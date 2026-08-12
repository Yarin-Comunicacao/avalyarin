import { getDb } from "./db";
import {
  specialistApplications,
  partnerships,
  users,
  ratings,
  ratingItems,
  establishments,
} from "../drizzle/schema";
import { eq, and, desc, gte, inArray } from "drizzle-orm";

// Types
interface RatingWithQualification {
  id: number;
  establishmentId: number;
  establishmentName: string | null;
  visitDate: Date | null;
  overallScore: number | null;
  type: string;
  createdAt: Date;
  isQualified: boolean;
  missingComments: boolean;
  itemCount: number;
}

/**
 * Get user's ratings from the last 365 days with qualification status.
 * A rating is "qualified" if ALL its ratingItems have `comment` filled (min 20 chars).
 */
export async function getRatingsForSpecialistApplication(userId: number): Promise<RatingWithQualification[]> {
  const db = await getDb();
  if (!db) return [];

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  // Get ratings from last 365 days
  const userRatings = await db
    .select({
      id: ratings.id,
      establishmentId: ratings.establishmentId,
      establishmentName: establishments.name,
      visitDate: ratings.visitDate,
      overallScore: ratings.overallScore,
      type: ratings.type,
      createdAt: ratings.createdAt,
    })
    .from(ratings)
    .leftJoin(establishments, eq(ratings.establishmentId, establishments.id))
    .where(
      and(
        eq(ratings.userId, userId),
        gte(ratings.createdAt, oneYearAgo)
      )
    )
    .orderBy(desc(ratings.createdAt));

  // For each rating, check if all items have comments
  const ratingIds = userRatings.map((r) => r.id);
  if (ratingIds.length === 0) return [];

  // Get all items for these ratings
  const allItems = await db
    .select({
      ratingId: ratingItems.ratingId,
      comment: ratingItems.comment,
    })
    .from(ratingItems)
    .where(inArray(ratingItems.ratingId, ratingIds));

  // Group items by ratingId
  const itemsByRating = new Map<number, { comment: string | null }[]>();
  for (const item of allItems) {
    const list = itemsByRating.get(item.ratingId) || [];
    list.push({ comment: item.comment });
    itemsByRating.set(item.ratingId, list);
  }

  // Check qualification for each rating
  return userRatings.map((r): RatingWithQualification => {
    const items = itemsByRating.get(r.id) || [];
    const allItemsHaveComments =
      items.length > 0 &&
      items.every((item) => item.comment && item.comment.trim().length >= 20);

    return {
      id: r.id,
      establishmentId: r.establishmentId,
      establishmentName: r.establishmentName,
      visitDate: r.visitDate,
      overallScore: r.overallScore,
      type: r.type,
      createdAt: r.createdAt,
      isQualified: allItemsHaveComments,
      missingComments: !allItemsHaveComments,
      itemCount: items.length,
    };
  });
}

/**
 * Submit an specialist application
 */
