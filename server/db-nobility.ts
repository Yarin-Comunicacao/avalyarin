/**
 * Insígnias System (Nobility Badges)
 * 
 * Three types of insígnias:
 * 1. By Category: 52 ratings + 15 unique establishments in rolling 12 months
 * 2. By Neighborhood: 104 ratings + 30 unique establishments in rolling 12 months
 * 3. By Establishment: 52 ratings in rolling 12 months
 * 
 * Progression: Barão → Visconde → Conde → Marquês → Duque → Príncipe → Rei
 */

import { drizzle } from "drizzle-orm/mysql2";
import { sql, eq, and, gte, count, countDistinct } from "drizzle-orm";
import { ratings, establishments } from "../drizzle/schema";

// Lazy DB import
let _db: ReturnType<typeof drizzle> | null = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    _db = drizzle(process.env.DATABASE_URL);
  }
  return _db;
}

// ==================== CONSTANTS ====================

export const NOBILITY_TITLES = [
  { level: 1, male: "Barão", female: "Baronesa", neutral: "Barão" },
  { level: 2, male: "Visconde", female: "Viscondessa", neutral: "Visconde" },
  { level: 3, male: "Conde", female: "Condessa", neutral: "Conde" },
  { level: 4, male: "Marquês", female: "Marquesa", neutral: "Marquês" },
  { level: 5, male: "Duque", female: "Duquesa", neutral: "Duque" },
  { level: 6, male: "Príncipe", female: "Princesa", neutral: "Príncipe" },
  { level: 7, male: "Rei", female: "Rainha", neutral: "Rei" },
] as const;

// Category thresholds: { ratings needed, unique establishments needed }
export const CATEGORY_THRESHOLDS = [
  { level: 1, ratings: 3, uniqueEstablishments: 2 },
  { level: 2, ratings: 7, uniqueEstablishments: 4 },
  { level: 3, ratings: 13, uniqueEstablishments: 6 },
  { level: 4, ratings: 21, uniqueEstablishments: 9 },
  { level: 5, ratings: 31, uniqueEstablishments: 11 },
  { level: 6, ratings: 42, uniqueEstablishments: 13 },
  { level: 7, ratings: 52, uniqueEstablishments: 15 },
] as const;

// Neighborhood thresholds: { ratings needed, unique establishments needed }
export const NEIGHBORHOOD_THRESHOLDS = [
  { level: 1, ratings: 5, uniqueEstablishments: 3 },
  { level: 2, ratings: 14, uniqueEstablishments: 6 },
  { level: 3, ratings: 26, uniqueEstablishments: 10 },
  { level: 4, ratings: 42, uniqueEstablishments: 15 },
  { level: 5, ratings: 60, uniqueEstablishments: 20 },
  { level: 6, ratings: 82, uniqueEstablishments: 25 },
  { level: 7, ratings: 104, uniqueEstablishments: 30 },
] as const;

// Establishment thresholds: only ratings needed (loyalty badge)
export const ESTABLISHMENT_THRESHOLDS = [
  { level: 1, ratings: 3 },
  { level: 2, ratings: 7 },
  { level: 3, ratings: 13 },
  { level: 4, ratings: 21 },
  { level: 5, ratings: 31 },
  { level: 6, ratings: 42 },
  { level: 7, ratings: 52 },
] as const;

// Eligible neighborhoods (100+ establishments)
export const ELIGIBLE_NEIGHBORHOODS = [
  "Pinheiros", "Moema", "Bela Vista", "Ipiranga", "Liberdade",
  "Consolação", "Perdizes", "República", "Jardim Paulista", "Campo Belo",
  "Itaim Bibi", "Bom Retiro", "Cambuci", "Lapa", "Barra Funda",
  "Saúde", "Santa Cecília", "Vila Madalena", "Sé", "Vila Mariana",
];

// Neighborhood grouping (aliases that count together)
export const NEIGHBORHOOD_ALIASES: Record<string, string> = {
  "Alto de Pinheiros": "Pinheiros",
  "Vila Madalena/Sumarezinho": "Vila Madalena",
};

// ==================== SPECIAL NEIGHBORHOOD INSIGNIAS ====================

