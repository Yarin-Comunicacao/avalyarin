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


// ============================================================
// Promo Code Establishments — vínculo N:N + fluxo de aprovação pelo business
// ============================================================

import { promoCodeEstablishments, establishments, businessClaims, users, businessNotifications } from "../drizzle/schema";
import { inArray } from "drizzle-orm";

/**
 * Create a promo code (critic/specialist) linked to multiple establishments.
 * Each establishment link starts as "pending" and the business owner(s) get notified.
 */
export async function createPromoCodeWithEstablishments(data: {
  code: string;
  type: "percentage" | "buy_one_get_one" | "free_item" | "fixed_discount";
  value?: number;
  description?: string;
  creatorId: number;
  creatorType: "specialist" | "business" | "critic";
  establishmentIds: number[];
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
    establishmentId: null, // multi-estab: usa a tabela de junção
    startsAt: data.startsAt ?? null,
    expiresAt: data.expiresAt ?? null,
    maxUses: data.maxUses ?? null,
    maxUsesPerUser: data.maxUsesPerUser ?? 1,
    firstVisitOnly: data.firstVisitOnly ?? false,
    status: "pending_approval",
  });
  const promoCodeId = result.insertId;

  // Link establishments
  if (data.establishmentIds.length > 0) {
    await db.insert(promoCodeEstablishments).values(
      data.establishmentIds.map((estId) => ({
        promoCodeId,
        establishmentId: estId,
        status: "pending" as const,
      }))
    );
  }

  return promoCodeId;
}

/**
 * Notify business owners of establishments about a new promo code request.
 * Returns the list of notified user ids.
 */
export async function notifyBusinessesOfPromoRequest(params: {
  promoCodeId: number;
  code: string;
  creatorName: string;
  creatorType: "specialist" | "critic";
  establishmentIds: number[];
}) {
  const db = await getDb();
  if (!db) return [];
  if (params.establishmentIds.length === 0) return [];

  // Find approved business claims for these establishments
  const claims = await db
    .select()
    .from(businessClaims)
    .where(
      and(
        inArray(businessClaims.establishmentId, params.establishmentIds),
        eq(businessClaims.status, "approved")
      )
    );

  if (claims.length === 0) return [];

  const estRows = await db
    .select({ id: establishments.id, name: establishments.name })
    .from(establishments)
    .where(inArray(establishments.id, params.establishmentIds));
  const estNameById = new Map(estRows.map((e) => [e.id, e.name]));

  const roleLabel = params.creatorType === "critic" ? "Crítico" : "Especialista";

  await db.insert(businessNotifications).values(
    claims.map((c) => ({
      userId: c.userId,
      establishmentId: c.establishmentId,
      type: "promo_code_request",
      title: `Novo pedido de código promocional`,
      message: `${roleLabel} ${params.creatorName} solicitou o código ${params.code} para "${estNameById.get(c.establishmentId) || "seu estabelecimento"}".`,
      ratingId: params.promoCodeId, // reaproveita campo para referenciar o código
    }))
  );

  return claims.map((c) => c.userId);
}

/**
 * Get promo code requests for a business user, grouped by status.
 * Returns entries for all establishments the user has approved claims on.
 */
export async function getBusinessPromoCodeRequests(userId: number) {
  const db = await getDb();
  if (!db) return [];

  // Establishments this business manages
  const claims = await db
    .select()
    .from(businessClaims)
    .where(and(eq(businessClaims.userId, userId), eq(businessClaims.status, "approved")));
  if (claims.length === 0) return [];

  const estIds = claims.map((c) => c.establishmentId);

  const rows = await db
    .select({
      linkId: promoCodeEstablishments.id,
      linkStatus: promoCodeEstablishments.status,
      respondedAt: promoCodeEstablishments.respondedAt,
      establishmentId: promoCodeEstablishments.establishmentId,
      promoCodeId: promoCodes.id,
      code: promoCodes.code,
      type: promoCodes.type,
      value: promoCodes.value,
      description: promoCodes.description,
      creatorId: promoCodes.creatorId,
      creatorType: promoCodes.creatorType,
      startsAt: promoCodes.startsAt,
      expiresAt: promoCodes.expiresAt,
      maxUses: promoCodes.maxUses,
      firstVisitOnly: promoCodes.firstVisitOnly,
      codeStatus: promoCodes.status,
      createdAt: promoCodeEstablishments.createdAt,
      creatorName: users.name,
      creatorUsername: users.username,
      establishmentName: establishments.name,
    })
    .from(promoCodeEstablishments)
    .innerJoin(promoCodes, eq(promoCodes.id, promoCodeEstablishments.promoCodeId))
    .innerJoin(users, eq(users.id, promoCodes.creatorId))
    .innerJoin(establishments, eq(establishments.id, promoCodeEstablishments.establishmentId))
    .where(inArray(promoCodeEstablishments.establishmentId, estIds))
    .orderBy(desc(promoCodeEstablishments.createdAt));

  return rows;
}

