/**
 * Auto-Tagging System for Menu Items
 * 
 * Generates all relevant tag combinations from a product name.
 * Example: "Cerveja Heineken 600ml" generates:
 *   cerveja, heineken, cerveja heineken, heineken 600,
 *   heineken 600ml, cerveja 600, cerveja 600ml, cerveja heineken 600,
 *   cerveja heineken 600ml
 * 
 * Strategy:
 * 1. Tokenize the product name into meaningful words
 * 2. Generate all contiguous subsequences (n-grams)
 * 3. Also generate non-contiguous combinations (skip-grams) for key patterns
 * 4. Normalize and deduplicate
 */

/**
 * Words to exclude from standalone tags (too generic alone)
 */
const STOP_WORDS = new Set([
  'de', 'do', 'da', 'dos', 'das', 'com', 'sem', 'e', 'ou', 'em', 'no', 'na',
  'nos', 'nas', 'por', 'para', 'ao', 'à', 'um', 'uma', 'uns', 'umas',
  'o', 'a', 'os', 'as', 'que', 'se', 'não', 'mais', 'muito', 'já',
]);

/**
 * Normalize a tag: lowercase, trim, collapse spaces
 */
function normalizeTag(tag: string): string {
  return tag.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Tokenize a product name into meaningful words.
 * Keeps numbers and units together (e.g., "600ml" stays as one token).
 */
function tokenize(name: string): string[] {
  // Split on spaces, hyphens, and special chars but keep alphanumeric+units together
  const raw = name
    .replace(/[-–—]/g, ' ')
    .replace(/[()[\]{}]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);

  return raw;
}

/**
 * Check if a token is a stop word
 */
function isStopWord(token: string): boolean {
  return STOP_WORDS.has(token.toLowerCase());
}

/**
 * Generate all tags for a product name.
 * Returns an array of unique, normalized tags.
 */
export function generateProductTags(name: string): string[] {
  if (!name || name.trim().length === 0) return [];

  const tokens = tokenize(name);
  const meaningfulTokens = tokens.filter(t => !isStopWord(t));
  const tags = new Set<string>();

  // 1. Add each meaningful word as a standalone tag
  for (const token of meaningfulTokens) {
    if (token.length >= 2) {
      tags.add(normalizeTag(token));
    }
  }

  // 2. Generate all contiguous subsequences (bigrams, trigrams, etc.)
  for (let len = 2; len <= meaningfulTokens.length; len++) {
    for (let start = 0; start <= meaningfulTokens.length - len; start++) {
      const subsequence = meaningfulTokens.slice(start, start + len).join(' ');
      tags.add(normalizeTag(subsequence));
    }
  }

  // 3. Generate skip-gram combinations (non-contiguous but meaningful)
  // This handles cases like "cerveja 600ml" from "Cerveja Heineken 600ml"
  if (meaningfulTokens.length >= 3) {
    for (let i = 0; i < meaningfulTokens.length; i++) {
      for (let j = i + 2; j < meaningfulTokens.length; j++) {
        // Pair: first + last (skipping middle)
        const pair = `${meaningfulTokens[i]} ${meaningfulTokens[j]}`;
        tags.add(normalizeTag(pair));

        // Triple: first + middle + last for longer names
        for (let k = i + 1; k < j; k++) {
          // Already covered by contiguous subsequences
        }
      }
    }
  }

  // 4. Also add the full name (without stop words) as a tag
  if (meaningfulTokens.length >= 2) {
    tags.add(normalizeTag(meaningfulTokens.join(' ')));
  }

  // 5. Add the full original name normalized
  tags.add(normalizeTag(name));

  // 6. If there's a category prefix pattern (e.g., "Cerveja" in "Cerveja Heineken 600ml"),
  // generate category + each subsequent token combination
  // This is already handled by the skip-grams above

  // Convert to array and sort by length (shorter tags first for better UX)
  return Array.from(tags).sort((a, b) => a.length - b.length);
}

/**
 * Generate tags for a menu item considering both name and category.
 * If category is provided and not already in the name, prepend it to generate more tags.
 */
export function generateMenuItemTags(name: string, category?: string | null): string[] {
  const nameTags = generateProductTags(name);

  if (!category || category.trim().length === 0) {
    return nameTags;
  }

  // Check if category is already part of the name
  const normalizedCategory = normalizeTag(category);
  const normalizedName = normalizeTag(name);

  if (normalizedName.includes(normalizedCategory)) {
    return nameTags;
  }

  // Generate additional tags combining category with name tokens
  const categoryTags = new Set<string>(nameTags);
  const nameTokens = tokenize(name).filter(t => !isStopWord(t));

  // Add category as standalone tag
  categoryTags.add(normalizedCategory);

  // Add category + each meaningful token
  for (const token of nameTokens) {
    if (token.length >= 2) {
      categoryTags.add(normalizeTag(`${category} ${token}`));
    }
  }

  // Add category + full name
  categoryTags.add(normalizeTag(`${category} ${name}`));

  return Array.from(categoryTags).sort((a, b) => a.length - b.length);
}
