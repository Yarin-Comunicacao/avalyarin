import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const code = 'smb' + Math.random().toString(36).slice(2, 8);

// 1. Criar o estabelecimento Samba Burguer
const [insertResult] = await conn.execute(
  `INSERT INTO establishments (code, slug, name, address, neighborhood, region, lat, lng, rating, reviewCount, image, hours, phone, instagram, categoryId, hasMenu, source, status, description, complement, addressNumber)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    code,
    'samba-burguer',
    'Samba Burguer',
    'Rua Mourato Coelho, 432',
    'Pinheiros',
    'Pinheiros',
    -23.5618,
    -46.6882,
    0,
    0,
    null,
    JSON.stringify({
      seg: 'Fechado',
      ter: '18:00–01:00',
      qua: '18:00–01:00',
      qui: '18:00–02:00',
      sex: '18:00–04:00',
      sab: '16:00–04:00',
      dom: '16:00–00:00',
    }),
    '(11) 98765-4321',
    '@sambaburguer',
    60003, // categoryId principal = Gastrobar
    true,
    'manual',
    'active',
    'Bar e balada com os melhores hambúrgueres artesanais de Pinheiros. Música ao vivo com samba e pagode toda sexta e sábado. Ambiente descontraído com área externa e drinks autorais.',
    null,
    '432',
  ]
);

const estabId = insertResult.insertId;
console.log(`✅ Samba Burguer criado: ID ${estabId}, code: ${code}`);

// 2. Vincular categorias (Bar/Balada + Hamburgueria)
const categoryIds = [
  60003, // Gastrobar (primary)
  16,    // Hamburgueria e Lanches
  60004, // Lanches
  1,     // Bar & Lanchonete
];

for (const catId of categoryIds) {
  const isPrimary = catId === 60003;
  await conn.execute(
    `INSERT INTO establishment_categories (establishmentId, categoryId, isPrimary) VALUES (?, ?, ?)`,
    [estabId, catId, isPrimary]
  );
}
console.log(`✅ Vinculado a ${categoryIds.length} categorias`);

await conn.end();
console.log('\n🎉 Samba Burguer criado com sucesso! Cardápio será adicionado manualmente pelo Painel Empresarial.');
