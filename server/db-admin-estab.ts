/**
 * Admin Establishment Management — db-admin-estab.ts
 * 
 * Handles: listing by category with active/hidden tabs, hide/show toggle,
 * individual establishment admin page, and menu item CRUD with images.
 */
import { eq, and, asc, sql, inArray } from "drizzle-orm";
import { establishments, menuItems, categories } from "../drizzle/schema";
import { getDb } from "./db";
import { storagePut } from "./storage";

// ============================================================
// LISTING — By Category with Active/Hidden separation
// ============================================================

/**
 * Get all categories with counts of active and hidden establishments
 */
export async function getAdminCategoriesWithCounts() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({
    id: categories.id,
    slug: categories.slug,
    name: categories.name,
    icon: categories.icon,
  }).from(categories).orderBy(asc(categories.name));

  // Get counts for each category
  const counts = await db.select({
    categoryId: establishments.categoryId,
    activeCount: sql<number>`SUM(CASE WHEN ${establishments.hidden} = false THEN 1 ELSE 0 END)`,
    hiddenCount: sql<number>`SUM(CASE WHEN ${establishments.hidden} = true THEN 1 ELSE 0 END)`,
  })
    .from(establishments)
    .groupBy(establishments.categoryId);

  const countMap = new Map(counts.map(c => [c.categoryId, { active: Number(c.activeCount) || 0, hidden: Number(c.hiddenCount) || 0 }]));

  return result.map(cat => ({
    ...cat,
    activeCount: countMap.get(cat.id)?.active ?? 0,
    hiddenCount: countMap.get(cat.id)?.hidden ?? 0,
    totalCount: (countMap.get(cat.id)?.active ?? 0) + (countMap.get(cat.id)?.hidden ?? 0),
  }));
}

/**
 * Get establishments by category, separated by active/hidden status, ordered alphabetically
 */
export async function getAdminEstablishmentsByCategory(
  categoryId: number,
  hidden: boolean,
  limit = 100,
  offset = 0
) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const whereClause = and(
    eq(establishments.categoryId, categoryId),
    eq(establishments.hidden, hidden)
  );

  const [items, countResult] = await Promise.all([
    db.select({
      id: establishments.id,
      name: establishments.name,
      slug: establishments.slug,
      address: establishments.address,
      neighborhood: establishments.neighborhood,
      phone: establishments.phone,
      instagram: establishments.instagram,
      image: establishments.image,
      hasMenu: establishments.hasMenu,
      hidden: establishments.hidden,
    })
      .from(establishments)
      .where(whereClause)
      .orderBy(asc(establishments.name))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`COUNT(*)` })
      .from(establishments)
      .where(whereClause),
  ]);

  return { items, total: Number(countResult[0]?.count) || 0 };
}

// ============================================================
// HIDE / SHOW TOGGLE
// ============================================================

/**
 * Toggle hidden status for one or more establishments
 */
export async function toggleEstablishmentVisibility(ids: number[], hidden: boolean) {
  const db = await getDb();
  if (!db) return { success: false };

  await db.update(establishments)
    .set({ hidden })
    .where(inArray(establishments.id, ids));

  return { success: true, affected: ids.length };
}

// ============================================================
// INDIVIDUAL ESTABLISHMENT — Admin Detail
// ============================================================

/**
 * Get full establishment details for admin editing
 */
export async function getAdminEstablishmentDetail(id: number) {
  const db = await getDb();
  if (!db) return null;

  const [est] = await db.select().from(establishments).where(eq(establishments.id, id)).limit(1);
  if (!est) return null;

  const [cat] = await db.select().from(categories).where(eq(categories.id, est.categoryId)).limit(1);

  const menu = await db.select()
    .from(menuItems)
    .where(eq(menuItems.establishmentId, id))
    .orderBy(asc(menuItems.category), asc(menuItems.name));

  return {
    ...est,
    categoryName: cat?.name ?? "Desconhecida",
    categorySlug: cat?.slug ?? "",
    menuItems: menu,
  };
}

