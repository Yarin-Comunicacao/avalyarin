import { eq, like, or, sql, and, inArray, notInArray, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, categories, establishments, menuItems, ratings, ratingItems, businessClaims, userRankings, ageVerificationRequests, groups, groupMembers, establishmentCategories, businessNotifications, groupEvents, eventRsvps } from "../drizzle/schema";
import { ENV } from './_core/env';
import { storagePut } from './storage';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// CODE GENERATION HELPERS
// ============================================================

/**
 * Generate a visual code for a new record.
 * Prefix + zero-padded sequential number based on max existing code.
 * users: numeric only (1-200000000)
 * categories: ca + 3 digits (ca001-ca999)
 * establishments: es + 6 digits (es000001-es999999)
 * ratings: ra + 6 digits (ra000001-ra999999)
 * groups: gr + 6 digits (gr000001-gr999999)
 * menu_items: mi + 6 digits (mi000001-mi999999)
 */
export async function generateCode(table: 'users' | 'categories' | 'establishments' | 'ratings' | 'groups' | 'menu_items'): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available for code generation");

  const config: Record<string, { prefix: string; digits: number; tableRef: any }> = {
    users: { prefix: '', digits: 0, tableRef: users },
    categories: { prefix: 'ca', digits: 3, tableRef: categories },
    establishments: { prefix: 'es', digits: 6, tableRef: establishments },
    ratings: { prefix: 'ra', digits: 6, tableRef: ratings },
    groups: { prefix: 'gr', digits: 6, tableRef: groups },
    menu_items: { prefix: 'mi', digits: 6, tableRef: menuItems },
  };

  const { prefix, digits, tableRef } = config[table];

  // Get the max code from the table
  const [row] = await db.select({ maxCode: sql<string>`MAX(code)` }).from(tableRef);
  const maxCode = row?.maxCode;

  let nextNum = 1;
  if (maxCode) {
    if (prefix) {
      // Extract numeric part after prefix
      const numStr = maxCode.replace(prefix, '');
      nextNum = parseInt(numStr, 10) + 1;
    } else {
      // Users: purely numeric
      nextNum = parseInt(maxCode, 10) + 1;
    }
  }

  if (prefix) {
    return `${prefix}${String(nextNum).padStart(digits, '0')}`;
  }
  return String(nextNum);
}

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // Generate code for new users
    const newCode = await generateCode('users');
    values.code = newCode;

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================
// CATEGORIES
// ============================================================

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(categories);
  return result;
}

export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCategoryWithCount(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const cat = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  if (cat.length === 0) return undefined;
  
  // Count establishments via N:N table (includes both primary and secondary categories)
  const [countResult] = await db.select({ count: sql<number>`COUNT(DISTINCT ${establishmentCategories.establishmentId})` })
    .from(establishmentCategories)
    .innerJoin(establishments, eq(establishments.id, establishmentCategories.establishmentId))
    .where(and(
      eq(establishmentCategories.categoryId, cat[0].id),
      completeEstablishmentFilter
    ));
  
  return { ...cat[0], establishmentCount: countResult.count };
}

export async function getCategoriesWithCounts() {
  const db = await getDb();
  if (!db) return [];
  
  // Count via N:N table to include establishments with multiple categories
  const result = await db.select({
    id: categories.id,
    slug: categories.slug,
    name: categories.name,
    description: categories.description,
    icon: categories.icon,
    active: categories.active,
    establishmentCount: sql<number>`COUNT(DISTINCT ${establishmentCategories.establishmentId})`,
  })
    .from(categories)
    .leftJoin(establishmentCategories, eq(establishmentCategories.categoryId, categories.id))
    .leftJoin(establishments, and(
      eq(establishments.id, establishmentCategories.establishmentId),
      completeEstablishmentFilter
    ))
    .groupBy(categories.id);
  
  return result;
}

// ============================================================
// ESTABLISHMENTS
// ============================================================

/**
 * Filter that ensures only active establishments are shown publicly.
 * Used in all public-facing queries. Admin queries bypass this filter.
 * Only establishments with status = 'active' are visible to end users.
 */
const completeEstablishmentFilter = eq(establishments.status, 'active');

/**
 * Checks if an establishment is complete (has address, hours, and menu).
 * Returns true if complete, false if incomplete.
 */
function isEstablishmentComplete(est: { address: string | null; hours: string | null; hasMenu: boolean }): boolean {
  if (!est.address || est.address.trim() === '') return false;
  if (!est.hours || est.hours.trim() === '') return false;
  if (!est.hasMenu) return false;
  return true;
}

/**
 * Automatically syncs the `status` field based on completeness.
 * If an establishment is incomplete and active, it moves to 'pending'.
 * If it becomes complete and is 'pending', it moves to 'active'.
 * 'hidden' status is manually managed and not auto-changed.
 * Called after any mutation that affects completeness fields.
 */
export async function syncEstablishmentVisibility(establishmentId: number) {
  const db = await getDb();
  if (!db) return;

  const [est] = await db.select({
    address: establishments.address,
    hours: establishments.hours,
    hasMenu: establishments.hasMenu,
    status: establishments.status,
  }).from(establishments).where(eq(establishments.id, establishmentId)).limit(1);

  if (!est) return;

  const complete = isEstablishmentComplete(est);

  if (!complete && est.status === 'active') {
    // Incomplete and currently active -> move to pending
    await db.update(establishments).set({ status: 'pending' }).where(eq(establishments.id, establishmentId));
  } else if (complete && est.status === 'pending') {
    // Complete and currently pending -> activate
    await db.update(establishments).set({ status: 'active' }).where(eq(establishments.id, establishmentId));
  }
  // 'hidden' status is manually managed by admin and not auto-changed
}

export async function getEstablishmentsByCategory(categorySlug: string, limit = 50, offset = 0, bypassFilter = false) {
  const db = await getDb();
  if (!db) return [];
  
  const cat = await db.select().from(categories).where(eq(categories.slug, categorySlug)).limit(1);
  if (cat.length === 0) return [];
  
  // Use N:N table to find establishments in this category
  const ecRows = await db.select({ establishmentId: establishmentCategories.establishmentId })
    .from(establishmentCategories)
    .where(eq(establishmentCategories.categoryId, cat[0].id));
  
  if (ecRows.length === 0) return [];
  
  const estIds = ecRows.map(r => r.establishmentId);
  
  const whereClause = bypassFilter
    ? inArray(establishments.id, estIds)
    : and(inArray(establishments.id, estIds), completeEstablishmentFilter);
  
  const result = await db.select()
    .from(establishments)
    .where(whereClause)
    .limit(limit)
    .offset(offset);
  
  return result;
}

export async function getEstablishmentBySlug(slug: string, bypassFilter = false) {
  const db = await getDb();
  if (!db) return undefined;
  
  const whereClause = bypassFilter
    ? eq(establishments.slug, slug)
    : and(eq(establishments.slug, slug), completeEstablishmentFilter);
  
  const result = await db.select()
    .from(establishments)
    .where(whereClause)
    .limit(1);
  
  if (result.length === 0) return undefined;
  
  // Get all categories via N:N table
  const estCategories = await db.select({
    id: categories.id,
    slug: categories.slug,
    name: categories.name,
    icon: categories.icon,
    isPrimary: establishmentCategories.isPrimary,
  })
    .from(establishmentCategories)
    .innerJoin(categories, eq(categories.id, establishmentCategories.categoryId))
    .where(eq(establishmentCategories.establishmentId, result[0].id));
  
  // Primary category (fallback to legacy categoryId)
  const primaryCat = estCategories.find(c => c.isPrimary) || estCategories[0];
  // Fallback to legacy if N:N has no entries
  const legacyCat = primaryCat ? null : await db.select().from(categories).where(eq(categories.id, result[0].categoryId)).limit(1).then(r => r[0] || null);
  
  return {
    ...result[0],
    category: primaryCat ? { id: primaryCat.id, slug: primaryCat.slug, name: primaryCat.name, icon: primaryCat.icon } : legacyCat,
    categories: estCategories.length > 0 ? estCategories : (legacyCat ? [{ ...legacyCat, isPrimary: true }] : []),
  };
}

