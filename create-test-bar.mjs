import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Generate a unique code
const code = 'tst' + Math.random().toString(36).slice(2, 8);

// 1. Create the test establishment
// Columns: id, code, slug, name, address, neighborhood, region, lat, lng, rating, reviewCount, image, hours, phone, instagram, categoryId, hasMenu, source, createdAt, status, description, complement, addressNumber
const [insertResult] = await conn.execute(
  `INSERT INTO establishments (code, slug, name, address, neighborhood, region, lat, lng, rating, reviewCount, image, hours, phone, instagram, categoryId, hasMenu, source, status, description, complement, addressNumber)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    code,
    'bar-teste-avalyarin',
    'Bar Teste Avalyarin',
    'Rua dos Pinheiros, 999',
    'Pinheiros',
    'Pinheiros',
    -23.5630,
    -46.6900,
    0, // rating
    0, // reviewCount
    null, // image
    JSON.stringify({
      seg: '17:00–01:00',
      ter: '17:00–01:00',
      qua: '17:00–01:00',
      qui: '17:00–02:00',
      sex: '17:00–03:00',
      sab: '12:00–03:00',
      dom: '12:00–22:00',
    }),
    '(11) 99999-9999',
    '@bartesteavalirin',
    60003, // categoryId = Gastrobar
    true,  // hasMenu
    'manual', // source
    'active', // status
    'Estabelecimento de teste para validar todas as funcionalidades do sistema Avalyarin. Gastrobar com cardápio completo incluindo hambúrgueres autorais, pizzas, pratos brasileiros, internacionais, vegetarianos, cervejas artesanais, drinks e sobremesas.',
    null, // complement
    '999', // addressNumber
  ]
);

const estabId = insertResult.insertId;
console.log(`✅ Estabelecimento criado: ID ${estabId}`);

// 2. Link to ALL food categories (N:N)
const foodCategoryIds = [
  60003, // Gastrobar (primary)
  2,     // Cozinha Brasileira
  17,    // Cozinha Internacional
  3,     // Autoral / Contemporâneo
  16,    // Hamburgueria e Lanches
  14,    // Pizzaria
  60004, // Lanches
  60002, // Restaurante
  60001, // Vegetariano
];

for (const catId of foodCategoryIds) {
  const isPrimary = catId === 60003;
  await conn.execute(
    `INSERT INTO establishment_categories (establishmentId, categoryId, isPrimary) VALUES (?, ?, ?)`,
    [estabId, catId, isPrimary]
  );
}
console.log(`✅ Vinculado a ${foodCategoryIds.length} categorias de alimentos`);

// 3. Create a comprehensive menu
// Columns: id, code, establishmentId, name, description, price, category, createdAt, imageUrl, imageKey, imageThumbUrl, imageThumbKey
const menuItems = [
  // === HAMBÚRGUERES AUTORAIS ===
  { name: 'Smash Pinheiros', category: 'Hambúrgueres', description: 'Smash burger duplo com queijo cheddar, cebola caramelizada e molho da casa', price: 42.00 },
  { name: 'Burger Nordestino', category: 'Hambúrgueres', description: 'Hambúrguer com queijo coalho, carne de sol desfiada e manteiga de garrafa', price: 48.00 },
  { name: 'Lamb Burger', category: 'Hambúrgueres', description: 'Hambúrguer de cordeiro com molho tzatziki e rúcula', price: 55.00 },
  { name: 'Veggie Burger', category: 'Hambúrgueres', description: 'Hambúrguer de grão de bico com guacamole e chips de batata doce', price: 38.00 },
  { name: 'Burger Trufado', category: 'Hambúrgueres', description: 'Angus com queijo brie, cogumelos salteados e azeite trufado', price: 62.00 },
  { name: 'Classic Cheese', category: 'Hambúrgueres', description: 'Blend da casa 180g, cheddar, alface, tomate e pickles', price: 36.00 },

  // === PIZZAS ===
  { name: 'Margherita', category: 'Pizzas', description: 'Molho de tomate San Marzano, mozzarella di bufala e manjericão fresco', price: 58.00 },
  { name: 'Pepperoni', category: 'Pizzas', description: 'Molho de tomate, mozzarella e pepperoni artesanal', price: 62.00 },
  { name: 'Funghi Trufado', category: 'Pizzas', description: 'Creme de cogumelos, mix de funghi, parmesão e azeite trufado', price: 72.00 },
  { name: 'Pizza Vegana', category: 'Pizzas', description: 'Molho pesto, abobrinha, berinjela, pimentão e queijo vegano', price: 56.00 },

  // === PRATOS BRASILEIROS ===
  { name: 'Picanha na Brasa', category: 'Pratos Principais', description: 'Picanha grelhada com arroz, farofa, vinagrete e mandioca frita', price: 85.00 },
  { name: 'Moqueca de Peixe', category: 'Pratos Principais', description: 'Moqueca baiana com peixe do dia, leite de coco, dendê e arroz', price: 78.00 },
  { name: 'Feijoada Completa', category: 'Pratos Principais', description: 'Feijoada com todos os acompanhamentos tradicionais (sábados)', price: 68.00 },

  // === PRATOS INTERNACIONAIS ===
  { name: 'Risotto de Camarão', category: 'Pratos Internacionais', description: 'Risotto arbóreo com camarões grelhados, açafrão e parmesão', price: 82.00 },
  { name: 'Pad Thai', category: 'Pratos Internacionais', description: 'Macarrão de arroz com camarão, amendoim, broto de feijão e tamarindo', price: 58.00 },
  { name: 'Fish & Chips', category: 'Pratos Internacionais', description: 'Peixe empanado em massa de cerveja com batatas fritas e tartar', price: 52.00 },

  // === PRATOS VEGETARIANOS ===
  { name: 'Bowl Mediterrâneo', category: 'Vegetariano', description: 'Quinoa, falafel, homus, tabule, azeitonas e molho tahine', price: 45.00 },
  { name: 'Curry de Legumes', category: 'Vegetariano', description: 'Curry tailandês com leite de coco, legumes da estação e arroz jasmim', price: 42.00 },
  { name: 'Nhoque de Abóbora', category: 'Vegetariano', description: 'Nhoque artesanal de abóbora com molho de sálvia e manteiga', price: 48.00 },
  { name: 'Salada Caesar Vegana', category: 'Vegetariano', description: 'Alface romana, croutons, molho caesar vegano e parmesão de castanha', price: 35.00 },

  // === LANCHES ===
  { name: 'Hot Dog Gourmet', category: 'Lanches', description: 'Salsicha artesanal, cheddar, bacon crocante e cebola crispy', price: 28.00 },
  { name: 'Bauru Clássico', category: 'Lanches', description: 'Rosbife, queijo, tomate e picles no pão francês', price: 32.00 },
  { name: 'Club Sandwich', category: 'Lanches', description: 'Frango, bacon, ovo, alface, tomate em pão de forma tostado', price: 34.00 },

  // === PETISCOS ===
  { name: 'Bolinho de Bacalhau', category: 'Petiscos', description: '6 unidades com maionese de ervas', price: 38.00 },
  { name: 'Coxinha de Frango', category: 'Petiscos', description: '4 coxinhas crocantes com catupiry e molho de pimenta', price: 28.00 },
  { name: 'Bruschetta Caprese', category: 'Petiscos', description: 'Tomate, mozzarella de búfala, manjericão e redução de balsâmico', price: 32.00 },
  { name: 'Edamame com Flor de Sal', category: 'Petiscos', description: 'Edamame no vapor com flor de sal e pimenta', price: 22.00 },

  // === SOBREMESAS ===
  { name: 'Petit Gâteau', category: 'Sobremesas', description: 'Bolo de chocolate com centro derretido e sorvete de baunilha', price: 32.00 },
  { name: 'Churros com Doce de Leite', category: 'Sobremesas', description: 'Churros crocantes com doce de leite argentino', price: 24.00 },
  { name: 'Cheesecake de Frutas Vermelhas', category: 'Sobremesas', description: 'Cheesecake cremoso com calda de frutas vermelhas', price: 28.00 },

  // === CERVEJAS ARTESANAIS ===
  { name: 'IPA Tropical', category: 'Cervejas Artesanais', description: 'IPA com lúpulos tropicais, notas de maracujá e manga - 500ml', price: 28.00 },
  { name: 'Pilsen Premium', category: 'Cervejas Artesanais', description: 'Pilsen leve e refrescante, malte alemão - 500ml', price: 22.00 },
  { name: 'Stout Café', category: 'Cervejas Artesanais', description: 'Stout encorpada com café torrado e chocolate amargo - 500ml', price: 30.00 },
  { name: 'Weiss Banana', category: 'Cervejas Artesanais', description: 'Trigo com notas de banana e cravo - 500ml', price: 26.00 },
  { name: 'Sour Framboesa', category: 'Cervejas Artesanais', description: 'Cerveja ácida com framboesa natural - 350ml', price: 32.00 },
  { name: 'Session IPA', category: 'Cervejas Artesanais', description: 'IPA leve, cítrica e fácil de beber - 500ml', price: 24.00 },

  // === CERVEJAS COMERCIAIS ===
  { name: 'Heineken Long Neck', category: 'Cervejas', description: '330ml', price: 14.00 },
  { name: 'Chopp Brahma', category: 'Cervejas', description: 'Chopp claro 300ml', price: 12.00 },
  { name: 'Corona Extra', category: 'Cervejas', description: '330ml com limão', price: 16.00 },

  // === DRINKS / COQUETÉIS ===
  { name: 'Negroni', category: 'Drinks', description: 'Gin, Campari e Vermute Rosso', price: 38.00 },
  { name: 'Caipirinha Clássica', category: 'Drinks', description: 'Cachaça artesanal, limão e açúcar', price: 28.00 },
  { name: 'Moscow Mule', category: 'Drinks', description: 'Vodka, ginger beer e limão na caneca de cobre', price: 35.00 },
  { name: 'Aperol Spritz', category: 'Drinks', description: 'Aperol, prosecco e água com gás', price: 36.00 },
  { name: 'Old Fashioned', category: 'Drinks', description: 'Bourbon, angostura, açúcar e casca de laranja', price: 42.00 },
  { name: 'Gin Tônica da Casa', category: 'Drinks', description: 'Gin premium, tônica artesanal, pepino e alecrim', price: 34.00 },

  // === VINHOS ===
  { name: 'Malbec Argentino (taça)', category: 'Vinhos', description: 'Tinto encorpado da Mendoza - 150ml', price: 32.00 },
  { name: 'Sauvignon Blanc (taça)', category: 'Vinhos', description: 'Branco chileno, cítrico e refrescante - 150ml', price: 28.00 },

  // === NÃO ALCOÓLICOS ===
  { name: 'Suco Natural de Laranja', category: 'Não Alcoólicos', description: '400ml', price: 14.00 },
  { name: 'Água com Gás', category: 'Não Alcoólicos', description: '500ml', price: 8.00 },
  { name: 'Refrigerante', category: 'Não Alcoólicos', description: 'Coca-Cola, Guaraná ou Sprite - 350ml', price: 10.00 },
  { name: 'Mocktail Tropical', category: 'Não Alcoólicos', description: 'Maracujá, abacaxi, gengibre e água tônica', price: 22.00 },
];

// Insert menu items
let count = 0;
for (const item of menuItems) {
  const itemCode = `mi_test_${count++}`;
  await conn.execute(
    `INSERT INTO menu_items (code, establishmentId, name, description, price, category)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [itemCode, estabId, item.name, item.description, item.price, item.category]
  );
}
console.log(`✅ ${menuItems.length} itens de cardápio inseridos`);

console.log(`\n🎉 Bar Teste Avalyarin criado com sucesso!`);
console.log(`   ID: ${estabId}`);
console.log(`   Slug: bar-teste-avalyarin`);
console.log(`   Categorias: ${foodCategoryIds.length} (todas de alimentos)`);
console.log(`   Cardápio: ${menuItems.length} itens`);
console.log(`   - Hambúrgueres: 6`);
console.log(`   - Pizzas: 4`);
console.log(`   - Pratos Brasileiros: 3`);
console.log(`   - Pratos Internacionais: 3`);
console.log(`   - Vegetarianos: 4`);
console.log(`   - Lanches: 3`);
console.log(`   - Petiscos: 4`);
console.log(`   - Sobremesas: 3`);
console.log(`   - Cervejas Artesanais: 6`);
console.log(`   - Cervejas Comerciais: 3`);
console.log(`   - Drinks: 6`);
console.log(`   - Vinhos: 2`);
console.log(`   - Não Alcoólicos: 4`);

await conn.end();
