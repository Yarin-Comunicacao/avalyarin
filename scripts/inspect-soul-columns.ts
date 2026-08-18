import 'dotenv/config';
import mysql from 'mysql2/promise';

async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error('DATABASE_URL ausente');
  const hostname = new URL(uri).hostname.toLowerCase();
  const isTiDbCloudHost = hostname === 'tidbcloud.com' || hostname.endsWith('.tidbcloud.com');
  const ssl: any = isTiDbCloudHost ? { rejectUnauthorized: true } : undefined;
  const connection = await mysql.createConnection({ uri, ssl });
  try {
    const [claims] = await connection.query('SHOW COLUMNS FROM business_claims');
    const [establishments] = await connection.query('SHOW COLUMNS FROM establishments');
    const [menu] = await connection.query('SHOW COLUMNS FROM menu_items');
    console.log(JSON.stringify({ claims, establishments, menu }, null, 2));
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ error: error instanceof Error ? error.message : String(error), code: (error as any)?.code }));
  process.exitCode = 1;
});