export async function getEstablishmentWithMenu(slug: string, bypassFilter = false) {
  const db = await getDb();
  if (!db) return undefined;
  
  const whereClause = bypassFilter
    ? eq(establishments.slug, slug)
    : and(eq(establishments.slug, slug), completeEstablishmentFilter);
  
  const est = await db.select()
    .from(establishments)
    .where(whereClause)
    .limit(1);
  
  if (est.length === 0) return undefined;
  
  // Get all categories via N:N table
  const estCategories = await db.select({
    id: categories.id,
    slug: categories.slug,
    name: categories.name,
    icon: categories.icon,
    isPrimary: establishmentCategories.isPrimary,
  })
    .from(establishmentCategories)
    .innerJoin(categories, eq(categories.id, establishmentCategories.categoryId))
    .where(eq(establishmentCategories.establishmentId, est[0].id));
  
  const primaryCat = estCategories.find(c => c.isPrimary) || estCategories[0];
  const legacyCat = primaryCat ? null : await db.select().from(categories).where(eq(categories.id, est[0].categoryId)).limit(1).then(r => r[0] || null);
  
  const menu = await db.select()
    .from(menuItems)
    .where(eq(menuItems.establishmentId, est[0].id));
  
  return {
    ...est[0],
    category: primaryCat ? { id: primaryCat.id, slug: primaryCat.slug, name: primaryCat.name, icon: primaryCat.icon } : legacyCat,
    categories: estCategories.length > 0 ? estCategories : (legacyCat ? [{ ...legacyCat, isPrimary: true }] : []),
    menu,
  };
}

export async function getNearbyEstablishments(lat: number, lng: number, radiusKm = 3, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  
  // Haversine formula in SQL for distance calculation
  const distanceExpr = sql<number>`(
    6371 * acos(
      cos(radians(${lat})) * cos(radians(${establishments.lat})) *
      cos(radians(${establishments.lng}) - radians(${lng})) +
      sin(radians(${lat})) * sin(radians(${establishments.lat}))
    )
  )`;
  
  // Join with N:N table to get primary category name/slug
  const result = await db.select({
    id: establishments.id,
    slug: establishments.slug,
    name: establishments.name,
    address: establishments.address,
    neighborhood: establishments.neighborhood,
    lat: establishments.lat,
    lng: establishments.lng,
    rating: establishments.rating,
    reviewCount: establishments.reviewCount,
    image: establishments.image,
    hours: establishments.hours,
    phone: establishments.phone,
    instagram: establishments.instagram,
    categoryId: establishments.categoryId,
    categoryName: categories.name,
    categorySlug: categories.slug,
    hasMenu: establishments.hasMenu,
    source: establishments.source,
    distance: distanceExpr,
  })
    .from(establishments)
    .innerJoin(establishmentCategories, and(
      eq(establishmentCategories.establishmentId, establishments.id),
      eq(establishmentCategories.isPrimary, true)
    ))
    .innerJoin(categories, eq(categories.id, establishmentCategories.categoryId))
    .where(
      and(
        sql`${establishments.lat} IS NOT NULL`,
        sql`${establishments.lng} IS NOT NULL`,
        sql`${distanceExpr} < ${radiusKm}`,
        completeEstablishmentFilter
      )
    )
    .orderBy(distanceExpr)
    .limit(limit);
  
  return result;
}

// ============================================================
// SEARCH
// ============================================================

export async function searchEstablishments(query: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  
  const searchTerm = `%${query}%`;
  
  const result = await db.select({
    id: establishments.id,
    slug: establishments.slug,
    name: establishments.name,
    address: establishments.address,
    neighborhood: establishments.neighborhood,
    rating: establishments.rating,
    image: establishments.image,
    categoryId: establishments.categoryId,
    hasMenu: establishments.hasMenu,
  })
    .from(establishments)
    .where(and(
      like(establishments.name, searchTerm),
      completeEstablishmentFilter
    ))
    .limit(limit);
  
  return result;
}

export async function searchMenuItems(query: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  const searchTerm = `%${query}%`;
  
  // Search by name first, then description (only from complete establishments)
  const byName = await db.select({
    id: menuItems.id,
    name: menuItems.name,
    description: menuItems.description,
    price: menuItems.price,
    category: menuItems.category,
    establishmentId: menuItems.establishmentId,
    matchType: sql<string>`'name'`,
  })
    .from(menuItems)
    .innerJoin(establishments, eq(menuItems.establishmentId, establishments.id))
    .where(and(
      like(menuItems.name, searchTerm),
      completeEstablishmentFilter
    ))
    .limit(limit);
  
  const byDescription = await db.select({
    id: menuItems.id,
    name: menuItems.name,
    description: menuItems.description,
    price: menuItems.price,
    category: menuItems.category,
    establishmentId: menuItems.establishmentId,
    matchType: sql<string>`'description'`,
  })
    .from(menuItems)
    .innerJoin(establishments, eq(menuItems.establishmentId, establishments.id))
    .where(
      and(
        like(menuItems.description, searchTerm),
        // Exclude items already found by name
        sql`${menuItems.id} NOT IN (${byName.length > 0 ? byName.map(i => i.id).join(',') : '0'})`,
        completeEstablishmentFilter
      )
    )
    .limit(limit);
  
  return { byName, byDescription };
}