/**
 * Special neighborhood insígnias (achievement-based, not progression-based)
 * These are earned by reaching certain nobility levels across multiple neighborhoods.
 * Format: "Desbravador de Pinheiros", "Cartógrafo do Butantã", "Embaixador da Vila Mariana"
 */
export const SPECIAL_NEIGHBORHOOD_INSIGNIAS = [
  {
    id: "desbravador",
    male: "Desbravador",
    female: "Desbravadora",
    neutral: "Desbravador",
    requirement: "Atingir Barão em 10 bairros diferentes",
    description: "Conhece São Paulo como poucos. Já explorou 10 bairros.",
    check: (neighborhoodBadges: NobilityBadge[]) => neighborhoodBadges.filter(b => b.level >= 1).length >= 10,
  },
  {
    id: "cartografo",
    male: "Cartógrafo Gastronômico",
    female: "Cartógrafa Gastronômica",
    neutral: "Cartógrafo Gastronômico",
    requirement: "Atingir Conde em 5 bairros diferentes",
    description: "Mapeou a gastronomia de 5 regiões de SP.",
    check: (neighborhoodBadges: NobilityBadge[]) => neighborhoodBadges.filter(b => b.level >= 3).length >= 5,
  },
  {
    id: "embaixador",
    male: "Embaixador",
    female: "Embaixadora",
    neutral: "Embaixador",
    requirement: "Atingir Duque em 3 bairros diferentes",
    description: "Referência gastronômica em 3 bairros. Ninguém conhece esses cantos como você.",
    check: (neighborhoodBadges: NobilityBadge[]) => neighborhoodBadges.filter(b => b.level >= 5).length >= 3,
  },
  {
    id: "lenda_urbana",
    male: "Lenda Urbana",
    female: "Lenda Urbana",
    neutral: "Lenda Urbana",
    requirement: "Atingir Duque em 10 bairros diferentes",
    description: "Domínio absoluto da gastronomia paulistana. Uma lenda viva.",
    check: (neighborhoodBadges: NobilityBadge[]) => neighborhoodBadges.filter(b => b.level >= 5).length >= 10,
  },
  {
    id: "especialista_local",
    male: "Especialista Local",
    female: "Especialista Local",
    neutral: "Especialista Local",
    requirement: "Avaliar 5 categorias diferentes no mesmo bairro",
    description: "Conhece o bairro de ponta a ponta — do café da manhã ao último drink.",
    // This one requires a special check function (see getSpecialNeighborhoodInsignias)
    check: (_: NobilityBadge[]) => false, // handled separately
  },
] as const;

/**
 * Preposition helper for neighborhood names.
 * "de Pinheiros", "do Butantã", "da Vila Mariana", "da Lapa"
 */
export function getNeighborhoodPreposition(neighborhood: string): string {
  // Neighborhoods that use "do" (masculine with article)
  const doNeighborhoods = ["Butantã", "Cambuci", "Ipiranga"];
  // Neighborhoods that use "da" (feminine with article)
  const daNeighborhoods = [
    "Vila Madalena", "Vila Mariana", "Bela Vista", "Barra Funda",
    "Lapa", "Consolação", "Liberdade", "República", "Saúde",
    "Santa Cecília", "Sé",
  ];
  
  if (doNeighborhoods.includes(neighborhood)) return `do ${neighborhood}`;
  if (daNeighborhoods.includes(neighborhood)) return `da ${neighborhood}`;
  return `de ${neighborhood}`;
}

// ==================== TYPES ====================

export interface NobilityBadge {
  type: "category" | "neighborhood" | "establishment";
  targetId: number | string; // categoryId, neighborhood name, or establishmentId
  targetName: string;
  level: number;
  titleMale: string;
  titleFemale: string;
  titleNeutral: string;
  ratingsCount: number;
  uniqueEstablishments: number;
  nextLevel: {
    level: number;
    ratingsNeeded: number;
    uniqueEstablishmentsNeeded: number;
    ratingsRemaining: number;
    uniqueEstablishmentsRemaining: number;
  } | null;
}

export interface SpecialInsignia {
  id: string;
  titleMale: string;
  titleFemale: string;
  titleNeutral: string;
  requirement: string;
  description: string;
  earned: boolean;
  neighborhoods: string[]; // which neighborhoods contributed to earning this
}

