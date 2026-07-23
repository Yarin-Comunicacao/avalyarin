import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function main() {
  const url = new URL(DATABASE_URL);
  const connection = await mysql.createConnection({
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
  });

  const [rows] = await connection.execute(
    `SELECT id, code, name, address, neighborhood, region, lat, lng 
     FROM establishments 
     WHERE neighborhood IS NULL OR neighborhood = '' OR region IS NULL OR region = ''
     ORDER BY id`
  );

  console.log(JSON.stringify(rows, null, 2));
  console.log(`\nTotal: ${rows.length} establishments without neighborhood/region`);

  await connection.end();
}

main().catch(console.error);
