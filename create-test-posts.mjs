import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const estabId = 90003; // Bar Teste Avalyarin
const userId = 1; // owner/admin user

// Posts de destaque (9:16 vertical - stories-like)
const posts = [
  {
    type: 'brand',
    title: 'Smash Pinheiros',
    description: 'Nosso smash burger duplo com cheddar, cebola caramelizada e molho da casa. O favorito da galera!',
    imageUrl: '/manus-storage/bar-teste-destaque-1_39f7ad2a.jpg',
    imageKey: 'bar-teste-destaque-1_39f7ad2a.jpg',
  },
  {
    type: 'brand',
    title: 'Negroni Clássico',
    description: 'Gin, Campari e Vermute Rosso — servido com esfera de gelo e casca de laranja. Perfeito para começar a noite.',
    imageUrl: '/manus-storage/bar-teste-destaque-2_96490f63.jpg',
    imageKey: 'bar-teste-destaque-2_96490f63.jpg',
  },
  {
    type: 'menu_daily',
    title: 'Pizza Margherita',
    description: 'Massa artesanal, molho San Marzano, mozzarella di bufala e manjericão fresco. Direto do forno a lenha!',
    imageUrl: '/manus-storage/bar-teste-destaque-3_e464478f.jpg',
    imageKey: 'bar-teste-destaque-3_e464478f.jpg',
  },
  {
    type: 'promotion',
    title: 'Bowl Mediterrâneo',
    description: 'Quinoa, falafel, homus, tabule e molho tahine. Opção vegetariana que conquista até os carnívoros!',
    imageUrl: '/manus-storage/bar-teste-destaque-4_0d7e0292.jpg',
    imageKey: 'bar-teste-destaque-4_0d7e0292.jpg',
  },
  {
    type: 'event',
    title: 'Degustação de Cervejas',
    description: 'Toda quinta-feira: flight de 4 cervejas artesanais por R$49. IPA, Stout, Pilsen e Sour — escolha sua favorita!',
    imageUrl: '/manus-storage/bar-teste-destaque-5_a5425573.jpg',
    imageKey: 'bar-teste-destaque-5_a5425573.jpg',
  },
];

const now = new Date();
const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

for (const post of posts) {
  await conn.execute(
    `INSERT INTO establishment_posts (establishmentId, userId, type, title, description, imageUrl, imageKey, startsAt, expiresAt, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [estabId, userId, post.type, post.title, post.description, post.imageUrl, post.imageKey, now, expiresAt, 'active']
  );
}

console.log(`✅ ${posts.length} posts de destaque criados para o Bar Teste Avalyarin`);
console.log(`   Tipos: brand (2), menu_daily (1), promotion (1), event (1)`);
console.log(`   Status: active`);
console.log(`   Expira em: ${expiresAt.toLocaleDateString('pt-BR')}`);

// Also set the main image for the establishment
await conn.execute(
  `UPDATE establishments SET image = ? WHERE id = ?`,
  ['/manus-storage/bar-teste-destaque-1_39f7ad2a.jpg', estabId]
);
console.log(`✅ Imagem principal do estabelecimento atualizada`);

await conn.end();
