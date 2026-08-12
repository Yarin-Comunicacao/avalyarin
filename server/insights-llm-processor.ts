/**
 * Insights LLM Processor — Extracts patterns, themes, and sentiment from user feedback
 * 
 * Processes:
 * - "O que faltou para o 10?" (whatMissedForTen) texts
 * - Item comments (ratingItems.comment)
 * - Low score reasons (ratingItems.lowScoreReasons)
 * 
 * Outputs:
 * - Recurring themes/patterns
 * - Sentiment analysis per item/category
 * - Actionable recommendations
 * - Word cloud data
 */
import { getDb } from "./db";
import { ratings, ratingItems, establishments, menuItems } from "../drizzle/schema";
import { eq, sql, and, gte, desc, isNotNull } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

// ─── Cache ─────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const llmInsightsCache = new Map<string, CacheEntry<any>>();

function getCached<T>(key: string): T | null {
  const entry = llmInsightsCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    llmInsightsCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttlMs: number): T {
  llmInsightsCache.set(key, { data, expiresAt: Date.now() + ttlMs });
  return data;
}

const CACHE_TTL_LLM = 2 * 60 * 60 * 1000; // 2 hours for LLM-processed insights

// ─── Types ─────────────────────────────────────────────────────────────────

export interface FeedbackPattern {
  theme: string;
  description: string;
  frequency: number; // how many feedbacks mention this
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  relatedItems: string[];
  urgency: "high" | "medium" | "low";
  suggestedAction: string;
}

export interface ItemSentiment {
  itemName: string;
  overallSentiment: "positive" | "negative" | "neutral" | "mixed";
  sentimentScore: number; // -1 to 1
  positiveThemes: string[];
  negativeThemes: string[];
  sampleQuotes: string[];
  improvementSuggestion: string | null;
}

export interface LLMInsightsResult {
  patterns: FeedbackPattern[];
  itemSentiments: ItemSentiment[];
  summary: string;
  topPositive: string[];
  topNegative: string[];
  wordCloud: Array<{ word: string; count: number; sentiment: "positive" | "negative" | "neutral" }>;
  generatedAt: number;
  totalFeedbacksAnalyzed: number;
}

// ─── Data Gathering ────────────────────────────────────────────────────────

interface RawFeedback {
  itemName: string;
  comment: string | null;
  whatMissed: string | null;
  lowScoreReasons: any;
  score: string;
  createdAt: Date | null;
}

async function gatherFeedbackData(establishmentId: number, dayRange: number = 90): Promise<RawFeedback[]> {
  const db = await getDb();
  if (!db) return [];

  const cutoff = new Date(Date.now() - dayRange * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      itemName: ratingItems.itemName,
      comment: ratingItems.comment,
      whatMissed: ratingItems.whatMissedForTen,
      lowScoreReasons: ratingItems.lowScoreReasons,
      score: ratingItems.score,
      createdAt: ratings.createdAt,
    })
    .from(ratingItems)
    .innerJoin(ratings, eq(ratingItems.ratingId, ratings.id))
    .where(and(
      eq(ratings.establishmentId, establishmentId),
      gte(ratings.createdAt, cutoff),
      sql`(
        (${ratingItems.comment} IS NOT NULL AND ${ratingItems.comment} != '') OR
        (${ratingItems.whatMissedForTen} IS NOT NULL AND ${ratingItems.whatMissedForTen} != '') OR
        (${ratingItems.lowScoreReasons} IS NOT NULL)
      )`
    ))
    .orderBy(desc(ratings.createdAt))
    .limit(200);

  return rows;
}

// ─── LLM Processing ───────────────────────────────────────────────────────

