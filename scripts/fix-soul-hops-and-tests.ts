import 'dotenv/config';
import mysql from 'mysql2/promise';

async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error('DATABASE_URL ausente');
  const ssl: any = uri.includes('tidbcloud.com') ? { rejectUnauthorized: true } : undefined;
  const connection = await mysql.createConnection({ uri, ssl });

  try {
    console.log('--- Restaurando Estabelecimentos de Teste ---');
    const testEstabs = [
      { id: 999991, name: 'Estabelecimento de Teste 1', slug: 'teste-1', categoryId: 1 },
      { id: 999992, name: 'Estabelecimento de Teste 2', slug: 'teste-2', categoryId: 1 },
      { id: 999993, name: 'Estabelecimento de Teste 3', slug: 'teste-3', categoryId: 1 },
      { id: 999994, name: 'Estabelecimento de Teste 4', slug: 'teste-4', categoryId: 1 },
    ];

    for (const est of testEstabs) {
      const code = `es${Math.floor(Math.random() * 900000 + 100000)}`;
      await connection.query(
        `INSERT INTO establishments (id, code, slug, name, status, categoryId, lat, lng, createdAt) 
         VALUES (?, ?, ?, ?, 'active', ?, -23.5505, -46.6333, NOW()) 
         ON DUPLICATE KEY UPDATE name = VALUES(name), status = 'active'`,
        [est.id, code, est.slug, est.name, est.categoryId]
      );
      console.log(`Test Est ${est.id} pronto.`);
    }

    console.log('--- Movendo avaliações de teste do Soul Hops (30000189) para Teste 1 (999991) ---');
    // Avaliações identificadas como teste: 3390001, 3390002, 3000001, 2970001
    const testRatingIds = [3390001, 3390002, 3000001, 2970001];
    
    const [result]: any = await connection.query(
      `UPDATE ratings SET establishmentId = 999991 WHERE id IN (?) AND establishmentId = 30000189`,
      [testRatingIds]
    );
    
    console.log(`${result.affectedRows} avaliações movidas para o estabelecimento de teste.`);

    console.log('--- Sucesso! ---');

  } finally {
    await connection.end();
  }
}

main().catch(console.error);
