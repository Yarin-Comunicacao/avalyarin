import { getDb } from "./db";
import {
  influencerApplications,
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
export async function getRatingsForInfluencerApplication(userId: number): Promise<RatingWithQualification[]> {
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
 * Submit an influencer application
 */
export async function submitInfluencerApplication(data: {
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
    .from(influencerApplications)
    .where(
      and(
        eq(influencerApplications.userId, data.userId),
        eq(influencerApplications.status, "pending")
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error("Você já tem uma solicitação pendente.");
  }

  const [result] = await db.insert(influencerApplications).values({
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
 * Get all influencer applications (admin)
 */
export async function getInfluencerApplications(status?: string) {
  const db = await getDb();
  if (!db) return [];

  const conditions = status
    ? eq(influencerApplications.status, status as "pending" | "approved" | "rejected")
    : undefined;

  const apps = await db
    .select({
      id: influencerApplications.id,
      userId: influencerApplications.userId,
      userName: users.name,
      userEmail: users.email,
      selectedRatingIds: influencerApplications.selectedRatingIds,
      totalRatings: influencerApplications.totalRatings,
      qualifiedRatings: influencerApplications.qualifiedRatings,
      motivation: influencerApplications.motivation,
      socialMedia: influencerApplications.socialMedia,
      status: influencerApplications.status,
      adminNotes: influencerApplications.adminNotes,
      createdAt: influencerApplications.createdAt,
    })
    .from(influencerApplications)
    .leftJoin(users, eq(influencerApplications.userId, users.id))
    .where(conditions)
    .orderBy(desc(influencerApplications.createdAt));

  return apps;
}

/**
 * Approve an influencer application (admin)
 */
export async function approveInfluencerApplication(applicationId: number, adminNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get the application
  const [app] = await db
    .select()
    .from(influencerApplications)
    .where(eq(influencerApplications.id, applicationId))
    .limit(1);

  if (!app) throw new Error("Solicitação não encontrada");
  if (app.status !== "pending") throw new Error("Solicitação já foi processada");

  // Update application status
  await db
    .update(influencerApplications)
    .set({
      status: "approved",
      adminNotes: adminNotes || null,
      reviewedAt: Date.now(),
    })
    .where(eq(influencerApplications.id, applicationId));

  // Update user role to influencer
  await db
    .update(users)
    .set({ role: "influencer" })
    .where(eq(users.id, app.userId));

  return { success: true };
}

/**
 * Reject an influencer application (admin)
 */
export async function rejectInfluencerApplication(applicationId: number, adminNotes: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(influencerApplications)
    .set({
      status: "rejected",
      adminNotes,
      reviewedAt: Date.now(),
    })
    .where(eq(influencerApplications.id, applicationId));

  return { success: true };
}

/**
 * Get user's application status
 */
export async function getMyInfluencerApplication(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const [app] = await db
    .select()
    .from(influencerApplications)
    .where(eq(influencerApplications.userId, userId))
    .orderBy(desc(influencerApplications.createdAt))
    .limit(1);

  return app || null;
}

// ============================================================
// PARTNERSHIPS
// ============================================================

/**
 * Propose a partnership (influencer → estab)
 */
export async function proposePartnership(data: {
  influencerId: number;
  establishmentId: number;
  terms?: string;
  proposedBy: "influencer" | "establishment";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if partnership already exists
  const existing = await db
    .select()
    .from(partnerships)
    .where(
      and(
        eq(partnerships.influencerId, data.influencerId),
        eq(partnerships.establishmentId, data.establishmentId),
        inArray(partnerships.status, ["pending_estab", "pending_admin", "active"])
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new Error("Já existe uma parceria ativa ou pendente com este estabelecimento.");
  }

  const [result] = await db.insert(partnerships).values({
    influencerId: data.influencerId,
    establishmentId: data.establishmentId,
    terms: data.terms ?? null,
    proposedBy: data.proposedBy,
    status: data.proposedBy === "influencer" ? "pending_estab" : "pending_admin",
  });

  return result.insertId;
}

/**
 * Respond to a partnership (estab accepts/rejects)
 */
export async function respondToPartnership(partnershipId: number, accept: boolean, estabNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const newStatus = accept ? "pending_admin" : "rejected_estab";

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
 * Admin approve partnership
 */
export async function adminApprovePartnership(partnershipId: number, adminNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(partnerships)
    .set({
      status: "active",
      adminNotes: adminNotes || null,
      startsAt: Date.now(),
    })
    .where(eq(partnerships.id, partnershipId));

  return { success: true };
}

/**
 * Admin reject partnership
 */
export async function adminRejectPartnership(partnershipId: number, adminNotes: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(partnerships)
    .set({
      status: "rejected_admin",
      adminNotes,
    })
    .where(eq(partnerships.id, partnershipId));

  return { success: true };
}

/**
 * Get partnerships for an influencer
 */
export async function getInfluencerPartnerships(influencerId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: partnerships.id,
      establishmentId: partnerships.establishmentId,
      establishmentName: establishments.name,
      status: partnerships.status,
      terms: partnerships.terms,
      estabNotes: partnerships.estabNotes,
      adminNotes: partnerships.adminNotes,
      startsAt: partnerships.startsAt,
      createdAt: partnerships.createdAt,
    })
    .from(partnerships)
    .leftJoin(establishments, eq(partnerships.establishmentId, establishments.id))
    .where(eq(partnerships.influencerId, influencerId))
    .orderBy(desc(partnerships.createdAt));
}

/**
 * Get partnerships for an establishment (business panel)
 */
export async function getEstablishmentPartnerships(establishmentId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: partnerships.id,
      influencerId: partnerships.influencerId,
      influencerName: users.name,
      status: partnerships.status,
      terms: partnerships.terms,
      proposedBy: partnerships.proposedBy,
      estabNotes: partnerships.estabNotes,
      createdAt: partnerships.createdAt,
    })
    .from(partnerships)
    .leftJoin(users, eq(partnerships.influencerId, users.id))
    .where(eq(partnerships.establishmentId, establishmentId))
    .orderBy(desc(partnerships.createdAt));
}

/**
 * Get all partnerships pending admin approval
 */
export async function getAdminPendingPartnerships() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: partnerships.id,
      influencerId: partnerships.influencerId,
      influencerName: users.name,
      establishmentId: partnerships.establishmentId,
      establishmentName: establishments.name,
      status: partnerships.status,
      terms: partnerships.terms,
      proposedBy: partnerships.proposedBy,
      estabNotes: partnerships.estabNotes,
      createdAt: partnerships.createdAt,
    })
    .from(partnerships)
    .leftJoin(users, eq(partnerships.influencerId, users.id))
    .leftJoin(establishments, eq(partnerships.establishmentId, establishments.id))
    .where(eq(partnerships.status, "pending_admin"))
    .orderBy(desc(partnerships.createdAt));
}
