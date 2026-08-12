/**
 * Apply reclassification using keyword patterns directly against the database.
 * This avoids name-matching issues by using SQL LIKE/REGEXP on the DB directly.
 */
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Get category IDs
  const [categories] = await connection.execute("SELECT id, slug, name FROM categories");
  const catMap = {};
  for (const cat of categories) {
    catMap[cat.slug] = cat.id;
  }
  
  const cozinhaInternacionalId = catMap["cozinha-internacional"];
  const barLanchoneteId = catMap["bar-lanchonete"];
  const cozinhaBrasileiraId = catMap["cozinha-brasileira"];
  
  // International cuisine keywords - move from Cozinha Brasileira to Cozinha Internacional
  const internationalPatterns = [
    // Arab/Turkish
    "%arabe%", "%árabe%", "%esfiha%", "%kebab%", "%shawarma%", "%falafel%",
    "%hummus%", "%tabule%", "%beirut%", "%libanes%", "%libanesa%",
    "%sírio%", "%síria%", "%turco%", "%turca%", "%marroquin%",
    // Japanese
    "%sushi%", "%sashimi%", "%temaki%", "%ramen%", "%udon%", "%yakisoba%",
    "%teppan%", "%izakaya%", "%sakura%", "%nippon%", "%nikkei%",
    "% japa%", "%japonês%", "%japonesa%", "%japones%",
    // Italian
    "%italiano%", "%italiana%", "%trattoria%", "%osteria%", "%ristorante%",
    "%cantina%", "%nonna%",
    // Chinese
    "%chinês%", "%chinesa%", "%chinese%", "%dim sum%",
    // Mexican
    "%mexicano%", "%mexicana%", "%taco %", "%burrito%", "%nachos%",
    "%enchilada%", "%quesadilla%",
    // Indian
    "%indiano%", "%indiana%", "%curry%", "%tandoori%", "%masala%",
    // Thai
    "% thai%", "%tailandês%", "%tailandesa%", "%pad thai%",
    // Korean
    "%coreano%", "%coreana%", "%korean%", "%kimchi%", "%bibimbap%",
    // French
    "%francês%", "%francesa%", "%bistro%", "%brasserie%",
    // Peruvian
    "%peruano%", "%peruana%", "%ceviche%", "%pisco%",
    // Greek
    "%grego%", "%grega%", "%greek%", "%gyros%",
    // Portuguese
    "%português%", "%portuguesa%", "%bacalhau%",
    // Armenian
    "%armênio%", "%armênia%",
    // Vietnamese
    "%vietnam%", "%vietnamita%",
    // General
    "%internacional%", "%oriental%", "%mediterrâneo%", "%mediterrânea%",
    "%asiático%", "%asiática%", "%fusion%",
  ];
  
  // Bar & Lanchonete keywords
  const barLanchonetePatterns = [
    "%lanchonete%", "%lanches %",
    "%espetinho%", "%espeto %", "% espeto%", "%do espeto%",
    "%hot dog%", "%hotdog%", "%cachorro quente%",
  ];
  
  let totalIntl = 0;
  for (const pattern of internationalPatterns) {
    const [result] = await connection.execute(
      "UPDATE establishments SET categoryId = ? WHERE name LIKE ? AND categoryId = ?",
      [cozinhaInternacionalId, pattern, cozinhaBrasileiraId]
    );
    if (result.affectedRows > 0) {
      console.log(`  [INTL] "${pattern}" → ${result.affectedRows} movidos`);
      totalIntl += result.affectedRows;
    }
  }
  
  let totalBar = 0;
  for (const pattern of barLanchonetePatterns) {
    const [result] = await connection.execute(
      "UPDATE establishments SET categoryId = ? WHERE name LIKE ? AND categoryId = ?",
      [barLanchoneteId, pattern, cozinhaBrasileiraId]
    );
    if (result.affectedRows > 0) {
      console.log(`  [BAR] "${pattern}" → ${result.affectedRows} movidos`);
      totalBar += result.affectedRows;
    }
  }
  
  console.log(`\n=== RECLASSIFICAÇÃO V2 APLICADA ===`);
  console.log(`Movidos para Cozinha Internacional: ${totalIntl}`);
  console.log(`Movidos para Bar & Lanchonete: ${totalBar}`);
  
  // Verify new counts
  const [counts] = await connection.execute(`
    SELECT c.name, c.slug, COUNT(e.id) as count 
    FROM categories c 
    LEFT JOIN establishments e ON e.categoryId = c.id 
    GROUP BY c.id 
    ORDER BY count DESC
  `);
  
  console.log("\n=== CONTAGEM FINAL ===");
  let total = 0;
  for (const row of counts) {
    console.log(`  ${row.name}: ${row.count}`);
    total += row.count;
  }
  console.log(`  TOTAL: ${total}`);
  
  await connection.end();
}

main().catch(console.error);
