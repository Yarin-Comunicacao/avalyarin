import 'dotenv/config';
import mysql from 'mysql2/promise';

const SOUL_HOPS_ID = 30000189;

const soulHopsMenu = [
  { name: "Cerveja Pilsen Premium 1L", description: "5% abv | 9 ibu - German Pilsen receita da Dude, extrema e muito bem preparada", price: 55.00, category: "Chopp" },
  { name: "Cerveja Pilsen 1L", description: "4,3% abv | 9 ibu - Pilsen receita da Soulhops, Lager tradicional, leve para o dia todo", price: 36.00, category: "Chopp" },
  { name: "Cerveja Witbier 1L", description: "5,1% abv | 13 ibu - Witbier da Dádiva, leve e refrescante com notas de laranja", price: 45.00, category: "Chopp" },
  { name: "Cerveja Session IPA 1L", description: "4,5% abv | 30 ibu - Session IPA da Everbrew, bastante lúpulo para aroma", price: 50.00, category: "Chopp" },
  { name: "Cerveja American IPA 1L", description: "6% abv | 55 ibu - IPA clássica, bem lúpulada com amargor forte", price: 55.00, category: "Chopp" },
  { name: "Cerveja NEIPA 1L", description: "6,5% abv | 50 ibu - New England IPA frutada, cítrica e com muito aroma", price: 97.00, category: "Chopp" },
  { name: "Cerveja Double IPA 1L", description: "8,1% abv - Double IPA encorpada e intensa", price: 97.00, category: "Chopp" },
  { name: "Cerveja Red Ale 1L", description: "5,1% abv | 30 ibu - Red Ale da Everbrew com notas de caramelo e toffee", price: 50.00, category: "Chopp" },
  { name: "Cerveja Sour Leve 1L", description: "3,8% abv | 7 ibu - Sour de frutas vermelhas, leve e refrescante", price: 50.00, category: "Chopp" },
  { name: "X-Burger Pão, Carne e Queijo", description: "Burger 481 de 180g com queijo prato e cheddar fatiado no pão brioche selado", price: 44.90, category: "Hamburguer" },
  { name: "X-Bacon", description: "Burger 481 de 180g, bacon, queijo prato e cheddar fatiado no pão brioche selado", price: 51.90, category: "Hamburguer" },
  { name: "X-Fonduta de Queijo e Bacon", description: "Burger 481 de 180g com fonduta cremosa de queijos e farofa crocante de bacon", price: 56.90, category: "Hamburguer" },
  { name: "X-Geleia de Bacon e Rúcula", description: "Pão brioche selado, burger 481 de 180g, queijo, geleia de bacon agridoce e rúcula", price: 56.90, category: "Hamburguer" },
  { name: "X-Vegetariano", description: "Burger artesanal de cogumelos e feijão, alface, tomate, cebola roxa e queijo", price: 51.90, category: "Hamburguer" },
  { name: "Bolinho de Cupim da Casa", description: "Muito cupim desfiado, mandioquinha, envolto em panko", price: 54.90, category: "Petisco" },
  { name: "Dadinhos de Tapioca", description: "Dadinho de tapioca com calda de laranja e pimenta", price: 43.00, category: "Petisco" },
  { name: "Fritas", description: "Porção de fritas sequinhas e crocantes", price: 35.90, category: "Petisco" },
  { name: "Fritas Cupim e Fonduta de Queijos", description: "Fritas crocantes com cupim desfiado e fonduta cremosa de queijos", price: 59.80, category: "Petisco" },
  { name: "Pastel de Cupim", description: "Desfiado, super crocante e saboroso", price: 20.90, category: "Petisco" },
  { name: "Coca-Cola 350ml", description: "Lata 350ml", price: 10.00, category: "Bebida" },
  { name: "Água Lindoya 510ml", description: "Garrafa 510ml", price: 8.00, category: "Bebida" },
  { name: "Combo 4L Pilsen Premium", description: "4 litros de Pilsen premium receita da Dude", price: 176.00, category: "Chopp" },
  { name: "Combo 4L Pilsen", description: "4 litros da Pilsen (cadeirinha) para curtir", price: 107.00, category: "Chopp" },
  { name: "Combo 4L Session IPA", description: "4 litros da Session IPA para refrescar", price: 158.00, category: "Chopp" },
];

async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error('DATABASE_URL ausente');
  const ssl: any = uri.includes('tidbcloud.com') ? { rejectUnauthorized: true } : undefined;
  const connection = await mysql.createConnection({ uri, ssl });

  try {
    console.log(`Limpando itens antigos para o estabelecimento ${SOUL_HOPS_ID}...`);
    await connection.query('DELETE FROM menu_items WHERE establishmentId = ?', [SOUL_HOPS_ID]);
    await connection.query('DELETE FROM menu_categories WHERE establishmentId = ?', [SOUL_HOPS_ID]);

    const [m]: any = await connection.query('SELECT MAX(id) as maxId FROM menu_items');
    const [c]: any = await connection.query('SELECT MAX(id) as maxId FROM menu_categories');
    let nextMenuId = (m[0].maxId || 500000) + 1;
    let nextCatId = (c[0].maxId || 70000) + 1;

    const categories = Array.from(new Set(soulHopsMenu.map(i => i.category)));
    console.log(`Inserindo ${categories.length} categorias...`);
    for (let i = 0; i < categories.length; i++) {
      await connection.query(
        'INSERT INTO menu_categories (id, establishmentId, name, sortOrder, createdAt) VALUES (?, ?, ?, ?, NOW())',
        [nextCatId++, SOUL_HOPS_ID, categories[i], i]
      );
    }

    console.log(`Inserindo ${soulHopsMenu.length} itens do cardápio...`);
    for (const item of soulHopsMenu) {
      const code = `mi${Math.floor(Math.random() * 900000 + 100000)}`;
      await connection.query(
        `INSERT INTO menu_items (id, establishmentId, code, name, description, price, category, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [nextMenuId++, SOUL_HOPS_ID, code, item.name, item.description, item.price, item.category]
      );
    }

    console.log('Atualizando flag hasMenu do estabelecimento...');
    await connection.query('UPDATE establishments SET hasMenu = 1 WHERE id = ?', [SOUL_HOPS_ID]);

    console.log('Restauração concluída com sucesso!');
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
