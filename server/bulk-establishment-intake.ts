import { eq } from "drizzle-orm";
import { categories, establishments } from "../drizzle/schema";
import { createEstablishment, getDb, syncEstablishmentVisibility } from "./db";
import { parseEstablishmentSpreadsheet } from "./establishment-spreadsheet";
import { extractGetInMenu, persistDigitalMenu } from "./digital-menu-scraper";

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export async function createEstablishmentsFromSpreadsheet(buffer: Buffer, fileName = "estabelecimentos.xlsx") {
  const parsed = parseEstablishmentSpreadsheet(buffer, fileName);
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");

  const [categoryRows, existingRows] = await Promise.all([
    db.select({ id: categories.id, name: categories.name }).from(categories),
    db.select({ name: establishments.name }).from(establishments),
  ]);
  const categoryByName = new Map<string, number>(categoryRows.map((category: { id: number; name: string }) => [normalize(category.name), Number(category.id)]));
  const existingNames = new Set(existingRows.map((row: { name: string }) => normalize(row.name)));
  const created: Array<{ id: number; name: string; status: string }> = [];
  const warnings = [...parsed.warnings];

  for (const row of parsed.rows) {
    const categoryId = categoryByName.get(normalize(row.category));
    if (!categoryId) {
      warnings.push(`${row.name}: categoria '${row.category}' não foi encontrada no Avalyarin.`);
      continue;
    }
    const nameKey = normalize(row.name);
    if (existingNames.has(nameKey)) {
      warnings.push(`${row.name}: estabelecimento já existe e não foi duplicado.`);
      continue;
    }
    const createdEstablishment = await createEstablishment({
      name: row.name,
      categoryId,
      address: row.address,
      addressNumber: row.addressNumber || undefined,
      complement: row.complement || undefined,
      neighborhood: row.neighborhood,
      region: row.region || undefined,
      city: row.city || undefined,
      state: row.state || undefined,
      zipCode: row.zipCode || undefined,
      phone: row.phone,
      instagram: row.instagram,
      googleMapsUrl: row.googleMapsUrl || undefined,
      facebook: row.facebook || undefined,
      website: row.website || undefined,
      description: row.description || undefined,
      hours: row.hours,
      lat: row.lat ?? undefined,
      lng: row.lng ?? undefined,
      image: row.image || undefined,
      logo: row.logo || undefined,
      menuUrl: row.menuUrl || undefined,
      lastMenuUpdate: row.lastMenuUpdate || undefined,
      validationScore: row.validationScore ?? undefined,
    });

    const establishmentId = Number(createdEstablishment.id);
    let importedMenu = false;
    if (row.menuUrl) {
      try {
        const extraction = await extractGetInMenu(row.menuUrl);
        await persistDigitalMenu(db, establishmentId, extraction);
        await db.update(establishments).set({
          hasMenu: true,
          lastMenuUpdate: row.lastMenuUpdate || new Date(),
        }).where(eq(establishments.id, establishmentId));
        await syncEstablishmentVisibility(establishmentId);
        importedMenu = true;
        warnings.push(`${row.name}: cardápio digital importado (${extraction.items.length} itens em ${extraction.menus} menus).`);
      } catch (error: any) {
        const message = String(error?.message || error).slice(0, 240);
        warnings.push(`${row.name}: estabelecimento criado, mas o menu_url não pôde ser importado (${message}).`);
      }
    }

    existingNames.add(nameKey);
    const [createdRow] = await db.select({ status: establishments.status }).from(establishments).where(eq(establishments.id, establishmentId)).limit(1);
    created.push({ id: establishmentId, name: row.name, status: createdRow?.status || (importedMenu ? "active" : "pending") });
  }

  return { created, skipped: parsed.rows.length - created.length, warnings };
}
