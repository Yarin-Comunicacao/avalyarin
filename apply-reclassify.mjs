/**
 * Apply reclassification: move establishments from Cozinha Brasileira
 * to Cozinha Internacional or Bar & Lanchonete in the database.
 */
import mysql from "mysql2/promise";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const data = JSON.parse(fs.readFileSync("/home/ubuntu/reclassify_results.json", "utf-8"));

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Get category IDs
  const [categories] = await connection.execute("SELECT id, slug FROM categories");
  const catMap = {};
  for (const cat of categories) {
    catMap[cat.slug] = cat.id;
  }
  
  console.log("Category IDs:", catMap);
  
  const cozinhaInternacionalId = catMap["cozinha-internacional"];
  const barLanchoneteId = catMap["bar-lanchonete"];
  const cozinhaBrasileiraId = catMap["cozinha-brasileira"];
  
  if (!cozinhaInternacionalId || !barLanchoneteId || !cozinhaBrasileiraId) {
    console.error("Missing category IDs!");
    process.exit(1);
  }
  
  // Move to Cozinha Internacional
  let movedIntl = 0;
  for (const name of data.to_international) {
    const [result] = await connection.execute(
      "UPDATE establishments SET categoryId = ? WHERE name = ? AND categoryId = ?",
      [cozinhaInternacionalId, name, cozinhaBrasileiraId]
    );
    movedIntl += result.affectedRows;
  }
  
  // Move to Bar & Lanchonete
  let movedBar = 0;
  for (const name of data.to_bar_lanchonete) {
    const [result] = await connection.execute(
      "UPDATE establishments SET categoryId = ? WHERE name = ? AND categoryId = ?",
      [barLanchoneteId, name, cozinhaBrasileiraId]
    );
    movedBar += result.affectedRows;
  }
  
  console.log(`\n=== RECLASSIFICAÇÃO APLICADA ===`);
  console.log(`Movidos para Cozinha Internacional: ${movedIntl}`);
  console.log(`Movidos para Bar & Lanchonete: ${movedBar}`);
  
  // Verify new counts
  const [counts] = await connection.execute(`
    SELECT c.name, c.slug, COUNT(e.id) as count 
    FROM categories c 
    LEFT JOIN establishments e ON e.categoryId = c.id 
    GROUP BY c.id 
    ORDER BY count DESC
  `);
  
  console.log("\n=== CONTAGEM ATUALIZADA ===");
  for (const row of counts) {
    console.log(`  ${row.name}: ${row.count}`);
  }
  
  await connection.end();
}

main().catch(console.error);
