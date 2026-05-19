/**
 * User Progression System
 * 
 * Points: Each rating earns weighted points based on age:
 *   - 0–12 months ago: 1.0 point
 *   - 12–24 months ago: 0.2 points
 *   - 24–36 months ago: 0.1 points
 *   - 36+ months ago: 0.025 points (personal record, never expires)
 * 
 * Levels: 16 levels with exponential point thresholds
 * AI Phrases: Personalized phrase generated via LLM when user levels up
 * 
 * Level 1 (Iniciante) is always the starting level.
 * The phrase is based on the categories the user has rated to reach that level.
 */

import { drizzle } from "drizzle-orm/mysql2";
import { sql, eq } from "drizzle-orm";
import { ratings, establishments, categories } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";

// Lazy DB import
let _db: ReturnType<typeof drizzle> | null = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    _db = drizzle(process.env.DATABASE_URL);
  }
  return _db;
}

// ==================== CONSTANTS ====================

/**
 * Point weight decay based on rating age
 */
export const POINT_WEIGHTS = [
  { maxMonths: 12, weight: 1.0 },   // 0–12 months: full value
  { maxMonths: 24, weight: 0.2 },   // 12–24 months: 20%
  { maxMonths: 36, weight: 0.1 },   // 24–36 months: 10%
  { maxMonths: Infinity, weight: 0.025 }, // 36+ months: 2.5% (never expires)
] as const;

/**
 * 16 Levels with point thresholds (weighted points)
 * Level 1: Iniciante (1 point) — first rating
 * Level 16: top tier — requires sustained high activity
 */
export const PROGRESSION_LEVELS = [
  { level: 1, name: "Iniciante", minPoints: 1, icon: "🔍" },
  { level: 2, name: "Explorador", minPoints: 3, icon: "🧭" },
  { level: 3, name: "Frequentador", minPoints: 6, icon: "🍻" },
  { level: 4, name: "Conhecedor", minPoints: 10, icon: "🎯" },
  { level: 5, name: "Avaliador", minPoints: 15, icon: "📝" },
  { level: 6, name: "Crítico", minPoints: 22, icon: "✍️" },
  { level: 7, name: "Especialista", minPoints: 30, icon: "🔬" },
  { level: 8, name: "Curador", minPoints: 40, icon: "🎨" },
  { level: 9, name: "Sommelier", minPoints: 55, icon: "🍷" },
  { level: 10, name: "Gastronomo", minPoints: 75, icon: "🍽️" },
  { level: 11, name: "Mestre", minPoints: 100, icon: "👨‍🍳" },
  { level: 12, name: "Embaixador", minPoints: 130, icon: "🏅" },
  { level: 13, name: "Autoridade", minPoints: 170, icon: "📖" },
  { level: 14, name: "Visionário", minPoints: 220, icon: "🔮" },
  { level: 15, name: "Lenda", minPoints: 280, icon: "🏆" },
  { level: 16, name: "Ícone", minPoints: 365, icon: "⭐" },
] as const;

// ==================== TYPES ====================

export interface UserProgression {
  userId: number;
  currentLevel: number;
  levelName: string;
  levelIcon: string;
  totalPointsWeighted: number; // weighted total (replaces totalPointsRolling)
  totalRatingsAllTime: number; // total raw count of all ratings ever
  nextLevel: {
    level: number;
    name: string;
    pointsNeeded: number;
    pointsRemaining: number;
    progressPercent: number;
  } | null;
  phrase: string | null; // AI-generated phrase for current level
  topCategories: { name: string; count: number }[];
}