/**
 * Business responds to a promo code request (accept or put on hold).
 * Validates that the user owns the establishment of the link.
 * Returns info needed for notifying the creator when accepted.
 */
export async function respondToPromoCodeRequest(params: {
  userId: number;
  linkId: number;
  action: "accepted" | "on_hold";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Load the link
  const [link] = await db
    .select()
    .from(promoCodeEstablishments)
    .where(eq(promoCodeEstablishments.id, params.linkId))
    .limit(1);
  if (!link) return null;

  // Verify ownership
  const [claim] = await db
    .select()
    .from(businessClaims)
    .where(
      and(
        eq(businessClaims.userId, params.userId),
        eq(businessClaims.establishmentId, link.establishmentId),
        eq(businessClaims.status, "approved")
      )
    )
    .limit(1);
  if (!claim) return null;

  await db
    .update(promoCodeEstablishments)
    .set({ status: params.action, respondedAt: Date.now() })
    .where(eq(promoCodeEstablishments.id, params.linkId));

  // If accepted, activate the promo code (at least one estab accepted)
  if (params.action === "accepted") {
    await db
      .update(promoCodes)
      .set({ status: "active" })
      .where(and(eq(promoCodes.id, link.promoCodeId), eq(promoCodes.status, "pending_approval")));
  }

  // Return data for creator notification
  const [promo] = await db
    .select()
    .from(promoCodes)
    .where(eq(promoCodes.id, link.promoCodeId))
    .limit(1);
  const [est] = await db
    .select({ id: establishments.id, name: establishments.name })
    .from(establishments)
    .where(eq(establishments.id, link.establishmentId))
    .limit(1);

  return {
    promoCodeId: link.promoCodeId,
    creatorId: promo?.creatorId,
    code: promo?.code,
    establishmentName: est?.name,
    action: params.action,
  };
}

/**
 * Get my promo code requests (critic/specialist) with per-establishment status.
 */
export async function getMyPromoCodeRequests(creatorId: number) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      promoCodeId: promoCodes.id,
      code: promoCodes.code,
      type: promoCodes.type,
      value: promoCodes.value,
      description: promoCodes.description,
      codeStatus: promoCodes.status,
      expiresAt: promoCodes.expiresAt,
      maxUses: promoCodes.maxUses,
      createdAt: promoCodes.createdAt,
      linkId: promoCodeEstablishments.id,
      linkStatus: promoCodeEstablishments.status,
      establishmentId: promoCodeEstablishments.establishmentId,
      establishmentName: establishments.name,
    })
    .from(promoCodes)
    .innerJoin(promoCodeEstablishments, eq(promoCodeEstablishments.promoCodeId, promoCodes.id))
    .innerJoin(establishments, eq(establishments.id, promoCodeEstablishments.establishmentId))
    .where(eq(promoCodes.creatorId, creatorId))
    .orderBy(desc(promoCodes.createdAt));

  return rows;
}

/**
 * List active establishments available for promo code selection.
 */
export async function getEstablishmentsForPromoSelection() {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select({
      id: establishments.id,
      name: establishments.name,
      neighborhood: establishments.neighborhood,
      image: establishments.image,
      logo: establishments.logo,
    })
    .from(establishments)
    .where(eq(establishments.status, "active"))
    .orderBy(establishments.name);
}
