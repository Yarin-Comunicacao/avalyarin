/**
 * Establishment Posts System (Destaques)
 * 
 * Ephemeral 9:16 vertical content posted by business accounts.
 * Shown in carousels on Home: "Salvos" (followed) and "Perto de Mim" (geo-based).
 * 
 * Post types & default durations:
 * - brand: Divulgação (30 dias)
 * - menu_daily: Cardápio do Dia (expira no horário de fechamento do estab)
 * - promotion: Promoção (7 dias)
 * - event: Evento (15 dias ou até a data do evento)
 * - new_item: Novidade (30 dias)
 * - collab: Parceria (21 dias)
 */

import { drizzle } from "drizzle-orm/mysql2";
import { sql, eq, and, gte, lte, inArray, desc } from "drizzle-orm";
import { establishmentPosts, userSavedEstablishments, establishments } from "../drizzle/schema";

// Lazy DB import
let _db: ReturnType<typeof drizzle> | null = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    _db = drizzle(process.env.DATABASE_URL);
  }
  return _db;
}

// ==================== TYPES ====================

export type PostType = "event" | "promotion" | "brand" | "menu_daily" | "new_item" | "collab";

/** Default duration in days for each post type */
export const POST_TYPE_DURATIONS: Record<PostType, number> = {
  brand: 30,
  menu_daily: 1, // special: expires at closing time
  promotion: 7,
  event: 15, // or until event date
  new_item: 30,
  collab: 21,
};

export interface PostForCarousel {
  id: number;
  establishmentId: number;
  establishmentName: string;
  establishmentImage: string | null;
  neighborhood: string | null;
  slug: string | null;
  type: PostType;
  title: string;
  description: string | null;
  imageUrl: string;
  linkUrl: string | null;
  startsAt: Date;
  expiresAt: Date;
  viewCount: number;
}

// ==================== QUERY FUNCTIONS ====================

/**
 * Get active posts for the Home carousel (public — all active posts)
 * Returns posts that are currently active (started and not expired)
 */
export async function getActivePostsForHome(limit: number = 20): Promise<PostForCarousel[]> {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();

  const results = await db.execute(sql`
    SELECT 
      p.id,
      p.establishmentId,
      e.name as establishmentName,
      e.image as establishmentImage,
      e.neighborhood,
      e.slug,
      p.type,
      p.title,
      p.description,
      p.imageUrl,
      p.linkUrl,
      p.startsAt,
      p.expiresAt,
      p.viewCount
    FROM establishment_posts p
    JOIN establishments e ON e.id = p.establishmentId
    WHERE p.status = 'active'
      AND p.startsAt <= ${now}
      AND p.expiresAt > ${now}
    ORDER BY p.createdAt DESC
    LIMIT ${limit}
  `);

  const rows = (results as any)[0] || results;
  return (rows as any[]).map(row => ({
    id: Number(row.id),
    establishmentId: Number(row.establishmentId),
    establishmentName: row.establishmentName,
    establishmentImage: row.establishmentImage,
    neighborhood: row.neighborhood,
    slug: row.slug || null,
    type: row.type,
    title: row.title,
    description: row.description,
    imageUrl: row.imageUrl,
    linkUrl: row.linkUrl,
    startsAt: new Date(row.startsAt),
    expiresAt: new Date(row.expiresAt),
    viewCount: Number(row.viewCount),
  }));
}

/**
 * Get active posts filtered by type (for /busca?tipo= page)
 */
export async function getActivePostsByType(type: string, limit: number = 30): Promise<PostForCarousel[]> {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();

  const results = await db.execute(sql`
    SELECT 
      p.id,
      p.establishmentId,
      e.name as establishmentName,
      e.image as establishmentImage,
      e.neighborhood,
      e.slug,
      p.type,
      p.title,
      p.description,
      p.imageUrl,
      p.linkUrl,
      p.startsAt,
      p.expiresAt,
      p.viewCount
    FROM establishment_posts p
    JOIN establishments e ON e.id = p.establishmentId
    WHERE p.status = 'active'
      AND p.type = ${type}
      AND p.startsAt <= ${now}
      AND p.expiresAt > ${now}
    ORDER BY p.createdAt DESC
    LIMIT ${limit}
  `);

  const rows = (results as any)[0] || results;
  return (rows as any[]).map(row => ({
    id: Number(row.id),
    establishmentId: Number(row.establishmentId),
    establishmentName: row.establishmentName,
    establishmentImage: row.establishmentImage,
    neighborhood: row.neighborhood,
    slug: row.slug || null,
    type: row.type,
    title: row.title,
    description: row.description,
    imageUrl: row.imageUrl,
    linkUrl: row.linkUrl,
    startsAt: new Date(row.startsAt),
    expiresAt: new Date(row.expiresAt),
    viewCount: Number(row.viewCount),
  }));
}

/**
 * Get active posts from establishments the user follows ("Salvos" carousel)
 */
export async function getSavedEstablishmentPosts(userId: number, limit: number = 20): Promise<PostForCarousel[]> {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();

  const results = await db.execute(sql`
    SELECT 
      p.id,
      p.establishmentId,
      e.name as establishmentName,
      e.image as establishmentImage,
      e.neighborhood,
      e.slug,
      p.type,
      p.title,
      p.description,
      p.imageUrl,
      p.linkUrl,
      p.startsAt,
      p.expiresAt,
      p.viewCount
    FROM establishment_posts p
    JOIN establishments e ON e.id = p.establishmentId
    JOIN user_saved_establishments s ON s.establishmentId = p.establishmentId AND s.userId = ${userId}
    WHERE p.status = 'active'
      AND p.startsAt <= ${now}
      AND p.expiresAt > ${now}
    ORDER BY p.createdAt DESC
    LIMIT ${limit}
  `);

  const rows = (results as any)[0] || results;
  return (rows as any[]).map(row => ({
    id: Number(row.id),
    establishmentId: Number(row.establishmentId),
    establishmentName: row.establishmentName,
    establishmentImage: row.establishmentImage,
    neighborhood: row.neighborhood,
    slug: row.slug || null,
    type: row.type,
    title: row.title,
    description: row.description,
    imageUrl: row.imageUrl,
    linkUrl: row.linkUrl,
    startsAt: new Date(row.startsAt),
    expiresAt: new Date(row.expiresAt),
    viewCount: Number(row.viewCount),
  }));
}

