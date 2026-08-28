import { extractMenuWithOcr, hasAcceptableMenuQuality } from "./smart-menu-ocr";
import { eq, sql } from "drizzle-orm";
import { getDb, createEstablishment, generateCode, syncEstablishmentVisibility } from "./db";
import { logDbError } from "./dbErrorLogger";
import { generateMenuItemTags } from "./auto-tags";
import { formatOpeningHours } from "../shared/opening-hours";
import { establishments, establishmentMenuImports, menuCategories, menuItems } from "../drizzle/schema";

const MAX_PHOTOS = 50;
const BATCH_SIZE = 5;

export function getInsertedImportId(result: { insertId?: unknown }): number {
  const importId = Number(result.insertId);
  if (!Number.isSafeInteger(importId) || importId <= 0) {
    throw new Error("Não foi possível obter o ID da importação do cardápio");
  }
  return importId;
}

export type SmartMenuPhoto = {
  url: string;
  key?: string;
};

type ExtractedItem = {
  name: string;
  description?: string | null;
  price?: number | null;
};

type ExtractedSection = {
  name: string;
  items: ExtractedItem[];
};

type ExtractedMenu = {
  sections: ExtractedSection[];
  confidence?: number;
};

/**
 * The production TiDB schema was created in more than one environment over time.
 * This small idempotent guard keeps the new intake feature compatible with the
 * official database without changing unrelated tables or data.
 */
export async function ensureSmartMenuSchema() {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");

  const statements = [
    sql`CREATE TABLE IF NOT EXISTS establishment_menu_imports (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      establishmentId INT NOT NULL,
      submittedById INT NOT NULL,
      sourceUrls JSON NOT NULL,
      status ENUM('processing','completed','failed') NOT NULL DEFAULT 'processing',
      extractedCategoryCount INT NOT NULL DEFAULT 0,
      extractedItemCount INT NOT NULL DEFAULT 0,
      errorMessage TEXT,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      completedAt TIMESTAMP NULL
    )`,
    sql`ALTER TABLE establishments ADD COLUMN googleMapsUrl TEXT`,
    sql`ALTER TABLE establishments ADD COLUMN facebook TEXT`,
    sql`ALTER TABLE establishments ADD COLUMN website TEXT`,
  ];

  for (const statement of statements) {
    try {
      await db.execute(statement);
    } catch (error: any) {
      // Drizzle wraps the database error. The real MySQL error is in 'cause'.
      const sqlMessage = String(error?.cause?.sqlMessage || error?.cause?.message || error?.sqlMessage || error?.message || "");
      const combined = sqlMessage.toLowerCase();

      // ER_DUP_FIELDNAME (1060) is the standard MySQL/TiDB error for duplicate columns.
      // We also check common string patterns as a fallback.
      const isDuplicate = error?.cause?.errno === 1060 || 
                          error?.errno === 1060 ||
                          combined.includes("duplicate column") || 
                          combined.includes("already exists");

      if (!isDuplicate) {
        logDbError(error, { operation: "ensureSmartMenuSchema", table: "establishments/establishment_menu_imports" });
        throw error;
      }
      // If it is a duplicate, we ignore the error and continue to the next statement.
    }
  }

  return db;
}

function normalizeSectionName(value: unknown): string {
  const name = String(value || "").replace(/\s+/g, " ").trim();
  return name.slice(0, 128);
}

function normalizeItem(item: any): ExtractedItem | null {
  const name = String(item?.name || "").replace(/\s+/g, " ").trim();
  if (!name) return null;

  let price: number | null = null;
  if (typeof item?.price === "number" && Number.isFinite(item.price)) price = item.price;
  if (typeof item?.price === "string") {
    const normalized = item.price.replace(/[^0-9,.-]/g, "").replace(/\.(?=\d{3}(?:,|$))/g, "").replace(",", ".");
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) price = parsed;
  }

  const description = item?.description == null
    ? null
    : String(item.description).replace(/\s+/g, " ").trim().slice(0, 1000);

  return { name: name.slice(0, 255), description, price };
}

async function extractBatch(photos: SmartMenuPhoto[], batchNumber: number, totalBatches: number): Promise<ExtractedMenu> {
  const extracted = await extractMenuWithOcr(photos, batchNumber, totalBatches);
  return {
    sections: extracted.sections.map(section => ({
      name: normalizeSectionName(section.name),
      items: section.items.map(normalizeItem).filter(Boolean) as ExtractedItem[],
    })).filter(section => section.name && section.items.length > 0),
    confidence: extracted.confidence,
  };
}

function mergeSections(batches: ExtractedMenu[]): ExtractedSection[] {
  const sections: ExtractedSection[] = [];
  const byName = new Map<string, ExtractedSection>();
  const itemKeys = new Set<string>();

  for (const batch of batches) {
    for (const section of batch.sections) {
      const key = section.name.toLocaleLowerCase("pt-BR");
      let target = byName.get(key);
      if (!target) {
        target = { name: section.name, items: [] };
        byName.set(key, target);
        sections.push(target);
      }
      for (const item of section.items) {
        const itemKey = `${key}::${item.name.toLocaleLowerCase("pt-BR")}`;
        if (!itemKeys.has(itemKey)) {
          itemKeys.add(itemKey);
          target.items.push(item);
        }
      }
    }
  }

  return sections;
}

