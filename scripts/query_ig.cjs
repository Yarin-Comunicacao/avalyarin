const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const [rows] = await connection.execute(
    "SELECT id, name, slug, instagram, image FROM establishments WHERE instagram IS NOT NULL AND instagram != '' AND TRIM(instagram) != '' ORDER BY name"
  );
  console.log('Total establishments with Instagram: ' + rows.length);
  console.log('---');
  for (const row of rows) {
    console.log(JSON.stringify({ id: row.id, name: row.name, slug: row.slug, instagram: row.instagram, hasImage: !!row.image }));
  }
  await connection.end();
  process.exit(0);
}

main();