export interface NobilitySummary {
  categoryBadges: NobilityBadge[];
  neighborhoodBadges: NobilityBadge[];
  establishmentBadges: NobilityBadge[];
  specialInsignias: SpecialInsignia[];
  highestTitle: { type: string; level: number; title: string; targetName: string } | null;
}

// ==================== HELPER FUNCTIONS ====================

function calculateLevel(
  ratingsCount: number,
  uniqueEstablishments: number,
  thresholds: readonly { level: number; ratings: number; uniqueEstablishments?: number }[]
): number {
  let currentLevel = 0;
  for (const threshold of thresholds) {
    if (ratingsCount >= threshold.ratings) {
      if (threshold.uniqueEstablishments !== undefined) {
        if (uniqueEstablishments >= threshold.uniqueEstablishments) {
          currentLevel = threshold.level;
        }
      } else {
        currentLevel = threshold.level;
      }
    }
  }
  return currentLevel;
}

function getNextLevelInfo(
  currentLevel: number,
  ratingsCount: number,
  uniqueEstablishments: number,
  thresholds: readonly { level: number; ratings: number; uniqueEstablishments?: number }[]
) {
  if (currentLevel >= 7) return null;
  const nextThreshold = thresholds.find(t => t.level === currentLevel + 1);
  if (!nextThreshold) return null;
  return {
    level: nextThreshold.level,
    ratingsNeeded: nextThreshold.ratings,
    uniqueEstablishmentsNeeded: nextThreshold.uniqueEstablishments ?? 0,
    ratingsRemaining: Math.max(0, nextThreshold.ratings - ratingsCount),
    uniqueEstablishmentsRemaining: Math.max(0, (nextThreshold.uniqueEstablishments ?? 0) - uniqueEstablishments),
  };
}

function resolveNeighborhood(neighborhood: string): string {
  return NEIGHBORHOOD_ALIASES[neighborhood] || neighborhood;
}

// ==================== QUERY FUNCTIONS ====================

/**
 * Get all category nobility badges for a user (rolling 12 months)
 */
export async function getUserCategoryBadges(userId: number): Promise<NobilityBadge[]> {
  const db = await getDb();
  if (!db) return [];

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

  // Get ratings count and unique establishments per category in last 12 months
  const results = await db.execute(sql`
    SELECT 
      e.categoryId,
      c.name as categoryName,
      COUNT(r.id) as ratingsCount,
      COUNT(DISTINCT r.establishmentId) as uniqueEstablishments
    FROM ratings r
    JOIN establishments e ON e.id = r.establishmentId
    JOIN categories c ON c.id = e.categoryId
    WHERE r.userId = ${userId}
      AND COALESCE(r.visitDate, r.createdAt) >= ${twelveMonthsAgo}
    GROUP BY e.categoryId, c.name
    HAVING COUNT(r.id) >= 3
    ORDER BY COUNT(r.id) DESC
  `);

  const badges: NobilityBadge[] = [];
  const rows = (results as any)[0] || results;

  for (const row of rows as any[]) {
    const ratingsCount = Number(row.ratingsCount);
    const uniqueEst = Number(row.uniqueEstablishments);
    const level = calculateLevel(ratingsCount, uniqueEst, CATEGORY_THRESHOLDS);

    if (level > 0) {
      const title = NOBILITY_TITLES[level - 1];
      badges.push({
        type: "category",
        targetId: Number(row.categoryId),
        targetName: row.categoryName,
        level,
        titleMale: title.male,
        titleFemale: title.female,
        titleNeutral: title.neutral,
        ratingsCount,
        uniqueEstablishments: uniqueEst,
        nextLevel: getNextLevelInfo(level, ratingsCount, uniqueEst, CATEGORY_THRESHOLDS),
      });
    }
  }

  return badges;
}

/**
 * Get all neighborhood nobility badges for a user (rolling 12 months)
 */