export async function processInsightsWithLLM(establishmentId: number): Promise<LLMInsightsResult> {
  const cacheKey = `llm_insights_${establishmentId}`;
  const cached = getCached<LLMInsightsResult>(cacheKey);
  if (cached) return cached;

  const feedbacks = await gatherFeedbackData(establishmentId);

  if (feedbacks.length < 3) {
    const emptyResult: LLMInsightsResult = {
      patterns: [],
      itemSentiments: [],
      summary: "Dados insuficientes para análise. São necessárias pelo menos 3 avaliações com comentários.",
      topPositive: [],
      topNegative: [],
      wordCloud: [],
      generatedAt: Date.now(),
      totalFeedbacksAnalyzed: feedbacks.length,
    };
    return setCache(cacheKey, emptyResult, 5 * 60 * 1000); // cache for 5 min only
  }

  // Get establishment info
  const db = await getDb();
  const [estab] = await db!
    .select({ name: establishments.name, neighborhood: establishments.neighborhood })
    .from(establishments)
    .where(eq(establishments.id, establishmentId));

  // Format feedbacks for LLM
  const feedbackTexts = feedbacks.map(f => {
    const parts: string[] = [];
    parts.push(`Item: ${f.itemName} (nota: ${f.score})`);
    if (f.comment) parts.push(`Comentário: "${f.comment}"`);
    if (f.whatMissed) parts.push(`Faltou para o 10: "${f.whatMissed}"`);
    if (f.lowScoreReasons) {
      const reasons = Array.isArray(f.lowScoreReasons) 
        ? f.lowScoreReasons.map((r: any) => typeof r === "string" ? r : r?.label || r?.value || "").filter(Boolean)
        : [];
      if (reasons.length > 0) parts.push(`Motivos nota baixa: ${reasons.join(", ")}`);
    }
    return parts.join(" | ");
  }).join("\n");

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Você é um analista de dados especializado em bares e restaurantes de São Paulo.
Analise os feedbacks de clientes e extraia:

1. PADRÕES RECORRENTES (temas que aparecem em múltiplos feedbacks)
2. SENTIMENTO POR ITEM (análise de sentimento para cada item mencionado)
3. RESUMO EXECUTIVO (1-2 frases sobre a situação geral)
4. TOP POSITIVOS (3-5 pontos fortes mais citados)
5. TOP NEGATIVOS (3-5 pontos fracos mais citados)
6. WORD CLOUD (15-20 palavras/expressões mais relevantes com sentimento)

REGRAS:
- Baseie-se APENAS nos dados fornecidos
- Agrupe feedbacks similares em temas (não liste cada feedback individualmente)
- Priorize padrões com maior frequência
- Sugira ações práticas e específicas
- Use linguagem profissional mas acessível
- Sentimento: positive/negative/neutral/mixed
- Urgência: high (afeta experiência imediata), medium (pode melhorar), low (nice-to-have)

Responda em JSON válido.`
        },
        {
          role: "user",
          content: `Estabelecimento: "${estab?.name || "Desconhecido"}" (${estab?.neighborhood || "SP"})
Total de feedbacks: ${feedbacks.length}

FEEDBACKS:
${feedbackTexts}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "llm_insights",
          strict: true,
          schema: {
            type: "object",
            properties: {
              patterns: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    theme: { type: "string", description: "Nome curto do tema/padrão" },
                    description: { type: "string", description: "Descrição detalhada do padrão" },
                    frequency: { type: "integer", description: "Quantos feedbacks mencionam este tema" },
                    sentiment: { type: "string", enum: ["positive", "negative", "neutral", "mixed"] },
                    relatedItems: { type: "array", items: { type: "string" }, description: "Itens do cardápio relacionados" },
                    urgency: { type: "string", enum: ["high", "medium", "low"] },
                    suggestedAction: { type: "string", description: "Ação prática sugerida" },
                  },
                  required: ["theme", "description", "frequency", "sentiment", "relatedItems", "urgency", "suggestedAction"],
                  additionalProperties: false,
                },
              },
              itemSentiments: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    itemName: { type: "string" },
                    overallSentiment: { type: "string", enum: ["positive", "negative", "neutral", "mixed"] },
                    sentimentScore: { type: "number", description: "-1 (muito negativo) a 1 (muito positivo)" },
                    positiveThemes: { type: "array", items: { type: "string" } },
                    negativeThemes: { type: "array", items: { type: "string" } },
                    sampleQuotes: { type: "array", items: { type: "string" }, description: "Até 3 citações representativas" },
                    improvementSuggestion: { type: ["string", "null"], description: "Sugestão de melhoria ou null se positivo" },
                  },
                  required: ["itemName", "overallSentiment", "sentimentScore", "positiveThemes", "negativeThemes", "sampleQuotes", "improvementSuggestion"],
                  additionalProperties: false,
                },
              },
              summary: { type: "string", description: "Resumo executivo de 1-2 frases" },
              topPositive: { type: "array", items: { type: "string" }, description: "3-5 pontos fortes" },
              topNegative: { type: "array", items: { type: "string" }, description: "3-5 pontos fracos" },
              wordCloud: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    word: { type: "string" },
                    count: { type: "integer" },
                    sentiment: { type: "string", enum: ["positive", "negative", "neutral"] },
                  },
                  required: ["word", "count", "sentiment"],
                  additionalProperties: false,
                },
              },
            },
            required: ["patterns", "itemSentiments", "summary", "topPositive", "topNegative", "wordCloud"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices?.[0]?.message?.content;
    if (content && typeof content === "string") {
      const parsed = JSON.parse(content);
      const result: LLMInsightsResult = {
        patterns: parsed.patterns || [],
        itemSentiments: parsed.itemSentiments || [],
        summary: parsed.summary || "",
        topPositive: parsed.topPositive || [],
        topNegative: parsed.topNegative || [],
        wordCloud: parsed.wordCloud || [],
        generatedAt: Date.now(),
        totalFeedbacksAnalyzed: feedbacks.length,
      };
      return setCache(cacheKey, result, CACHE_TTL_LLM);
    }
  } catch (error) {
    console.error("[InsightsLLM] Error processing insights:", error);
  }

  // Fallback: basic text analysis without LLM
  return setCache(cacheKey, generateFallbackInsights(feedbacks), CACHE_TTL_LLM);
}

