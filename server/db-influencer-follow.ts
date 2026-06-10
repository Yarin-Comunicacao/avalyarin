/**
 * Influencer Follow System
 * 
 * Users can follow influencers to see their ratings in their feed.
 * Influencers have a public profile page similar to establishments.
 */

import { getDb } from "./db";
import { influencerFollows, users, ratings, establishments, ratingItems } from "../drizzle/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";

/**
 * Follow an influencer
 */
export async function followInfluencer(userId: number, influencerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if already following
  const [existing] = await db
    .select()
    .from(influencerFollows)
    .where(
      and(
        eq(influencerFollows.userId, userId),
        eq(influencerFollows.influencerId, influencerId)
      )
    )
    .limit(1);

  if (existing) return { alreadyFollowing: true };

  // Verify the target is actually an influencer
  const [target] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, influencerId))
    .limit(1);

  if (!target || target.role !== "influencer") {
    throw new Error("Usuário não é um influencer.");
  }

  await db.insert(influencerFollows).values({
    userId,
    influencerId,
  });

  return { success: true };
}

/**
 * Unfollow an influencer
 */
export async function unfollowInfluencer(userId: number, influencerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(influencerFollows)
    .where(
      and(
        eq(influencerFollows.userId, userId),
        eq(influencerFollows.influencerId, influencerId)
      )
    );

  return { success: true };
}

/**
 * Check if a user is following an influencer
 */
export async function isFollowingInfluencer(userId: number, influencerId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const [existing] = await db
    .select({ id: influencerFollows.id })
    .from(influencerFollows)
    .where(
      and(
        eq(influencerFollows.userId, userId),
        eq(influencerFollows.influencerId, influencerId)
      )
    )
    .limit(1);

  return !!existing;
}

/**
 * Get follower count for an influencer
 */
export async function getFollowerCount(influencerId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const [result] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(influencerFollows)
    .where(eq(influencerFollows.influencerId, influencerId));

  return result?.count ?? 0;
}

/**
 * Get list of influencers a user follows
 */
export async function getFollowedInfluencers(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      verified: users.verified,
      followedAt: influencerFollows.createdAt,
    })
    .from(influencerFollows)
    .innerJoin(users, eq(influencerFollows.influencerId, users.id))
    .where(eq(influencerFollows.userId, userId))
    .orderBy(desc(influencerFollows.createdAt));
}

/**
 * Get influencer public profile data
 */
export async function getInfluencerProfile(influencerId: number) {
  const db = await getDb();
  if (!db) return null;

  const [influencer] = await db
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
        eq(users.id, influencerId),
        eq(users.role, "influencer")
      )
    )
    .limit(1);

  if (!influencer) return null;

  // Get stats
  const [stats] = await db
    .select({
      totalRatings: sql<number>`COUNT(*)`,
      avgScore: sql<number>`AVG(${ratings.overallScore})`,
      uniqueEstabs: sql<number>`COUNT(DISTINCT ${ratings.establishmentId})`,
    })
    .from(ratings)
    .where(eq(ratings.userId, influencerId));

  // Get follower count
  const followerCount = await getFollowerCount(influencerId);

  return {
    ...influencer,
    stats: {
      totalRatings: stats?.totalRatings ?? 0,
      avgScore: stats?.avgScore ? Math.round(stats.avgScore * 10) / 10 : 0,
      uniqueEstabs: stats?.uniqueEstabs ?? 0,
    },
    followerCount,
  };
}

/**
 * Get recent ratings from an influencer (for their public profile)
 */
export async function getInfluencerRatings(influencerId: number, limit = 20) {
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
    .where(eq(ratings.userId, influencerId))
    .orderBy(desc(ratings.createdAt))
    .limit(limit);

  return recentRatings;
}

/**
 * Get feed of ratings from followed influencers
 */
export async function getInfluencerFeed(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];

  // Get list of followed influencer IDs
  const followed = await db
    .select({ influencerId: influencerFollows.influencerId })
    .from(influencerFollows)
    .where(eq(influencerFollows.userId, userId));

  if (followed.length === 0) return [];

  const influencerIds = followed.map(f => f.influencerId);

  // Get recent ratings from followed influencers
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
    .where(inArray(ratings.userId, influencerIds))
    .orderBy(desc(ratings.createdAt))
    .limit(limit);

  return feedRatings;
}

/**
 * Get all influencers (for discovery/listing)
 */
export async function listInfluencers(limit = 50) {
  const db = await getDb();
  if (!db) return [];

  const influencers = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      verified: users.verified,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, "influencer"))
    .orderBy(desc(users.createdAt))
    .limit(limit);

  // Get stats for each
  const results = await Promise.all(
    influencers.map(async (inf) => {
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
