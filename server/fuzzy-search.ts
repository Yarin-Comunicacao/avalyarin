/**
 * Fuzzy Search Utility
 * Provides typo-tolerant search using Levenshtein distance.
 * Since the DB has only ~270 active establishments, we can load names
 * and do fuzzy matching in-memory efficiently.
 */

import { getDb } from "./db";
import { establishments } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshtein(a: string, b: string): number {
  const an = a.length;
  const bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix: number[][] = [];

  for (let i = 0; i <= an; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= bn; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= an; i++) {
    for (let j = 1; j <= bn; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[an][bn];
}

/**
 * Check if query is a fuzzy match for a target name.
 * Tighter matching rules to avoid false positives:
 * - For queries 3-4 chars: max distance 1
 * - For queries 5-6 chars: max distance 2
 * - For queries 7+ chars: max distance 2
 * Only compares against words of similar length in the target.
 */
function isFuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  // Exact substring match
  if (t.includes(q)) return true;

  // Check each word in the target
  const targetWords = t.split(/[\s\-&,()]+/).filter(w => w.length > 0);

  // Determine max allowed distance based on query length
  const maxDistance = q.length <= 4 ? 1 : 2;

  for (const word of targetWords) {
    // Only compare words of similar length (within +/- 2 chars)
    if (Math.abs(word.length - q.length) > 2) continue;

    const dist = levenshtein(q, word);
    if (dist <= maxDistance) return true;
  }

  // Check if removing common Portuguese suffixes helps (e.g., "donas" -> "dona")
  const suffixes = ["s", "es", "os", "as"];
  for (const suffix of suffixes) {
    if (q.endsWith(suffix) && q.length > suffix.length + 2) {
      const stem = q.slice(0, -suffix.length);
      if (t.includes(stem)) return true;
      // Check stem against target words
      for (const word of targetWords) {
        if (Math.abs(word.length - stem.length) > 2) continue;
        if (levenshtein(stem, word) <= 1) return true;
      }
    }
  }

  return false;
}

/**
 * Get fuzzy-matched establishment names from the database.
 * Loads all active establishment names and filters in-memory.
 * With ~270 establishments, this is very fast.
 */
export async function fuzzySearchEstablishments(query: string): Promise<string[]> {
  const db = await getDb();
  if (!db || query.length < 3) return [];

  // Load all active establishment names
  const allEst = await db.select({
    name: establishments.name,
  })
    .from(establishments)
    .where(eq(establishments.status, 'active'));

  // Find fuzzy matches
  const matches = allEst
    .filter(est => isFuzzyMatch(query, est.name))
    .map(est => est.name);

  return matches;
}

/**
 * Generate SQL LIKE patterns from common typo variants.
 * Focused on plural removal and simple character substitutions.
 */
export function generateFuzzyTerms(query: string): string[] {
  const q = query.toLowerCase();
  const terms: string[] = [q];

  // Remove trailing 's' for plural tolerance (Portuguese)
  if (q.length > 3 && q.endsWith('s')) {
    terms.push(q.slice(0, -1));
  }
  if (q.length > 4 && q.endsWith('es')) {
    terms.push(q.slice(0, -2));
  }
  if (q.length > 4 && q.endsWith('as')) {
    terms.push(q.slice(0, -2) + 'a');
  }
  if (q.length > 4 && q.endsWith('os')) {
    terms.push(q.slice(0, -2) + 'o');
  }

  // Deduplicate
  return Array.from(new Set(terms));
}

export { isFuzzyMatch, levenshtein };
