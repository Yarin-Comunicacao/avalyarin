import { eq } from "drizzle-orm";
import { categories, establishments } from "../drizzle/schema";
import { createEstablishment, getDb, syncEstablishmentVisibility } from "./db";
import { parseEstablishmentSpreadsheet } from "./establishment-spreadsheet";
import { extractGetInMenu, extractMenuFromUrl, getMenuProvider, normalizeMenuUrl, persistDigitalMenu, splitMenuUrls, type DigitalMenuExtraction } from "./digital-menu-scraper";

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
  const menuExtractions = new Map<string, DigitalMenuExtraction>();

  // A importação só começa a criar registros depois que todas as fontes de
  // cardápio foram lidas. Assim, uma URL inválida não deixa estabelecimento
  // parcialmente criado e a resposta permanece síncrona e consistente.
  for (const row of parsed.rows) {
    const primaryUrl = splitMenuUrls(row.menuUrl)[0];
    if (!primaryUrl) continue;
    try {
      const extraction = getMenuProvider(primaryUrl) === "getin"
        ? await extractGetInMenu(primaryUrl)
        : await extractMenuFromUrl(primaryUrl);
      if (!extraction.items.length) throw new Error("Nenhum item encontrado");
      menuExtractions.set(normalize(row.name), extraction);
    } catch (error: any) {
      throw new Error(`${row.name}: não foi possível ler o cardápio antes do cadastro (${String(error?.message || error).slice(0, 240)}). Nenhum estabelecimento foi criado.`);
    }
  }

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
      const extraction = menuExtractions.get(nameKey);
      if (!extraction) throw new Error(`${row.name}: extração de cardápio ausente.`);
      await persistDigitalMenu(db, establishmentId, extraction);
      await db.update(establishments).set({ hasMenu: true }).where(eq(establishments.id, establishmentId));
      importedMenu = true;
      warnings.push(`${row.name}: cardápio lido e importado (${extraction.items.length} itens).`);
      if (menuUrls.length > 1) warnings.push(`${row.name}: ${menuUrls.length - 1} link(s) adicional(is) encontrado(s); use uma linha por estabelecimento para manter o primeiro link como principal.`);
      await syncEstablishmentVisibility(establishmentId);
    }

    existingNames.add(nameKey);
    const [createdRow] = await db.select({ status: establishments.status }).from(establishments).where(eq(establishments.id, establishmentId)).limit(1);
    created.push({ id: establishmentId, name: row.name, status: createdRow?.status || (importedMenu ? "active" : "pending") });
  }

  return { created, skipped: parsed.rows.length - created.length, warnings };
}