export interface LevelUpResult {
  previousLevel: number;
  newLevel: number;
  phrase: string;
  levelName: string;
  levelIcon: string;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate the weight for a rating based on its age in months
 */
export function getPointWeight(ageInMonths: number): number {
  for (const tier of POINT_WEIGHTS) {
    if (ageInMonths < tier.maxMonths) {
      return tier.weight;
    }
  }
  return 0.025; // fallback
}

/**
 * Calculate level from weighted points
 */
export function calculateLevelFromPoints(points: number): number {
  let level = 0;
  for (const l of PROGRESSION_LEVELS) {
    if (points >= l.minPoints) {
      level = l.level;
    } else {
      break;
    }
  }
  return level;
}

/**
 * Get level info by level number
 */
export function getLevelInfo(level: number) {
  return PROGRESSION_LEVELS.find(l => l.level === level) || PROGRESSION_LEVELS[0];
}

/**
 * Get next level info
 */
export function getNextLevelInfo(currentLevel: number, currentPoints: number) {
  if (currentLevel >= 16) return null;
  const nextLevelData = PROGRESSION_LEVELS.find(l => l.level === currentLevel + 1);
  if (!nextLevelData) return null;
  
  const currentLevelData = PROGRESSION_LEVELS.find(l => l.level === currentLevel);
  const currentMin = currentLevelData?.minPoints || 0;
  const nextMin = nextLevelData.minPoints;
  const range = nextMin - currentMin;
  const progress = currentPoints - currentMin;
  
  return {
    level: nextLevelData.level,
    name: nextLevelData.name,
    pointsNeeded: nextMin,
    pointsRemaining: Math.max(0, Math.round((nextMin - currentPoints) * 10) / 10),
    progressPercent: range > 0 ? Math.min(100, Math.round((progress / range) * 100)) : 0,
  };
}

// ==================== QUERY FUNCTIONS ====================

/**
 * Get user's weighted point total using age-based decay.
 * Uses SQL to calculate months since each rating and apply weights.
 */
export async function getUserWeightedPoints(userId: number): Promise<{ weighted: number; totalCount: number }> {
  const db = await getDb();
  if (!db) return { weighted: 0, totalCount: 0 };

  // Calculate weighted points using CASE WHEN in SQL for efficiency
  const results = await db.execute(sql`
    SELECT 
      COUNT(id) as totalCount,
      SUM(
        CASE
          WHEN TIMESTAMPDIFF(MONTH, COALESCE(visitDate, createdAt), NOW()) < 12 THEN 1.0
          WHEN TIMESTAMPDIFF(MONTH, COALESCE(visitDate, createdAt), NOW()) < 24 THEN 0.2
          WHEN TIMESTAMPDIFF(MONTH, COALESCE(visitDate, createdAt), NOW()) < 36 THEN 0.1
          ELSE 0.025
        END
      ) as weightedPoints
    FROM ratings
    WHERE userId = ${userId}
  `);

  const rows = (results as any)[0] || results;
  const row = (rows as any[])[0];
  if (!row) return { weighted: 0, totalCount: 0 };
  
  return {
    weighted: Math.round(Number(row.weightedPoints || 0) * 100) / 100,
    totalCount: Number(row.totalCount || 0),
  };
}

/**
 * Get user's top categories (by weighted rating count)
 */
export async function getUserTopCategories(userId: number, limit = 5): Promise<{ name: string; count: number }[]> {
  const db = await getDb();
  if (!db) return [];

  const results = await db.execute(sql`
    SELECT c.name, COUNT(r.id) as cnt
    FROM ratings r
    JOIN establishments e ON e.id = r.establishmentId
    JOIN categories c ON c.id = e.categoryId
    WHERE r.userId = ${userId}
    GROUP BY c.name
    ORDER BY cnt DESC
    LIMIT ${limit}
  `);

  const rows = (results as any)[0] || results;
  return (rows as any[]).map(r => ({ name: r.name, count: Number(r.cnt) }));
}

/**
 * Get stored user level data (phrase, last known level)
 */
export async function getStoredUserLevel(userId: number): Promise<{ level: number; phrase: string | null; updatedAt: Date | null } | null> {
  const db = await getDb();
  if (!db) return null;

  const results = await db.execute(sql`
    SELECT level, phrase, updatedAt
    FROM user_levels
    WHERE userId = ${userId}
    LIMIT 1
  `);

  const rows = (results as any)[0] || results;
  const row = (rows as any[])[0];
  if (!row) return null;
  return { level: Number(row.level), phrase: row.phrase || null, updatedAt: row.updatedAt ? new Date(row.updatedAt) : null };
}

/**
 * Save/update user level and phrase
 */
export async function saveUserLevel(userId: number, level: number, phrase: string | null): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.execute(sql`
    INSERT INTO user_levels (userId, level, phrase, updatedAt)
    VALUES (${userId}, ${level}, ${phrase}, NOW())
    ON DUPLICATE KEY UPDATE level = ${level}, phrase = ${phrase}, updatedAt = NOW()
  `);
}

