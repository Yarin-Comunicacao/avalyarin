import { eq, like, or, sql, and, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, categories, establishments, menuItems } from "../drizzle/schema";
import { ENV } from './_core/env';

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
  
  const [countResult] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(establishments)
    .where(eq(establishments.categoryId, cat[0].id));
  
  return { ...cat[0], establishmentCount: countResult.count };
}

export async function getCategoriesWithCounts() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    id: categories.id,
    slug: categories.slug,
    name: categories.name,
    description: categories.description,
    icon: categories.icon,
    active: categories.active,
    establishmentCount: sql<number>`COUNT(${establishments.id})`,
  })
    .from(categories)
    .leftJoin(establishments, eq(establishments.categoryId, categories.id))
    .groupBy(categories.id);
  
  return result;
}

// ============================================================
// ESTABLISHMENTS
// ============================================================

export async function getEstablishmentsByCategory(categorySlug: string, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  
  const cat = await db.select().from(categories).where(eq(categories.slug, categorySlug)).limit(1);
  if (cat.length === 0) return [];
  
  const result = await db.select()
    .from(establishments)
    .where(eq(establishments.categoryId, cat[0].id))
    .limit(limit)
    .offset(offset);
  
  return result;
}

export async function getEstablishmentBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select()
    .from(establishments)
    .where(eq(establishments.slug, slug))
    .limit(1);
  
  if (result.length === 0) return undefined;
  
  // Get category info
  const cat = await db.select().from(categories).where(eq(categories.id, result[0].categoryId)).limit(1);
  
  return {
    ...result[0],
    category: cat.length > 0 ? cat[0] : null,
  };
}

export async function getEstablishmentWithMenu(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const est = await db.select()
    .from(establishments)
    .where(eq(establishments.slug, slug))
    .limit(1);
  
  if (est.length === 0) return undefined;
  
  const cat = await db.select().from(categories).where(eq(categories.id, est[0].categoryId)).limit(1);
  
  const menu = await db.select()
    .from(menuItems)
    .where(eq(menuItems.establishmentId, est[0].id));
  
  return {
    ...est[0],
    category: cat.length > 0 ? cat[0] : null,
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
    hasMenu: establishments.hasMenu,
    source: establishments.source,
    distance: distanceExpr,
  })
    .from(establishments)
    .innerJoin(categories, eq(establishments.categoryId, categories.id))
    .where(
      and(
        sql`${establishments.lat} IS NOT NULL`,
        sql`${establishments.lng} IS NOT NULL`,
        sql`${distanceExpr} < ${radiusKm}`
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
    .where(like(establishments.name, searchTerm))
    .limit(limit);
  
  return result;
}

export async function searchMenuItems(query: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  const searchTerm = `%${query}%`;
  
  // Search by name first, then description
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
    .where(like(menuItems.name, searchTerm))
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
    .where(
      and(
        like(menuItems.description, searchTerm),
        // Exclude items already found by name
        sql`${menuItems.id} NOT IN (${byName.length > 0 ? byName.map(i => i.id).join(',') : '0'})`
      )
    )
    .limit(limit);
  
  return { byName, byDescription };
}

export async function searchAll(query: string) {
  const db = await getDb();
  if (!db) return { establishments: [], menuItemsByName: [], menuItemsByDescription: [] };
  
  const searchTerm = `%${query}%`;
  
  // 1. Search establishments by name
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
    .where(like(establishments.name, searchTerm))
    .limit(20);
  
  // Get category names for establishments
  const catIds = Array.from(new Set(estResults.map(e => e.categoryId)));
  let catMap: Record<number, string> = {};
  if (catIds.length > 0) {
    const cats = await db.select({ id: categories.id, name: categories.name, slug: categories.slug })
      .from(categories)
      .where(inArray(categories.id, catIds));
    catMap = Object.fromEntries(cats.map(c => [c.id, c.name]));
  }
  
  const establishmentResults = estResults.map(e => ({
    ...e,
    categoryName: catMap[e.categoryId] || '',
  }));
  
  // 2. Search menu items by name
  const menuByName = await db.select({
    id: menuItems.id,
    name: menuItems.name,
    description: menuItems.description,
    price: menuItems.price,
    category: menuItems.category,
    establishmentId: menuItems.establishmentId,
  })
    .from(menuItems)
    .where(like(menuItems.name, searchTerm))
    .limit(50);
  
  // 3. Search menu items by description (excluding those already found by name)
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
    .where(
      and(
        like(menuItems.description, searchTerm),
        nameIds.length > 0 ? sql`${menuItems.id} NOT IN (${sql.raw(nameIds.join(','))})` : sql`1=1`
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
      categoryId: establishments.categoryId,
    })
      .from(establishments)
      .where(inArray(establishments.id, estIds));
    
    // Get categories for these establishments
    const estCatIds = Array.from(new Set(ests.map(e => e.categoryId)));
    if (estCatIds.length > 0) {
      const estCats = await db.select({ id: categories.id, name: categories.name })
        .from(categories)
        .where(inArray(categories.id, estCatIds));
      const estCatMap = Object.fromEntries(estCats.map(c => [c.id, c.name]));
      estMap = Object.fromEntries(ests.map(e => [e.id, { name: e.name, slug: e.slug, categoryName: estCatMap[e.categoryId] || '' }]));
    }
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
// RATINGS
// ============================================================

import { ratings, ratingItems } from "../drizzle/schema";
import { desc } from "drizzle-orm";

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
  
  // Insert rating
  const [result] = await db.insert(ratings).values({
    userId,
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
    .innerJoin(categories, eq(establishments.categoryId, categories.id))
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
    createdAt: ratings.createdAt,
    userName: users.name,
  })
    .from(ratings)
    .innerJoin(users, eq(ratings.userId, users.id))
    .where(eq(ratings.establishmentId, establishmentId))
    .orderBy(desc(ratings.createdAt))
    .limit(limit)
    .offset(offset);
  
  return result;
}
