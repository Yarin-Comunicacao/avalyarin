import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const [rows] = await connection.execute(
    "SELECT neighborhood, COUNT(*) as count FROM establishments WHERE neighborhood IS NOT NULL AND neighborhood != '' GROUP BY neighborhood ORDER BY count DESC"
  );
  console.log(`Total unique neighborhoods: ${rows.length}`);
  console.log(JSON.stringify(rows, null, 2));
  await connection.end();
}
main().catch(console.error);
