/**
 * Analytics & Insights module
 * Provides aggregated metrics with in-memory cache for performance.
 * Cache TTL: 5 minutes for admin, 10 minutes for business/user stats.
 */
import { getDb } from "./db";
import { ratings, ratingItems, users, establishments, categories, menuItems, promoCodes, promoCodeUses, establishmentCategories } from "../drizzle/schema";
import { eq, sql, and, gte, lte, desc, count, avg } from "drizzle-orm";

// ─── Cache Layer ─────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<any>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttlMs: number): T {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  return data;
}

const CACHE_TTL_ADMIN = 5 * 60 * 1000; // 5 minutes
const CACHE_TTL_BUSINESS = 10 * 60 * 1000; // 10 minutes
const CACHE_TTL_USER = 10 * 60 * 1000; // 10 minutes

// ─── Admin Dashboard Analytics ───────────────────────────────────────────────

export interface AdminDashboardData {
  overview: {
    totalUsers: number;
    totalRatings: number;
    totalEstablishments: number;
    totalCategories: number;
    activeEstablishments: number;
    totalMenuItems: number;
  };
  growth: {
    usersLast30Days: number;
    ratingsLast30Days: number;
    ratingsLast7Days: number;
    usersLast7Days: number;
  };
  ratingsOverTime: Array<{ date: string; count: number }>;
  topEstablishments: Array<{
    id: number;
    name: string;
    neighborhood: string | null;
    avgScore: number;
    ratingCount: number;
  }>;
  categoryDistribution: Array<{
    categoryId: number;
    categoryName: string;
    establishmentCount: number;
    ratingCount: number;
  }>;
  userActivity: {
    activeUsersLast7Days: number;
    activeUsersLast30Days: number;
    avgRatingsPerUser: number;
  };
  ratingTypes: {
    direct: number;
    analytic: number;
  };
}

