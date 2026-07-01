/**
 * Dashboard Data Module — Charts + Timeline with Outlier Detection
 * Provides: age pie, top items bar, regions pie, peak hours bar, timeline with outliers
 */
import { getDb } from "./db";
import { ratings, ratingItems, users, establishments } from "../drizzle/schema";
import { eq, sql, and, gte } from "drizzle-orm";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DashboardData {
  period: number; // days
  agePie: Array<{ label: string; value: number; percentage: number }>;
  topItemsBar: Array<{ name: string; count: number; avgScore: number }>;
  regionsPie: Array<{ label: string; value: number; percentage: number }>;
  peakHoursBar: Array<{ hour: string; count: number }>;
  timeline: {
    points: Array<{ date: string; score: number; count: number }>;
    outliers: Array<{
      date: string;
      score: number;
      avgScore: number;
      stdDev: number;
      deviation: number;
      possibleCauses: string[];
    }>;
    mean: number;
    stdDev: number;
  };
  summary: {
    totalRatings: number;
    avgScore: number;
    uniqueVisitors: number;
    avgTicket: number | null;
  };
}

// ─── Main Function ──────────────────────────────────────────────────────────

export async function getDashboardData(
  establishmentId: number,
  periodDays: number = 30
): Promise<DashboardData> {
  const db = await getDb();
  if (!db) return getEmptyDashboard(periodDays);

  const now = new Date();
  const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

  // ─── Summary Metrics ────────────────────────────────────────────────────
  const [summaryResult] = await db
    .select({
      totalRatings: sql<number>`COUNT(*)`,
      avgScore: sql<number>`AVG(overallScore)`,
      uniqueVisitors: sql<number>`COUNT(DISTINCT userId)`,
      avgTicket: sql<number>`AVG(CASE WHEN totalCost > 0 THEN totalCost ELSE NULL END)`,
    })
    .from(ratings)
    .where(and(eq(ratings.establishmentId, establishmentId), gte(ratings.createdAt, periodStart)));

  // ─── 1. Age Pie Chart ───────────────────────────────────────────────────
  const ageData = await db
    .select({ birthdate: users.birthdate })
    .from(ratings)
    .innerJoin(users, eq(ratings.userId, users.id))
    .where(and(eq(ratings.establishmentId, establishmentId), gte(ratings.createdAt, periodStart)));

  const ageGroups: Record<string, number> = { "18-24": 0, "25-34": 0, "35-44": 0, "45-54": 0, "55+": 0 };
  let totalWithAge = 0;
  for (const row of ageData) {
    if (row.birthdate) {
      const age = Math.floor((now.getTime() - new Date(row.birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      totalWithAge++;
      if (age < 25) ageGroups["18-24"]++;
      else if (age < 35) ageGroups["25-34"]++;
      else if (age < 45) ageGroups["35-44"]++;
      else if (age < 55) ageGroups["45-54"]++;
      else ageGroups["55+"]++;
    }
  }

  const agePie = Object.entries(ageGroups)
    .filter(([, v]) => v > 0)
    .map(([label, value]) => ({
      label,
      value,
      percentage: totalWithAge > 0 ? Math.round((value / totalWithAge) * 100) : 0,
    }));

  // ─── 2. Top Items Bar Chart ─────────────────────────────────────────────
  const topItems = await db
    .select({
      name: ratingItems.itemName,
      count: sql<number>`COUNT(*)`,
      avgScore: sql<number>`AVG(${ratingItems.score})`,
    })
    .from(ratingItems)
    .innerJoin(ratings, eq(ratingItems.ratingId, ratings.id))
    .where(and(eq(ratings.establishmentId, establishmentId), gte(ratings.createdAt, periodStart)))
    .groupBy(ratingItems.itemName)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(10);

  const topItemsBar = topItems.map(i => ({
    name: i.name,
    count: Number(i.count),
    avgScore: Number(Number(i.avgScore).toFixed(1)),
  }));

  // ─── 3. Regions Pie Chart ───────────────────────────────────────────────
  const regionData = await db
    .select({ surveyData: users.surveyData })
    .from(ratings)
    .innerJoin(users, eq(ratings.userId, users.id))
    .where(and(eq(ratings.establishmentId, establishmentId), gte(ratings.createdAt, periodStart)));

  const regionCounts: Record<string, number> = {};
  let totalWithRegion = 0;
  for (const row of regionData) {
    if (row.surveyData) {
      try {
        const data = typeof row.surveyData === "string" ? JSON.parse(row.surveyData) : row.surveyData;
        const region = data?.region || data?.bairro || data?.neighborhood;
        if (region && typeof region === "string") {
          regionCounts[region] = (regionCounts[region] || 0) + 1;
          totalWithRegion++;
        }
      } catch { /* ignore parse errors */ }
    }
  }

  const regionsPie = Object.entries(regionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({
      label,
      value,
      percentage: totalWithRegion > 0 ? Math.round((value / totalWithRegion) * 100) : 0,
    }));

  // ─── 4. Peak Hours Bar Chart ────────────────────────────────────────────
  const hourData = await db
    .select({
      hour: sql<number>`HOUR(createdAt)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(ratings)
    .where(and(eq(ratings.establishmentId, establishmentId), gte(ratings.createdAt, periodStart)))
    .groupBy(sql`HOUR(createdAt)`)
    .orderBy(sql`HOUR(createdAt)`);

  const peakHoursBar = hourData.map(h => ({
    hour: `${String(h.hour).padStart(2, "0")}h`,
    count: Number(h.count),
  }));

  // ─── 5. Timeline with Outlier Detection ─────────────────────────────────
  const dailyScores = await db
    .select({
      date: sql<string>`DATE(createdAt)`,
      score: sql<number>`AVG(overallScore)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(ratings)
    .where(and(eq(ratings.establishmentId, establishmentId), gte(ratings.createdAt, periodStart)))
    .groupBy(sql`DATE(createdAt)`)
    .orderBy(sql`DATE(createdAt)`);

  const points = dailyScores.map(d => ({
    date: String(d.date),
    score: Number(Number(d.score).toFixed(1)),
    count: Number(d.count),
  }));

  // Calculate mean and standard deviation
  const scores = points.map(p => p.score);
  const mean = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const variance = scores.length > 1
    ? scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / (scores.length - 1)
    : 0;
  const stdDev = Math.sqrt(variance);

  // Detect outliers: points more than 2 standard deviations below the mean
  const outliers: DashboardData["timeline"]["outliers"] = [];
  if (stdDev > 0 && points.length >= 5) {
    for (const point of points) {
      const deviation = (mean - point.score) / stdDev;
      if (deviation >= 2) {
        // This is an outlier — score is significantly below average
        // Try to find possible causes from low-score items on that date
        const dayItems = await db
          .select({ itemName: ratingItems.itemName, score: ratingItems.score })
          .from(ratingItems)
          .innerJoin(ratings, eq(ratingItems.ratingId, ratings.id))
          .where(and(
            eq(ratings.establishmentId, establishmentId),
            sql`DATE(${ratings.createdAt}) = ${point.date}`,
            sql`${ratingItems.score} <= 5`
          ))
          .limit(10);

        // Get "what missed for 10" on that date
        const dayMissed = await db
          .select({ text: ratingItems.whatMissedForTen })
          .from(ratingItems)
          .innerJoin(ratings, eq(ratingItems.ratingId, ratings.id))
          .where(and(
            eq(ratings.establishmentId, establishmentId),
            sql`DATE(${ratings.createdAt}) = ${point.date}`,
            sql`${ratingItems.whatMissedForTen} IS NOT NULL AND ${ratingItems.whatMissedForTen} != ''`
          ))
          .limit(5);

        const possibleCauses: string[] = [];

        // Group low items by name
        const itemCounts: Record<string, number> = {};
        for (const item of dayItems) {
          itemCounts[item.itemName] = (itemCounts[item.itemName] || 0) + 1;
        }
        const topBadItems = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
        for (const [name, count] of topBadItems) {
          possibleCauses.push(`"${name}" com ${count} notas baixas`);
        }

        // Add missed texts
        for (const m of dayMissed.slice(0, 2)) {
          if (m.text) possibleCauses.push(`Feedback: "${m.text}"`);
        }

        if (possibleCauses.length === 0) {
          possibleCauses.push(`${point.count} avaliações com média ${point.score} (normal: ${mean.toFixed(1)})`);
        }

        outliers.push({
          date: point.date,
          score: point.score,
          avgScore: Number(mean.toFixed(1)),
          stdDev: Number(stdDev.toFixed(2)),
          deviation: Number(deviation.toFixed(1)),
          possibleCauses,
        });
      }
    }
  }

  return {
    period: periodDays,
    agePie,
    topItemsBar,
    regionsPie,
    peakHoursBar,
    timeline: { points, outliers, mean: Number(mean.toFixed(1)), stdDev: Number(stdDev.toFixed(2)) },
    summary: {
      totalRatings: Number(summaryResult?.totalRatings || 0),
      avgScore: summaryResult?.avgScore ? Number(Number(summaryResult.avgScore).toFixed(1)) : 0,
      uniqueVisitors: Number(summaryResult?.uniqueVisitors || 0),
      avgTicket: summaryResult?.avgTicket ? Number(Number(summaryResult.avgTicket).toFixed(0)) : null,
    },
  };
}

// ─── Empty State ────────────────────────────────────────────────────────────

function getEmptyDashboard(period: number): DashboardData {
  return {
    period,
    agePie: [],
    topItemsBar: [],
    regionsPie: [],
    peakHoursBar: [],
    timeline: { points: [], outliers: [], mean: 0, stdDev: 0 },
    summary: { totalRatings: 0, avgScore: 0, uniqueVisitors: 0, avgTicket: null },
  };
}