// ============================================================
// MENU ITEM CRUD (with image support)
// ============================================================

/**
 * Add a new menu item to an establishment
 */
export async function adminAddMenuItem(data: {
  establishmentId: number;
  name: string;
  description?: string;
  price?: number;
  category?: string;
  imageUrl?: string;
  imageKey?: string;
  imageThumbUrl?: string;
  imageThumbKey?: string;
}) {
  const db = await getDb();
  if (!db) return null;

  const [result] = await db.insert(menuItems).values({
    establishmentId: data.establishmentId,
    name: data.name,
    description: data.description || null,
    price: data.price || null,
    category: data.category || null,
    imageUrl: data.imageUrl || null,
    imageKey: data.imageKey || null,
    imageThumbUrl: data.imageThumbUrl || null,
    imageThumbKey: data.imageThumbKey || null,
  });

  // Update hasMenu flag
  await db.update(establishments)
    .set({ hasMenu: true })
    .where(eq(establishments.id, data.establishmentId));

  return { success: true, id: result.insertId };
}

/**
 * Update an existing menu item
 */
export async function adminUpdateMenuItem(id: number, data: {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  imageUrl?: string;
  imageKey?: string;
  imageThumbUrl?: string;
  imageThumbKey?: string;
}) {
  const db = await getDb();
  if (!db) return null;

  // Filter out undefined values
  const updateData: Record<string, any> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
  if (data.imageKey !== undefined) updateData.imageKey = data.imageKey;
  if (data.imageThumbUrl !== undefined) updateData.imageThumbUrl = data.imageThumbUrl;
  if (data.imageThumbKey !== undefined) updateData.imageThumbKey = data.imageThumbKey;

  if (Object.keys(updateData).length === 0) return { success: true };

  await db.update(menuItems).set(updateData).where(eq(menuItems.id, id));
  return { success: true };
}

/**
 * Delete a menu item
 */
export async function adminDeleteMenuItem(id: number) {
  const db = await getDb();
  if (!db) return null;

  // Get the establishment ID before deleting
  const [item] = await db.select({ establishmentId: menuItems.establishmentId })
    .from(menuItems)
    .where(eq(menuItems.id, id))
    .limit(1);

  await db.delete(menuItems).where(eq(menuItems.id, id));

  // Check if establishment still has menu items
  if (item) {
    const remaining = await db.select({ count: sql<number>`COUNT(*)` })
      .from(menuItems)
      .where(eq(menuItems.establishmentId, item.establishmentId));
    
    if (Number(remaining[0]?.count) === 0) {
      await db.update(establishments)
        .set({ hasMenu: false })
        .where(eq(establishments.id, item.establishmentId));
    }
  }

  return { success: true };
}

/**
 * Upload menu item image and return URL
 */
export async function uploadMenuItemImage(
  establishmentId: number,
  menuItemId: number,
  imageBuffer: Buffer,
  mimeType: string,
  fileName: string
) {
  const key = `menu-images/${establishmentId}/${menuItemId}-${Date.now()}-${fileName}`;
  const { url } = await storagePut(key, imageBuffer, mimeType);
  
  // Update the menu item with the image URL
  const db = await getDb();
  if (db) {
    await db.update(menuItems)
      .set({ imageUrl: url, imageKey: key })
      .where(eq(menuItems.id, menuItemId));
  }

  return { url, key };
}

/**
 * Get menu item categories for an establishment (distinct categories used)
 */
export async function getMenuCategories(establishmentId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.selectDistinct({ category: menuItems.category })
    .from(menuItems)
    .where(and(
      eq(menuItems.establishmentId, establishmentId),
      sql`${menuItems.category} IS NOT NULL AND ${menuItems.category} != ''`
    ))
    .orderBy(asc(menuItems.category));

  return result.map(r => r.category).filter(Boolean) as string[];
}