export async function searchAll(query: string) {
  const db = await getDb();
  if (!db) return { establishments: [], menuItemsByName: [], menuItemsByDescription: [] };
  
  const searchTerm = `%${query}%`;
  
  // 1. Search establishments by name (only complete ones)
  const estResults = await db.select({
    id: establishments.id,
    slug: establishments.slug,
    name: establishments.name,
    address: establishments.address,
    neighborhood: establishments.neighborhood,
    rating: establishments.rating,
    image: establishments.image,
    categoryId: establishments.categoryId,
    hasMenu: establishments.hasMenu,
  })
    .from(establishments)
    .where(and(
      like(establishments.name, searchTerm),
      completeEstablishmentFilter
    ))
    .limit(20);
  
  // Get category names for establishments via N:N (primary category)
  const estIdsForCat = estResults.map(e => e.id);
  let catMap: Record<number, string> = {};
  if (estIdsForCat.length > 0) {
    const ecPrimary = await db.select({
      establishmentId: establishmentCategories.establishmentId,
      categoryName: categories.name,
    })
      .from(establishmentCategories)
      .innerJoin(categories, eq(categories.id, establishmentCategories.categoryId))
      .where(and(
        inArray(establishmentCategories.establishmentId, estIdsForCat),
        eq(establishmentCategories.isPrimary, true)
      ));
    catMap = Object.fromEntries(ecPrimary.map(r => [r.establishmentId, r.categoryName]));
  }
  
  const establishmentResults = estResults.map(e => ({
    ...e,
    categoryName: catMap[e.id] || '',
  }));
  
  // 2. Search menu items by name (only from complete establishments)
  const menuByName = await db.select({
    id: menuItems.id,
    name: menuItems.name,
    description: menuItems.description,
    price: menuItems.price,
    category: menuItems.category,
    establishmentId: menuItems.establishmentId,
  })
    .from(menuItems)
    .innerJoin(establishments, eq(menuItems.establishmentId, establishments.id))
    .where(and(
      like(menuItems.name, searchTerm),
      completeEstablishmentFilter
    ))
    .limit(50);
  
  // 3. Search menu items by description (excluding those already found by name, only from complete establishments)
  const nameIds = menuByName.map(i => i.id);
  const menuByDesc = await db.select({
    id: menuItems.id,
    name: menuItems.name,
    description: menuItems.description,
    price: menuItems.price,
    category: menuItems.category,
    establishmentId: menuItems.establishmentId,
  })
    .from(menuItems)
    .innerJoin(establishments, eq(menuItems.establishmentId, establishments.id))
    .where(
      and(
        like(menuItems.description, searchTerm),
        nameIds.length > 0 ? sql`${menuItems.id} NOT IN (${sql.raw(nameIds.join(','))})` : sql`1=1`,
        completeEstablishmentFilter
      )
    )
    .limit(50);
  
  // Get establishment names for menu items
  const estIds = Array.from(new Set([...menuByName, ...menuByDesc].map(i => i.establishmentId)));
  let estMap: Record<number, { name: string; slug: string; categoryName: string }> = {};
  if (estIds.length > 0) {
    const ests = await db.select({
      id: establishments.id,
      name: establishments.name,
      slug: establishments.slug,
    })
      .from(establishments)
      .where(inArray(establishments.id, estIds));
    
    // Get primary categories for these establishments via N:N
    const ecPrimaryForMenu = await db.select({
      establishmentId: establishmentCategories.establishmentId,
      categoryName: categories.name,
    })
      .from(establishmentCategories)
      .innerJoin(categories, eq(categories.id, establishmentCategories.categoryId))
      .where(and(
        inArray(establishmentCategories.establishmentId, estIds),
        eq(establishmentCategories.isPrimary, true)
      ));
    const menuCatMap = Object.fromEntries(ecPrimaryForMenu.map(r => [r.establishmentId, r.categoryName]));
    estMap = Object.fromEntries(ests.map(e => [e.id, { name: e.name, slug: e.slug, categoryName: menuCatMap[e.id] || '' }]));
  }
  
  const menuItemsByName = menuByName.map(item => ({
    ...item,
    establishmentName: estMap[item.establishmentId]?.name || '',
    establishmentSlug: estMap[item.establishmentId]?.slug || '',
    categoryName: estMap[item.establishmentId]?.categoryName || '',
  }));
  
  const menuItemsByDescription = menuByDesc.map(item => ({
    ...item,
    establishmentName: estMap[item.establishmentId]?.name || '',
    establishmentSlug: estMap[item.establishmentId]?.slug || '',
    categoryName: estMap[item.establishmentId]?.categoryName || '',
  }));
  
  return { establishments: establishmentResults, menuItemsByName, menuItemsByDescription };
}

// ============================================================
// SEARCH BY NEIGHBORHOOD
// ============================================================

export async function getEstablishmentsByNeighborhood(neighborhood: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  const estResults = await db.select({
    id: establishments.id,
    slug: establishments.slug,
    name: establishments.name,
    address: establishments.address,
    neighborhood: establishments.neighborhood,
    rating: establishments.rating,
    image: establishments.image,
    categoryId: establishments.categoryId,
    hasMenu: establishments.hasMenu,
  })
    .from(establishments)
    .where(and(
      eq(establishments.neighborhood, neighborhood),
      completeEstablishmentFilter
    ))
    .limit(limit);

  // Get primary category names via N:N
  const estIds = estResults.map(e => e.id);
  let catMap: Record<number, string> = {};
  if (estIds.length > 0) {
    const ecPrimary = await db.select({
      establishmentId: establishmentCategories.establishmentId,
      categoryName: categories.name,
    })
      .from(establishmentCategories)
      .innerJoin(categories, eq(categories.id, establishmentCategories.categoryId))
      .where(and(
        inArray(establishmentCategories.establishmentId, estIds),
        eq(establishmentCategories.isPrimary, true)
      ));
    catMap = Object.fromEntries(ecPrimary.map(r => [r.establishmentId, r.categoryName]));
  }

  return estResults.map(e => ({
    ...e,
    categoryName: catMap[e.id] || '',
  }));
}

// ============================================================
// RATINGS
// ============================================================


export async function saveRating(userId: number, data: {
  establishmentId: number;
  type: "direct" | "analytic";
  visitDate?: string;
  overallScore?: number;
  subtotal?: number;
  servicePercent?: number;
  couvert?: number;
  valet?: number;
  parking?: number;
  totalCost?: number;
  criteriaScores?: any;
  bonusScores?: any;
  source?: "presencial" | "hibrido" | "remoto";
  items: Array<{
    menuItemId?: number;
    itemName: string;
    score: number;
    comment?: string;
    quantity?: number;
    price?: number;
  }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Generate code for new rating
  const ratingCode = await generateCode('ratings');

  // Insert rating
  const [result] = await db.insert(ratings).values({
    userId,
    code: ratingCode,
    establishmentId: data.establishmentId,
    type: data.type,
    visitDate: data.visitDate ? new Date(data.visitDate) : null,
    overallScore: data.overallScore ?? null,
    subtotal: data.subtotal ?? null,
    servicePercent: data.servicePercent ?? null,
    couvert: data.couvert ?? null,
    valet: data.valet ?? null,
    parking: data.parking ?? null,
    totalCost: data.totalCost ?? null,
    criteriaScores: data.criteriaScores ?? null,
    bonusScores: data.bonusScores ?? null,
    source: data.source ?? "remoto",
  }).$returningId();
  
  const ratingId = result.id;
  
  // Insert rating items
  if (data.items.length > 0) {
    await db.insert(ratingItems).values(
      data.items.map(item => ({
        ratingId,
        menuItemId: item.menuItemId ?? null,
        itemName: item.itemName,
        score: item.score,
        comment: item.comment ?? null,
        quantity: item.quantity ?? 1,
        price: item.price ?? null,
      }))
    );
  }

  // Notify business owner(s) of the new rating (non-blocking)
  try {
    const ownerClaims = await db.select({ userId: businessClaims.userId })
      .from(businessClaims)
      .where(and(
        eq(businessClaims.establishmentId, data.establishmentId),
        eq(businessClaims.status, "approved")
      ));
    if (ownerClaims.length > 0) {
      const est = await db.select({ name: establishments.name })
        .from(establishments)
        .where(eq(establishments.id, data.establishmentId))
        .limit(1);
      const estName = est[0]?.name || "Estabelecimento";
      const score = data.overallScore ?? (data.items.length > 0 ? (data.items.reduce((s, i) => s + i.score, 0) / data.items.length) : 0);
      const itemNames = data.items.slice(0, 3).map(i => i.itemName).join(", ");
      await db.insert(businessNotifications).values(
        ownerClaims.map(c => ({
          userId: c.userId,
          establishmentId: data.establishmentId,
          type: "new_rating",
          title: `Nova avaliação em ${estName}`,
          message: `Nota ${score.toFixed(1)} — Itens: ${itemNames}${data.items.length > 3 ? ` (+${data.items.length - 3})` : ""}`,
          ratingId,
        }))
      );
    }
  } catch (e) {
    console.error("[Notification] Failed to notify business owner:", e);
  }
  
  return { id: ratingId, success: true };
}

export async function getUserRatings(userId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    id: ratings.id,
    establishmentId: ratings.establishmentId,
    type: ratings.type,
    overallScore: ratings.overallScore,
    totalCost: ratings.totalCost,
    createdAt: ratings.createdAt,
    establishmentName: establishments.name,
    establishmentSlug: establishments.slug,
    categoryName: categories.name,
  })
    .from(ratings)
    .innerJoin(establishments, eq(ratings.establishmentId, establishments.id))
    .leftJoin(establishmentCategories, and(
      eq(establishmentCategories.establishmentId, establishments.id),
      eq(establishmentCategories.isPrimary, true)
    ))
    .leftJoin(categories, eq(categories.id, establishmentCategories.categoryId))
    .where(eq(ratings.userId, userId))
    .orderBy(desc(ratings.createdAt))
    .limit(limit)
    .offset(offset);
  
  return result;
}

