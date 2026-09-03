import { eq } from "drizzle-orm";
import { categories, establishments } from "../drizzle/schema";
import { createEstablishment, getDb, syncEstablishmentVisibility } from "./db";
import { parseEstablishmentSpreadsheet } from "./establishment-spreadsheet";
import { extractGetInMenu, extractMenuFromUrl, getMenuProvider, normalizeMenuUrl, persistDigitalMenu, splitMenuUrls } from "./digital-menu-scraper";

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

async function importMenuAfterBulkResponse(db: any, establishmentId: number, name: string, url: string) {
  try {
    const extraction = getMenuProvider(url) === "getin" ? await extractGetInMenu(url) : await extractMenuFromUrl(url);
    if (!extraction.items.length) throw new Error("nenhum item encontrado");
    await persistDigitalMenu(db, establishmentId, extraction);
    await db.update(establishments).set({ hasMenu: true }).where(eq(establishments.id, establishmentId));
    await syncEstablishmentVisibility(establishmentId);
    console.log(`[Bulk menu] ${name}: ${extraction.items.length} itens importados.`);
  } catch (error: any) {
    await db.update(establishments).set({ hasMenu: false }).where(eq(establishments.id, establishmentId));
    await syncEstablishmentVisibility(establishmentId);
    console.error(`[Bulk menu] ${name}: ${String(error?.message || error)}`);
  }
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
      void importMenuAfterBulkResponse(db, establishmentId, row.name, primaryUrl);
      warnings.push(`${row.name}: estabelecimento cadastrado como pendente; leitura do cardápio iniciada em segundo plano. O resultado será atualizado após o processamento.`);
      if (menuUrls.length > 1) warnings.push(`${row.name}: ${menuUrls.length - 1} link(s) adicional(is) encontrado(s); use uma linha por estabelecimento para manter o primeiro link como principal.`);
      await syncEstablishmentVisibility(establishmentId);
    }

    existingNames.add(nameKey);
    const [createdRow] = await db.select({ status: establishments.status }).from(establishments).where(eq(establishments.id, establishmentId)).limit(1);
    created.push({ id: establishmentId, name: row.name, status: createdRow?.status || (importedMenu ? "active" : "pending") });
  }

  return { created, skipped: parsed.rows.length - created.length, warnings };
}
