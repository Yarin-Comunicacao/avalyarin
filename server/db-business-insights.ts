/**
 * Business Insights Module — Advanced analytics for establishments
 * Provides: Health Score, 20 Insights by Tier, AI-generated Actions
 */
import { getDb } from "./db";
import { ratings, ratingItems, users, establishments, menuItems, businessSubscriptions } from "../drizzle/schema";
import { eq, sql, and, gte, desc, count } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

// ─── Cache Layer ─────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const insightsCache = new Map<string, CacheEntry<any>>();

function getCached<T>(key: string): T | null {
  const entry = insightsCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    insightsCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttlMs: number): T {
  insightsCache.set(key, { data, expiresAt: Date.now() + ttlMs });
  return data;
}

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const CACHE_TTL_ACTIONS = 60 * 60 * 1000; // 1 hour (LLM-generated)

// ─── Types ──────────────────────────────────────────────────────────────────

export interface HealthScoreData {
  score: number; // 0-100
  label: "Crítico" | "Atenção" | "Bom" | "Ótimo" | "Excelente";
  color: "red" | "orange" | "yellow" | "green" | "emerald";
  components: {
    avgScore: { value: number; weight: 40; contribution: number };
    returnRate: { value: number; weight: 20; contribution: number };
    trend: { value: number; weight: 20; contribution: number };
    sentiment: { value: number; weight: 20; contribution: number };
  };
  alerts: Array<{
    type: "urgent" | "warning" | "info" | "positive";
    title: string;
    description: string;
    linkedInsight?: number;
    linkedAction?: number;
  }>;
  sparkline: Array<{ date: string; score: number }>;
  trendDirection: "up" | "down" | "stable";
  trendDelta: number; // percentage change
}

export interface InsightData {
  id: number;
  tier: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  icon: string;
  value: string | number | null;
  detail: string | null;
  chartData?: any;
  metadata?: Record<string, any>;
}

export interface ActionData {
  id: number;
  priority: "urgent" | "high" | "medium" | "low";
  title: string;
  description: string;
  impact: string;
  investmentEstimate: string;
  timeEstimate: string;
  steps: string[];
  source: string; // which insight generated this
  status: "pending" | "done" | "ignored";
}

export interface BusinessInsightsFullData {
  healthScore: HealthScoreData;
  insights: InsightData[];
  actions: ActionData[];
  plan: "free" | "premium";
}

// ─── Business Plan Check ────────────────────────────────────────────────────

export async function getBusinessPlan(userId: number, establishmentId: number): Promise<"free" | "premium"> {
  const db = await getDb();
  if (!db) return "free";

  const [sub] = await db
    .select({ plan: businessSubscriptions.plan, status: businessSubscriptions.status })
    .from(businessSubscriptions)
    .where(
      and(
        eq(businessSubscriptions.userId, userId),
        eq(businessSubscriptions.establishmentId, establishmentId),
        eq(businessSubscriptions.status, "active")
      )
    )
    .limit(1);

  return sub?.plan === "premium" ? "premium" : "free";
}

// ─── Health Score ───────────────────────────────────────────────────────────