// ─── Fallback (no LLM) ────────────────────────────────────────────────────

function generateFallbackInsights(feedbacks: RawFeedback[]): LLMInsightsResult {
  // Simple word frequency analysis
  const wordCounts: Record<string, { count: number; scores: number[] }> = {};
  const itemScores: Record<string, { scores: number[]; comments: string[] }> = {};

  for (const f of feedbacks) {
    // Track item scores
    if (!itemScores[f.itemName]) itemScores[f.itemName] = { scores: [], comments: [] };
    itemScores[f.itemName].scores.push(Number(f.score));

    const text = [f.comment, f.whatMissed].filter(Boolean).join(" ");
    if (text) {
      itemScores[f.itemName].comments.push(text);
      // Simple word extraction
      const words = text.toLowerCase()
        .replace(/[^\wáàâãéèêíìîóòôõúùûç\s]/g, "")
        .split(/\s+/)
        .filter(w => w.length > 3);
      for (const w of words) {
        if (!wordCounts[w]) wordCounts[w] = { count: 0, scores: [] };
        wordCounts[w].count++;
        wordCounts[w].scores.push(Number(f.score));
      }
    }
  }

  // Generate word cloud from top words
  const wordCloud = Object.entries(wordCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20)
    .map(([word, data]) => {
      const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
      return {
        word,
        count: data.count,
        sentiment: avgScore >= 7 ? "positive" as const : avgScore <= 4 ? "negative" as const : "neutral" as const,
      };
    });

  // Generate item sentiments
  const itemSentiments: ItemSentiment[] = Object.entries(itemScores)
    .filter(([_, data]) => data.scores.length >= 2)
    .map(([itemName, data]) => {
      const avg = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
      const sentiment = avg >= 8 ? "positive" : avg <= 5 ? "negative" : avg >= 6 ? "neutral" : "mixed";
      return {
        itemName,
        overallSentiment: sentiment as any,
        sentimentScore: (avg - 5) / 5, // normalize to -1 to 1
        positiveThemes: [],
        negativeThemes: [],
        sampleQuotes: data.comments.slice(0, 3),
        improvementSuggestion: avg < 7 ? "Analisar feedbacks para identificar melhorias" : null,
      };
    })
    .sort((a, b) => a.sentimentScore - b.sentimentScore)
    .slice(0, 10);

  return {
    patterns: [],
    itemSentiments,
    summary: `Análise básica de ${feedbacks.length} feedbacks. Para insights detalhados com IA, aguarde processamento.`,
    topPositive: [],
    topNegative: [],
    wordCloud,
    generatedAt: Date.now(),
    totalFeedbacksAnalyzed: feedbacks.length,
  };
}

// ─── Platform-wide Pattern Analysis (Admin) ───────────────────────────────

export interface PlatformInsights {
  totalFeedbacks: number;
  topPatterns: Array<{ theme: string; count: number; avgScore: number }>;
  categoryTrends: Array<{ category: string; avgSentiment: number; feedbackCount: number }>;
  recentAlerts: Array<{ establishmentName: string; issue: string; severity: "high" | "medium" | "low" }>;
  generatedAt: number;
}

