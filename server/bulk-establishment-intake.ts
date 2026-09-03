import { eq } from "drizzle-orm";
import { categories, establishments } from "../drizzle/schema";
import { createEstablishment, getDb, syncEstablishmentVisibility } from "./db";
import { parseEstablishmentSpreadsheet } from "./establishment-spreadsheet";
import { extractGetInMenu, extractMenuFromUrl, getMenuProvider, normalizeMenuUrl, persistDigitalMenu, splitMenuUrls } from "./digital-menu-scraper";

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
      menuUrl: normalizeMenuUrl(row.menuUrl) || undefined,
      lastMenuUpdate: row.lastMenuUpdate || undefined,
      validationScore: row.validationScore ?? undefined,
    });

    const establishmentId = Number(createdEstablishment.id);
    let importedMenu = false;
    const menuUrls = splitMenuUrls(row.menuUrl);
    if (menuUrls.length > 0) {
      const primaryUrl = menuUrls[0];
      await db.update(establishments).set({
        menuUrl: primaryUrl,
        hasMenu: false,
        lastMenuUpdate: row.lastMenuUpdate || new Date(),
      }).where(eq(establishments.id, establishmentId));
      importedMenu = true;
      if (getMenuProvider(primaryUrl) === "getin") {
        try {
          const extraction = await extractGetInMenu(primaryUrl);
          await persistDigitalMenu(db, establishmentId, extraction);
          await db.update(establishments).set({ hasMenu: extraction.items.length > 0 }).where(eq(establishments.id, establishmentId));
          importedMenu = extraction.items.length > 0;
          warnings.push(`${row.name}: cardápio Get In importado (${extraction.items.length} itens em ${extraction.menus} menus).`);
        } catch (error: any) {
          const message = String(error?.message || error).slice(0, 240);
          warnings.push(`${row.name}: link Get In salvo, mas os itens não puderam ser lidos (${message}).`);
        }
      } else {
        try {
          const extraction = await extractMenuFromUrl(primaryUrl);
          await persistDigitalMenu(db, establishmentId, extraction);
          await db.update(establishments).set({ hasMenu: extraction.items.length > 0 }).where(eq(establishments.id, establishmentId));
          importedMenu = extraction.items.length > 0;
          warnings.push(`${row.name}: cardápio externo lido e importado (${extraction.items.length} itens).`);
        } catch (error: any) {
          const message = String(error?.message || error).slice(0, 240);
          await db.update(establishments).set({ hasMenu: false }).where(eq(establishments.id, establishmentId));
          importedMenu = false;
          warnings.push(`${row.name}: não foi possível ler o link do cardápio; estabelecimento mantido como pendente (${message}).`);
        }
      }
      if (menuUrls.length > 1) warnings.push(`${row.name}: ${menuUrls.length - 1} link(s) adicional(is) encontrado(s); use uma linha por estabelecimento para manter o primeiro link como principal.`);
      await syncEstablishmentVisibility(establishmentId);
    }

    existingNames.add(nameKey);
    const [createdRow] = await db.select({ status: establishments.status }).from(establishments).where(eq(establishments.id, establishmentId)).limit(1);
    created.push({ id: establishmentId, name: row.name, status: createdRow?.status || (importedMenu ? "active" : "pending") });
  }

  return { created, skipped: parsed.rows.length - created.length, warnings };
}
