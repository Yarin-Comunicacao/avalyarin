import { getDb } from "./db";
import { criticProfiles, users, ratings, establishments } from "../drizzle/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";

// ============================================================
// CRITIC APPLICATION & MANAGEMENT
// ============================================================

/**
 * Submit a critic application. User provides their publication info.
 */
export async function submitCriticApplication(data: {
  userId: number;
  displayName: string;
  bio?: string;
  publication: string;
  publicationUrl?: string;
  specialty?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if already applied
  const [existing] = await db
    .select()
    .from(criticProfiles)
    .where(eq(criticProfiles.userId, data.userId))
    .limit(1);

  if (existing) {
    throw new Error("Você já possui uma solicitação de crítico.");
  }

  await db.insert(criticProfiles).values({
    userId: data.userId,
    displayName: data.displayName,
    bio: data.bio || null,
    publication: data.publication,
    publicationUrl: data.publicationUrl || null,
    specialty: data.specialty || null,
    status: "pending",
    verified: false,
  });

  return { success: true };
}

/**
 * Get all critic applications (admin view).
 */
export async function getCriticApplications(status?: string) {
  const db = await getDb();
  if (!db) return [];

  const conditions = status ? and(eq(criticProfiles.status, status as any)) : undefined;

  const results = await db
    .select({
      id: criticProfiles.id,
      userId: criticProfiles.userId,
      displayName: criticProfiles.displayName,
      bio: criticProfiles.bio,
      publication: criticProfiles.publication,
      publicationUrl: criticProfiles.publicationUrl,
      specialty: criticProfiles.specialty,
      verified: criticProfiles.verified,
      status: criticProfiles.status,
      adminNotes: criticProfiles.adminNotes,
      createdAt: criticProfiles.createdAt,
      userName: users.name,
      userEmail: users.email,
      username: users.username,
    })
    .from(criticProfiles)
    .innerJoin(users, eq(criticProfiles.userId, users.id))
    .where(conditions)
    .orderBy(desc(criticProfiles.createdAt));

  return results;
}

/**
 * Approve a critic application — sets status to approved, verified to true, and updates user role.
 */
export async function approveCriticApplication(applicationId: number, adminId: number, adminNotes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [app] = await db
    .select()
    .from(criticProfiles)
    .where(eq(criticProfiles.id, applicationId))
    .limit(1);

  if (!app) throw new Error("Solicitação não encontrada.");
  if (app.status === "approved") throw new Error("Já aprovado.");

  await db.update(criticProfiles).set({
    status: "approved",
    verified: true,
    adminNotes: adminNotes || null,
    reviewedBy: adminId,
    reviewedAt: new Date(),
  }).where(eq(criticProfiles.id, applicationId));

  // Update user role to critic
  await db.update(users).set({ role: "critic" }).where(eq(users.id, app.userId));

  return { success: true };
}

/**
 * Reject a critic application.
 */
export async function rejectCriticApplication(applicationId: number, adminId: number, adminNotes: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(criticProfiles).set({
    status: "rejected",
    adminNotes,
    reviewedBy: adminId,
    reviewedAt: new Date(),
  }).where(eq(criticProfiles.id, applicationId));

  return { success: true };
}

/**
 * Get current user's critic application/profile.
 */
export async function getMyCriticProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const [profile] = await db
    .select()
    .from(criticProfiles)
    .where(eq(criticProfiles.userId, userId))
    .limit(1);

  return profile || null;
}

/**
 * Update critic profile info (for approved critics).
 */
export async function updateCriticProfile(userId: number, data: {
  displayName?: string;
  bio?: string;
  publication?: string;
  publicationUrl?: string;
  specialty?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(criticProfiles).set({
    ...(data.displayName !== undefined && { displayName: data.displayName }),
    ...(data.bio !== undefined && { bio: data.bio }),
    ...(data.publication !== undefined && { publication: data.publication }),
    ...(data.publicationUrl !== undefined && { publicationUrl: data.publicationUrl }),
    ...(data.specialty !== undefined && { specialty: data.specialty }),
  }).where(eq(criticProfiles.userId, userId));

  return { success: true };
}

/**
 * Get public critic profile by username.
 */
export async function getCriticPublicProfile(username: string) {
  const db = await getDb();
  if (!db) return null;

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      role: users.role,
    })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user || user.role !== "critic") return null;

  const [profile] = await db
    .select()
    .from(criticProfiles)
    .where(and(eq(criticProfiles.userId, user.id), eq(criticProfiles.verified, true)))
    .limit(1);

  if (!profile) return null;

  return {
    ...profile,
    name: user.name,
    username: user.username,
  };
}

/**
 * Get critic's ratings (public view).
 */
export async function getCriticRatings(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select({
      id: ratings.id,
      establishmentId: ratings.establishmentId,
      establishmentName: establishments.name,
      establishmentSlug: establishments.slug,
      overallScore: ratings.overallScore,
      type: ratings.type,
      visitDate: ratings.visitDate,
      createdAt: ratings.createdAt,
    })
    .from(ratings)
    .innerJoin(establishments, eq(ratings.establishmentId, establishments.id))
    .where(eq(ratings.userId, userId))
    .orderBy(desc(ratings.createdAt))
    .limit(limit);

  return results;
}

/**
 * Get establishments that have the "Selo Crítico" (critic rated ≥ 8.0).
 */
export async function getEstablishmentsWithCriticSeal() {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select({
      establishmentId: ratings.establishmentId,
      establishmentName: establishments.name,
      establishmentSlug: establishments.slug,
      criticName: criticProfiles.displayName,
      criticPublication: criticProfiles.publication,
      score: ratings.overallScore,
      ratedAt: ratings.createdAt,
    })
    .from(ratings)
    .innerJoin(users, eq(ratings.userId, users.id))
    .innerJoin(criticProfiles, eq(users.id, criticProfiles.userId))
    .innerJoin(establishments, eq(ratings.establishmentId, establishments.id))
    .where(
      and(
        eq(users.role, "critic"),
        eq(criticProfiles.verified, true),
        gte(ratings.overallScore, 8) // score stored as 0-10
      )
    )
    .orderBy(desc(ratings.createdAt));

  return results;
}

/**
 * Check if a specific establishment has the Selo Crítico.
 */
export async function hasEstablishmentCriticSeal(establishmentId: number) {
  const db = await getDb();
  if (!db) return { hasSeal: false, critics: [] };

  const results = await db
    .select({
      criticName: criticProfiles.displayName,
      criticPublication: criticProfiles.publication,
      criticUsername: users.username,
      score: ratings.overallScore,
      ratedAt: ratings.createdAt,
    })
    .from(ratings)
    .innerJoin(users, eq(ratings.userId, users.id))
    .innerJoin(criticProfiles, eq(users.id, criticProfiles.userId))
    .where(
      and(
        eq(ratings.establishmentId, establishmentId),
        eq(users.role, "critic"),
        eq(criticProfiles.verified, true),
        gte(ratings.overallScore, 8) // score stored as 0-10
      )
    )
    .orderBy(desc(ratings.createdAt));

  return {
    hasSeal: results.length > 0,
    critics: results,
  };
}