export async function submitSpecialistApplication(data: {
  userId: number;
  selectedRatingIds: number[];
  totalRatings: number;
  qualifiedRatings: number;
  motivation?: string;
  socialMedia?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if user already has a pending application
  const existing = await db
    .select()
    .from(specialistApplications)
    .where(
      and(
        eq(specialistApplications.userId, data.userId),
        eq(specialistApplications.status, "pending")
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error("Você já tem uma solicitação pendente.");
  }

  const [result] = await db.insert(specialistApplications).values({
    userId: data.userId,
    selectedRatingIds: data.selectedRatingIds,
    totalRatings: data.totalRatings,
    qualifiedRatings: data.qualifiedRatings,
    motivation: data.motivation ?? null,
    socialMedia: data.socialMedia ?? null,
  });

  return result.insertId;
}

/**
 * Get all specialist applications (admin)
 */
export async function getSpecialistApplications(status?: string) {
  const db = await getDb();
  if (!db) return [];

  const conditions = status
    ? eq(specialistApplications.status, status as "pending" | "approved" | "rejected")
    : undefined;

  const apps = await db
    .select({
      id: specialistApplications.id,
      userId: specialistApplications.userId,
      userName: users.name,
      userEmail: users.email,
      selectedRatingIds: specialistApplications.selectedRatingIds,
      totalRatings: specialistApplications.totalRatings,
      qualifiedRatings: specialistApplications.qualifiedRatings,
      motivation: specialistApplications.motivation,
      socialMedia: specialistApplications.socialMedia,
      status: specialistApplications.status,
      adminNotes: specialistApplications.adminNotes,
      createdAt: specialistApplications.createdAt,
    })
    .from(specialistApplications)
    .leftJoin(users, eq(specialistApplications.userId, users.id))
    .where(conditions)
    .orderBy(desc(specialistApplications.createdAt));

  return apps;
}

/**
 * Approve an specialist application (admin)
 */
export async function approveSpecialistApplication(applicationId: number, adminNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get the application
  const [app] = await db
    .select()
    .from(specialistApplications)
    .where(eq(specialistApplications.id, applicationId))
    .limit(1);

  if (!app) throw new Error("Solicitação não encontrada");
  if (app.status !== "pending") throw new Error("Solicitação já foi processada");

  // Update application status
  await db
    .update(specialistApplications)
    .set({
      status: "approved",
      adminNotes: adminNotes || null,
      reviewedAt: Date.now(),
    })
    .where(eq(specialistApplications.id, applicationId));

  // Update user role to specialist
  await db
    .update(users)
    .set({ role: "specialist" })
    .where(eq(users.id, app.userId));

  return { success: true };
}

/**
 * Reject an specialist application (admin)
 */
export async function rejectSpecialistApplication(applicationId: number, adminNotes: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(specialistApplications)
    .set({
      status: "rejected",
      adminNotes,
      reviewedAt: Date.now(),
    })
    .where(eq(specialistApplications.id, applicationId));

  return { success: true };
}

/**
 * Get user's application status
 */
export async function getMySpecialistApplication(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const [app] = await db
    .select()
    .from(specialistApplications)
    .where(eq(specialistApplications.userId, userId))
    .orderBy(desc(specialistApplications.createdAt))
    .limit(1);

  return app || null;
}

// ============================================================
// PARTNERSHIPS
// ============================================================

/**
 * Propose a partnership (specialist → estab)
 */
export async function proposePartnership(data: {
  partnershipType: "specialist" | "business";
  specialistId?: number;
  partnerEstablishmentId?: number;
  establishmentId: number;
  terms?: string;
  proposedBy: "specialist" | "establishment";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Validate: specialist type needs specialistId, business type needs partnerEstablishmentId
  if (data.partnershipType === "specialist" && !data.specialistId) {
    throw new Error("specialistId é obrigatório para parcerias com specialist.");
  }
  if (data.partnershipType === "business" && !data.partnerEstablishmentId) {
    throw new Error("partnerEstablishmentId é obrigatório para parcerias B2B.");
  }

  // Check if partnership already exists
  if (data.partnershipType === "specialist") {
    const existing = await db
      .select()
      .from(partnerships)
      .where(
        and(
          eq(partnerships.specialistId, data.specialistId!),
          eq(partnerships.establishmentId, data.establishmentId),
          inArray(partnerships.status, ["pending_estab", "pending_support", "active"])
        )
      )
      .limit(1);
    if (existing.length > 0) {
      throw new Error("Já existe uma parceria ativa ou pendente com este specialist.");
    }
  } else {
    const existing = await db
      .select()
      .from(partnerships)
      .where(
        and(
          eq(partnerships.partnerEstablishmentId, data.partnerEstablishmentId!),
          eq(partnerships.establishmentId, data.establishmentId),
          inArray(partnerships.status, ["pending_estab", "pending_support", "active"])
        )
      )
      .limit(1);
    if (existing.length > 0) {
      throw new Error("Já existe uma parceria ativa ou pendente com este estabelecimento.");
    }
  }

  // Determine initial status
  let initialStatus: "pending_estab" | "pending_support";
  if (data.partnershipType === "specialist") {
    initialStatus = data.proposedBy === "specialist" ? "pending_estab" : "pending_support";
  } else {
    // B2B: always goes to pending_estab first (partner estab needs to accept)
    initialStatus = "pending_estab";
  }

  const [result] = await db.insert(partnerships).values({
    partnershipType: data.partnershipType,
    specialistId: data.specialistId ?? null,
    partnerEstablishmentId: data.partnerEstablishmentId ?? null,
    establishmentId: data.establishmentId,
    terms: data.terms ?? null,
    proposedBy: data.proposedBy,
    status: initialStatus,
  });

  return result.insertId;
}

/**
 * Respond to a partnership (estab accepts/rejects)
 * When accepted, goes to pending_support for review
 */
export async function respondToPartnership(partnershipId: number, accept: boolean, estabNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const newStatus = accept ? "pending_support" : "rejected_estab";

  await db
    .update(partnerships)
    .set({
      status: newStatus,
      estabNotes: estabNotes || null,
    })
    .where(eq(partnerships.id, partnershipId));

  return { success: true };
}

/**
 * Support approve partnership
 */
export async function supportApprovePartnership(partnershipId: number, supportNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(partnerships)
    .set({
      status: "active",
      supportNotes: supportNotes || null,
      startsAt: Date.now(),
    })
    .where(eq(partnerships.id, partnershipId));

  return { success: true };
}

/**
 * Support reject partnership
 */
export async function supportRejectPartnership(partnershipId: number, supportNotes: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(partnerships)
    .set({
      status: "rejected_support",
      supportNotes,
    })
    .where(eq(partnerships.id, partnershipId));

  return { success: true };
}

/**
 * Get partnerships for an specialist
 */
export async function getSpecialistPartnerships(specialistId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: partnerships.id,
      partnershipType: partnerships.partnershipType,
      establishmentId: partnerships.establishmentId,
      establishmentName: establishments.name,
      status: partnerships.status,
      terms: partnerships.terms,
      estabNotes: partnerships.estabNotes,
      supportNotes: partnerships.supportNotes,
      startsAt: partnerships.startsAt,
      createdAt: partnerships.createdAt,
    })
    .from(partnerships)
    .leftJoin(establishments, eq(partnerships.establishmentId, establishments.id))
    .where(eq(partnerships.specialistId, specialistId))
    .orderBy(desc(partnerships.createdAt));
}

/**
 * Get partnerships for an establishment (business panel)
 */
export async function getEstablishmentPartnerships(establishmentId: number) {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select({
      id: partnerships.id,
      partnershipType: partnerships.partnershipType,
      specialistId: partnerships.specialistId,
      specialistName: users.name,
      partnerEstablishmentId: partnerships.partnerEstablishmentId,
      status: partnerships.status,
      terms: partnerships.terms,
      proposedBy: partnerships.proposedBy,
      estabNotes: partnerships.estabNotes,
      supportNotes: partnerships.supportNotes,
      createdAt: partnerships.createdAt,
    })
    .from(partnerships)
    .leftJoin(users, eq(partnerships.specialistId, users.id))
    .where(eq(partnerships.establishmentId, establishmentId))
    .orderBy(desc(partnerships.createdAt));

  return results;
}

/**
 * Get establishment partnerships where this estab is the PARTNER (received B2B proposals)
 */
export async function getReceivedB2BPartnerships(establishmentId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: partnerships.id,
      partnershipType: partnerships.partnershipType,
      establishmentId: partnerships.establishmentId,
      proposerEstablishmentName: establishments.name,
      status: partnerships.status,
      terms: partnerships.terms,
      proposedBy: partnerships.proposedBy,
      estabNotes: partnerships.estabNotes,
      createdAt: partnerships.createdAt,
    })
    .from(partnerships)
    .leftJoin(establishments, eq(partnerships.establishmentId, establishments.id))
    .where(
      and(
        eq(partnerships.partnerEstablishmentId, establishmentId),
        eq(partnerships.partnershipType, "business")
      )
    )
    .orderBy(desc(partnerships.createdAt));
}

