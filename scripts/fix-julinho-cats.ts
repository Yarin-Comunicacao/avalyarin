import 'dotenv/config';
import mysql from 'mysql2/promise';

async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error('DATABASE_URL missing');
  const ssl: any = uri.includes('tidbcloud.com') ? { rejectUnauthorized: true } : undefined;
  const connection = await mysql.createConnection({ uri, ssl });

  try {
    // 1. Move items from Gin and Vodkas to Doses
    const [updateResult]: any = await connection.query(
      "UPDATE menu_items SET category = 'Doses' WHERE establishmentId = 30000199 AND category IN ('Gin', 'Vodkas')"
    );
    console.log(`${updateResult.affectedRows} itens movidos para Doses.`);

    // 2. Remove Gin and Vodkas from menu_categories
    const [deleteResult]: any = await connection.query(
      "DELETE FROM menu_categories WHERE establishmentId = 30000199 AND name IN ('Gin', 'Vodkas')"
    );
    console.log(`${deleteResult.affectedRows} categorias removidas de menu_categories.`);

    // 3. Verify the final categories in menu_items
    const [rows]: any = await connection.query(
      "SELECT DISTINCT category FROM menu_items WHERE establishmentId = 30000199"
    );
    console.log('Categorias atuais no Julinho:', rows.map((r: any) => r.category));

  } finally {
    await connection.end();
  }
}

main().catch(console.error);
