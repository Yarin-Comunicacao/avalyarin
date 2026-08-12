/**
 * Seed existing 206 establishments (with menus, images, coordinates, etc.) into the database.
 * These are the "original" establishments that already have full data.
 */
import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const data = JSON.parse(readFileSync("/home/ubuntu/existing_data.json", "utf-8"));

async function main() {
  console.log("Connecting to database...");
  const connection = await createConnection(DATABASE_URL);
  
  try {
    // Get category slug -> id map
    const [catRows] = await connection.execute("SELECT id, slug FROM categories");
    const categoryMap = {};
    for (const row of catRows) {
      categoryMap[row.slug] = row.id;
    }
    console.log(`Categories loaded: ${Object.keys(categoryMap).length}`);
    
    // ============================================================
    // INSERT EXISTING ESTABLISHMENTS (with full data)
    // ============================================================
    console.log("\nInserting existing establishments...");
    
    let estInserted = 0;
    let estUpdated = 0;
    const slugToId = {}; // slug -> db id
    
    for (const est of data.establishments) {
      const categoryId = categoryMap[est.categorySlug];
      if (!categoryId) {
        console.warn(`  Skipping ${est.name}: no category ${est.categorySlug}`);
        continue;
      }
      
      // Check if this slug already exists (from spreadsheet seed)
      const [existing] = await connection.execute(
        "SELECT id FROM establishments WHERE slug = ?", [est.slug]
      );
      
      if (existing.length > 0) {
        // Update with full data
        await connection.execute(
          `UPDATE establishments SET 
            name=?, address=?, neighborhood=?, lat=?, lng=?, rating=?, reviewCount=?,
            image=?, hours=?, phone=?, instagram=?, categoryId=?, hasMenu=?, source=?
           WHERE slug=?`,
          [
            est.name, est.address, est.neighborhood, est.lat, est.lng,
            est.rating, est.reviewCount, est.image, est.hours, est.phone,
            est.instagram, categoryId, est.hasMenu, 'original', est.slug
          ]
        );
        slugToId[est.slug] = existing[0].id;
        estUpdated++;
      } else {
        // Insert new
        const [result] = await connection.execute(
          `INSERT INTO establishments (slug, name, address, neighborhood, lat, lng, rating, reviewCount, image, hours, phone, instagram, categoryId, hasMenu, source)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            est.slug, est.name, est.address, est.neighborhood, est.lat, est.lng,
            est.rating, est.reviewCount, est.image, est.hours, est.phone,
            est.instagram, categoryId, est.hasMenu, 'original'
          ]
        );
        slugToId[est.slug] = result.insertId;
        estInserted++;
      }
    }
    
    console.log(`  ✅ Inserted: ${estInserted}, Updated: ${estUpdated}`);
    
    // ============================================================
    // INSERT MENU ITEMS
    // ============================================================
    console.log("\nInserting menu items...");
    
    // First, get all establishment slug -> id mapping
    const [allEst] = await connection.execute("SELECT id, slug FROM establishments WHERE source = 'original'");
    for (const row of allEst) {
      slugToId[row.slug] = row.id;
    }
    
    const BATCH_SIZE = 200;
    let menuInserted = 0;
    
    for (let i = 0; i < data.menuItems.length; i += BATCH_SIZE) {
      const batch = data.menuItems.slice(i, i + BATCH_SIZE);
      const values = [];
      const placeholders = [];
      
      for (const item of batch) {
        const estId = slugToId[item.establishmentSlug];
        if (!estId) continue;
        
        placeholders.push("(?, ?, ?, ?, ?)");
        values.push(estId, item.name, item.description || null, item.price, item.category || null);
      }
      
      if (placeholders.length > 0) {
        await connection.execute(
          `INSERT INTO menu_items (establishmentId, name, description, price, category)
           VALUES ${placeholders.join(", ")}`,
          values
        );
        menuInserted += placeholders.length;
      }
    }
    
    console.log(`  ✅ Menu items inserted: ${menuInserted}`);
    
    // ============================================================
    // FINAL VERIFICATION
    // ============================================================
    console.log("\nFinal verification...");
    const [estCount] = await connection.execute("SELECT COUNT(*) as cnt FROM establishments");
    const [origCount] = await connection.execute("SELECT COUNT(*) as cnt FROM establishments WHERE source = 'original'");
    const [spreadCount] = await connection.execute("SELECT COUNT(*) as cnt FROM establishments WHERE source = 'spreadsheet'");
    const [menuCount] = await connection.execute("SELECT COUNT(*) as cnt FROM menu_items");
    const [withMenu] = await connection.execute("SELECT COUNT(*) as cnt FROM establishments WHERE hasMenu = true");
    
    console.log(`  Total establishments: ${estCount[0].cnt}`);
    console.log(`  - Original (with menu): ${origCount[0].cnt}`);
    console.log(`  - Spreadsheet (no menu): ${spreadCount[0].cnt}`);
    console.log(`  Total menu items: ${menuCount[0].cnt}`);
    console.log(`  Establishments with menu: ${withMenu[0].cnt}`);
    
    console.log("\n✅ Existing data seeded successfully!");
    
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