/**
 * Increment view count for a post
 */
export async function incrementPostView(postId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.execute(sql`
    UPDATE establishment_posts 
    SET viewCount = viewCount + 1 
    WHERE id = ${postId}
  `);
}

/**
 * Increment tap count for a post
 */
export async function incrementPostTap(postId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.execute(sql`
    UPDATE establishment_posts 
    SET tapCount = tapCount + 1 
    WHERE id = ${postId}
  `);
}

/**
 * Toggle save/follow an establishment
 */
export async function toggleSaveEstablishment(userId: number, establishmentId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  // Check if already saved
  const existing = await db.execute(sql`
    SELECT id FROM user_saved_establishments 
    WHERE userId = ${userId} AND establishmentId = ${establishmentId}
    LIMIT 1
  `);

  const rows = (existing as any)[0] || existing;
  if ((rows as any[]).length > 0) {
    // Unsave
    await db.execute(sql`
      DELETE FROM user_saved_establishments 
      WHERE userId = ${userId} AND establishmentId = ${establishmentId}
    `);
    return false; // no longer saved
  } else {
    // Save
    await db.execute(sql`
      INSERT INTO user_saved_establishments (userId, establishmentId) 
      VALUES (${userId}, ${establishmentId})
    `);
    return true; // now saved
  }
}

/**
 * Check if user has saved an establishment
 */
export async function isEstablishmentSaved(userId: number, establishmentId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const results = await db.execute(sql`
    SELECT id FROM user_saved_establishments 
    WHERE userId = ${userId} AND establishmentId = ${establishmentId}
    LIMIT 1
  `);

  const rows = (results as any)[0] || results;
  return (rows as any[]).length > 0;
}

/**
 * Get all saved establishment IDs for a user
 */
export async function getUserSavedEstablishmentIds(userId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];

  const results = await db.execute(sql`
    SELECT establishmentId FROM user_saved_establishments 
    WHERE userId = ${userId}
    ORDER BY createdAt DESC
  `);

  const rows = (results as any)[0] || results;
  return (rows as any[]).map((r: any) => Number(r.establishmentId));
}

/**
 * Create a new post (for business accounts)
 */
export async function createEstablishmentPost(data: {
  establishmentId: number;
  userId: number;
  type: PostType;
  title: string;
  description?: string;
  imageUrl: string;
  imageKey?: string;
  linkUrl?: string;
  startsAt: Date;
  expiresAt: Date;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.execute(sql`
    INSERT INTO establishment_posts 
      (establishmentId, userId, type, title, description, imageUrl, imageKey, linkUrl, startsAt, expiresAt, status)
    VALUES 
      (${data.establishmentId}, ${data.userId}, ${data.type}, ${data.title}, 
       ${data.description || null}, ${data.imageUrl}, ${data.imageKey || null}, 
       ${data.linkUrl || null}, ${data.startsAt}, ${data.expiresAt}, 'active')
  `);

  const rows = (result as any)[0] || result;
  return (rows as any).insertId;
}

/**
 * Auto-expire posts that have passed their expiresAt date
 */
export async function expireOldPosts(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const now = new Date();
  const result = await db.execute(sql`
    UPDATE establishment_posts 
    SET status = 'expired' 
    WHERE status = 'active' AND expiresAt <= ${now}
  `);

  const rows = (result as any)[0] || result;
  return (rows as any).affectedRows || 0;
}

/**
 * Get saved establishments with full details for "Meus Locais" page
 */
export interface SavedEstablishmentDetail {
  id: number;
  name: string;
  slug: string | null;
  neighborhood: string | null;
  imageUrl: string | null;
  googleRating: string | null;
  googleRatingsTotal: number | null;
  categoryName: string | null;
  categorySlug: string | null;
  savedAt: Date;
}

export async function getSavedEstablishmentsWithDetails(userId: number): Promise<SavedEstablishmentDetail[]> {
  const db = await getDb();
  if (!db) return [];

  const results = await db.execute(sql`
    SELECT 
      e.id,
      e.name,
      e.slug,
      e.neighborhood,
      e.image as imageUrl,
      e.googleRating,
      e.googleRatingsTotal,
      c.name as categoryName,
      c.slug as categorySlug,
      s.createdAt as savedAt
    FROM user_saved_establishments s
    JOIN establishments e ON e.id = s.establishmentId
    LEFT JOIN establishment_categories ec ON ec.establishmentId = e.id AND ec.isPrimary = 1
    LEFT JOIN categories c ON c.id = ec.categoryId
    WHERE s.userId = ${userId}
    ORDER BY s.createdAt DESC
  `);

  const rows = (results as any)[0] || results;
  return (rows as any[]).map((row: any) => ({
    id: Number(row.id),
    name: row.name,
    slug: row.slug || null,
    neighborhood: row.neighborhood || null,
    imageUrl: row.imageUrl || null,
    googleRating: row.googleRating || null,
    googleRatingsTotal: row.googleRatingsTotal ? Number(row.googleRatingsTotal) : null,
    categoryName: row.categoryName || null,
    categorySlug: row.categorySlug || null,
    savedAt: new Date(row.savedAt),
  }));
}