export async function getRatingById(ratingId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const [rating] = await db.select()
    .from(ratings)
    .where(and(eq(ratings.id, ratingId), eq(ratings.userId, userId)))
    .limit(1);
  
  if (!rating) return undefined;
  
  const items = await db.select()
    .from(ratingItems)
    .where(eq(ratingItems.ratingId, ratingId));
  
  const est = await db.select({
    name: establishments.name,
    slug: establishments.slug,
  })
    .from(establishments)
    .where(eq(establishments.id, rating.establishmentId))
    .limit(1);
  
  return {
    ...rating,
    items,
    establishment: est.length > 0 ? est[0] : null,
  };
}

export async function getEstablishmentRatings(establishmentId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    id: ratings.id,
    type: ratings.type,
    overallScore: ratings.overallScore,
    visitDate: ratings.visitDate,
    createdAt: ratings.createdAt,
    source: ratings.source,
    userName: users.name,
    username: users.username,
    userVerified: users.verified,
  })
    .from(ratings)
    .innerJoin(users, eq(ratings.userId, users.id))
    .where(eq(ratings.establishmentId, establishmentId))
    .orderBy(desc(ratings.createdAt))
    .limit(limit)
    .offset(offset);
  
  // Fetch items for each rating
  const ratingsWithItems = await Promise.all(
    result.map(async (r) => {
      const items = await db.select({
        id: ratingItems.id,
        itemName: ratingItems.itemName,
        score: ratingItems.score,
        quantity: ratingItems.quantity,
        price: ratingItems.price,
        comment: ratingItems.comment,
      })
        .from(ratingItems)
        .where(eq(ratingItems.ratingId, r.id));
      return { ...r, items };
    })
  );
  
  return ratingsWithItems;
}

