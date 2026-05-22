/**
 * Admin Establishment Management — db-admin-estab.ts
 * 
 * Handles: listing by category with active/hidden tabs, hide/show toggle,
 * individual establishment admin page, and menu item CRUD with images.
 */
import { eq, and, asc, sql, inArray } from "drizzle-orm";
import { establishments, menuItems, categories, menuCategories } from "../drizzle/schema";
import { getDb, syncEstablishmentVisibility } from "./db";
import { storagePut } from "./storage";

/**
 * Capitalize first letter of a string
 */
export function capitalizeCategory(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

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

  // Get counts for each category (including incomplete count)
  const counts = await db.select({
    categoryId: establishments.categoryId,
    activeCount: sql<number>`SUM(CASE WHEN ${establishments.hidden} = false THEN 1 ELSE 0 END)`,
    hiddenCount: sql<number>`SUM(CASE WHEN ${establishments.hidden} = true THEN 1 ELSE 0 END)`,
    incompleteCount: sql<number>`SUM(CASE WHEN ${establishments.hidden} = false AND (
      ${establishments.address} IS NULL OR ${establishments.address} = '' OR
      ${establishments.hours} IS NULL OR ${establishments.hours} = '' OR
      ${establishments.hasMenu} = false
    ) THEN 1 ELSE 0 END)`,
  })
    .from(establishments)
    .groupBy(establishments.categoryId);

  const countMap = new Map(counts.map(c => [c.categoryId, {
    active: Number(c.activeCount) || 0,
    hidden: Number(c.hiddenCount) || 0,
    incomplete: Number(c.incompleteCount) || 0,
  }]));

  return result.map(cat => ({
    ...cat,
    activeCount: countMap.get(cat.id)?.active ?? 0,
    hiddenCount: countMap.get(cat.id)?.hidden ?? 0,
    incompleteCount: countMap.get(cat.id)?.incomplete ?? 0,
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
      hours: establishments.hours,
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

  // Compute missing required fields for each establishment
  const itemsWithCompleteness = items.map(est => {
    const missing: string[] = [];
    if (!est.address || est.address.trim() === '') missing.push('endereço');
    if (!est.hours || est.hours.trim() === '') missing.push('horário');
    if (!est.hasMenu) missing.push('cardápio');
    return { ...est, missingFields: missing, isComplete: missing.length === 0 };
  });

  return { items: itemsWithCompleteness, total: Number(countResult[0]?.count) || 0 };
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

  // Compute completeness
  const missingFields: string[] = [];
  if (!est.address || est.address.trim() === '') missingFields.push('endereço');
  if (!est.hours || est.hours.trim() === '') missingFields.push('horário');
  if (menu.length === 0) missingFields.push('cardápio');

  // Count menu items without photo
  const itemsWithoutPhoto = menu.filter(m => !m.imageUrl || m.imageUrl.trim() === '').length;

  return {
    ...est,
    categoryName: cat?.name ?? "Desconhecida",
    categorySlug: cat?.slug ?? "",
    menuItems: menu,
    missingFields,
    isComplete: missingFields.length === 0,
    itemsWithoutPhoto,
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

  // Capitalize category name
  const finalCategory = data.category ? capitalizeCategory(data.category) : null;

  const [result] = await db.insert(menuItems).values({
    establishmentId: data.establishmentId,
    name: data.name,
    description: data.description || null,
    price: data.price || null,
    category: finalCategory,
    imageUrl: data.imageUrl || null,
    imageKey: data.imageKey || null,
    imageThumbUrl: data.imageThumbUrl || null,
    imageThumbKey: data.imageThumbKey || null,
  });

  // Ensure category is tracked in menu_categories table
  if (finalCategory) {
    await ensureMenuCategory(data.establishmentId, finalCategory);
  }

  // Update hasMenu flag and sync visibility
  await db.update(establishments)
    .set({ hasMenu: true })
    .where(eq(establishments.id, data.establishmentId));
  await syncEstablishmentVisibility(data.establishmentId);

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
  if (data.category !== undefined) updateData.category = capitalizeCategory(data.category);
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
  if (data.imageKey !== undefined) updateData.imageKey = data.imageKey;
  if (data.imageThumbUrl !== undefined) updateData.imageThumbUrl = data.imageThumbUrl;
  if (data.imageThumbKey !== undefined) updateData.imageThumbKey = data.imageThumbKey;

  if (Object.keys(updateData).length === 0) return { success: true };

  await db.update(menuItems).set(updateData).where(eq(menuItems.id, id));

  // If category changed, ensure it's tracked
  if (updateData.category) {
    // Get the establishment ID
    const [item] = await db.select({ establishmentId: menuItems.establishmentId })
      .from(menuItems).where(eq(menuItems.id, id)).limit(1);
    if (item) {
      await ensureMenuCategory(item.establishmentId, updateData.category);
    }
  }

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

  // Check if establishment still has menu items and sync visibility
  if (item) {
    const remaining = await db.select({ count: sql<number>`COUNT(*)` })
      .from(menuItems)
      .where(eq(menuItems.establishmentId, item.establishmentId));
    
    if (Number(remaining[0]?.count) === 0) {
      await db.update(establishments)
        .set({ hasMenu: false })
        .where(eq(establishments.id, item.establishmentId));
    }
    // Sync visibility (may hide if last menu item was removed)
    await syncEstablishmentVisibility(item.establishmentId);
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
 * Get menu item categories for an establishment, respecting sortOrder from menu_categories table.
 * Falls back to alphabetical order for categories not in the table.
 */
export async function getMenuCategories(establishmentId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get distinct categories from menu_items
  const result = await db.selectDistinct({ category: menuItems.category })
    .from(menuItems)
    .where(and(
      eq(menuItems.establishmentId, establishmentId),
      sql`${menuItems.category} IS NOT NULL AND ${menuItems.category} != ''`
    ));

  const rawCategories = result.map(r => r.category).filter(Boolean) as string[];

  // Get sort order from menu_categories table
  const sortEntries = await db.select()
    .from(menuCategories)
    .where(eq(menuCategories.establishmentId, establishmentId))
    .orderBy(asc(menuCategories.sortOrder));

  const sortMap = new Map(sortEntries.map((e, i) => [e.name.toLowerCase(), i]));

  // Sort: categories with sortOrder first (by sortOrder), then remaining alphabetically
  const sorted = rawCategories.sort((a, b) => {
    const aOrder = sortMap.get(a.toLowerCase());
    const bOrder = sortMap.get(b.toLowerCase());
    if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder;
    if (aOrder !== undefined) return -1;
    if (bOrder !== undefined) return 1;
    return a.localeCompare(b, 'pt-BR');
  });

  return sorted;
}

/**
 * Get menu categories with their sort order for an establishment
 */
export async function getMenuCategoriesWithOrder(establishmentId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get distinct categories from menu_items
  const result = await db.selectDistinct({ category: menuItems.category })
    .from(menuItems)
    .where(and(
      eq(menuItems.establishmentId, establishmentId),
      sql`${menuItems.category} IS NOT NULL AND ${menuItems.category} != ''`
    ));

  const rawCategories = result.map(r => r.category).filter(Boolean) as string[];

  // Get sort order from menu_categories table
  const sortEntries = await db.select()
    .from(menuCategories)
    .where(eq(menuCategories.establishmentId, establishmentId))
    .orderBy(asc(menuCategories.sortOrder));

  const sortMap = new Map(sortEntries.map(e => [e.name.toLowerCase(), e.sortOrder]));

  // Build result with sort order
  const categoriesWithOrder = rawCategories.map(name => ({
    name,
    sortOrder: sortMap.get(name.toLowerCase()) ?? 999,
  }));

  // Sort by sortOrder, then alphabetically
  categoriesWithOrder.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.name.localeCompare(b.name, 'pt-BR');
  });

  return categoriesWithOrder;
}

/**
 * Save the new order of menu categories for an establishment.
 * Replaces all existing sort entries for this establishment.
 */
export async function reorderMenuCategories(establishmentId: number, orderedNames: string[]) {
  const db = await getDb();
  if (!db) return { success: false };

  // Delete existing entries for this establishment
  await db.delete(menuCategories)
    .where(eq(menuCategories.establishmentId, establishmentId));

  // Insert new entries with sort order
  if (orderedNames.length > 0) {
    const values = orderedNames.map((name, index) => ({
      establishmentId,
      name: capitalizeCategory(name),
      sortOrder: index,
    }));
    await db.insert(menuCategories).values(values);
  }

  return { success: true };
}

/**
 * Ensure a category name is capitalized when adding/updating menu items.
 * Also syncs the menu_categories table if the category is new.
 */
export async function ensureMenuCategory(establishmentId: number, categoryName: string) {
  const db = await getDb();
  if (!db) return;

  const capitalized = capitalizeCategory(categoryName);

  // Check if this category already exists in menu_categories
  const existing = await db.select()
    .from(menuCategories)
    .where(and(
      eq(menuCategories.establishmentId, establishmentId),
      sql`LOWER(${menuCategories.name}) = LOWER(${capitalized})`
    ))
    .limit(1);

  if (existing.length === 0) {
    // Get max sort order for this establishment
    const maxResult = await db.select({ maxOrder: sql<number>`COALESCE(MAX(${menuCategories.sortOrder}), -1)` })
      .from(menuCategories)
      .where(eq(menuCategories.establishmentId, establishmentId));
    const maxOrder = Number(maxResult[0]?.maxOrder ?? -1);

    await db.insert(menuCategories).values({
      establishmentId,
      name: capitalized,
      sortOrder: maxOrder + 1,
    });
  }

  return capitalized;
}