export async function getPlatformInsights(): Promise<PlatformInsights> {
  const cacheKey = "platform_insights";
  const cached = getCached<PlatformInsights>(cacheKey);
  if (cached) return cached;

  const db = await getDb();
  if (!db) return { totalFeedbacks: 0, topPatterns: [], categoryTrends: [], recentAlerts: [], generatedAt: Date.now() };

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Count total feedbacks with text
  const [totalResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(ratingItems)
    .innerJoin(ratings, eq(ratingItems.ratingId, ratings.id))
    .where(and(
      gte(ratings.createdAt, thirtyDaysAgo),
      sql`(
        (${ratingItems.comment} IS NOT NULL AND ${ratingItems.comment} != '') OR
        (${ratingItems.whatMissedForTen} IS NOT NULL AND ${ratingItems.whatMissedForTen} != '')
      )`
    ));

  // Get low-scoring establishments (potential alerts)
  const lowScoreEstabs = await db
    .select({
      estabName: establishments.name,
      avgScore: sql<number>`AVG(CAST(${ratingItems.score} AS DECIMAL(5,2)))`,
      feedbackCount: sql<number>`COUNT(*)`,
    })
    .from(ratingItems)
    .innerJoin(ratings, eq(ratingItems.ratingId, ratings.id))
    .innerJoin(establishments, eq(ratings.establishmentId, establishments.id))
    .where(and(
      gte(ratings.createdAt, thirtyDaysAgo),
      sql`CAST(${ratingItems.score} AS DECIMAL(5,2)) <= 4`
    ))
    .groupBy(establishments.id, establishments.name)
    .having(sql`COUNT(*) >= 3`)
    .orderBy(sql`AVG(CAST(${ratingItems.score} AS DECIMAL(5,2))) ASC`)
    .limit(5);

  const recentAlerts = lowScoreEstabs.map((e: any) => ({
    establishmentName: e.estabName || "Desconhecido",
    issue: `Nota média ${Number(e.avgScore).toFixed(1)} em ${e.feedbackCount} avaliações recentes`,
    severity: Number(e.avgScore) <= 3 ? "high" as const : "medium" as const,
  }));

  // Get most common low-score reasons across platform
  const platformReasons = await db
    .select({ reasons: ratingItems.lowScoreReasons })
    .from(ratingItems)
    .innerJoin(ratings, eq(ratingItems.ratingId, ratings.id))
    .where(and(
      gte(ratings.createdAt, thirtyDaysAgo),
      sql`${ratingItems.lowScoreReasons} IS NOT NULL`
    ))
    .limit(500);

  const reasonCounts: Record<string, { count: number; scores: number[] }> = {};
  for (const row of platformReasons) {
    if (row.reasons && Array.isArray(row.reasons)) {
      for (const r of row.reasons as any[]) {
        const label = typeof r === "string" ? r : r?.label || r?.value || "";
        if (label) {
          if (!reasonCounts[label]) reasonCounts[label] = { count: 0, scores: [] };
          reasonCounts[label].count++;
        }
      }
    }
  }

  const topPatterns = Object.entries(reasonCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([theme, data]) => ({
      theme,
      count: data.count,
      avgScore: 0, // not tracked per-reason
    }));

  const result: PlatformInsights = {
    totalFeedbacks: Number(totalResult?.count || 0),
    topPatterns,
    categoryTrends: [],
    recentAlerts,
    generatedAt: Date.now(),
  };

  return setCache(cacheKey, result, 30 * 60 * 1000); // 30 min cache
}


// ─── Word Cloud by Score Range ────────────────────────────────────────────

export interface WordCloudItem {
  word: string;
  count: number;
  sentiment: "positive" | "negative" | "neutral";
}

export interface WordCloudByRange {
  high: WordCloudItem[]; // notas 7-10
  low: WordCloudItem[];  // notas 1-6
  highTotal: number;     // total de feedbacks analisados (7-10)
  lowTotal: number;      // total de feedbacks analisados (1-6)
  generatedAt: number;
}

export async function getWordCloudByScoreRange(establishmentId: number): Promise<WordCloudByRange> {
  const cacheKey = `wordcloud_range_${establishmentId}`;
  const cached = getCached<WordCloudByRange>(cacheKey);
  if (cached) return cached;

  const db = await getDb();
  if (!db) return { high: [], low: [], highTotal: 0, lowTotal: 0, generatedAt: Date.now() };

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  // Fetch all feedback texts with their scores
  const rows = await db
    .select({
      comment: ratingItems.comment,
      whatMissed: ratingItems.whatMissedForTen,
      score: ratingItems.score,
      lowScoreReasons: ratingItems.lowScoreReasons,
    })
    .from(ratingItems)
    .innerJoin(ratings, eq(ratingItems.ratingId, ratings.id))
    .where(and(
      eq(ratings.establishmentId, establishmentId),
      gte(ratings.createdAt, ninetyDaysAgo),
      sql`(
        (${ratingItems.comment} IS NOT NULL AND ${ratingItems.comment} != '') OR
        (${ratingItems.whatMissedForTen} IS NOT NULL AND ${ratingItems.whatMissedForTen} != '') OR
        (${ratingItems.lowScoreReasons} IS NOT NULL)
      )`
    ))
    .orderBy(desc(ratings.createdAt))
    .limit(500);

  // Separate by score range
  const highTexts: string[] = [];
  const lowTexts: string[] = [];

  for (const row of rows) {
    const score = Number(row.score);
    const texts: string[] = [];
    if (row.comment) texts.push(row.comment);
    if (row.whatMissed) texts.push(row.whatMissed);
    if (row.lowScoreReasons && Array.isArray(row.lowScoreReasons)) {
      for (const r of row.lowScoreReasons as any[]) {
        const label = typeof r === "string" ? r : r?.label || r?.value || "";
        if (label) texts.push(label);
      }
    }

    if (score >= 7) {
      highTexts.push(...texts);
    } else {
      lowTexts.push(...texts);
    }
  }

  // Process word frequencies
  const highCloud = extractWordCloud(highTexts, "high");
  const lowCloud = extractWordCloud(lowTexts, "low");

  const result: WordCloudByRange = {
    high: highCloud,
    low: lowCloud,
    highTotal: highTexts.length,
    lowTotal: lowTexts.length,
    generatedAt: Date.now(),
  };

  return setCache(cacheKey, result, CACHE_TTL_LLM);
}

// Stop words in Portuguese to filter out
const STOP_WORDS = new Set([
  "que", "para", "com", "uma", "por", "mais", "como", "mas", "foi", "ser",
  "tem", "seu", "sua", "são", "dos", "das", "nos", "nas", "esse", "essa",
  "este", "esta", "isso", "isto", "aqui", "ali", "ele", "ela", "eles", "elas",
  "não", "sim", "muito", "bem", "mal", "também", "ainda", "quando", "onde",
  "qual", "quais", "quem", "porque", "pois", "então", "assim", "cada", "todo",
  "toda", "todos", "todas", "outro", "outra", "outros", "outras", "mesmo",
  "mesma", "mesmos", "mesmas", "sobre", "entre", "depois", "antes", "desde",
  "até", "sem", "sob", "num", "numa", "uns", "umas", "pelo", "pela", "pelos",
  "pelas", "neste", "nesta", "nestes", "nestas", "nesse", "nessa", "nesses",
  "nessas", "naquele", "naquela", "deste", "desta", "desse", "dessa", "daquele",
  "daquela", "outra", "pouco", "pode", "poderia", "seria", "ter", "tinha",
  "foram", "está", "estão", "estava", "estavam", "falta", "acho",
]);

function extractWordCloud(texts: string[], range: "high" | "low"): WordCloudItem[] {
  const wordCounts: Record<string, number> = {};

  for (const text of texts) {
    // Tokenize: split by spaces and punctuation, keep only meaningful words
    const words = text.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents for matching
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 3 && !STOP_WORDS.has(w));

    // Also extract bigrams (2-word phrases) for more meaningful results
    const originalWords = text.toLowerCase()
      .replace(/[^\wáàâãéèêíìîóòôõúùûç\s]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 2);

    for (const w of words) {
      wordCounts[w] = (wordCounts[w] || 0) + 1;
    }

    // Bigrams
    for (let i = 0; i < originalWords.length - 1; i++) {
      const bigram = `${originalWords[i]} ${originalWords[i + 1]}`;
      if (bigram.length > 6 && !STOP_WORDS.has(originalWords[i]) && !STOP_WORDS.has(originalWords[i + 1])) {
        wordCounts[bigram] = (wordCounts[bigram] || 0) + 1;
      }
    }
  }

  // Sort by frequency and take top 25
  const sorted = Object.entries(wordCounts)
    .filter(([_, count]) => count >= 2) // minimum 2 mentions
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25);

  // Assign sentiment based on range context
  return sorted.map(([word, count]) => ({
    word,
    count,
    sentiment: range === "high" ? "positive" : "negative",
  }));
}
