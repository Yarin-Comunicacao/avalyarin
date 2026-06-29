/**
 * Smart Search with LLM — interprets natural language queries
 * and returns relevant establishments and menu items.
 * 
 * Strategy:
 * 1. Try standard LIKE search first (fast, no LLM cost)
 * 2. If no results or query looks like natural language, use LLM to interpret
 * 3. LLM extracts structured search terms (product, category, ambiance, neighborhood)
 * 4. Execute multiple targeted SQL queries with extracted terms
 * 5. Merge and rank results
 */

import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { establishments, menuItems, categories, establishmentCategories } from "../drizzle/schema";
import { like, and, or, eq, inArray, sql, not } from "drizzle-orm";

// Complete establishment filter (same as used in searchAll)
const completeEstablishmentFilter = eq(establishments.status, 'active');

interface SmartSearchResult {
  establishments: Array<{
    id: number;
    slug: string;
    name: string;
    neighborhood: string | null;
    rating: number | null;
    image: string | null;
    categoryName: string;
    matchReason: string;
  }>;
  menuItems: Array<{
    id: number;
    name: string;
    description: string | null;
    price: number | null;
    category: string | null;
    establishmentName: string;
    establishmentSlug: string;
    matchReason: string;
  }>;
  interpretation: string; // What the AI understood from the query
  isAiPowered: boolean;
}

interface LLMSearchTerms {
  interpretation: string;
  searchTerms: string[];
  categoryHints: string[];
  neighborhoodHints: string[];
  ambianceKeywords: string[];
}

/**
 * Use LLM to interpret a natural language query into structured search terms
 */
async function interpretQuery(query: string): Promise<LLMSearchTerms> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Você é um assistente de busca para um app de avaliação de bares e restaurantes em São Paulo.
O usuário vai digitar uma busca em linguagem natural. Sua tarefa é interpretar a intenção e extrair termos de busca.

REGRAS:
- Extraia nomes de produtos/bebidas/comidas mencionados (ex: "chopp brahma" → ["chopp", "brahma", "cerveja"])
- Identifique categorias de estabelecimento (ex: "pizzaria", "bar", "hamburgueria", "coquetelaria")
- Identifique bairros de SP se mencionados (ex: "Pinheiros", "Vila Madalena", "Itaim")
- Identifique palavras-chave de ambiente/experiência (ex: "cadeiras de praia" → ["praia", "ao ar livre", "descontraído"])
- Gere sinônimos e termos relacionados para ampliar a busca
- "perto de mim" não é um bairro, ignore essa parte

