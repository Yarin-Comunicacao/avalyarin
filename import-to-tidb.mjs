import { readFileSync } from "fs";
import mysql from "mysql2/promise";

async function main() {
  const data = JSON.parse(readFileSync("/home/ubuntu/existing_data.json", "utf-8"));
  
  // Using the DATABASE_URL found in .project-config.json
  const DATABASE_URL = "mysql://4LUtXE4vPqQU3CD.root:sCS5ECjAEZ66Z5MzGo25@gateway06.us-east-1.prod.aws.tidbcloud.com:4000/WG3U3sVg2ZrW6m8T99FRdE";
  
  const connection = await mysql.createConnection({
    uri: DATABASE_URL,
    ssl: { rejectUnauthorized: true }
  });
  
  console.log("Starting import via raw SQL...");
  
  // 1. Categories
  const catMap = new Map();
  for (const cat of data.categories) {
    const code = `ca${Math.floor(Math.random() * 900 + 100)}`;
    await connection.execute(
      "INSERT IGNORE INTO categories (slug, name, description, icon, active, code) VALUES (?, ?, ?, ?, ?, ?)",
      [cat.slug, cat.name, cat.description, cat.icon, cat.active ? 1 : 0, code]
    );
    
    const [rows] = await connection.execute("SELECT id FROM categories WHERE slug = ?", [cat.slug]);
    if (rows.length > 0) catMap.set(cat.slug, rows[0].id);
  }
  console.log("Categories processed.");
  
  // 2. Establishments
  const estMap = new Map();
  for (const est of data.establishments) {
    const categoryId = catMap.get(est.categorySlug);
    if (!categoryId) continue;
    
    const code = `es${Math.floor(Math.random() * 900000 + 100000)}`;
    await connection.execute(
      "INSERT IGNORE INTO establishments (slug, name, address, neighborhood, lat, lng, rating, reviewCount, image, hours, phone, instagram, categoryId, code, status, hasMenu) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 1)",
      [est.slug, est.name, est.address, est.neighborhood, est.lat, est.lng, est.rating, est.reviewCount, est.image, est.hours, est.phone, est.instagram, categoryId, code]
    );
    
    const [rows] = await connection.execute("SELECT id FROM establishments WHERE slug = ?", [est.slug]);
    if (rows.length > 0) {
      const establishmentId = rows[0].id;
      estMap.set(est.slug, establishmentId);
      
      await connection.execute(
        "INSERT IGNORE INTO establishment_categories (establishmentId, categoryId, isPrimary) VALUES (?, ?, ?)",
        [establishmentId, categoryId, 1]
      );
    }
  }
  console.log("Establishments processed.");
  
  // 3. Menu Items
  for (const item of data.menuItems) {
    const establishmentId = estMap.get(item.establishmentSlug);
    if (!establishmentId) continue;
    
    const code = `mi${Math.floor(Math.random() * 900000 + 100000)}`;
    await connection.execute(
      "INSERT IGNORE INTO menu_items (establishmentId, name, description, price, category, code) VALUES (?, ?, ?, ?, ?, ?)",
      [establishmentId, item.name, item.description, item.price, item.category, code]
    );
  }
  console.log("Menu items processed.");
  
  console.log("✅ Import complete!");
  await connection.end();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