export async function getUserNeighborhoodBadges(userId: number): Promise<NobilityBadge[]> {
  const db = await getDb();
  if (!db) return [];

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

  // Get ratings count and unique establishments per neighborhood in last 12 months
  const results = await db.execute(sql`
    SELECT 
      e.neighborhood,
      COUNT(r.id) as ratingsCount,
      COUNT(DISTINCT r.establishmentId) as uniqueEstablishments
    FROM ratings r
    JOIN establishments e ON e.id = r.establishmentId
    WHERE r.userId = ${userId}
      AND COALESCE(r.visitDate, r.createdAt) >= ${twelveMonthsAgo}
      AND e.neighborhood IS NOT NULL
      AND e.neighborhood != ''
    GROUP BY e.neighborhood
    ORDER BY COUNT(r.id) DESC
  `);

  // Aggregate by resolved neighborhood (handle aliases)
  const neighborhoodMap = new Map<string, { ratingsCount: number; uniqueEstablishments: number }>();
  const rows = (results as any)[0] || results;

  for (const row of rows as any[]) {
    const resolved = resolveNeighborhood(row.neighborhood);
    if (!ELIGIBLE_NEIGHBORHOODS.includes(resolved)) continue;

    const existing = neighborhoodMap.get(resolved) || { ratingsCount: 0, uniqueEstablishments: 0 };
    existing.ratingsCount += Number(row.ratingsCount);
    existing.uniqueEstablishments += Number(row.uniqueEstablishments);
    neighborhoodMap.set(resolved, existing);
  }

  const badges: NobilityBadge[] = [];

  for (const [neighborhood, data] of Array.from(neighborhoodMap.entries())) {
    const level = calculateLevel(data.ratingsCount, data.uniqueEstablishments, NEIGHBORHOOD_THRESHOLDS);

    if (level > 0) {
      const title = NOBILITY_TITLES[level - 1];
      badges.push({
        type: "neighborhood",
        targetId: neighborhood,
        targetName: neighborhood,
        level,
        titleMale: title.male,
        titleFemale: title.female,
        titleNeutral: title.neutral,
        ratingsCount: data.ratingsCount,
        uniqueEstablishments: data.uniqueEstablishments,
        nextLevel: getNextLevelInfo(level, data.ratingsCount, data.uniqueEstablishments, NEIGHBORHOOD_THRESHOLDS),
      });
    }
  }

  return badges;
}

/**
 * Get all establishment nobility badges for a user (rolling 12 months)
 */
export async function getUserEstablishmentBadges(userId: number): Promise<NobilityBadge[]> {
  const db = await getDb();
  if (!db) return [];

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

  // Get ratings count per establishment in last 12 months
  const results = await db.execute(sql`
    SELECT 
      r.establishmentId,
      e.name as establishmentName,
      COUNT(r.id) as ratingsCount
    FROM ratings r
    JOIN establishments e ON e.id = r.establishmentId
    WHERE r.userId = ${userId}
      AND COALESCE(r.visitDate, r.createdAt) >= ${twelveMonthsAgo}
    GROUP BY r.establishmentId, e.name
    HAVING COUNT(r.id) >= 3
    ORDER BY COUNT(r.id) DESC
  `);

  const badges: NobilityBadge[] = [];
  const rows = (results as any)[0] || results;

  for (const row of rows as any[]) {
    const ratingsCount = Number(row.ratingsCount);
    const level = calculateLevel(ratingsCount, 0, ESTABLISHMENT_THRESHOLDS.map(t => ({ ...t, uniqueEstablishments: undefined })));

    if (level > 0) {
      const title = NOBILITY_TITLES[level - 1];
      badges.push({
        type: "establishment",
        targetId: Number(row.establishmentId),
        targetName: row.establishmentName,
        level,
        titleMale: title.male,
        titleFemale: title.female,
        titleNeutral: title.neutral,
        ratingsCount,
        uniqueEstablishments: 1,
        nextLevel: getNextLevelInfo(level, ratingsCount, 0, ESTABLISHMENT_THRESHOLDS.map(t => ({ ...t, uniqueEstablishments: undefined }))),
      });
    }
  }

  return badges;
}

/**
 * Check if user has evaluated 5+ categories in any single neighborhood
 */