// ============ ADMIN FUNCTIONS ============

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return null;
  
  const [estCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(establishments);
  const [catCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(categories);
  const [userCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(users);
  const [ratingCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(ratings);
  const [menuCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(menuItems);
  const [claimCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(businessClaims);
  const [pendingClaims] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(businessClaims)
    .where(eq(businessClaims.status, "pending"));
  
  return {
    establishments: estCount.count,
    categories: catCount.count,
    users: userCount.count,
    ratings: ratingCount.count,
    menuItems: menuCount.count,
    totalClaims: claimCount.count,
    pendingClaims: pendingClaims.count,
  };
}

export async function getAllUsers(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt,
    lastSignedIn: users.lastSignedIn,
  })
    .from(users)
    .orderBy(desc(users.lastSignedIn))
    .limit(limit)
    .offset(offset);
}

export async function updateUserRole(userId: number, role: "user" | "influencer" | "business" | "support" | "admin" | "owner") {
  const db = await getDb();
  if (!db) return null;
  
  await db.update(users).set({ role }).where(eq(users.id, userId));
  return { success: true };
}

export async function adminUpdateEstablishment(id: number, data: {
  name?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  description?: string;
  neighborhood?: string;
  phone?: string;
  instagram?: string;
  hours?: string;
  active?: boolean;
  status?: 'active' | 'hidden' | 'pending';
}) {
  const db = await getDb();
  if (!db) return null;
  
  await db.update(establishments).set(data).where(eq(establishments.id, id));
  
  // Sync visibility after updating fields that affect completeness
  if (data.address !== undefined) {
    await syncEstablishmentVisibility(id);
  }
  
  return { success: true };
}

export async function adminDeleteEstablishment(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  // Delete menu items first
  await db.delete(menuItems).where(eq(menuItems.establishmentId, id));
  // Delete ratings and rating items
  const estRatings = await db.select({ id: ratings.id }).from(ratings).where(eq(ratings.establishmentId, id));
  for (const r of estRatings) {
    await db.delete(ratingItems).where(eq(ratingItems.ratingId, r.id));
  }
  await db.delete(ratings).where(eq(ratings.establishmentId, id));
  // Delete establishment
  await db.delete(establishments).where(eq(establishments.id, id));
  return { success: true };
}

export async function getAllClaims(status?: "pending" | "approved" | "rejected") {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select({
    id: businessClaims.id,
    userId: businessClaims.userId,
    userName: users.name,
    userEmail: users.email,
    establishmentId: businessClaims.establishmentId,
    establishmentName: establishments.name,
    status: businessClaims.status,
    businessName: businessClaims.businessName,
    contactPhone: businessClaims.contactPhone,
    contactEmail: businessClaims.contactEmail,
    proofDescription: businessClaims.proofDescription,
    adminNotes: businessClaims.adminNotes,
    createdAt: businessClaims.createdAt,
  })
    .from(businessClaims)
    .innerJoin(users, eq(businessClaims.userId, users.id))
    .innerJoin(establishments, eq(businessClaims.establishmentId, establishments.id))
    .orderBy(desc(businessClaims.createdAt));
  
  if (status) {
    return await query.where(eq(businessClaims.status, status));
  }
  return await query;
}

export async function reviewClaim(claimId: number, adminId: number, status: "approved" | "rejected", adminNotes?: string) {
  const db = await getDb();
  if (!db) return null;
  
  // Update claim status
  await db.update(businessClaims).set({
    status,
    adminNotes: adminNotes || null,
    reviewedBy: adminId,
    reviewedAt: new Date(),
  }).where(eq(businessClaims.id, claimId));
  
  // If approved, promote user to business role
  if (status === "approved") {
    const [claim] = await db.select().from(businessClaims).where(eq(businessClaims.id, claimId));
    if (claim) {
      await db.update(users).set({ role: "business" }).where(eq(users.id, claim.userId));
    }
  }
  
  return { success: true };
}

// ============ BUSINESS FUNCTIONS ============

export async function submitClaim(userId: number, data: {
  establishmentId: number;
  businessName: string;
  contactPhone: string;
  contactEmail: string;
  proofDescription: string;
}) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(businessClaims).values({
    userId,
    establishmentId: data.establishmentId,
    businessName: data.businessName,
    contactPhone: data.contactPhone,
    contactEmail: data.contactEmail,
    proofDescription: data.proofDescription,
  });
  
  return { id: result[0].insertId };
}

export async function getUserClaims(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select({
    id: businessClaims.id,
    establishmentId: businessClaims.establishmentId,
    establishmentName: establishments.name,
    status: businessClaims.status,
    adminNotes: businessClaims.adminNotes,
    createdAt: businessClaims.createdAt,
  })
    .from(businessClaims)
    .innerJoin(establishments, eq(businessClaims.establishmentId, establishments.id))
    .where(eq(businessClaims.userId, userId))
    .orderBy(desc(businessClaims.createdAt));
}

export async function getBusinessEstablishments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Get approved claims for this user
  const claims = await db.select({ establishmentId: businessClaims.establishmentId })
    .from(businessClaims)
    .where(and(
      eq(businessClaims.userId, userId),
      eq(businessClaims.status, "approved")
    ));
  
  if (claims.length === 0) return [];
  
  const estIds = claims.map(c => c.establishmentId);
  return await db.select()
    .from(establishments)
    .where(inArray(establishments.id, estIds));
}

export async function businessUpdateEstablishment(userId: number, establishmentId: number, data: {
  name?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  description?: string;
  neighborhood?: string;
  phone?: string;
  instagram?: string;
  hours?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  
  // Verify ownership
  const [claim] = await db.select()
    .from(businessClaims)
    .where(and(
      eq(businessClaims.userId, userId),
      eq(businessClaims.establishmentId, establishmentId),
      eq(businessClaims.status, "approved")
    ));
  
  if (!claim) return null;
  
  await db.update(establishments).set(data).where(eq(establishments.id, establishmentId));
  
  // Sync visibility after updating fields that affect completeness
  if (data.address !== undefined) {
    await syncEstablishmentVisibility(establishmentId);
  }
  
  return { success: true };
}

export async function businessAddMenuItem(userId: number, establishmentId: number, data: {
  name: string;
  description?: string;
  price?: number;
  category?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  
  // Verify ownership
  const [claim] = await db.select()
    .from(businessClaims)
    .where(and(
      eq(businessClaims.userId, userId),
      eq(businessClaims.establishmentId, establishmentId),
      eq(businessClaims.status, "approved")
    ));
  
  if (!claim) return null;
  
  // Generate code for new menu item
  const itemCode = await generateCode('menu_items');

  const result = await db.insert(menuItems).values({
    establishmentId,
    code: itemCode,
    name: data.name,
    description: data.description || null,
    price: data.price || null,
    category: data.category || null,
  });
  
  // Update hasMenu flag and sync visibility
  await db.update(establishments).set({ hasMenu: true }).where(eq(establishments.id, establishmentId));
  await syncEstablishmentVisibility(establishmentId);
  
  return { id: result[0].insertId };
}

export async function businessDeleteMenuItem(userId: number, menuItemId: number) {
  const db = await getDb();
  if (!db) return null;
  
  // Get the menu item to verify ownership
  const [item] = await db.select().from(menuItems).where(eq(menuItems.id, menuItemId));
  if (!item) return null;
  
  // Verify ownership
  const [claim] = await db.select()
    .from(businessClaims)
    .where(and(
      eq(businessClaims.userId, userId),
      eq(businessClaims.establishmentId, item.establishmentId),
      eq(businessClaims.status, "approved")
    ));
  
  if (!claim) return null;
  
  await db.delete(menuItems).where(eq(menuItems.id, menuItemId));
  
  // Check if establishment still has menu items
  const remaining = await db.select({ count: sql<number>`COUNT(*)` })
    .from(menuItems)
    .where(eq(menuItems.establishmentId, item.establishmentId));
  
  if (Number(remaining[0]?.count) === 0) {
    await db.update(establishments)
      .set({ hasMenu: false })
      .where(eq(establishments.id, item.establishmentId));
  }
  await syncEstablishmentVisibility(item.establishmentId);
  
  return { success: true };
}


// ============================================================
// BUSINESS NOTIFICATIONS
// ============================================================

export async function getBusinessNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Get approved claims for this user
  const claims = await db.select({ establishmentId: businessClaims.establishmentId })
    .from(businessClaims)
    .where(and(
      eq(businessClaims.userId, userId),
      eq(businessClaims.status, "approved")
    ));
  
  if (claims.length === 0) return [];
  
  const estIds = claims.map(c => c.establishmentId);
  const ests = await db.select()
    .from(establishments)
    .where(inArray(establishments.id, estIds));
  
  const notifications: Array<{
    type: 'missing_field' | 'missing_photo';
    severity: 'error' | 'warning';
    establishmentId: number;
    establishmentName: string;
    message: string;
    field?: string;
    count?: number;
  }> = [];
  
  for (const est of ests) {
    // Check required fields
    if (!est.address || est.address.trim() === '') {
      notifications.push({
        type: 'missing_field',
        severity: 'error',
        establishmentId: est.id,
        establishmentName: est.name,
        message: `"${est.name}" está sem endereço. O estabelecimento ficará oculto até preencher.`,
        field: 'endereço',
      });
    }
    if (!est.hours || est.hours.trim() === '') {
      notifications.push({
        type: 'missing_field',
        severity: 'error',
        establishmentId: est.id,
        establishmentName: est.name,
        message: `"${est.name}" está sem horário de funcionamento. O estabelecimento ficará oculto até preencher.`,
        field: 'horário',
      });
    }
    if (!est.hasMenu) {
      notifications.push({
        type: 'missing_field',
        severity: 'error',
        establishmentId: est.id,
        establishmentName: est.name,
        message: `"${est.name}" está sem cardápio. Adicione itens para ficar visível no app.`,
        field: 'cardápio',
      });
    }
    
    // Check menu items without photo
    const items = await db.select()
      .from(menuItems)
      .where(eq(menuItems.establishmentId, est.id));
    
    const itemsWithoutPhoto = items.filter(m => !m.imageUrl || m.imageUrl.trim() === '');
    if (itemsWithoutPhoto.length > 0) {
      notifications.push({
        type: 'missing_photo',
        severity: 'warning',
        establishmentId: est.id,
        establishmentName: est.name,
        message: `"${est.name}" tem ${itemsWithoutPhoto.length} ${itemsWithoutPhoto.length === 1 ? 'item' : 'itens'} sem foto no cardápio.`,
        count: itemsWithoutPhoto.length,
      });
    }
  }
  
  return notifications;
}

// ============================================================
// BUSINESS RATING NOTIFICATIONS (persistent)
// ============================================================

export async function getBusinessRatingNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select()
    .from(businessNotifications)
    .where(eq(businessNotifications.userId, userId))
    .orderBy(desc(businessNotifications.createdAt))
    .limit(50);
}

export async function markBusinessNotificationRead(userId: number, notificationId: number) {
  const db = await getDb();
  if (!db) return { success: false };
  await db.update(businessNotifications)
    .set({ isRead: true })
    .where(and(
      eq(businessNotifications.id, notificationId),
      eq(businessNotifications.userId, userId)
    ));
  return { success: true };
}

// ============================================================
// RANKINGS
// ============================================================

/**
 * Get the establishments a user has rated in a specific category.
 * Used to determine what options are available for ranking.
 */
export async function getUserRatedEstablishmentsByCategory(userId: number, categoryId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({
    id: establishments.id,
    slug: establishments.slug,
    name: establishments.name,
    image: establishments.image,
    neighborhood: establishments.neighborhood,
    avgScore: sql<number>`AVG(${ratings.overallScore})`,
    ratingCount: sql<number>`COUNT(${ratings.id})`,
  })
    .from(ratings)
    .innerJoin(establishments, eq(establishments.id, ratings.establishmentId))
    .innerJoin(establishmentCategories, and(
      eq(establishmentCategories.establishmentId, establishments.id),
      eq(establishmentCategories.categoryId, categoryId)
    ))
    .where(eq(ratings.userId, userId))
    .groupBy(establishments.id);

  return result;
}

/**
 * Get the user's current ranking for a specific category.
 */
export async function getUserRanking(userId: number, categoryId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({
    id: userRankings.id,
    position: userRankings.position,
    establishmentId: userRankings.establishmentId,
    establishmentName: establishments.name,
    establishmentSlug: establishments.slug,
    establishmentImage: establishments.image,
    establishmentNeighborhood: establishments.neighborhood,
  })
    .from(userRankings)
    .innerJoin(establishments, eq(establishments.id, userRankings.establishmentId))
    .where(and(
      eq(userRankings.userId, userId),
      eq(userRankings.categoryId, categoryId),
    ))
    .orderBy(userRankings.position);

  return result;
}

/**
 * Save or update a user's ranking for a category.
 * Replaces all existing ranking entries for this user+category.
 */
export async function saveUserRanking(userId: number, categoryId: number, rankedEstablishments: { establishmentId: number; position: number }[]) {
  const db = await getDb();
  if (!db) return { success: false };

  // Delete existing ranking for this user+category
  await db.delete(userRankings).where(and(
    eq(userRankings.userId, userId),
    eq(userRankings.categoryId, categoryId),
  ));

  // Insert new ranking entries
  if (rankedEstablishments.length > 0) {
    await db.insert(userRankings).values(
      rankedEstablishments.map(item => ({
        userId,
        categoryId,
        establishmentId: item.establishmentId,
        position: item.position,
      }))
    );
  }

  return { success: true };
}

/**
 * Get all rankings for a user across all categories (summary view).
 */
export async function getUserRankingSummary(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({
    categoryId: categories.id,
    categoryName: categories.name,
    categorySlug: categories.slug,
    categoryIcon: categories.icon,
    rankingCount: sql<number>`COUNT(${userRankings.id})`,
  })
    .from(userRankings)
    .innerJoin(categories, eq(categories.id, userRankings.categoryId))
    .where(eq(userRankings.userId, userId))
    .groupBy(categories.id);

  return result;
}

/**
 * Get nearby establishments in a category that the user has NOT rated yet.
 * Used for the discovery banner.
 */
export async function getDiscoveryEstablishments(userId: number, categoryId: number, lat?: number, lng?: number, limit = 6) {
  const db = await getDb();
  if (!db) return [];

  // Get IDs the user already rated in this category (via N:N)
  const ratedIds = await db.select({ id: ratings.establishmentId })
    .from(ratings)
    .innerJoin(establishments, eq(establishments.id, ratings.establishmentId))
    .innerJoin(establishmentCategories, and(
      eq(establishmentCategories.establishmentId, establishments.id),
      eq(establishmentCategories.categoryId, categoryId)
    ))
    .where(eq(ratings.userId, userId))
    .groupBy(ratings.establishmentId);

  const ratedIdSet = ratedIds.map(r => r.id);

  // Query establishments in this category (via N:N) that user hasn't rated
  const ecInCategory = await db.select({ establishmentId: establishmentCategories.establishmentId })
    .from(establishmentCategories)
    .where(eq(establishmentCategories.categoryId, categoryId));
  const estIdsInCategory = ecInCategory.map(r => r.establishmentId);
  
  if (estIdsInCategory.length === 0) return [];
  
  const conditions = [
    inArray(establishments.id, estIdsInCategory),
    ...(ratedIdSet.length > 0 ? [notInArray(establishments.id, ratedIdSet)] : []),
  ];

  if (lat && lng) {
    const result = await db.select({
      id: establishments.id,
      slug: establishments.slug,
      name: establishments.name,
      image: establishments.image,
      neighborhood: establishments.neighborhood,
      lat: establishments.lat,
      lng: establishments.lng,
      rating: establishments.rating,
    })
      .from(establishments)
      .where(and(...conditions))
      .orderBy(sql`(POW(${establishments.lat} - ${lat}, 2) + POW(${establishments.lng} - ${lng}, 2))`)
      .limit(limit);
    return result;
  }

  const result = await db.select({
    id: establishments.id,
    slug: establishments.slug,
    name: establishments.name,
    image: establishments.image,
    neighborhood: establishments.neighborhood,
    lat: establishments.lat,
    lng: establishments.lng,
    rating: establishments.rating,
  })
    .from(establishments)
    .where(and(...conditions))
    .limit(limit);

  return result;
}

// ============================================================
// USERNAME MANAGEMENT
// ============================================================

export async function checkUsernameAvailable(username: string, excludeUserId?: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (rows.length === 0) return true;
  if (excludeUserId && rows[0].id === excludeUserId) return true;
  return false;
}

export async function generateUsernameSuggestions(baseName: string, excludeUserId?: number): Promise<string[]> {
  // Remove spaces and special chars, lowercase
  const clean = baseName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const parts = baseName.toLowerCase().trim().split(/\s+/).filter(Boolean);
  
  const candidates: string[] = [];
  
  if (parts.length >= 2) {
    const first = parts[0].replace(/[^a-z0-9]/g, "");
    const last = parts[parts.length - 1].replace(/[^a-z0-9]/g, "");
    candidates.push(
      `${first}${last}`,
      `${first}_${last}`,
      `${first}.${last}`,
      `${last}${first}`,
      `${last}_${first}`,
      `${last}.${first}`
    );
  } else {
    candidates.push(clean, `${clean}_`, `_${clean}`, `${clean}1`, `${clean}2`);
  }

  // Check availability for each
  const available: string[] = [];
  for (const candidate of candidates) {
    if (candidate.length < 3) continue;
    const isAvailable = await checkUsernameAvailable(candidate, excludeUserId);
    if (isAvailable) {
      available.push(candidate);
    }
  }
  return available.slice(0, 6);
}

export async function setUsername(userId: number, username: string): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  if (!db) return { success: false, error: "Database unavailable" };
  
  // Validate: no spaces, lowercase, alphanumeric + _ and .
  if (/\s/.test(username)) return { success: false, error: "Nome de usuário não pode conter espaços" };
  if (!/^[a-z0-9_.]{3,30}$/.test(username)) return { success: false, error: "Nome de usuário deve ter 3-30 caracteres (letras, números, _ ou .)" };
  
  // Check uniqueness
  const isAvailable = await checkUsernameAvailable(username, userId);
  if (!isAvailable) return { success: false, error: "Este nome de usuário já está em uso" };
  
  await db.update(users).set({ username }).where(eq(users.id, userId));
  return { success: true };
}

