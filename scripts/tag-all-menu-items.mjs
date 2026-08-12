/**
 * Migration script: Generate and apply tags to ALL existing menu items.
 * Run with: node scripts/tag-all-menu-items.mjs
 */

import 'dotenv/config';
import mysql from 'mysql2/promise';

// --- Auto-tag logic (duplicated here for standalone script) ---

const STOP_WORDS = new Set([
  'de', 'do', 'da', 'dos', 'das', 'com', 'sem', 'e', 'ou', 'em', 'no', 'na',
  'nos', 'nas', 'por', 'para', 'ao', 'à', 'um', 'uma', 'uns', 'umas',
  'o', 'a', 'os', 'as', 'que', 'se', 'não', 'mais', 'muito', 'já',
]);

function normalizeTag(tag) {
  return tag.toLowerCase().trim().replace(/\s+/g, ' ');
}

function tokenize(name) {
  return name
    .replace(/[-–—]/g, ' ')
    .replace(/[()[\]{}]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);
}

function isStopWord(token) {
  return STOP_WORDS.has(token.toLowerCase());
}

function generateProductTags(name) {
  if (!name || name.trim().length === 0) return [];

  const tokens = tokenize(name);
  const meaningfulTokens = tokens.filter(t => !isStopWord(t));
  const tags = new Set();

  // Each meaningful word
  for (const token of meaningfulTokens) {
    if (token.length >= 2) {
      tags.add(normalizeTag(token));
    }
  }

  // Contiguous subsequences
  for (let len = 2; len <= meaningfulTokens.length; len++) {
    for (let start = 0; start <= meaningfulTokens.length - len; start++) {
      const subsequence = meaningfulTokens.slice(start, start + len).join(' ');
      tags.add(normalizeTag(subsequence));
    }
  }

  // Skip-grams (non-contiguous pairs)
  if (meaningfulTokens.length >= 3) {
    for (let i = 0; i < meaningfulTokens.length; i++) {
      for (let j = i + 2; j < meaningfulTokens.length; j++) {
        const pair = `${meaningfulTokens[i]} ${meaningfulTokens[j]}`;
        tags.add(normalizeTag(pair));
      }
    }
  }

  // Full name without stop words
  if (meaningfulTokens.length >= 2) {
    tags.add(normalizeTag(meaningfulTokens.join(' ')));
  }

  // Full original name
  tags.add(normalizeTag(name));

  return Array.from(tags).sort((a, b) => a.length - b.length);
}

// --- Main migration ---

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const connection = await mysql.createConnection(dbUrl);
  console.log('Connected to database');

  // Get all menu items
  const [rows] = await connection.execute('SELECT id, name, category FROM menu_items');
  console.log(`Found ${rows.length} menu items to tag`);

  let updated = 0;
  let errors = 0;
  const batchSize = 50;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const promises = batch.map(async (item) => {
      try {
        const tags = generateProductTags(item.name);
        await connection.execute(
          'UPDATE menu_items SET tags = ? WHERE id = ?',
          [JSON.stringify(tags), item.id]
        );
        updated++;
      } catch (err) {
        errors++;
        console.error(`Error tagging item ${item.id} (${item.name}):`, err.message);
      }
    });
    await Promise.all(promises);
    
    if ((i + batchSize) % 200 === 0 || i + batchSize >= rows.length) {
      console.log(`Progress: ${Math.min(i + batchSize, rows.length)}/${rows.length} (${updated} updated, ${errors} errors)`);
    }
  }

  console.log(`\nDone! Updated: ${updated}, Errors: ${errors}`);
  await connection.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