async function nextId(db: any, table: any): Promise<number> {
  const result = await db.select({ maxId: sql<number>`COALESCE(MAX(id), 0)` }).from(table);
  return Number(result[0]?.maxId || 0) + 1;
}


export async function createSmartEstablishment(input: {
  name: string;
  googleMapsUrl: string;
  instagram: string;
  facebook?: string;
  website?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  region?: string;
  city?: string;
  lat?: number;
  lng?: number;
  hours?: string;
  openingHours?: unknown;
  phone?: string;
  image?: string;
  logo?: string;
  categoryId: number;
  photos: SmartMenuPhoto[];
  submittedById: number;
}) {
  if (!input.name.trim()) throw new Error("Nome do estabelecimento é obrigatório");
  if (input.photos.length === 0) throw new Error("Envie pelo menos uma foto do cardápio");
  if (input.photos.length > MAX_PHOTOS) throw new Error(`O limite é de ${MAX_PHOTOS} fotos por cardápio`);

  const db = await ensureSmartMenuSchema();
  const establishment = await createEstablishment({
    name: input.name.trim(),
    categoryId: input.categoryId,
    instagram: input.instagram.trim(),
    googleMapsUrl: input.googleMapsUrl.trim(),
    facebook: input.facebook?.trim() || undefined,
    website: input.website?.trim() || undefined,
    address: input.address?.trim() || undefined,
    addressNumber: input.addressNumber?.trim() || undefined,
    complement: input.complement?.trim() || undefined,
    neighborhood: input.neighborhood?.trim() || "Não informado",
    region: input.region?.trim() || undefined,
    city: input.city?.trim() || undefined,
    lat: input.lat,
    lng: input.lng,
    hours: formatOpeningHours(input.openingHours) || input.hours?.trim() || "Não informado",
    phone: input.phone?.trim() || undefined,
    image: input.image?.trim() || undefined,
    logo: input.logo?.trim() || undefined,
    description: "Cadastro criado a partir de fotos do cardápio; dados sujeitos à revisão.",
  });

  const establishmentId = Number(establishment.id);

  const [importResult] = await db.insert(establishmentMenuImports).values({
    establishmentId,
    submittedById: input.submittedById,
    sourceUrls: input.photos.map(photo => photo.url),
    status: "processing",
  });
  const importId = getInsertedImportId(importResult);
  try {
    const batches: ExtractedMenu[] = [];
    for (let offset = 0; offset < input.photos.length; offset += BATCH_SIZE) {
      const batch = input.photos.slice(offset, offset + BATCH_SIZE);
      batches.push(await extractBatch(batch, Math.floor(offset / BATCH_SIZE) + 1, Math.ceil(input.photos.length / BATCH_SIZE)));
    }

    const sections = mergeSections(batches);
    const extractedMenu = { sections, confidence: batches.map(batch => batch.confidence).filter((value): value is number => typeof value === "number").reduce((sum, value, _, values) => sum + value / values.length, 0) || undefined };
    if (!hasAcceptableMenuQuality(extractedMenu)) {
      throw new Error("O cardápio não pôde ser lido com qualidade suficiente. Envie fotos nítidas, sem reflexos, mostrando uma página por vez.");
    }

    let categoryId = await nextId(db, menuCategories);
    let itemId = await nextId(db, menuItems);
    const categoryRows: any[] = [];
    const itemRows: any[] = [];

    for (let sortOrder = 0; sortOrder < sections.length; sortOrder++) {
      const section = sections[sortOrder];
      categoryRows.push({ id: categoryId++, establishmentId, name: section.name, sortOrder });
      for (const item of section.items) {
        itemRows.push({
          id: itemId++,
          code: await generateCode("menu_items"),
          establishmentId,
          name: item.name,
          description: item.description || null,
          price: item.price,
          category: section.name.slice(0, 64),
          tags: generateMenuItemTags(item.name, section.name),
        });
      }
    }

    if (categoryRows.length > 0) await db.insert(menuCategories).values(categoryRows);
    if (itemRows.length > 0) await db.insert(menuItems).values(itemRows);

    await db.update(establishments)
      .set({ hasMenu: true })
      .where(eq(establishments.id, establishmentId));
    await syncEstablishmentVisibility(establishmentId);

    await db.update(establishmentMenuImports).set({
      status: "completed",
      extractedCategoryCount: categoryRows.length,
      extractedItemCount: itemRows.length,
      completedAt: new Date(),
    }).where(eq(establishmentMenuImports.id, importId));

    return {
      success: true,
      establishmentId,
      slug: establishment.slug,
      categories: categoryRows.length,
      items: itemRows.length,
      status: "pending",
    };
  } catch (error: any) {
    const message = String(error?.message || error).slice(0, 2000);
    await db.update(establishmentMenuImports).set({ status: "failed", errorMessage: message }).where(eq(establishmentMenuImports.id, importId)).catch(() => undefined);
    logDbError(error, { operation: "createSmartEstablishment", table: "establishment_menu_imports/menu_categories/menu_items", params: { establishmentId, importId } });
    throw error;
  }
}

export const SMART_MENU_LIMITS = { maxPhotos: MAX_PHOTOS, batchSize: BATCH_SIZE };