/**
 * List available establishments for B2B partnership (exclude own)
 * Supports search by name and returns all matching results (no arbitrary limit)
 */
export async function listAvailableEstablishmentsForPartnership(excludeIds: number[], search?: string) {
  const db = await getDb();
  if (!db) return [];

  const { sql: rawSql } = await import("drizzle-orm");
  const excludeClause = excludeIds.length > 0 ? excludeIds.join(",") : "0";
  const searchClause = search && search.trim().length > 0
    ? ` AND ${establishments.name.name} LIKE '%${search.trim().replace(/'/g, "''")}%'`
    : "";
  return await db
    .select({
      id: establishments.id,
      name: establishments.name,
      neighborhood: establishments.neighborhood,
    })
    .from(establishments)
    .where(rawSql`${establishments.id} NOT IN (${rawSql.raw(excludeClause)}) AND ${establishments.status} = 'active'${rawSql.raw(searchClause)}`)
    .orderBy(establishments.name);
}

/**
 * Get all partnerships pending support approval
 */
export async function getSupportPendingPartnerships() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: partnerships.id,
      partnershipType: partnerships.partnershipType,
      specialistId: partnerships.specialistId,
      specialistName: users.name,
      partnerEstablishmentId: partnerships.partnerEstablishmentId,
      establishmentId: partnerships.establishmentId,
      establishmentName: establishments.name,
      status: partnerships.status,
      terms: partnerships.terms,
      proposedBy: partnerships.proposedBy,
      estabNotes: partnerships.estabNotes,
      createdAt: partnerships.createdAt,
    })
    .from(partnerships)
    .leftJoin(users, eq(partnerships.specialistId, users.id))
    .leftJoin(establishments, eq(partnerships.establishmentId, establishments.id))
    .where(eq(partnerships.status, "pending_support"))
    .orderBy(desc(partnerships.createdAt));
}