/**
 * Generate AI phrase for a level-up event
 */
export async function generateLevelUpPhrase(
  levelName: string,
  level: number,
  topCategories: { name: string; count: number }[]
): Promise<string> {
  const categoriesText = topCategories.length > 0
    ? topCategories.map(c => `${c.name} (${c.count} avaliações)`).join(", ")
    : "diversas categorias";

  try {
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Você é um escritor criativo para um app de avaliação de bares e restaurantes em São Paulo chamado Avalyarin. 
Gere uma frase curta (máximo 15 palavras) e criativa para celebrar a conquista de um novo nível de progressão do usuário.
A frase deve ser personalizada com base nas categorias de estabelecimentos que o usuário mais avaliou.
Use tom entusiasta, divertido e ligado à gastronomia/vida noturna paulistana.
Responda APENAS com a frase, sem aspas, sem explicações.`
        },
        {
          role: "user",
          content: `O usuário alcançou o nível ${level} "${levelName}". Suas categorias mais avaliadas são: ${categoriesText}. Gere uma frase de celebração personalizada.`
        }
      ],
    });

    const content = result.choices?.[0]?.message?.content;
    if (typeof content === "string" && content.trim().length > 0) {
      return content.trim().replace(/^["']|["']$/g, ""); // Remove quotes if any
    }
    return `Parabéns! Você alcançou o nível ${levelName}!`;
  } catch (error) {
    console.error("[Progression] Failed to generate phrase:", error);
    return `Parabéns! Você alcançou o nível ${levelName}!`;
  }
}

/**
 * Get full user progression (main function for the profile)
 */
export async function getUserProgression(userId: number): Promise<UserProgression> {
  const [pointsData, topCategories, storedLevel] = await Promise.all([
    getUserWeightedPoints(userId),
    getUserTopCategories(userId),
    getStoredUserLevel(userId),
  ]);

  const currentLevel = calculateLevelFromPoints(pointsData.weighted);
  const levelInfo = getLevelInfo(currentLevel);
  const nextLevel = getNextLevelInfo(currentLevel, pointsData.weighted);

  return {
    userId,
    currentLevel,
    levelName: levelInfo.name,
    levelIcon: levelInfo.icon,
    totalPointsWeighted: pointsData.weighted,
    totalRatingsAllTime: pointsData.totalCount,
    nextLevel,
    phrase: storedLevel?.phrase || null,
    topCategories,
  };
}

/**
 * Check and process level-up after a new rating is saved.
 * Returns LevelUpResult if user leveled up, null otherwise.
 */
export async function checkAndProcessLevelUp(userId: number): Promise<LevelUpResult | null> {
  const [pointsData, storedLevel, topCategories] = await Promise.all([
    getUserWeightedPoints(userId),
    getStoredUserLevel(userId),
    getUserTopCategories(userId),
  ]);

  const newLevel = calculateLevelFromPoints(pointsData.weighted);
  const previousLevel = storedLevel?.level || 0;

  // Only process if user actually leveled up
  if (newLevel <= previousLevel) {
    // If level went down (points decayed), update stored level but don't generate phrase
    if (newLevel < previousLevel) {
      await saveUserLevel(userId, newLevel, storedLevel?.phrase || null);
    }
    return null;
  }

  // User leveled up! Generate personalized phrase
  const levelInfo = getLevelInfo(newLevel);
  const phrase = await generateLevelUpPhrase(levelInfo.name, newLevel, topCategories);

  // Save new level and phrase
  await saveUserLevel(userId, newLevel, phrase);

  return {
    previousLevel,
    newLevel,
    phrase,
    levelName: levelInfo.name,
    levelIcon: levelInfo.icon,
  };
}