export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      username: users.username,
      birthdate: users.birthdate,
      role: users.role,
      verified: users.verified,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return rows[0] || null;
}

export async function updateUserProfile(userId: number, data: { name?: string; username?: string; birthdate?: string }) {
  const db = await getDb();
  if (!db) return null;
  
  const updateData: Record<string, any> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.birthdate !== undefined) updateData.birthdate = data.birthdate;
  if (data.username !== undefined) {
    // Check username availability
    const existing = await db.select({ id: users.id }).from(users)
      .where(and(eq(users.username, data.username), sql`${users.id} != ${userId}`))
      .limit(1);
    if (existing.length > 0) {
      throw new Error("Username já está em uso");
    }
    updateData.username = data.username;
  }
  
  if (Object.keys(updateData).length === 0) return { success: true };
  
  await db.update(users).set(updateData).where(eq(users.id, userId));
  return { success: true };
}

// ─── Create Establishment (Admin) ────────────────────────────────────────────

export async function createEstablishment(data: {
  name: string;
  categoryId: number;
  address?: string;
  addressNumber?: string;
  complement?: string;
  description?: string;
  neighborhood?: string;
  region?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  instagram?: string;
  hours?: string;
  image?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Generate slug from name
  const slug = data.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    + "-" + Date.now().toString(36);

  // New establishments without address/hours/menu start as pending
  const isComplete = !!(data.address && data.address.trim() !== '' && data.hours && data.hours.trim() !== '');
  // hasMenu is always false for new estabs (no menu items yet), so always pending initially
  const shouldHide = !isComplete || true; // always pending until menu is added

  // Generate code for new establishment
  const estabCode = await generateCode('establishments');

  const result = await db.insert(establishments).values({
    slug,
    code: estabCode,
    name: data.name,
    categoryId: data.categoryId,
    address: data.address || null,
    addressNumber: data.addressNumber || null,
    complement: data.complement || null,
    description: data.description || null,
    neighborhood: data.neighborhood || null,
    region: data.region || null,
    lat: data.lat || null,
    lng: data.lng || null,
    phone: data.phone || null,
    instagram: data.instagram || null,
    hours: data.hours || null,
    image: data.image || null,
    hasMenu: false,
    status: shouldHide ? 'pending' : 'active',
    source: "admin",
  });

  return { id: result[0].insertId, slug };
}

// ─── Code Backup ────────────────────────────────────────────────────────────

const CODE_BACKUP_STORAGE_PREFIX = "code-backups/";

export async function generateCodeBackup() {
  const projectRoot = path.resolve(import.meta.dirname, '..');
  
  // Collect all source files
  const sourceFiles: Array<{ path: string; content: string }> = [];
  const extensions = ['.ts', '.tsx', '.css', '.json', '.html'];
  const excludeDirs = ['node_modules', '.git', 'dist', '.manus-logs', '.manus', 'references'];

  function walkDir(dir: string, relativeTo: string) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (excludeDirs.includes(entry.name)) continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkDir(fullPath, relativeTo);
        } else if (extensions.some(ext => entry.name.endsWith(ext))) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const relPath = path.relative(relativeTo, fullPath);
            sourceFiles.push({ path: relPath, content });
          } catch { /* skip unreadable files */ }
        }
      }
    } catch { /* skip unreadable dirs */ }
  }

  walkDir(projectRoot, projectRoot);

  // Generate a structured backup document
  const timestamp = new Date().toISOString();
  const backupId = `backup-${Date.now().toString(36)}`;
  
  let document = `# Avalyarin - Backup do C\u00f3digo Fonte\n`;
  document += `## Gerado em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}\n`;
  document += `## Total de arquivos: ${sourceFiles.length}\n\n`;
  document += `---\n\n`;

  // Group by directory
  const byDir: Record<string, typeof sourceFiles> = {};
  for (const file of sourceFiles) {
    const dir = path.dirname(file.path) || '.';
    if (!byDir[dir]) byDir[dir] = [];
    byDir[dir].push(file);
  }

  const sortedDirs = Object.keys(byDir).sort();
  for (const dir of sortedDirs) {
    document += `## \uD83D\uDCC1 ${dir}/\n\n`;
    for (const file of byDir[dir].sort((a, b) => a.path.localeCompare(b.path))) {
      const ext = path.extname(file.path).slice(1) || 'text';
      document += `### \u2514\u2500 ${path.basename(file.path)}\n\n`;
      document += `\`\`\`${ext}\n${file.content}\n\`\`\`\n\n`;
    }
  }

  // Upload to storage
  const buffer = Buffer.from(document, 'utf-8');
  const sizeKB = Math.round(buffer.length / 1024);
  const { url } = await storagePut(
    `${CODE_BACKUP_STORAGE_PREFIX}${backupId}.md`,
    buffer,
    'text/markdown'
  );

  const backupEntry = {
    id: backupId,
    createdAt: timestamp,
    url,
    sizeKB,
    fileCount: sourceFiles.length,
  };

  // Persist to database
  const db = await getDb();
  if (db) {
    await db.execute(sql`INSERT INTO code_backups (backupId, createdAt, url, sizeKB, fileCount) VALUES (${backupId}, NOW(), ${url}, ${sizeKB}, ${sourceFiles.length})`);
  }

  return backupEntry;
}

