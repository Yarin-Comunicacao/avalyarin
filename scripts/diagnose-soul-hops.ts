import 'dotenv/config';
import mysql from 'mysql2/promise';

const ident = (name: string) => `\`${name}\``;

async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error('DATABASE_URL ausente');
  const ssl: any = uri.includes('tidbcloud.com') ? { rejectUnauthorized: true } : undefined;
  const connection = await mysql.createConnection({ uri, ssl });

  try {
    const [establishments] = await connection.query(
      `SELECT id, code, slug, name, status, ${ident('hasMenu')} AS hasMenu, address, hours
       FROM establishments
       WHERE LOWER(name) LIKE '%soul hops%' OR LOWER(slug) LIKE '%soul-hops%'
       ORDER BY id`
    );

    const establishmentIds = (establishments as any[]).map((row) => row.id);
    let menu: any[] = [];
    let categories: any[] = [];
    let claimRows: any[] = [];

    if (establishmentIds.length > 0) {
      const idList = establishmentIds.join(',');
      [menu] = await connection.query(
        `SELECT id, code, ${ident('establishmentId')} AS establishmentId, name, category, price,
                ${ident('imageUrl')} AS imageUrl, ${ident('imageThumbUrl')} AS imageThumbUrl
         FROM menu_items
         WHERE ${ident('establishmentId')} IN (${idList})
         ORDER BY ${ident('establishmentId')}, category, id`
      );
      [categories] = await connection.query(
        `SELECT ${ident('establishmentId')} AS establishmentId, name, ${ident('sortOrder')} AS sortOrder
         FROM menu_categories
         WHERE ${ident('establishmentId')} IN (${idList})
         ORDER BY ${ident('establishmentId')}, ${ident('sortOrder')}`
      );
      [claimRows] = await connection.query(
        `SELECT id, ${ident('userId')} AS userId, ${ident('establishmentId')} AS establishmentId, status
         FROM business_claims
         WHERE ${ident('establishmentId')} IN (${idList})
         ORDER BY id DESC`
      );
    }

    console.log(JSON.stringify({ establishments, menu, categories, claimRows }, null, 2));
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ error: error instanceof Error ? error.message : String(error), code: (error as any)?.code }));
  process.exitCode = 1;
});
