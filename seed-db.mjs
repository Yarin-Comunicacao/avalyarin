/**
 * Seed script: Inserts categories, existing establishments (with menus from data.ts),
 * and new establishments from the classified spreadsheet data into MySQL.
 * 
 * Run with: node seed-db.mjs
 */
import { drizzle } from "drizzle-orm/mysql2";
import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";
import { resolve } from "path";
import dotenv from "dotenv";

// Load env
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

// Parse the seed data JSON
const seedDataPath = resolve("/home/ubuntu/seed_data.json");
const seedData = JSON.parse(readFileSync(seedDataPath, "utf-8"));

// Parse the existing data.ts to get establishments with menus
// We'll import it as a module - but since it's TypeScript, we'll parse it differently
// Instead, let's read the existing data and extract what we need via a separate JSON export

async function main() {
  console.log("Connecting to database...");
  const connection = await createConnection(DATABASE_URL);
  
  try {
    // ============================================================
    // 1. INSERT CATEGORIES
    // ============================================================
    console.log("\n1. Inserting categories...");
    
    const categoryMap = {}; // slug -> id
    
    for (const [slug, cat] of Object.entries(seedData.categories)) {
      const [result] = await connection.execute(
        `INSERT INTO categories (slug, name, description, icon, active) 
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), icon=VALUES(icon)`,
        [slug, cat.name, cat.description, cat.icon, true]
      );
      
      // Get the ID
      const [rows] = await connection.execute(
        `SELECT id FROM categories WHERE slug = ?`, [slug]
      );
      categoryMap[slug] = rows[0].id;
    }
    
    console.log(`   ✅ ${Object.keys(categoryMap).length} categories inserted`);
    console.log(`   Category IDs:`, categoryMap);
    
    // ============================================================
    // 2. INSERT ESTABLISHMENTS FROM SPREADSHEET (no menu)
    // ============================================================
    console.log("\n2. Inserting establishments from spreadsheet...");
    
    const BATCH_SIZE = 500;
    const establishments = seedData.establishments;
    let insertedCount = 0;
    let skippedCount = 0;
    
    for (let i = 0; i < establishments.length; i += BATCH_SIZE) {
      const batch = establishments.slice(i, i + BATCH_SIZE);
      
      const values = [];
      const placeholders = [];
      
      for (const est of batch) {
        const categoryId = categoryMap[est.categorySlug];
        if (!categoryId) {
          skippedCount++;
          continue;
        }
        
        placeholders.push("(?, ?, ?, ?, ?, ?, ?, ?, ?)");
        values.push(
          est.slug,
          est.name,
          est.address || null,
          est.neighborhood || null,
          est.region || null,
          est.rating || null,
          est.reviewCount || null,
          categoryId,
          est.source || 'spreadsheet'
        );
      }
      
      if (placeholders.length > 0) {
        await connection.execute(
          `INSERT IGNORE INTO establishments (slug, name, address, neighborhood, region, rating, reviewCount, categoryId, source) 
           VALUES ${placeholders.join(", ")}`,
          values
        );
        insertedCount += placeholders.length;
      }
      
      if ((i + BATCH_SIZE) % 2000 === 0 || i + BATCH_SIZE >= establishments.length) {
        console.log(`   Progress: ${Math.min(i + BATCH_SIZE, establishments.length)}/${establishments.length}`);
      }
    }
    
    console.log(`   ✅ ${insertedCount} establishments inserted, ${skippedCount} skipped`);
    
    // ============================================================
    // 3. VERIFY COUNTS
    // ============================================================
    console.log("\n3. Verifying...");
    
    const [catCount] = await connection.execute("SELECT COUNT(*) as cnt FROM categories");
    const [estCount] = await connection.execute("SELECT COUNT(*) as cnt FROM establishments");
    const [menuCount] = await connection.execute("SELECT COUNT(*) as cnt FROM menu_items");
    
    console.log(`   Categories: ${catCount[0].cnt}`);
    console.log(`   Establishments: ${estCount[0].cnt}`);
    console.log(`   Menu Items: ${menuCount[0].cnt}`);
    
    // Show per-category breakdown
    const [breakdown] = await connection.execute(`
      SELECT c.name, COUNT(e.id) as cnt 
      FROM categories c 
      LEFT JOIN establishments e ON e.categoryId = c.id 
      GROUP BY c.id, c.name 
      ORDER BY cnt DESC
    `);
    
    console.log("\n   Per-category breakdown:");
    for (const row of breakdown) {
      console.log(`     ${row.name}: ${row.cnt}`);
    }
    
    console.log("\n✅ Seed complete!");
    
  } catch (error) {
    console.error("Error:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
