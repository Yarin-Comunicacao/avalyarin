/**
 * Specialist Follow System
 * 
 * Users can follow specialists to see their ratings in their feed.
 * Specialists have a public profile page similar to establishments.
 */

import { getDb } from "./db";
import { specialistFollows, users, ratings, establishments, ratingItems } from "../drizzle/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";

/**
 * Follow an specialist
 */
export async function followSpecialist(userId: number, specialistId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if already following
  const [existing] = await db
    .select()
    .from(specialistFollows)
    .where(
      and(
        eq(specialistFollows.userId, userId),
        eq(specialistFollows.specialistId, specialistId)
      )
    )
    .limit(1);

  if (existing) return { alreadyFollowing: true };

  // Verify the target is actually an specialist
  const [target] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, specialistId))
    .limit(1);

  if (!target || target.role !== "specialist") {
    throw new Error("Usuário não é um specialist.");
  }

  await db.insert(specialistFollows).values({
    userId,
    specialistId,
  });

  return { success: true };
}

/**
 * Unfollow an specialist
 */
export async function unfollowSpecialist(userId: number, specialistId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(specialistFollows)
    .where(
      and(
        eq(specialistFollows.userId, userId),
        eq(specialistFollows.specialistId, specialistId)
      )
    );

  return { success: true };
}

/**
 * Check if a user is following an specialist
 */
export async function isFollowingSpecialist(userId: number, specialistId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const [existing] = await db
    .select({ id: specialistFollows.id })
    .from(specialistFollows)
    .where(
      and(
        eq(specialistFollows.userId, userId),
        eq(specialistFollows.specialistId, specialistId)
      )
    )
    .limit(1);

  return !!existing;
}

/**
 * Get follower count for an specialist
 */
export async function getFollowerCount(specialistId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const [result] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(specialistFollows)
    .where(eq(specialistFollows.specialistId, specialistId));

  return result?.count ?? 0;
}

/**
 * Get list of specialists a user follows
 */
export async function getFollowedSpecialists(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      verified: users.verified,
      followedAt: specialistFollows.createdAt,
    })
    .from(specialistFollows)
    .innerJoin(users, eq(specialistFollows.specialistId, users.id))
    .where(eq(specialistFollows.userId, userId))
    .orderBy(desc(specialistFollows.createdAt));
}

/**
 * Get specialist public profile data
 */
export async function getSpecialistProfile(specialistId: number) {
  const db = await getDb();
  if (!db) return null;

  const [specialist] = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      verified: users.verified,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(
      and(
        eq(users.id, specialistId),
        eq(users.role, "specialist")
      )
    )
    .limit(1);

  if (!specialist) return null;

  // Get stats
  const [stats] = await db
    .select({
      totalRatings: sql<number>`COUNT(*)`,
      avgScore: sql<number>`AVG(${ratings.overallScore})`,
      uniqueEstabs: sql<number>`COUNT(DISTINCT ${ratings.establishmentId})`,
    })
    .from(ratings)
    .where(eq(ratings.userId, specialistId));

  // Get follower count
  const followerCount = await getFollowerCount(specialistId);

  return {
    ...specialist,
    stats: {
      totalRatings: stats?.totalRatings ?? 0,
      avgScore: stats?.avgScore ? Math.round(stats.avgScore * 10) / 10 : 0,
      uniqueEstabs: stats?.uniqueEstabs ?? 0,
    },
    followerCount,
  };
}

/**
 * Get recent ratings from an specialist (for their public profile)
 */
export async function getSpecialistRatings(specialistId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  const recentRatings = await db
    .select({
      id: ratings.id,
      establishmentId: ratings.establishmentId,
      establishmentName: establishments.name,
      establishmentSlug: establishments.slug,
      overallScore: ratings.overallScore,
      type: ratings.type,
      source: ratings.source,
      visitDate: ratings.visitDate,
      createdAt: ratings.createdAt,
    })
    .from(ratings)
    .innerJoin(establishments, eq(ratings.establishmentId, establishments.id))
    .where(eq(ratings.userId, specialistId))
    .orderBy(desc(ratings.createdAt))
    .limit(limit);

  return recentRatings;
}

/**
 * Get feed of ratings from followed specialists
 */
export async function getSpecialistFeed(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];

  // Get list of followed specialist IDs
  const followed = await db
    .select({ specialistId: specialistFollows.specialistId })
    .from(specialistFollows)
    .where(eq(specialistFollows.userId, userId));

  if (followed.length === 0) return [];

  const specialistIds = followed.map(f => f.specialistId);

  // Get recent ratings from followed specialists
  const feedRatings = await db
    .select({
      id: ratings.id,
      userId: ratings.userId,
      userName: users.name,
      userUsername: users.username,
      userVerified: users.verified,
      establishmentId: ratings.establishmentId,
      establishmentName: establishments.name,
      establishmentSlug: establishments.slug,
      establishmentNeighborhood: establishments.neighborhood,
      overallScore: ratings.overallScore,
      type: ratings.type,
      source: ratings.source,
      visitDate: ratings.visitDate,
      createdAt: ratings.createdAt,
    })
    .from(ratings)
    .innerJoin(users, eq(ratings.userId, users.id))
    .innerJoin(establishments, eq(ratings.establishmentId, establishments.id))
    .where(inArray(ratings.userId, specialistIds))
    .orderBy(desc(ratings.createdAt))
    .limit(limit);

  return feedRatings;
}

/**
 * Get all specialists (for discovery/listing)
 */
export async function listSpecialists(limit = 50) {
  const db = await getDb();
  if (!db) return [];

  const specialists = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      verified: users.verified,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, "specialist"))
    .orderBy(desc(users.createdAt))
    .limit(limit);

  // Get stats for each
  const results = await Promise.all(
    specialists.map(async (inf) => {
      const [stats] = await db
        .select({
          totalRatings: sql<number>`COUNT(*)`,
          avgScore: sql<number>`AVG(${ratings.overallScore})`,
        })
        .from(ratings)
        .where(eq(ratings.userId, inf.id));

      const followerCount = await getFollowerCount(inf.id);

      return {
        ...inf,
        totalRatings: stats?.totalRatings ?? 0,
        avgScore: stats?.avgScore ? Math.round(stats.avgScore * 10) / 10 : 0,
        followerCount,
      };
    })
  );

  return results;
}
