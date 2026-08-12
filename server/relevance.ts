/**
 * Relevance scoring for rating comments using LLM analysis.
 * 
 * Scores comments on a 0-100 scale based on:
 * - Depth of detail (specific ingredients, techniques, comparisons)
 * - Utility for other users (helps decide what to order)
 * - Technical knowledge (sommelier-level insights)
 * - Constructive criticism (explains why something was good/bad)
 * 
 * Generic comments like "gostei" score low (10-20).
 * Detailed reviews with comparisons and insights score high (70-100).
 */

import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { ratings, ratingItems } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export async function calculateRelevanceScore(comments: string[]): Promise<number> {
  if (!comments.length || comments.every(c => !c || c.trim().length === 0)) {
    return 0; // No comments = no relevance
  }

  const allComments = comments.filter(c => c && c.trim().length > 0).join("\n---\n");

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Você é um analisador de relevância de avaliações gastronômicas. Sua tarefa é pontuar de 0 a 100 o quão útil e detalhado é um conjunto de comentários de avaliação.

CRITÉRIOS DE PONTUAÇÃO:
- 0-10: Sem comentário ou apenas emojis
- 10-25: Comentários genéricos ("gostei", "muito bom", "recomendo")
- 25-45: Comentários com algum detalhe ("o hambúrguer estava suculento", "cerveja gelada")
- 45-65: Comentários com detalhes específicos e opinião fundamentada ("a troca do tomate por pasta de tomate deu diferença", "o ponto da carne estava perfeito, médio como pedi")
- 65-85: Comentários com comparações, conhecimento técnico ou insights únicos ("como sommelier de X-salada, foi o melhor que provei", "o blend de carnes lembra o do Burger Joint mas com mais suculência")
- 85-100: Comentários excepcionais com análise profunda, comparações múltiplas, dicas para outros consumidores e conhecimento especializado

Responda APENAS com um número inteiro de 0 a 100.`
        },
        {
          role: "user",
          content: `Analise os seguintes comentários de uma avaliação e dê uma nota de relevância (0-100):\n\n${allComments}`
        }
      ],
    });

    const rawContent = response?.choices?.[0]?.message?.content;
    const content = typeof rawContent === 'string' ? rawContent.trim() : '';
    if (!content) return 15; // Default for failed analysis

    const score = parseInt(content, 10);
    if (isNaN(score) || score < 0 || score > 100) return 15;
    return score;
  } catch (error) {
    console.error("[Relevance] LLM analysis failed:", error);
    return 15; // Default fallback
  }
}

/**
 * Calculate and save relevance score for a specific rating.
 * Called after a rating is saved.
 */
export async function scoreAndSaveRelevance(ratingId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  // Get all comments for this rating
  const items = await db.select({ comment: ratingItems.comment })
    .from(ratingItems)
    .where(eq(ratingItems.ratingId, ratingId));

  const comments = items
    .map((i: { comment: string | null }) => i.comment)
    .filter((c: string | null): c is string => !!c && c.trim().length > 0);

  const score = await calculateRelevanceScore(comments);

  // Save to ratings table
  await db.update(ratings)
    .set({ relevanceScore: score })
    .where(eq(ratings.id, ratingId));

  return score;
}