export async function getCodeBackups() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(sql`SELECT backupId as id, createdAt, url, sizeKB, fileCount FROM code_backups ORDER BY createdAt DESC LIMIT 10`);
  return (rows[0] as unknown as any[]).map(r => ({
    id: r.id,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    url: r.url,
    sizeKB: r.sizeKB,
    fileCount: r.fileCount,
  }));
}

// ─── Survey & Profile ────────────────────────────────────────────────────────

export async function saveSurveyData(userId: number, surveyData: Record<string, any>, birthdate?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateFields: Record<string, any> = { surveyData };
  if (birthdate) {
    updateFields.birthdate = birthdate;
  }
  await db.update(users).set(updateFields).where(eq(users.id, userId));
  return { success: true };
}

export async function getUserSurveyData(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({
      birthdate: users.birthdate,
      surveyData: users.surveyData,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return rows[0] || null;
}

// ─── Age Verification ────────────────────────────────────────────────────────

export async function submitAgeVerification(userId: number, data: {
  documentUrl: string;
  documentKey: string;
  requestedBirthdate: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(ageVerificationRequests).values({
    userId,
    documentUrl: data.documentUrl,
    documentKey: data.documentKey,
    requestedBirthdate: data.requestedBirthdate,
    status: "pending",
  });
  return { id: result[0].insertId };
}

export async function getAgeVerificationRequests(status?: "pending" | "approved" | "rejected") {
  const db = await getDb();
  if (!db) return [];
  const conditions = status ? eq(ageVerificationRequests.status, status) : undefined;
  const rows = await db
    .select({
      id: ageVerificationRequests.id,
      userId: ageVerificationRequests.userId,
      documentUrl: ageVerificationRequests.documentUrl,
      requestedBirthdate: ageVerificationRequests.requestedBirthdate,
      status: ageVerificationRequests.status,
      adminNotes: ageVerificationRequests.adminNotes,
      reviewedBy: ageVerificationRequests.reviewedBy,
      reviewedAt: ageVerificationRequests.reviewedAt,
      createdAt: ageVerificationRequests.createdAt,
    })
    .from(ageVerificationRequests)
    .where(conditions)
    .orderBy(desc(ageVerificationRequests.createdAt));
  
  // Join user names
  const userIds = Array.from(new Set(rows.map(r => r.userId)));
  if (userIds.length === 0) return [];
  const userRows = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(inArray(users.id, userIds));
  const userMap = Object.fromEntries(userRows.map(u => [u.id, u]));
  
  return rows.map(r => ({
    ...r,
    userName: userMap[r.userId]?.name || "Desconhecido",
    userEmail: userMap[r.userId]?.email || "",
  }));
}

export async function reviewAgeVerification(requestId: number, adminId: number, status: "approved" | "rejected", adminNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get the request
  const rows = await db
    .select()
    .from(ageVerificationRequests)
    .where(eq(ageVerificationRequests.id, requestId))
    .limit(1);
  if (!rows[0]) throw new Error("Request not found");
  const request = rows[0];
  
  // Update request status
  await db.update(ageVerificationRequests).set({
    status,
    adminNotes: adminNotes || null,
    reviewedBy: adminId,
    reviewedAt: new Date(),
  }).where(eq(ageVerificationRequests.id, requestId));
  
  // If approved, update user's birthdate
  if (status === "approved") {
    await db.update(users).set({
      birthdate: request.requestedBirthdate,
    }).where(eq(users.id, request.userId));
  }
  
  return { success: true };
}

export async function getUserAgeVerificationStatus(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({
      id: ageVerificationRequests.id,
      status: ageVerificationRequests.status,
      requestedBirthdate: ageVerificationRequests.requestedBirthdate,
      adminNotes: ageVerificationRequests.adminNotes,
      createdAt: ageVerificationRequests.createdAt,
    })
    .from(ageVerificationRequests)
    .where(eq(ageVerificationRequests.userId, userId))
    .orderBy(desc(ageVerificationRequests.createdAt))
    .limit(1);
  return rows[0] || null;
}

// ============================================================
// GROUP EVENTS
// ============================================================

export async function createGroupEvent(data: {
  groupId: number;
  creatorId: number;
  establishmentId: number;
  title: string;
  description?: string;
  eventDate: Date;
  maxGuests?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const code = `ev${String(Date.now() % 999999).padStart(6, '0')}`;

  const [result] = await db.insert(groupEvents).values({
    code,
    groupId: data.groupId,
    creatorId: data.creatorId,
    establishmentId: data.establishmentId,
    title: data.title,
    description: data.description || null,
    eventDate: data.eventDate,
    maxGuests: data.maxGuests || null,
  }).$returningId();

  return { id: result.id, code };
}

export async function getGroupEvents(groupId: number, status: 'active' | 'cancelled' | 'completed' = 'active') {
  const db = await getDb();
  if (!db) return [];

  const rows = await db.select({
    id: groupEvents.id,
    code: groupEvents.code,
    groupId: groupEvents.groupId,
    creatorId: groupEvents.creatorId,
    establishmentId: groupEvents.establishmentId,
    title: groupEvents.title,
    description: groupEvents.description,
    eventDate: groupEvents.eventDate,
    maxGuests: groupEvents.maxGuests,
    status: groupEvents.status,
    createdAt: groupEvents.createdAt,
    establishmentName: establishments.name,
    establishmentSlug: establishments.slug,
    establishmentNeighborhood: establishments.neighborhood,
    establishmentAddress: establishments.address,
    establishmentImage: establishments.image,
    creatorName: users.name,
  })
    .from(groupEvents)
    .innerJoin(establishments, eq(establishments.id, groupEvents.establishmentId))
    .innerJoin(users, eq(users.id, groupEvents.creatorId))
    .where(and(
      eq(groupEvents.groupId, groupId),
      eq(groupEvents.status, status)
    ))
    .orderBy(groupEvents.eventDate);

  return rows;
}

export async function getEventById(eventId: number) {
  const db = await getDb();
  if (!db) return null;

  const [event] = await db.select({
    id: groupEvents.id,
    code: groupEvents.code,
    groupId: groupEvents.groupId,
    creatorId: groupEvents.creatorId,
    establishmentId: groupEvents.establishmentId,
    title: groupEvents.title,
    description: groupEvents.description,
    eventDate: groupEvents.eventDate,
    maxGuests: groupEvents.maxGuests,
    status: groupEvents.status,
    createdAt: groupEvents.createdAt,
    establishmentName: establishments.name,
    establishmentSlug: establishments.slug,
    establishmentNeighborhood: establishments.neighborhood,
    establishmentAddress: establishments.address,
    establishmentImage: establishments.image,
    establishmentLat: establishments.lat,
    establishmentLng: establishments.lng,
    creatorName: users.name,
    groupName: groups.name,
  })
    .from(groupEvents)
    .innerJoin(establishments, eq(establishments.id, groupEvents.establishmentId))
    .innerJoin(users, eq(users.id, groupEvents.creatorId))
    .innerJoin(groups, eq(groups.id, groupEvents.groupId))
    .where(eq(groupEvents.id, eventId))
    .limit(1);

  return event || null;
}

export async function getEventRsvps(eventId: number) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db.select({
    id: eventRsvps.id,
    eventId: eventRsvps.eventId,
    userId: eventRsvps.userId,
    status: eventRsvps.status,
    respondedAt: eventRsvps.respondedAt,
    userName: users.name,
    userUsername: users.username,
  })
    .from(eventRsvps)
    .innerJoin(users, eq(users.id, eventRsvps.userId))
    .where(eq(eventRsvps.eventId, eventId));

  return rows;
}

export async function rsvpEvent(eventId: number, userId: number, status: 'confirmed' | 'maybe' | 'declined') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if RSVP already exists
  const existing = await db.select()
    .from(eventRsvps)
    .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)))
    .limit(1);

  if (existing.length > 0) {
    // Update existing RSVP
    await db.update(eventRsvps)
      .set({ status, respondedAt: new Date() })
      .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)));
  } else {
    // Create new RSVP
    await db.insert(eventRsvps).values({
      eventId,
      userId,
      status,
      respondedAt: new Date(),
    });
  }

  return { success: true };
}