export async function getHealthScore(establishmentId: number): Promise<HealthScoreData> {
  const cacheKey = `health_score_${establishmentId}`;
  const cached = getCached<HealthScoreData>(cacheKey);
  if (cached) return cached;

  const db = await getDb();
  if (!db) return getEmptyHealthScore();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  // 1. Average Score (weight: 40%)
  const [avgResult] = await db
    .select({ avg: sql<number>`AVG(overallScore)`, count: sql<number>`COUNT(*)` })
    .from(ratings)
    .where(eq(ratings.establishmentId, establishmentId));

  const avgScore = avgResult?.avg ? Number(avgResult.avg) : 0;
  const totalRatings = Number(avgResult?.count || 0);
  // Normalize to 0-100: score/10 * 100
  const avgScoreNormalized = Math.min(100, (avgScore / 10) * 100);

  // 2. Return Rate (weight: 20%) — users who rated more than once
  const returningUsers = await db
    .select({ userId: ratings.userId, visits: sql<number>`COUNT(*)` })
    .from(ratings)
    .where(eq(ratings.establishmentId, establishmentId))
    .groupBy(ratings.userId)
    .having(sql`COUNT(*) >= 2`);

  const [totalUsers] = await db
    .select({ count: sql<number>`COUNT(DISTINCT userId)` })
    .from(ratings)
    .where(eq(ratings.establishmentId, establishmentId));

  const returnRate = totalUsers?.count > 0
    ? (returningUsers.length / Number(totalUsers.count)) * 100
    : 0;

  // 3. Trend (weight: 20%) — compare last 7 days vs last 30 days
  const [last7] = await db
    .select({ avg: sql<number>`AVG(overallScore)` })
    .from(ratings)
    .where(and(eq(ratings.establishmentId, establishmentId), gte(ratings.createdAt, sevenDaysAgo)));

  const [last30] = await db
    .select({ avg: sql<number>`AVG(overallScore)` })
    .from(ratings)
    .where(and(eq(ratings.establishmentId, establishmentId), gte(ratings.createdAt, thirtyDaysAgo)));

  const last7Avg = last7?.avg ? Number(last7.avg) : avgScore;
  const last30Avg = last30?.avg ? Number(last30.avg) : avgScore;
  const trendDelta = last30Avg > 0 ? ((last7Avg - last30Avg) / last30Avg) * 100 : 0;
  // Normalize: +10% = 100, 0% = 50, -10% = 0
  const trendNormalized = Math.max(0, Math.min(100, 50 + (trendDelta * 5)));

  // 4. Sentiment (weight: 20%) — based on scores distribution
  const [lowScores] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(ratingItems)
    .innerJoin(ratings, eq(ratingItems.ratingId, ratings.id))
    .where(and(
      eq(ratings.establishmentId, establishmentId),
      sql`${ratingItems.score} <= 6`
    ));

  const [totalItems] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(ratingItems)
    .innerJoin(ratings, eq(ratingItems.ratingId, ratings.id))
    .where(eq(ratings.establishmentId, establishmentId));

  const lowScoreRatio = totalItems?.count > 0
    ? Number(lowScores?.count || 0) / Number(totalItems.count)
    : 0;
  // Invert: fewer low scores = better sentiment
  const sentimentNormalized = Math.max(0, Math.min(100, (1 - lowScoreRatio) * 100));

  // Calculate final score
  const finalScore = Math.round(
    (avgScoreNormalized * 0.4) +
    (returnRate * 0.2) +
    (trendNormalized * 0.2) +
    (sentimentNormalized * 0.2)
  );

  // Determine label and color
  let label: HealthScoreData["label"];
  let color: HealthScoreData["color"];
  if (finalScore >= 85) { label = "Excelente"; color = "emerald"; }
  else if (finalScore >= 70) { label = "Ótimo"; color = "green"; }
  else if (finalScore >= 55) { label = "Bom"; color = "yellow"; }
  else if (finalScore >= 40) { label = "Atenção"; color = "orange"; }
  else { label = "Crítico"; color = "red"; }

  // Trend direction
  let trendDirection: "up" | "down" | "stable" = "stable";
  if (trendDelta > 3) trendDirection = "up";
  else if (trendDelta < -3) trendDirection = "down";

  // Sparkline (last 30 days, daily avg)
  const sparklineData = await db
    .select({
      date: sql<string>`DATE(createdAt)`,
      score: sql<number>`AVG(overallScore)`,
    })
    .from(ratings)
    .where(and(eq(ratings.establishmentId, establishmentId), gte(ratings.createdAt, thirtyDaysAgo)))
    .groupBy(sql`DATE(createdAt)`)
    .orderBy(sql`DATE(createdAt)`);

  // Generate alerts
  const alerts: HealthScoreData["alerts"] = [];

  // Alert: worst items
  const worstItems = await db
    .select({
      itemName: ratingItems.itemName,
      avgScore: sql<number>`AVG(${ratingItems.score})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(ratingItems)
    .innerJoin(ratings, eq(ratingItems.ratingId, ratings.id))
    .where(and(eq(ratings.establishmentId, establishmentId), gte(ratings.createdAt, thirtyDaysAgo)))
    .groupBy(ratingItems.itemName)
    .having(sql`COUNT(*) >= 2 AND AVG(${ratingItems.score}) < 6`)
    .orderBy(sql`AVG(${ratingItems.score}) ASC`)
    .limit(3);

  for (const item of worstItems) {
    alerts.push({
      type: "urgent",
      title: `${item.itemName} com nota baixa`,
      description: `Nota média ${Number(item.avgScore).toFixed(1)} em ${item.count} avaliações recentes.`,
      linkedInsight: 6,
    });
  }

  // Alert: "what missed for 10" patterns
  const missedForTen = await db
    .select({ text: ratingItems.whatMissedForTen })
    .from(ratingItems)
    .innerJoin(ratings, eq(ratingItems.ratingId, ratings.id))
    .where(and(
      eq(ratings.establishmentId, establishmentId),
      gte(ratings.createdAt, thirtyDaysAgo),
      sql`${ratingItems.whatMissedForTen} IS NOT NULL AND ${ratingItems.whatMissedForTen} != ''`
    ))
    .limit(20);

  if (missedForTen.length >= 3) {
    alerts.push({
      type: "warning",
      title: `${missedForTen.length} feedbacks "O que faltou para o 10"`,
      description: `Clientes próximos da nota máxima deixaram sugestões de melhoria.`,
      linkedInsight: 4,
    });
  }

  // Alert: positive trend
  if (trendDirection === "up") {
    alerts.push({
      type: "positive",
      title: "Tendência positiva",
      description: `Nota subiu ${Math.abs(trendDelta).toFixed(1)}% nos últimos 7 dias comparado aos 30 dias.`,
    });
  }

  // Limit to 3 alerts
  const topAlerts = alerts.slice(0, 3);

  const result: HealthScoreData = {
    score: finalScore,
    label,
    color,
    components: {
      avgScore: { value: Number(avgScore.toFixed(1)), weight: 40, contribution: Math.round(avgScoreNormalized * 0.4) },
      returnRate: { value: Math.round(returnRate), weight: 20, contribution: Math.round(returnRate * 0.2) },
      trend: { value: Number(trendDelta.toFixed(1)), weight: 20, contribution: Math.round(trendNormalized * 0.2) },
      sentiment: { value: Math.round(sentimentNormalized), weight: 20, contribution: Math.round(sentimentNormalized * 0.2) },
    },
    alerts: topAlerts,
    sparkline: sparklineData.map(d => ({ date: String(d.date), score: Number(Number(d.score).toFixed(1)) })),
    trendDirection,
    trendDelta: Number(trendDelta.toFixed(1)),
  };

  return setCache(cacheKey, result, CACHE_TTL);
}

function getEmptyHealthScore(): HealthScoreData {
  return {
    score: 0,
    label: "Crítico",
    color: "red",
    components: {
      avgScore: { value: 0, weight: 40, contribution: 0 },
      returnRate: { value: 0, weight: 20, contribution: 0 },
      trend: { value: 0, weight: 20, contribution: 0 },
      sentiment: { value: 0, weight: 20, contribution: 0 },
    },
    alerts: [{ type: "info", title: "Sem dados suficientes", description: "Aguardando avaliações para calcular o Health Score." }],
    sparkline: [],
    trendDirection: "stable",
    trendDelta: 0,
  };
}

// ─── Insights by Tier ───────────────────────────────────────────────────────

export async function getInsightsByTier(establishmentId: number): Promise<InsightData[]> {
  const cacheKey = `insights_tier_${establishmentId}`;
  const cached = getCached<InsightData[]>(cacheKey);
  if (cached) return cached;

  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const insights: InsightData[] = [];

  // ─── TIER 1 (Daily) ─────────────────────────────────────────────────────

  // 1. Persona Real
  const personaData = await db
    .select({
      userId: ratings.userId,
      birthdate: users.birthdate,
      surveyData: users.surveyData,
    })
    .from(ratings)
    .innerJoin(users, eq(ratings.userId, users.id))
    .where(and(eq(ratings.establishmentId, establishmentId), gte(ratings.createdAt, ninetyDaysAgo)))
    .limit(200);

  const ageGroups: Record<string, number> = { "18-24": 0, "25-34": 0, "35-44": 0, "45+": 0 };
  let totalWithAge = 0;
  for (const p of personaData) {
    if (p.birthdate) {
      const age = Math.floor((now.getTime() - new Date(p.birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      totalWithAge++;
      if (age < 25) ageGroups["18-24"]++;
      else if (age < 35) ageGroups["25-34"]++;
      else if (age < 45) ageGroups["35-44"]++;
      else ageGroups["45+"]++;
    }
  }

  const dominantAge = Object.entries(ageGroups).sort((a, b) => b[1] - a[1])[0];
  insights.push({
    id: 1,
    tier: 1,
    title: "Persona Real",
    description: "Perfil demográfico dos seus clientes reais",
    icon: "Users",
    value: totalWithAge > 0 ? `${dominantAge[0]} (${Math.round((dominantAge[1] / totalWithAge) * 100)}%)` : null,
    detail: totalWithAge > 0 ? `${totalWithAge} clientes analisados nos últimos 90 dias` : "Sem dados suficientes",
    metadata: { ageGroups, totalWithAge, totalRaters: personaData.length },
  });

  // 2. Horários de Engajamento
  const hourData = await db
    .select({
      hour: sql<number>`HOUR(createdAt)`,
      dayOfWeek: sql<number>`DAYOFWEEK(createdAt)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(ratings)
    .where(and(eq(ratings.establishmentId, establishmentId), gte(ratings.createdAt, ninetyDaysAgo)))
    .groupBy(sql`HOUR(createdAt)`, sql`DAYOFWEEK(createdAt)`);

  const peakHour = hourData.sort((a, b) => Number(b.count) - Number(a.count))[0];
  const dayNames = ["", "Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  insights.push({
    id: 2,
    tier: 1,
    title: "Horários de Engajamento",
    description: "Quando seus clientes visitam e avaliam",
    icon: "Clock",
    value: peakHour ? `${dayNames[peakHour.dayOfWeek]} ${peakHour.hour}h` : null,
    detail: peakHour ? `Pico: ${dayNames[peakHour.dayOfWeek]} às ${peakHour.hour}h (${peakHour.count} visitas)` : "Sem dados suficientes",
    metadata: { hourData: hourData.map(h => ({ hour: h.hour, day: h.dayOfWeek, count: Number(h.count) })) },
  });

  // 3. Itens Hero
  const heroItems = await db
    .select({
      itemName: ratingItems.itemName,
      avgScore: sql<number>`AVG(${ratingItems.score})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(ratingItems)
    .innerJoin(ratings, eq(ratingItems.ratingId, ratings.id))
    .where(and(eq(ratings.establishmentId, establishmentId)))
    .groupBy(ratingItems.itemName)
    .having(sql`COUNT(*) >= 2`)
    .orderBy(sql`(AVG(${ratingItems.score}) * LOG(COUNT(*) + 1)) DESC`)
    .limit(5);

  insights.push({
    id: 3,
    tier: 1,
    title: "Itens Hero",
    description: "Produtos com melhor nota E maior volume — ideais para criativos",
    icon: "Star",
    value: heroItems[0]?.itemName || null,
    detail: heroItems[0] ? `${heroItems[0].itemName}: nota ${Number(heroItems[0].avgScore).toFixed(1)} (${heroItems[0].count}x)` : "Sem dados suficientes",
    metadata: { items: heroItems.map(i => ({ name: i.itemName, score: Number(Number(i.avgScore).toFixed(1)), count: Number(i.count) })) },
  });

  // 4. Copy Bank (palavras dos clientes)
  const comments = await db
    .select({ comment: ratingItems.comment, whatMissed: ratingItems.whatMissedForTen })
    .from(ratingItems)
    .innerJoin(ratings, eq(ratingItems.ratingId, ratings.id))
    .where(and(
      eq(ratings.establishmentId, establishmentId),
      sql`(${ratingItems.comment} IS NOT NULL AND ${ratingItems.comment} != '') OR (${ratingItems.whatMissedForTen} IS NOT NULL AND ${ratingItems.whatMissedForTen} != '')`
    ))
    .limit(100);

  const allTexts = comments.map(c => c.comment || c.whatMissed || "").filter(t => t.length > 5);
  insights.push({
    id: 4,
    tier: 1,
    title: "Copy Bank",
    description: "Expressões e palavras reais dos seus clientes",
    icon: "MessageSquare",
    value: allTexts.length > 0 ? `${allTexts.length} comentários` : null,
    detail: allTexts.length > 0 ? `${allTexts.length} textos disponíveis para análise de copy` : "Sem comentários suficientes",
    metadata: { sampleTexts: allTexts.slice(0, 10) },
  });

  // 5. Raio de Atração
  const raterLocations = await db
    .select({ lat: users.lat, lng: users.lng })
    .from(ratings)
    .innerJoin(users, eq(ratings.userId, users.id))
    .where(and(
      eq(ratings.establishmentId, establishmentId),
      sql`${users.lat} IS NOT NULL AND ${users.lng} IS NOT NULL`
    ))
    .limit(100);

  const [estabLocation] = await db
    .select({ lat: establishments.lat, lng: establishments.lng })
    .from(establishments)
    .where(eq(establishments.id, establishmentId));

  let avgDistance: number | null = null;
  if (estabLocation?.lat && estabLocation?.lng && raterLocations.length > 0) {
    const distances = raterLocations
      .filter(r => r.lat && r.lng)
      .map(r => haversineKm(estabLocation.lat!, estabLocation.lng!, r.lat!, r.lng!));
    avgDistance = distances.length > 0 ? distances.reduce((a, b) => a + b, 0) / distances.length : null;
  }

  insights.push({
    id: 5,
    tier: 1,
    title: "Raio de Atração",
    description: "De onde vêm seus clientes (distância média)",
    icon: "MapPin",
    value: avgDistance !== null ? `${avgDistance.toFixed(1)} km` : null,
    detail: avgDistance !== null ? `Clientes vêm em média de ${avgDistance.toFixed(1)} km de distância` : "Sem dados de localização",
    metadata: { avgDistance, totalWithLocation: raterLocations.length },
  });

  // ─── TIER 2 (Weekly) ────────────────────────────────────────────────────

  // 6. Sentimento por Pilar
  const lowReasons = await db
    .select({ reasons: ratingItems.lowScoreReasons })
    .from(ratingItems)
    .innerJoin(ratings, eq(ratingItems.ratingId, ratings.id))
    .where(and(
      eq(ratings.establishmentId, establishmentId),
      sql`${ratingItems.lowScoreReasons} IS NOT NULL`
    ))
    .limit(200);

  const reasonCounts: Record<string, number> = {};
  for (const row of lowReasons) {
    if (row.reasons && Array.isArray(row.reasons)) {
      for (const r of row.reasons as any[]) {
        const label = typeof r === "string" ? r : r?.label || r?.value || "";
        if (label) reasonCounts[label] = (reasonCounts[label] || 0) + 1;
      }
    }
  }

  const topReasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  insights.push({
    id: 6,
    tier: 2,
    title: "Sentimento por Pilar",
    description: "Motivos mais citados em notas baixas",
    icon: "ThumbsDown",
    value: topReasons[0] ? topReasons[0][0] : null,
    detail: topReasons[0] ? `Principal motivo: "${topReasons[0][0]}" (${topReasons[0][1]}x)` : "Sem motivos registrados",
    metadata: { reasons: topReasons.map(([label, count]) => ({ label, count })) },
  });

  // 7. Conteúdo que Performa
  const highRatedItems = await db
    .select({
      itemName: ratingItems.itemName,
      avgScore: sql<number>`AVG(${ratingItems.score})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(ratingItems)
    .innerJoin(ratings, eq(ratingItems.ratingId, ratings.id))
    .where(and(eq(ratings.establishmentId, establishmentId), gte(ratings.createdAt, ninetyDaysAgo)))
    .groupBy(ratingItems.itemName)
    .having(sql`AVG(${ratingItems.score}) >= 8 AND COUNT(*) >= 3`)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(5);

  insights.push({
    id: 7,
    tier: 2,
    title: "Conteúdo que Performa",
    description: "Itens com nota alta + volume — ideais para conteúdo em redes sociais",
    icon: "TrendingUp",
    value: highRatedItems.length > 0 ? `${highRatedItems.length} itens` : null,
    detail: highRatedItems[0] ? `Melhor para conteúdo: ${highRatedItems[0].itemName} (${Number(highRatedItems[0].avgScore).toFixed(1)})` : "Sem itens qualificados",
    metadata: { items: highRatedItems.map(i => ({ name: i.itemName, score: Number(Number(i.avgScore).toFixed(1)), count: Number(i.count) })) },
  });

  // 8. Taxa de Retorno
  const [uniqueRaters] = await db
    .select({ count: sql<number>`COUNT(DISTINCT userId)` })
    .from(ratings)
    .where(eq(ratings.establishmentId, establishmentId));

  const [repeaters] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(
      db.select({ userId: ratings.userId })
        .from(ratings)
        .where(eq(ratings.establishmentId, establishmentId))
        .groupBy(ratings.userId)
        .having(sql`COUNT(*) >= 2`)
        .as("repeaters")
    );

  const returnRateValue = uniqueRaters?.count > 0
    ? Math.round((Number(repeaters?.count || 0) / Number(uniqueRaters.count)) * 100)
    : 0;

  insights.push({
    id: 8,
    tier: 2,
    title: "Taxa de Retorno",
    description: "Percentual de clientes que voltaram mais de uma vez",
    icon: "RefreshCw",
    value: `${returnRateValue}%`,
    detail: `${repeaters?.count || 0} de ${uniqueRaters?.count || 0} clientes voltaram`,
    metadata: { returnRate: returnRateValue, repeaters: Number(repeaters?.count || 0), total: Number(uniqueRaters?.count || 0) },
  });

  // 9. Comparativo com Concorrentes
  const [estabInfo] = await db
    .select({ neighborhood: establishments.neighborhood, categoryId: establishments.categoryId })
    .from(establishments)
    .where(eq(establishments.id, establishmentId));

  let neighborhoodAvg: number | null = null;
  if (estabInfo?.neighborhood) {
    const [nbAvg] = await db
      .select({ avg: sql<number>`AVG(r.overallScore)` })
      .from(sql`ratings r INNER JOIN establishments e ON r.establishmentId = e.id`)
      .where(sql`e.neighborhood = ${estabInfo.neighborhood} AND e.id != ${establishmentId}`);
    neighborhoodAvg = nbAvg?.avg ? Number(Number(nbAvg.avg).toFixed(1)) : null;
  }

  const [myAvg] = await db
    .select({ avg: sql<number>`AVG(overallScore)` })
    .from(ratings)
    .where(eq(ratings.establishmentId, establishmentId));

  const myAvgScore = myAvg?.avg ? Number(Number(myAvg.avg).toFixed(1)) : 0;
  const diff = neighborhoodAvg !== null ? (myAvgScore - neighborhoodAvg) : null;

  insights.push({
    id: 9,
    tier: 2,
    title: "Comparativo com Concorrentes",
    description: "Sua nota vs. média do bairro na mesma categoria",
    icon: "BarChart3",
    value: diff !== null ? `${diff > 0 ? "+" : ""}${diff.toFixed(1)}` : null,
    detail: neighborhoodAvg !== null
      ? `Você: ${myAvgScore} | Bairro: ${neighborhoodAvg} (${diff! > 0 ? "acima" : diff! < 0 ? "abaixo" : "igual"})`
      : "Sem dados comparativos",
    metadata: { myAvg: myAvgScore, neighborhoodAvg, neighborhood: estabInfo?.neighborhood },
  });

  // 10. Ticket Médio
  const [ticketData] = await db
    .select({
      avg: sql<number>`AVG(totalCost)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(ratings)
    .where(and(
      eq(ratings.establishmentId, establishmentId),
      sql`totalCost IS NOT NULL AND totalCost > 0`
    ));

  insights.push({
    id: 10,
    tier: 2,
    title: "Ticket Médio",
    description: "Valor médio gasto por visita (baseado em avaliações com valor)",
    icon: "DollarSign",
    value: ticketData?.avg ? `R$ ${Number(ticketData.avg).toFixed(0)}` : null,
    detail: ticketData?.avg ? `Média de R$ ${Number(ticketData.avg).toFixed(2)} em ${ticketData.count} visitas com valor informado` : "Sem dados de gasto",
    metadata: { avgTicket: ticketData?.avg ? Number(ticketData.avg) : null, count: Number(ticketData?.count || 0) },
  });

  // ─── TIER 3 (Monthly) ──────────────────────────────────────────────────

  // 11. Público por Faixa Etária (detailed)
  insights.push({
    id: 11,
    tier: 3,
    title: "Público por Faixa Etária",
    description: "Distribuição detalhada de idade para segmentação de campanhas",
    icon: "PieChart",
    value: totalWithAge > 0 ? `${totalWithAge} perfis` : null,
    detail: totalWithAge > 0 ? `Faixa dominante: ${dominantAge[0]} com ${Math.round((dominantAge[1] / totalWithAge) * 100)}%` : "Sem dados de idade",
    metadata: { ageGroups, totalWithAge },
  });

  // 12. Elasticidade de Preço
  const priceVsScore = await db
    .select({
      price: ratingItems.price,
      score: ratingItems.score,
    })
    .from(ratingItems)
    .innerJoin(ratings, eq(ratingItems.ratingId, ratings.id))
    .where(and(
      eq(ratings.establishmentId, establishmentId),
      sql`${ratingItems.price} IS NOT NULL AND ${ratingItems.price} > 0`
    ))
    .limit(200);

  let priceCorrelation: string | null = null;
  if (priceVsScore.length >= 10) {
    const avgPrice = priceVsScore.reduce((a, b) => a + Number(b.price || 0), 0) / priceVsScore.length;
    const highPrice = priceVsScore.filter(p => Number(p.price) > avgPrice);
    const lowPrice = priceVsScore.filter(p => Number(p.price) <= avgPrice);
    const highAvgScore = highPrice.length > 0 ? highPrice.reduce((a, b) => a + Number(b.score), 0) / highPrice.length : 0;
    const lowAvgScore = lowPrice.length > 0 ? lowPrice.reduce((a, b) => a + Number(b.score), 0) / lowPrice.length : 0;
    priceCorrelation = highAvgScore > lowAvgScore ? "Itens caros têm nota melhor" : "Itens baratos têm nota melhor";
  }

  insights.push({
    id: 12,
    tier: 3,
    title: "Elasticidade de Preço",
    description: "Correlação entre preço e satisfação dos itens",
    icon: "TrendingDown",
    value: priceCorrelation,
    detail: priceVsScore.length >= 10 ? `Análise baseada em ${priceVsScore.length} itens com preço` : "Dados insuficientes (mínimo 10 itens com preço)",
    metadata: { totalItems: priceVsScore.length },
  });

  // 13. Eficiência de Promos
  const promoData = await db
    .select({
      code: sql<string>`pc.code`,
      uses: sql<number>`COUNT(pcu.id)`,
    })
    .from(sql`promo_codes pc LEFT JOIN promo_code_uses pcu ON pcu.codeId = pc.id`)
    .where(sql`pc.establishmentId = ${establishmentId}`)
    .groupBy(sql`pc.id`)
    .limit(10);

  const totalPromoUses = promoData.reduce((a, b) => a + Number(b.uses), 0);
  insights.push({
    id: 13,
    tier: 3,
    title: "Eficiência de Promos",
    description: "Desempenho dos códigos promocionais criados",
    icon: "Ticket",
    value: promoData.length > 0 ? `${totalPromoUses} usos` : null,
    detail: promoData.length > 0 ? `${promoData.length} promos criados, ${totalPromoUses} usos totais` : "Nenhum promo criado",
    metadata: { promos: promoData.map(p => ({ code: p.code, uses: Number(p.uses) })) },
  });

  // 14. Frequência de Visita
  const visitFrequency = await db
    .select({
      userId: ratings.userId,
      visitCount: sql<number>`COUNT(*)`,
      firstVisit: sql<string>`MIN(createdAt)`,
      lastVisit: sql<string>`MAX(createdAt)`,
    })
    .from(ratings)
    .where(eq(ratings.establishmentId, establishmentId))
    .groupBy(ratings.userId)
    .having(sql`COUNT(*) >= 2`);

  let avgDaysBetween: number | null = null;
  if (visitFrequency.length > 0) {
    const intervals = visitFrequency.map(v => {
      const first = new Date(v.firstVisit).getTime();
      const last = new Date(v.lastVisit).getTime();
      const visits = Number(v.visitCount);
      return visits > 1 ? (last - first) / (visits - 1) / (24 * 60 * 60 * 1000) : null;
    }).filter(Boolean) as number[];
    avgDaysBetween = intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : null;
  }

  insights.push({
    id: 14,
    tier: 3,
    title: "Frequência de Visita",
    description: "Intervalo médio entre visitas dos clientes recorrentes",
    icon: "Calendar",
    value: avgDaysBetween !== null ? `${Math.round(avgDaysBetween)} dias` : null,
    detail: avgDaysBetween !== null ? `Clientes voltam em média a cada ${Math.round(avgDaysBetween)} dias` : "Dados insuficientes",
    metadata: { avgDaysBetween, repeatVisitors: visitFrequency.length },
  });

  // 15. NPS Implícito
  const [npsData] = await db
    .select({
      promoters: sql<number>`SUM(CASE WHEN overallScore >= 9 THEN 1 ELSE 0 END)`,
      detractors: sql<number>`SUM(CASE WHEN overallScore <= 6 THEN 1 ELSE 0 END)`,
      total: sql<number>`COUNT(*)`,
    })
    .from(ratings)
    .where(eq(ratings.establishmentId, establishmentId));

  const npsScore = npsData?.total > 0
    ? Math.round(((Number(npsData.promoters || 0) - Number(npsData.detractors || 0)) / Number(npsData.total)) * 100)
    : null;

  insights.push({
    id: 15,
    tier: 3,
    title: "NPS Implícito",
    description: "Net Promoter Score calculado a partir das notas (9-10 promotores, 1-6 detratores)",
    icon: "Award",
    value: npsScore !== null ? `${npsScore}` : null,
    detail: npsScore !== null ? `NPS: ${npsScore} (${npsData.promoters} promotores, ${npsData.detractors} detratores)` : "Sem dados",
    metadata: { nps: npsScore, promoters: Number(npsData?.promoters || 0), detractors: Number(npsData?.detractors || 0), total: Number(npsData?.total || 0) },
  });

  // ─── TIER 4 (Strategic) ─────────────────────────────────────────────────

  // 16. Previsão de Demanda
  const weekdayVolume = await db
    .select({
      dayOfWeek: sql<number>`DAYOFWEEK(createdAt)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(ratings)
    .where(and(eq(ratings.establishmentId, establishmentId), gte(ratings.createdAt, ninetyDaysAgo)))
    .groupBy(sql`DAYOFWEEK(createdAt)`);

  const peakDay = weekdayVolume.sort((a, b) => Number(b.count) - Number(a.count))[0];
  insights.push({
    id: 16,
    tier: 4,
    title: "Previsão de Demanda",
    description: "Padrão de volume por dia da semana para planejamento de estoque",
    icon: "LineChart",
    value: peakDay ? `${dayNames[peakDay.dayOfWeek]}` : null,
    detail: peakDay ? `Dia de maior movimento: ${dayNames[peakDay.dayOfWeek]} (${peakDay.count} visitas em 90 dias)` : "Sem dados",
    metadata: { weekdayVolume: weekdayVolume.map(d => ({ day: dayNames[d.dayOfWeek], count: Number(d.count) })) },
  });

  // 17. Share of Voice
  const [myRatingCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(ratings)
    .where(and(eq(ratings.establishmentId, establishmentId), gte(ratings.createdAt, ninetyDaysAgo)));

  let neighborhoodTotal: number | null = null;
  if (estabInfo?.neighborhood) {
    const [nbTotal] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(sql`ratings r INNER JOIN establishments e ON r.establishmentId = e.id`)
      .where(sql`e.neighborhood = ${estabInfo.neighborhood} AND r.createdAt >= ${ninetyDaysAgo.toISOString()}`);
    neighborhoodTotal = nbTotal?.count ? Number(nbTotal.count) : null;
  }

  const shareOfVoice = neighborhoodTotal && neighborhoodTotal > 0
    ? Math.round((Number(myRatingCount?.count || 0) / neighborhoodTotal) * 100)
    : null;

  insights.push({
    id: 17,
    tier: 4,
    title: "Share of Voice",
    description: "Sua presença em avaliações vs. total do bairro",
    icon: "Volume2",
    value: shareOfVoice !== null ? `${shareOfVoice}%` : null,
    detail: shareOfVoice !== null ? `${myRatingCount?.count || 0} de ${neighborhoodTotal} avaliações no bairro (${shareOfVoice}%)` : "Sem dados comparativos",
    metadata: { myCount: Number(myRatingCount?.count || 0), neighborhoodTotal, shareOfVoice },
  });

  // 18. Sazonalidade
  const monthlyVolume = await db
    .select({
      month: sql<number>`MONTH(createdAt)`,
      count: sql<number>`COUNT(*)`,
      avgScore: sql<number>`AVG(overallScore)`,
    })
    .from(ratings)
    .where(eq(ratings.establishmentId, establishmentId))
    .groupBy(sql`MONTH(createdAt)`);

  const monthNames = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const peakMonth = monthlyVolume.sort((a, b) => Number(b.count) - Number(a.count))[0];
  insights.push({
    id: 18,
    tier: 4,
    title: "Sazonalidade",
    description: "Padrões de consumo por mês/estação",
    icon: "Sun",
    value: peakMonth ? monthNames[peakMonth.month] : null,
    detail: peakMonth ? `Mês mais forte: ${monthNames[peakMonth.month]} (${peakMonth.count} visitas, nota ${Number(peakMonth.avgScore).toFixed(1)})` : "Sem dados históricos",
    metadata: { months: monthlyVolume.map(m => ({ month: monthNames[m.month], count: Number(m.count), avgScore: Number(Number(m.avgScore).toFixed(1)) })) },
  });

  // 19. Correlação Ambiente × Nota
  const missedTexts = await db
    .select({ text: ratingItems.whatMissedForTen, score: ratingItems.score })
    .from(ratingItems)
    .innerJoin(ratings, eq(ratingItems.ratingId, ratings.id))
    .where(and(
      eq(ratings.establishmentId, establishmentId),
      sql`${ratingItems.whatMissedForTen} IS NOT NULL AND ${ratingItems.whatMissedForTen} != ''`
    ))
    .limit(100);

  const ambientKeywords = ["música", "barulho", "som", "iluminação", "luz", "limpeza", "banheiro", "lotado", "espaço", "decoração", "ar condicionado", "ventilação"];
  const ambientMentions: Record<string, number> = {};
  for (const row of missedTexts) {
    const text = (row.text || "").toLowerCase();
    for (const kw of ambientKeywords) {
      if (text.includes(kw)) {
        ambientMentions[kw] = (ambientMentions[kw] || 0) + 1;
      }
    }
  }

  const topAmbient = Object.entries(ambientMentions).sort((a, b) => b[1] - a[1]).slice(0, 3);
  insights.push({
    id: 19,
    tier: 4,
    title: "Correlação Ambiente × Nota",
    description: "Fatores de ambiente mais mencionados no 'O que faltou para o 10?'",
    icon: "Lightbulb",
    value: topAmbient[0] ? topAmbient[0][0] : null,
    detail: topAmbient.length > 0 ? `Top menções: ${topAmbient.map(([k, v]) => `${k} (${v}x)`).join(", ")}` : "Sem menções de ambiente",
    metadata: { ambientMentions: topAmbient.map(([keyword, count]) => ({ keyword, count })) },
  });

  // 20. Funil Descoberta → Visita → Avaliação → Retorno
  const [totalVisitors] = await db
    .select({ count: sql<number>`COUNT(DISTINCT userId)` })
    .from(ratings)
    .where(eq(ratings.establishmentId, establishmentId));

  const [totalRatingsCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(ratings)
    .where(eq(ratings.establishmentId, establishmentId));

  insights.push({
    id: 20,
    tier: 4,
    title: "Funil de Conversão",
    description: "Visitantes únicos → Avaliações → Retornos",
    icon: "Filter",
    value: totalVisitors?.count ? `${totalVisitors.count} visitantes` : null,
    detail: `${totalVisitors?.count || 0} visitantes únicos, ${totalRatingsCount?.count || 0} avaliações, ${visitFrequency.length} retornaram`,
    metadata: {
      uniqueVisitors: Number(totalVisitors?.count || 0),
      totalRatings: Number(totalRatingsCount?.count || 0),
      returners: visitFrequency.length,
    },
  });

  return setCache(cacheKey, insights, CACHE_TTL);
}

// ─── Business Actions (AI-generated) ────────────────────────────────────────

export async function getBusinessActions(establishmentId: number): Promise<ActionData[]> {
  const cacheKey = `business_actions_${establishmentId}`;
  const cached = getCached<ActionData[]>(cacheKey);
  if (cached) return cached;

  const db = await getDb();
  if (!db) return [];

  // Gather data for LLM
  const insights = await getInsightsByTier(establishmentId);
  const healthScore = await getHealthScore(establishmentId);

  // Get "what missed for 10" texts
  const missedTexts = await db
    .select({ text: ratingItems.whatMissedForTen, itemName: ratingItems.itemName, score: ratingItems.score })
    .from(ratingItems)
    .innerJoin(ratings, eq(ratingItems.ratingId, ratings.id))
    .where(and(
      eq(ratings.establishmentId, establishmentId),
      sql`${ratingItems.whatMissedForTen} IS NOT NULL AND ${ratingItems.whatMissedForTen} != ''`
    ))
    .orderBy(desc(ratings.createdAt))
    .limit(30);

  // Get low score reasons
  const lowReasons = await db
    .select({ reasons: ratingItems.lowScoreReasons, itemName: ratingItems.itemName, score: ratingItems.score })
    .from(ratingItems)
    .innerJoin(ratings, eq(ratingItems.ratingId, ratings.id))
    .where(and(
      eq(ratings.establishmentId, establishmentId),
      sql`${ratingItems.lowScoreReasons} IS NOT NULL`,
      sql`${ratingItems.score} <= 6`
    ))
    .orderBy(desc(ratings.createdAt))
    .limit(30);

  // Get establishment info
  const [estab] = await db
    .select({ name: establishments.name, neighborhood: establishments.neighborhood })
    .from(establishments)
    .where(eq(establishments.id, establishmentId));

  // Build context for LLM
  const context = {
    establishmentName: estab?.name || "Estabelecimento",
    neighborhood: estab?.neighborhood || "",
    healthScore: healthScore.score,
    alerts: healthScore.alerts,
    topInsights: insights.filter(i => i.value !== null).slice(0, 10).map(i => ({ title: i.title, value: i.value, detail: i.detail })),
    missedForTen: missedTexts.map(m => ({ item: m.itemName, text: m.text, score: m.score })),
    lowScoreReasons: lowReasons.map(r => ({ item: r.itemName, reasons: r.reasons, score: r.score })),
  };

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Você é um consultor de marketing e operações para bares e restaurantes em São Paulo. 
Analise os dados do estabelecimento e gere 5-7 ações práticas e específicas que o dono pode implementar imediatamente.

REGRAS:
- Cada ação deve ter: prioridade (urgent/high/medium/low), título curto, descrição do problema detectado, impacto estimado, investimento estimado em R$, tempo para implementar, e 3-5 passos práticos
- Priorize ações de custo zero ou baixo custo primeiro
- Use linguagem simples e direta (o dono não é marketeiro)
- Baseie-se APENAS nos dados fornecidos, não invente problemas
- Se não houver dados suficientes para uma ação, não a inclua

Responda APENAS em JSON válido com o formato:
{
  "actions": [
    {
      "priority": "urgent|high|medium|low",
      "title": "Título curto da ação",
      "description": "Descrição do problema detectado com dados",
      "impact": "Impacto estimado (ex: +0.5 na nota, +R$500/mês)",
      "investmentEstimate": "R$ X ou Grátis",
      "timeEstimate": "X dias/semanas",
      "steps": ["Passo 1", "Passo 2", "Passo 3"],
      "source": "Nome do insight que gerou esta ação"
    }
  ]
}`
        },
        {
          role: "user",
          content: `Dados do estabelecimento "${context.establishmentName}" (${context.neighborhood}):

Health Score: ${context.healthScore}/100
Alertas: ${JSON.stringify(context.alerts)}

Insights principais:
${context.topInsights.map(i => `- ${i.title}: ${i.value} — ${i.detail}`).join("\n")}

"O que faltou para o 10?" (últimos feedbacks):
${context.missedForTen.map(m => `- ${m.item} (nota ${m.score}): "${m.text}"`).join("\n") || "Nenhum feedback disponível"}

Motivos de notas baixas (1-6):
${context.lowScoreReasons.map(r => `- ${r.item} (nota ${r.score}): ${JSON.stringify(r.reasons)}`).join("\n") || "Nenhum motivo registrado"}

Gere as ações práticas:`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "business_actions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              actions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    priority: { type: "string", enum: ["urgent", "high", "medium", "low"] },
                    title: { type: "string" },
                    description: { type: "string" },
                    impact: { type: "string" },
                    investmentEstimate: { type: "string" },
                    timeEstimate: { type: "string" },
                    steps: { type: "array", items: { type: "string" } },
                    source: { type: "string" },
                  },
                  required: ["priority", "title", "description", "impact", "investmentEstimate", "timeEstimate", "steps", "source"],
                  additionalProperties: false,
                },
              },
            },
            required: ["actions"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices?.[0]?.message?.content;
    if (content && typeof content === "string") {
      const parsed = JSON.parse(content);
      const actions: ActionData[] = (parsed.actions || []).map((a: any, i: number) => ({
        id: i + 1,
        priority: a.priority,
        title: a.title,
        description: a.description,
        impact: a.impact,
        investmentEstimate: a.investmentEstimate,
        timeEstimate: a.timeEstimate,
        steps: a.steps,
        source: a.source,
        status: "pending" as const,
      }));
      return setCache(cacheKey, actions, CACHE_TTL_ACTIONS);
    }
  } catch (error) {
    console.error("[BusinessActions] LLM error:", error);
  }

  // Fallback: generate basic actions from data without LLM
  const fallbackActions: ActionData[] = [];

  if (healthScore.alerts.length > 0) {
    for (const alert of healthScore.alerts.filter(a => a.type === "urgent" || a.type === "warning")) {
      fallbackActions.push({
        id: fallbackActions.length + 1,
        priority: alert.type === "urgent" ? "urgent" : "high",
        title: alert.title,
        description: alert.description,
        impact: "Melhoria na nota geral",
        investmentEstimate: "A definir",
        timeEstimate: "1-2 semanas",
        steps: ["Analisar os feedbacks detalhados", "Identificar a causa raiz", "Implementar correção"],
        source: "Health Score Alert",
        status: "pending",
      });
    }
  }

  return setCache(cacheKey, fallbackActions, CACHE_TTL_ACTIONS);
}

// ─── Full Business Insights ─────────────────────────────────────────────────

export async function getFullBusinessInsights(userId: number, establishmentId: number): Promise<BusinessInsightsFullData> {
  const plan = await getBusinessPlan(userId, establishmentId);
  const healthScore = await getHealthScore(establishmentId);
  const insights = await getInsightsByTier(establishmentId);
  const actions = await getBusinessActions(establishmentId);

  return { healthScore, insights, actions, plan };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
