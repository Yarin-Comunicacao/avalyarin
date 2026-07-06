import { getDb } from "./db";
import { promoCodes, promoCodeUses } from "../drizzle/schema";
import { eq, and, sql, desc } from "drizzle-orm";

// ============================================================
// Promo Codes — CRUD + Validation + Usage
// ============================================================

/**
 * Create a new promo code (status: pending_approval)
 */
export async function createPromoCode(data: {
  code: string;
  type: "percentage" | "buy_one_get_one" | "free_item" | "fixed_discount";
  value?: number;
  description?: string;
  creatorId: number;
  creatorType: "specialist" | "business";
  establishmentId?: number;
  startsAt?: number;
  expiresAt?: number;
  maxUses?: number;
  maxUsesPerUser?: number;
  firstVisitOnly?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(promoCodes).values({
    code: data.code.toUpperCase().trim(),
    type: data.type,
    value: data.value ?? null,
    description: data.description ?? null,
    creatorId: data.creatorId,
    creatorType: data.creatorType,
    establishmentId: data.establishmentId ?? null,
    startsAt: data.startsAt ?? null,
    expiresAt: data.expiresAt ?? null,
    maxUses: data.maxUses ?? null,
    maxUsesPerUser: data.maxUsesPerUser ?? 1,
    firstVisitOnly: data.firstVisitOnly ?? false,
    status: "pending_approval",
  });
  return result.insertId;
}

/**
 * Validate a promo code for a specific establishment and user
 * Returns the code details if valid, null if invalid/expired/maxed
 */
export async function validatePromoCode(
  code: string,
  establishmentId: number,
  userId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = Date.now();

  // Find the code
  const [promoCode] = await db
    .select()
    .from(promoCodes)
    .where(
      and(
        eq(promoCodes.code, code.toUpperCase().trim()),
        eq(promoCodes.status, "active")
      )
    )
    .limit(1);

  if (!promoCode) return null;

  // Check if code is for this establishment (or any)
  if (promoCode.establishmentId && promoCode.establishmentId !== establishmentId) {
    return null;
  }

  // Check date validity
  if (promoCode.startsAt && now < promoCode.startsAt) return null;
  if (promoCode.expiresAt && now > promoCode.expiresAt) return null;

  // Check total uses
  if (promoCode.maxUses) {
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(promoCodeUses)
      .where(eq(promoCodeUses.codeId, promoCode.id));
    if (count >= promoCode.maxUses) return null;
  }

  // Check per-user uses
  if (promoCode.maxUsesPerUser) {
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(promoCodeUses)
      .where(
        and(
          eq(promoCodeUses.codeId, promoCode.id),
          eq(promoCodeUses.userId, userId)
        )
      );
    if (count >= promoCode.maxUsesPerUser) return null;
  }

  // Check first visit only
  if (promoCode.firstVisitOnly) {
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(promoCodeUses)
      .where(
        and(
          eq(promoCodeUses.userId, userId),
          eq(promoCodeUses.establishmentId, establishmentId)
        )
      );
    if (count > 0) return null;
  }

  return promoCode;
}

/**
 * Register usage of a promo code
 */
export async function usePromoCode(data: {
  codeId: number;
  userId: number;
  establishmentId: number;
  discountApplied?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(promoCodeUses).values({
    codeId: data.codeId,
    userId: data.userId,
    establishmentId: data.establishmentId,
    discountApplied: data.discountApplied ?? null,
  });
  return result.insertId;
}

/**
 * Get promo codes created by a specific user
 */
export async function getUserPromoCodes(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(promoCodes)
    .where(eq(promoCodes.creatorId, userId))
    .orderBy(desc(promoCodes.createdAt));
}

/**
 * Delete a promo code (only if pending or paused, and owned by user)
 */
export async function deletePromoCode(codeId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [code] = await db
    .select()
    .from(promoCodes)
    .where(and(eq(promoCodes.id, codeId), eq(promoCodes.creatorId, userId)))
    .limit(1);

  if (!code) return false;
  if (!["pending_approval", "paused"].includes(code.status)) return false;

  await db.delete(promoCodes).where(eq(promoCodes.id, codeId));
  return true;
}

/**
 * Get all promo codes for admin review
 */
export async function getAdminPromoCodes(statusFilter?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (statusFilter) {
    return await db
      .select()
      .from(promoCodes)
      .where(eq(promoCodes.status, statusFilter as any))
      .orderBy(desc(promoCodes.createdAt));
  }
  return await db
    .select()
    .from(promoCodes)
    .orderBy(desc(promoCodes.createdAt));
}

/**
 * Approve a promo code
 */
export async function approvePromoCode(codeId: number, adminNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(promoCodes)
    .set({ status: "active", adminNotes: adminNotes ?? null })
    .where(eq(promoCodes.id, codeId));
  return true;
}

/**
 * Reject a promo code
 */
export async function rejectPromoCode(codeId: number, adminNotes: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(promoCodes)
    .set({ status: "rejected", adminNotes })
    .where(eq(promoCodes.id, codeId));
  return true;
}

/**
 * Check if a code string is already taken
 */
export async function isCodeTaken(code: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [existing] = await db
    .select({ id: promoCodes.id })
    .from(promoCodes)
    .where(eq(promoCodes.code, code.toUpperCase().trim()))
    .limit(1);
  return !!existing;
}

/**
 * Get usage stats for a promo code
 */
export async function getPromoCodeStats(codeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [{ totalUses }] = await db
    .select({ totalUses: sql<number>`COUNT(*)` })
    .from(promoCodeUses)
    .where(eq(promoCodeUses.codeId, codeId));

  const [{ uniqueUsers }] = await db
    .select({ uniqueUsers: sql<number>`COUNT(DISTINCT userId)` })
    .from(promoCodeUses)
    .where(eq(promoCodeUses.codeId, codeId));

  return { totalUses, uniqueUsers };
}