Responda APENAS em JSON válido com este formato:
{
  "interpretation": "frase curta explicando o que entendeu da busca",
  "searchTerms": ["termo1", "termo2", "termo3"],
  "categoryHints": ["categoria1"],
  "neighborhoodHints": ["bairro1"],
  "ambianceKeywords": ["palavra1", "palavra2"]
}`
        },
        {
          role: "user",
          content: query
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "search_interpretation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              interpretation: { type: "string", description: "Brief explanation of what was understood" },
              searchTerms: { type: "array", items: { type: "string" }, description: "Product/drink/food search terms" },
              categoryHints: { type: "array", items: { type: "string" }, description: "Category hints" },
              neighborhoodHints: { type: "array", items: { type: "string" }, description: "Neighborhood hints" },
              ambianceKeywords: { type: "array", items: { type: "string" }, description: "Ambiance/experience keywords" },
            },
            required: ["interpretation", "searchTerms", "categoryHints", "neighborhoodHints", "ambianceKeywords"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response?.choices?.[0]?.message?.content;
    if (!content) {
      return { interpretation: query, searchTerms: [query], categoryHints: [], neighborhoodHints: [], ambianceKeywords: [] };
    }

    const parsed = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
    return parsed as LLMSearchTerms;
  } catch (error) {
    console.error("[SmartSearch] LLM interpretation failed:", error);
    return { interpretation: query, searchTerms: [query], categoryHints: [], neighborhoodHints: [], ambianceKeywords: [] };
  }
}

/**
 * Search establishments by multiple terms (OR logic)
 */
async function searchEstablishmentsByTerms(terms: string[], neighborhoodHints: string[], categoryHints: string[]) {
  const db = await getDb();
  if (!db || terms.length === 0) return [];

  // Build OR conditions for name/description matching
  const nameConditions = terms.map(term => like(establishments.name, `%${term}%`));
  const neighborhoodConditions = neighborhoodHints.length > 0
    ? neighborhoodHints.map(n => like(establishments.neighborhood, `%${n}%`))
    : [];

  // Search by name
  const byName = await db.select({
    id: establishments.id,
    slug: establishments.slug,
    name: establishments.name,
    neighborhood: establishments.neighborhood,
    rating: establishments.rating,
    image: establishments.image,
  })
    .from(establishments)
    .where(and(
      or(...nameConditions),
      completeEstablishmentFilter
    ))
    .limit(10);

  // Search by neighborhood if hints provided
  let byNeighborhood: typeof byName = [];
  if (neighborhoodConditions.length > 0) {
    byNeighborhood = await db.select({
      id: establishments.id,
      slug: establishments.slug,
      name: establishments.name,
      neighborhood: establishments.neighborhood,
      rating: establishments.rating,
      image: establishments.image,
    })
      .from(establishments)
      .where(and(
        or(...neighborhoodConditions),
        completeEstablishmentFilter
      ))
      .limit(10);
  }

  // Search by category hints
  let byCategory: typeof byName = [];
  if (categoryHints.length > 0) {
    const catConditions = categoryHints.map(c => like(categories.name, `%${c}%`));
    const matchingCats = await db.select({ id: categories.id })
      .from(categories)
      .where(or(...catConditions));

    if (matchingCats.length > 0) {
      const catIds = matchingCats.map(c => c.id);
      const ecResults = await db.select({ establishmentId: establishmentCategories.establishmentId })
        .from(establishmentCategories)
        .where(inArray(establishmentCategories.categoryId, catIds))
        .limit(20);

      if (ecResults.length > 0) {
        const estIds = ecResults.map(e => e.establishmentId);
        byCategory = await db.select({
          id: establishments.id,
          slug: establishments.slug,
          name: establishments.name,
          neighborhood: establishments.neighborhood,
          rating: establishments.rating,
          image: establishments.image,
        })
          .from(establishments)
          .where(and(
            inArray(establishments.id, estIds),
            completeEstablishmentFilter
          ))
          .limit(10);
      }
    }
  }

  // Merge and deduplicate
  const seen = new Set<number>();
  const merged: typeof byName = [];
  for (const est of [...byName, ...byNeighborhood, ...byCategory]) {
    if (!seen.has(est.id)) {
      seen.add(est.id);
      merged.push(est);
    }
  }

  return merged.slice(0, 15);
}

/**
 * Search menu items by multiple terms (OR logic)
 */
async function searchMenuItemsByTerms(terms: string[]) {
  const db = await getDb();
  if (!db || terms.length === 0) return [];

  const nameConditions = terms.map(term => like(menuItems.name, `%${term}%`));
  const descConditions = terms.map(term => like(menuItems.description, `%${term}%`));

  // Search by name
  const byName = await db.select({
    id: menuItems.id,
    name: menuItems.name,
    description: menuItems.description,
    price: menuItems.price,
    category: menuItems.category,
    establishmentId: menuItems.establishmentId,
  })
    .from(menuItems)
    .innerJoin(establishments, eq(menuItems.establishmentId, establishments.id))
    .where(and(
      or(...nameConditions),
      completeEstablishmentFilter
    ))
    .limit(20);

  // Search by description
  const nameIds = byName.map(i => i.id);
  const byDesc = await db.select({
    id: menuItems.id,
    name: menuItems.name,
    description: menuItems.description,
    price: menuItems.price,
    category: menuItems.category,
    establishmentId: menuItems.establishmentId,
  })
    .from(menuItems)
    .innerJoin(establishments, eq(menuItems.establishmentId, establishments.id))
    .where(and(
      or(...descConditions),
      nameIds.length > 0 ? sql`${menuItems.id} NOT IN (${sql.raw(nameIds.join(','))})` : sql`1=1`,
      completeEstablishmentFilter
    ))
    .limit(20);

  return [...byName, ...byDesc];
}

/**
 * Get category names for establishments
 */
async function getCategoryNamesForEstablishments(estIds: number[]): Promise<Record<number, string>> {
  if (estIds.length === 0) return {};
  const db = await getDb();
  if (!db) return {};

  const ecPrimary = await db.select({
    establishmentId: establishmentCategories.establishmentId,
    categoryName: categories.name,
  })
    .from(establishmentCategories)
    .innerJoin(categories, eq(categories.id, establishmentCategories.categoryId))
    .where(and(
      inArray(establishmentCategories.establishmentId, estIds),
      eq(establishmentCategories.isPrimary, true)
    ));

  return Object.fromEntries(ecPrimary.map(r => [r.establishmentId, r.categoryName]));
}

/**
 * Get establishment info for menu items
 */
async function getEstablishmentInfoForItems(estIds: number[]): Promise<Record<number, { name: string; slug: string }>> {
  if (estIds.length === 0) return {};
  const db = await getDb();
  if (!db) return {};

  const ests = await db.select({
    id: establishments.id,
    name: establishments.name,
    slug: establishments.slug,
  })
    .from(establishments)
    .where(inArray(establishments.id, estIds));

  return Object.fromEntries(ests.map(e => [e.id, { name: e.name, slug: e.slug }]));
}

/**
 * Determine if a query needs AI interpretation
 * (more than 2 words, or no direct SQL results)
 */
function needsAiInterpretation(query: string): boolean {
  const words = query.trim().split(/\s+/);
  // Queries with 3+ words are likely natural language
  if (words.length >= 3) return true;
  // Queries with prepositions/articles suggest natural language
  const nlIndicators = ["de", "do", "da", "com", "para", "perto", "um", "uma", "que", "no", "na", "ao"];
  if (words.some(w => nlIndicators.includes(w.toLowerCase()))) return true;
  return false;
}

/**
 * Main smart search function
 */
export async function smartSearch(query: string): Promise<SmartSearchResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { establishments: [], menuItems: [], interpretation: "", isAiPowered: false };
  }

  // Determine if we need AI
  const useAi = needsAiInterpretation(trimmed);

  let interpretation = "";
  let searchTerms = [trimmed];
  let categoryHints: string[] = [];
  let neighborhoodHints: string[] = [];

  if (useAi) {
    const llmResult = await interpretQuery(trimmed);
    interpretation = llmResult.interpretation;
    searchTerms = [...llmResult.searchTerms, trimmed]; // Always include original
    categoryHints = llmResult.categoryHints;
    neighborhoodHints = llmResult.neighborhoodHints;
    
    // Add ambiance keywords to search terms for menu item descriptions
    if (llmResult.ambianceKeywords.length > 0) {
      searchTerms = [...searchTerms, ...llmResult.ambianceKeywords];
    }
    
    // Deduplicate search terms
    const termSet = new Set(searchTerms.map(t => t.toLowerCase()));
    searchTerms = Array.from(termSet);
  }

  // Search establishments
  const rawEstablishments = await searchEstablishmentsByTerms(searchTerms, neighborhoodHints, categoryHints);
  const estIds = rawEstablishments.map(e => e.id);
  const catMap = await getCategoryNamesForEstablishments(estIds);

  const estResults = rawEstablishments.map(e => ({
    id: e.id,
    slug: e.slug,
    name: e.name,
    neighborhood: e.neighborhood,
    rating: e.rating,
    image: e.image,
    categoryName: catMap[e.id] || "",
    matchReason: useAi ? interpretation : "Busca por nome",
  }));

  // Search menu items
  const rawItems = await searchMenuItemsByTerms(searchTerms);
  const itemEstIdSet = new Set(rawItems.map(i => i.establishmentId));
  const itemEstIds = Array.from(itemEstIdSet);
  const estInfoMap = await getEstablishmentInfoForItems(itemEstIds);

  const itemResults = rawItems.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price,
    category: item.category,
    establishmentName: estInfoMap[item.establishmentId]?.name || "",
    establishmentSlug: estInfoMap[item.establishmentId]?.slug || "",
    matchReason: useAi ? interpretation : "Busca por nome/descrição",
  }));

  return {
    establishments: estResults,
    menuItems: itemResults,
    interpretation,
    isAiPowered: useAi,
  };
}