async function checkEspecialistaLocal(userId: number): Promise<{ earned: boolean; neighborhoods: string[] }> {
  const db = await getDb();
  if (!db) return { earned: false, neighborhoods: [] };

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

  const results = await db.execute(sql`
    SELECT e.neighborhood, COUNT(DISTINCT e.categoryId) as catCount
    FROM ratings r
    JOIN establishments e ON e.id = r.establishmentId
    WHERE r.userId = ${userId}
      AND COALESCE(r.visitDate, r.createdAt) >= ${twelveMonthsAgo}
      AND e.neighborhood IS NOT NULL
      AND e.neighborhood != ''
    GROUP BY e.neighborhood
    HAVING COUNT(DISTINCT e.categoryId) >= 5
  `);

  const rows = (results as any)[0] || results;
  const neighborhoods = (rows as any[]).map(r => resolveNeighborhood(r.neighborhood));
  const unique = Array.from(new Set(neighborhoods));
  return { earned: unique.length > 0, neighborhoods: unique };
}

/**
 * Get special neighborhood insígnias for a user.
 * Each insígnia title includes the neighborhood name with proper preposition.
 */
export async function getSpecialNeighborhoodInsignias(userId: number, neighborhoodBadges: NobilityBadge[]): Promise<SpecialInsignia[]> {
  const insignias: SpecialInsignia[] = [];

  for (const spec of SPECIAL_NEIGHBORHOOD_INSIGNIAS) {
    if (spec.id === "especialista_local") {
      // Special check for this one
      const result = await checkEspecialistaLocal(userId);
      insignias.push({
        id: spec.id,
        titleMale: result.earned ? `${spec.male} ${result.neighborhoods.map(n => getNeighborhoodPreposition(n)).join(", ")}` : spec.male,
        titleFemale: result.earned ? `${spec.female} ${result.neighborhoods.map(n => getNeighborhoodPreposition(n)).join(", ")}` : spec.female,
        titleNeutral: result.earned ? `${spec.neutral} ${result.neighborhoods.map(n => getNeighborhoodPreposition(n)).join(", ")}` : spec.neutral,
        requirement: spec.requirement,
        description: spec.description,
        earned: result.earned,
        neighborhoods: result.neighborhoods,
      });
    } else {
      const earned = spec.check(neighborhoodBadges);
      const qualifyingNeighborhoods = neighborhoodBadges
        .filter(b => {
          if (spec.id === "desbravador") return b.level >= 1;
          if (spec.id === "cartografo") return b.level >= 3;
          if (spec.id === "embaixador" || spec.id === "lenda_urbana") return b.level >= 5;
          return false;
        })
        .map(b => b.targetName);

      // For the title, use the first qualifying neighborhood as the "main" one
      const mainNeighborhood = qualifyingNeighborhoods[0];
      const preposition = mainNeighborhood ? getNeighborhoodPreposition(mainNeighborhood) : "de SP";

      insignias.push({
        id: spec.id,
        titleMale: `${spec.male} ${preposition}`,
        titleFemale: `${spec.female} ${preposition}`,
        titleNeutral: `${spec.neutral} ${preposition}`,
        requirement: spec.requirement,
        description: spec.description,
        earned,
        neighborhoods: qualifyingNeighborhoods,
      });
    }
  }

  return insignias;
}

/**
 * Get full nobility summary for a user
 */
export async function getUserNobilitySummary(userId: number): Promise<NobilitySummary> {
  const [categoryBadges, neighborhoodBadges, establishmentBadges] = await Promise.all([
    getUserCategoryBadges(userId),
    getUserNeighborhoodBadges(userId),
    getUserEstablishmentBadges(userId),
  ]);

  // Get special insignias based on neighborhood badges
  const specialInsignias = await getSpecialNeighborhoodInsignias(userId, neighborhoodBadges);

  // Find highest title across all badge types
  let highestTitle: NobilitySummary["highestTitle"] = null;
  const allBadges = [...categoryBadges, ...neighborhoodBadges, ...establishmentBadges];

  for (const badge of allBadges) {
    if (!highestTitle || badge.level > highestTitle.level) {
      highestTitle = {
        type: badge.type,
        level: badge.level,
        title: badge.titleMale, // Will be resolved by frontend based on user gender
        targetName: badge.targetName,
      };
    }
  }

  return {
    categoryBadges,
    neighborhoodBadges,
    establishmentBadges,
    specialInsignias,
    highestTitle,
  };
}

/**
 * Get nobility progress for a specific category
 */
