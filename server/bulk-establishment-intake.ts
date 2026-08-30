import { eq } from "drizzle-orm";
import { categories, establishments } from "../drizzle/schema";
import { createEstablishment, getDb } from "./db";
import { parseEstablishmentSpreadsheet } from "./establishment-spreadsheet";

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
  const categoryByName = new Map(categoryRows.map(category => [normalize(category.name), category.id]));
  const existingNames = new Set(existingRows.map(row => normalize(row.name)));
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
    existingNames.add(nameKey);
    created.push({ id: Number(createdEstablishment.id), name: row.name, status: "pending" });
  }

  return { created, skipped: parsed.rows.length - created.length, warnings };
}
