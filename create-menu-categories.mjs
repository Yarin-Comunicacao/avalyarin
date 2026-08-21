import { readFileSync } from "fs";
import mysql from "mysql2/promise";

async function main() {
  const data = JSON.parse(readFileSync("/home/ubuntu/existing_data.json", "utf-8"));
  const DATABASE_URL = "mysql://4LUtXE4vPqQU3CD.root:sCS5ECjAEZ66Z5MzGo25@gateway06.us-east-1.prod.aws.tidbcloud.com:4000/WG3U3sVg2ZrW6m8T99FRdE";
  
  const connection = await mysql.createConnection({
    uri: DATABASE_URL,
    ssl: { rejectUnauthorized: true }
  });
  
  console.log("Starting menu categories creation...");
  
  const estMap = new Map();
  const [rows] = await connection.execute("SELECT id, slug FROM establishments");
  for (const row of rows) {
    estMap.set(row.slug, row.id);
  }

  // Group menu items by establishment to find unique categories
  const estCategories = {};
  for (const item of data.menuItems) {
    if (!estCategories[item.establishmentSlug]) {
      estCategories[item.establishmentSlug] = new Set();
    }
    estCategories[item.establishmentSlug].add(item.category);
  }

  for (const slug in estCategories) {
    const establishmentId = estMap.get(slug);
    if (!establishmentId) continue;

    const categories = Array.from(estCategories[slug]);
    for (let i = 0; i < categories.length; i++) {
      const catName = categories[i];
      await connection.execute(
        "INSERT IGNORE INTO menu_categories (establishmentId, name, sortOrder) VALUES (?, ?, ?)",
        [establishmentId, catName, i]
      );
    }
  }

  console.log("✅ Menu categories created!");
  await connection.end();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