export async function getAdminDashboard(): Promise<AdminDashboardData | null> {
  const cached = getCached<AdminDashboardData>("admin_dashboard");
  if (cached) return cached;

  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Overview counts
  const [userCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(users);
  const [ratingCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(ratings);
  const [estCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(establishments);
  const [catCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(categories);
  const [activeEstCount] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(establishments)
    .where(eq(establishments.status, "active"));
  const [menuCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(menuItems);

  // Growth metrics
  const [usersLast30] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(gte(users.createdAt, thirtyDaysAgo));
  const [ratingsLast30] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(ratings)
    .where(gte(ratings.createdAt, thirtyDaysAgo));
  const [ratingsLast7] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(ratings)
    .where(gte(ratings.createdAt, sevenDaysAgo));
  const [usersLast7] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(gte(users.createdAt, sevenDaysAgo));

  // Ratings over time (last 30 days, grouped by day)
  const ratingsOverTime = await db
    .select({
      date: sql<string>`DATE(createdAt)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(ratings)
    .where(gte(ratings.createdAt, thirtyDaysAgo))
    .groupBy(sql`DATE(createdAt)`)
    .orderBy(sql`DATE(createdAt)`);

  // Top establishments by average score (min 3 ratings)
  const topEstablishments = await db
    .select({
      id: establishments.id,
      name: establishments.name,
      neighborhood: establishments.neighborhood,
      avgScore: sql<number>`AVG(${ratings.overallScore})`,
      ratingCount: sql<number>`COUNT(${ratings.id})`,
    })
    .from(ratings)
    .innerJoin(establishments, eq(ratings.establishmentId, establishments.id))
    .groupBy(establishments.id, establishments.name, establishments.neighborhood)
    .having(sql`COUNT(${ratings.id}) >= 3`)
    .orderBy(sql`AVG(${ratings.overallScore}) DESC`)
    .limit(10);

  // Category distribution
  const categoryDistribution = await db
    .select({
      categoryId: categories.id,
      categoryName: categories.name,
      establishmentCount: sql<number>`COUNT(DISTINCT ${establishments.id})`,
      ratingCount: sql<number>`COUNT(DISTINCT ${ratings.id})`,
    })
    .from(categories)
    .leftJoin(establishments, eq(establishments.categoryId, categories.id))
    .leftJoin(ratings, eq(ratings.establishmentId, establishments.id))
    .groupBy(categories.id, categories.name)
    .orderBy(sql`COUNT(DISTINCT ${ratings.id}) DESC`);

  // User activity
  const [activeUsers7] = await db
    .select({ count: sql<number>`COUNT(DISTINCT userId)` })
    .from(ratings)
    .where(gte(ratings.createdAt, sevenDaysAgo));
  const [activeUsers30] = await db
    .select({ count: sql<number>`COUNT(DISTINCT userId)` })
    .from(ratings)
    .where(gte(ratings.createdAt, thirtyDaysAgo));

  const totalUsers = userCount.count || 1;
  const totalRatings = ratingCount.count || 0;

  // Rating types
  const [directCount] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(ratings)
    .where(eq(ratings.type, "direct"));
  const [analyticCount] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(ratings)
    .where(eq(ratings.type, "analytic"));

  const result: AdminDashboardData = {
    overview: {
      totalUsers: userCount.count,
      totalRatings: ratingCount.count,
      totalEstablishments: estCount.count,
      totalCategories: catCount.count,
      activeEstablishments: activeEstCount.count,
      totalMenuItems: menuCount.count,
    },
    growth: {
      usersLast30Days: usersLast30.count,
      ratingsLast30Days: ratingsLast30.count,
      ratingsLast7Days: ratingsLast7.count,
      usersLast7Days: usersLast7.count,
    },
    ratingsOverTime: ratingsOverTime.map(r => ({
      date: String(r.date),
      count: Number(r.count),
    })),
    topEstablishments: topEstablishments.map(e => ({
      id: e.id,
      name: e.name,
      neighborhood: e.neighborhood,
      avgScore: Number(Number(e.avgScore).toFixed(1)),
      ratingCount: Number(e.ratingCount),
    })),
    categoryDistribution: categoryDistribution.map(c => ({
      categoryId: c.categoryId,
      categoryName: c.categoryName,
      establishmentCount: Number(c.establishmentCount),
      ratingCount: Number(c.ratingCount),
    })),
    userActivity: {
      activeUsersLast7Days: activeUsers7.count,
      activeUsersLast30Days: activeUsers30.count,
      avgRatingsPerUser: Number((totalRatings / totalUsers).toFixed(1)),
    },
    ratingTypes: {
      direct: directCount.count,
      analytic: analyticCount.count,
    },
  };

  return setCache("admin_dashboard", result, CACHE_TTL_ADMIN);
}

// ─── Business Insights ───────────────────────────────────────────────────────

export interface BusinessInsightsData {
  overview: {
    totalRatings: number;
    avgScore: number;
    totalPromos: number;
    promoUses: number;
  };
  scoreOverTime: Array<{ date: string; avgScore: number; count: number }>;
  topItems: Array<{
    itemName: string;
    avgScore: number;
    ratingCount: number;
  }>;
  worstItems: Array<{
    itemName: string;
    avgScore: number;
    ratingCount: number;
  }>;
  ratingDistribution: Array<{ range: string; count: number }>;
  recentTrend: {
    last7DaysAvg: number | null;
    last30DaysAvg: number | null;
    allTimeAvg: number | null;
    trend: "up" | "down" | "stable";
  };
}

export async function getBusinessInsights(establishmentId: number): Promise<BusinessInsightsData | null> {
  const cacheKey = `business_insights_${establishmentId}`;
  const cached = getCached<BusinessInsightsData>(cacheKey);
  if (cached) return cached;

  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Overview
  const [ratingStats] = await db
    .select({
      count: sql<number>`COUNT(*)`,
      avgScore: sql<number>`AVG(overallScore)`,
    })
    .from(ratings)
    .where(eq(ratings.establishmentId, establishmentId));

  const [promoCount] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(promoCodes)
    .where(eq(promoCodes.establishmentId, establishmentId));

  const [promoUseCount] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(promoCodeUses)
    .innerJoin(promoCodes, eq(promoCodeUses.codeId, promoCodes.id))
    .where(eq(promoCodes.establishmentId, establishmentId));

  // Score over time (last 30 days)
  const scoreOverTime = await db
    .select({
      date: sql<string>`DATE(createdAt)`,
      avgScore: sql<number>`AVG(overallScore)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(ratings)
    .where(
      and(
        eq(ratings.establishmentId, establishmentId),
        gte(ratings.createdAt, thirtyDaysAgo)
      )
    )
    .groupBy(sql`DATE(createdAt)`)
    .orderBy(sql`DATE(createdAt)`);

  // Top items (best rated)
  const topItems = await db
    .select({
      itemName: ratingItems.itemName,
      avgScore: sql<number>`AVG(${ratingItems.score})`,
      ratingCount: sql<number>`COUNT(*)`,
    })
    .from(ratingItems)
    .innerJoin(ratings, eq(ratingItems.ratingId, ratings.id))
    .where(eq(ratings.establishmentId, establishmentId))
    .groupBy(ratingItems.itemName)
    .having(sql`COUNT(*) >= 2`)
    .orderBy(sql`AVG(${ratingItems.score}) DESC`)
    .limit(5);

  // Worst items
  const worstItems = await db
    .select({
      itemName: ratingItems.itemName,
      avgScore: sql<number>`AVG(${ratingItems.score})`,
      ratingCount: sql<number>`COUNT(*)`,
    })
    .from(ratingItems)
    .innerJoin(ratings, eq(ratingItems.ratingId, ratings.id))
    .where(eq(ratings.establishmentId, establishmentId))
    .groupBy(ratingItems.itemName)
    .having(sql`COUNT(*) >= 2`)
    .orderBy(sql`AVG(${ratingItems.score}) ASC`)
    .limit(5);

  // Rating distribution (0-2, 2-4, 4-6, 6-8, 8-10)
  const distribution = await db
    .select({
      range: sql<string>`CASE 
        WHEN overallScore < 2 THEN '0-2'
        WHEN overallScore < 4 THEN '2-4'
        WHEN overallScore < 6 THEN '4-6'
        WHEN overallScore < 8 THEN '6-8'
        ELSE '8-10'
      END`,
      count: sql<number>`COUNT(*)`,
    })
    .from(ratings)
    .where(eq(ratings.establishmentId, establishmentId))
    .groupBy(sql`CASE 
      WHEN overallScore < 2 THEN '0-2'
      WHEN overallScore < 4 THEN '2-4'
      WHEN overallScore < 6 THEN '4-6'
      WHEN overallScore < 8 THEN '6-8'
      ELSE '8-10'
    END`);

  // Recent trend
  const [last7Avg] = await db
    .select({ avg: sql<number>`AVG(overallScore)` })
    .from(ratings)
    .where(and(
      eq(ratings.establishmentId, establishmentId),
      gte(ratings.createdAt, sevenDaysAgo)
    ));
  const [last30Avg] = await db
    .select({ avg: sql<number>`AVG(overallScore)` })
    .from(ratings)
    .where(and(
      eq(ratings.establishmentId, establishmentId),
      gte(ratings.createdAt, thirtyDaysAgo)
    ));

  const allTimeAvg = ratingStats.avgScore ? Number(Number(ratingStats.avgScore).toFixed(1)) : null;
  const last7 = last7Avg.avg ? Number(Number(last7Avg.avg).toFixed(1)) : null;
  const last30 = last30Avg.avg ? Number(Number(last30Avg.avg).toFixed(1)) : null;

  let trend: "up" | "down" | "stable" = "stable";
  if (last7 !== null && last30 !== null) {
    if (last7 > last30 + 0.3) trend = "up";
    else if (last7 < last30 - 0.3) trend = "down";
  }

  const result: BusinessInsightsData = {
    overview: {
      totalRatings: ratingStats.count || 0,
      avgScore: allTimeAvg || 0,
      totalPromos: promoCount.count || 0,
      promoUses: promoUseCount.count || 0,
    },
    scoreOverTime: scoreOverTime.map(r => ({
      date: String(r.date),
      avgScore: Number(Number(r.avgScore).toFixed(1)),
      count: Number(r.count),
    })),
    topItems: topItems.map(i => ({
      itemName: i.itemName,
      avgScore: Number(Number(i.avgScore).toFixed(1)),
      ratingCount: Number(i.ratingCount),
    })),
    worstItems: worstItems.map(i => ({
      itemName: i.itemName,
      avgScore: Number(Number(i.avgScore).toFixed(1)),
      ratingCount: Number(i.ratingCount),
    })),
    ratingDistribution: ["0-2", "2-4", "4-6", "6-8", "8-10"].map(range => ({
      range,
      count: Number(distribution.find(d => d.range === range)?.count || 0),
    })),
    recentTrend: {
      last7DaysAvg: last7,
      last30DaysAvg: last30,
      allTimeAvg,
      trend,
    },
  };

  return setCache(cacheKey, result, CACHE_TTL_BUSINESS);
}

// ─── User Stats ──────────────────────────────────────────────────────────────

export interface UserStatsData {
  totalRatings: number;
  avgScore: number;
  categoriesEvaluated: number;
  establishmentsVisited: number;
  ratingsLast30Days: number;
  favoriteCategory: { name: string; count: number } | null;
  favoriteNeighborhood: { name: string; count: number } | null;
  ratingsByMonth: Array<{ month: string; count: number }>;
  topRatedEstablishments: Array<{ name: string; score: number }>;
  avgCostPerVisit: number | null;
}

export async function getUserStats(userId: number): Promise<UserStatsData | null> {
  const cacheKey = `user_stats_${userId}`;
  const cached = getCached<UserStatsData>(cacheKey);
  if (cached) return cached;

  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Basic stats
  const [basicStats] = await db
    .select({
      totalRatings: sql<number>`COUNT(*)`,
      avgScore: sql<number>`AVG(overallScore)`,
      establishmentsVisited: sql<number>`COUNT(DISTINCT establishmentId)`,
      avgCost: sql<number>`AVG(totalCost)`,
    })
    .from(ratings)
    .where(eq(ratings.userId, userId));

  // Ratings last 30 days
  const [recent] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(ratings)
    .where(and(eq(ratings.userId, userId), gte(ratings.createdAt, thirtyDaysAgo)));

  // Categories evaluated
  const categoriesResult = await db
    .select({
      categoryId: establishments.categoryId,
      categoryName: categories.name,
      count: sql<number>`COUNT(*)`,
    })
    .from(ratings)
    .innerJoin(establishments, eq(ratings.establishmentId, establishments.id))
    .innerJoin(categories, eq(establishments.categoryId, categories.id))
    .where(eq(ratings.userId, userId))
    .groupBy(establishments.categoryId, categories.name)
    .orderBy(sql`COUNT(*) DESC`);

  // Favorite neighborhood
  const neighborhoods = await db
    .select({
      neighborhood: establishments.neighborhood,
      count: sql<number>`COUNT(*)`,
    })
    .from(ratings)
    .innerJoin(establishments, eq(ratings.establishmentId, establishments.id))
    .where(eq(ratings.userId, userId))
    .groupBy(establishments.neighborhood)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(1);

  // Ratings by month (last 6 months)
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const ratingsByMonth = await db
    .select({
      month: sql<string>`DATE_FORMAT(createdAt, '%Y-%m')`,
      count: sql<number>`COUNT(*)`,
    })
    .from(ratings)
    .where(and(eq(ratings.userId, userId), gte(ratings.createdAt, sixMonthsAgo)))
    .groupBy(sql`DATE_FORMAT(createdAt, '%Y-%m')`)
    .orderBy(sql`DATE_FORMAT(createdAt, '%Y-%m')`);

  // Top rated establishments by this user
  const topRated = await db
    .select({
      name: establishments.name,
      score: ratings.overallScore,
    })
    .from(ratings)
    .innerJoin(establishments, eq(ratings.establishmentId, establishments.id))
    .where(eq(ratings.userId, userId))
    .orderBy(desc(ratings.overallScore))
    .limit(5);

  const result: UserStatsData = {
    totalRatings: basicStats.totalRatings || 0,
    avgScore: basicStats.avgScore ? Number(Number(basicStats.avgScore).toFixed(1)) : 0,
    categoriesEvaluated: categoriesResult.length,
    establishmentsVisited: basicStats.establishmentsVisited || 0,
    ratingsLast30Days: recent.count || 0,
    favoriteCategory: categoriesResult.length > 0
      ? { name: categoriesResult[0].categoryName, count: Number(categoriesResult[0].count) }
      : null,
    favoriteNeighborhood: neighborhoods.length > 0 && neighborhoods[0].neighborhood
      ? { name: neighborhoods[0].neighborhood, count: Number(neighborhoods[0].count) }
      : null,
    ratingsByMonth: ratingsByMonth.map(r => ({
      month: String(r.month),
      count: Number(r.count),
    })),
    topRatedEstablishments: topRated
      .filter(r => r.score !== null)
      .map(r => ({
        name: r.name,
        score: Number(Number(r.score!).toFixed(1)),
      })),
    avgCostPerVisit: basicStats.avgCost ? Number(Number(basicStats.avgCost).toFixed(0)) : null,
  };

  return setCache(cacheKey, result, CACHE_TTL_USER);
}