export async function getUserEvents(userId: number, upcoming = true) {
  const db = await getDb();
  if (!db) return [];

  // Get all groups the user is a member of
  const memberGroups = await db.select({ groupId: groupMembers.groupId })
    .from(groupMembers)
    .where(eq(groupMembers.userId, userId));

  if (memberGroups.length === 0) return [];

  const groupIds = memberGroups.map(g => g.groupId);

  const dateFilter = upcoming
    ? sql`${groupEvents.eventDate} >= NOW()`
    : sql`${groupEvents.eventDate} < NOW()`;

  const rows = await db.select({
    id: groupEvents.id,
    code: groupEvents.code,
    groupId: groupEvents.groupId,
    creatorId: groupEvents.creatorId,
    establishmentId: groupEvents.establishmentId,
    title: groupEvents.title,
    description: groupEvents.description,
    eventDate: groupEvents.eventDate,
    maxGuests: groupEvents.maxGuests,
    status: groupEvents.status,
    createdAt: groupEvents.createdAt,
    establishmentName: establishments.name,
    establishmentSlug: establishments.slug,
    establishmentNeighborhood: establishments.neighborhood,
    establishmentImage: establishments.image,
    creatorName: users.name,
    groupName: groups.name,
  })
    .from(groupEvents)
    .innerJoin(establishments, eq(establishments.id, groupEvents.establishmentId))
    .innerJoin(users, eq(users.id, groupEvents.creatorId))
    .innerJoin(groups, eq(groups.id, groupEvents.groupId))
    .where(and(
      inArray(groupEvents.groupId, groupIds),
      eq(groupEvents.status, 'active'),
      dateFilter
    ))
    .orderBy(groupEvents.eventDate);

  return rows;
}

export async function cancelGroupEvent(eventId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Only creator can cancel
  const [event] = await db.select({ creatorId: groupEvents.creatorId })
    .from(groupEvents)
    .where(eq(groupEvents.id, eventId))
    .limit(1);

  if (!event || event.creatorId !== userId) {
    throw new Error("Apenas o criador pode cancelar o evento");
  }

  await db.update(groupEvents)
    .set({ status: 'cancelled' })
    .where(eq(groupEvents.id, eventId));

  return { success: true };
}