export async function getCategoryNobilityProgress(userId: number, categoryId: number) {
  const db = await getDb();
  if (!db) return null;

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

  const results = await db.execute(sql`
    SELECT 
      COUNT(r.id) as ratingsCount,
      COUNT(DISTINCT r.establishmentId) as uniqueEstablishments
    FROM ratings r
    JOIN establishments e ON e.id = r.establishmentId
    WHERE r.userId = ${userId}
      AND e.categoryId = ${categoryId}
      AND COALESCE(r.visitDate, r.createdAt) >= ${twelveMonthsAgo}
  `);

  const rows = (results as any)[0] || results;
  const row = (rows as any[])[0];
  if (!row) return { level: 0, ratingsCount: 0, uniqueEstablishments: 0, nextLevel: getNextLevelInfo(0, 0, 0, CATEGORY_THRESHOLDS) };

  const ratingsCount = Number(row.ratingsCount);
  const uniqueEst = Number(row.uniqueEstablishments);
  const level = calculateLevel(ratingsCount, uniqueEst, CATEGORY_THRESHOLDS);

  return {
    level,
    ratingsCount,
    uniqueEstablishments: uniqueEst,
    nextLevel: getNextLevelInfo(level, ratingsCount, uniqueEst, CATEGORY_THRESHOLDS),
  };
}

/**
 * Get nobility progress for a specific neighborhood
 */
export async function getNeighborhoodNobilityProgress(userId: number, neighborhood: string) {
  const db = await getDb();
  if (!db) return null;

  const resolved = resolveNeighborhood(neighborhood);
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

  // Get all neighborhood variants that resolve to this one
  const variants = [resolved, ...Object.entries(NEIGHBORHOOD_ALIASES).filter(([_, v]) => v === resolved).map(([k]) => k)];

  const results = await db.execute(sql`
    SELECT 
      COUNT(r.id) as ratingsCount,
      COUNT(DISTINCT r.establishmentId) as uniqueEstablishments
    FROM ratings r
    JOIN establishments e ON e.id = r.establishmentId
    WHERE r.userId = ${userId}
      AND e.neighborhood IN (${sql.join(variants.map(v => sql`${v}`), sql`, `)})
      AND COALESCE(r.visitDate, r.createdAt) >= ${twelveMonthsAgo}
  `);

  const rows = (results as any)[0] || results;
  const row = (rows as any[])[0];
  if (!row) return { level: 0, ratingsCount: 0, uniqueEstablishments: 0, nextLevel: getNextLevelInfo(0, 0, 0, NEIGHBORHOOD_THRESHOLDS) };

  const ratingsCount = Number(row.ratingsCount);
  const uniqueEst = Number(row.uniqueEstablishments);
  const level = calculateLevel(ratingsCount, uniqueEst, NEIGHBORHOOD_THRESHOLDS);

  return {
    level,
    ratingsCount,
    uniqueEstablishments: uniqueEst,
    nextLevel: getNextLevelInfo(level, ratingsCount, uniqueEst, NEIGHBORHOOD_THRESHOLDS),
  };
}

/**
 * Get nobility progress for a specific establishment
 */
export async function getEstablishmentNobilityProgress(userId: number, establishmentId: number) {
  const db = await getDb();
  if (!db) return null;

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

  const results = await db.execute(sql`
    SELECT COUNT(r.id) as ratingsCount
    FROM ratings r
    WHERE r.userId = ${userId}
      AND r.establishmentId = ${establishmentId}
      AND COALESCE(r.visitDate, r.createdAt) >= ${twelveMonthsAgo}
  `);

  const rows = (results as any)[0] || results;
  const row = (rows as any[])[0];
  if (!row) return { level: 0, ratingsCount: 0, uniqueEstablishments: 1, nextLevel: getNextLevelInfo(0, 0, 0, ESTABLISHMENT_THRESHOLDS.map(t => ({ ...t, uniqueEstablishments: undefined }))) };

  const ratingsCount = Number(row.ratingsCount);
  const level = calculateLevel(ratingsCount, 0, ESTABLISHMENT_THRESHOLDS.map(t => ({ ...t, uniqueEstablishments: undefined })));

  return {
    level,
    ratingsCount,
    uniqueEstablishments: 1,
    nextLevel: getNextLevelInfo(level, ratingsCount, 0, ESTABLISHMENT_THRESHOLDS.map(t => ({ ...t, uniqueEstablishments: undefined }))),
  };
}
