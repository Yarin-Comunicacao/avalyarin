import 'dotenv/config';
import mysql from 'mysql2/promise';

async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error('DATABASE_URL ausente');
  const ssl: any = uri.includes('tidbcloud.com') ? { rejectUnauthorized: true } : undefined;
  const connection = await mysql.createConnection({ uri, ssl });

  try {
    const establishmentId = 30000200;
    console.log(`Iniciando inserção de cardápio para The G.O.A.T. Bar (ID: ${establishmentId})`);

    const items = [
      { name: 'Negroni', price: 40, category: 'Drinks' },
      { name: 'Boulevardier', price: 42, category: 'Drinks' },
      { name: 'Jack & Coke On Tap (Pequeno)', price: 28, category: 'Drinks' },
      { name: 'Jack & Coke On Tap (Grande)', price: 40, category: 'Drinks' },
      { name: 'Gin Tônica', price: 40, category: 'Drinks' },
      { name: 'Rabo de Galo', price: 35, category: 'Drinks' },
      { name: 'Buffalo Trace', price: 45, category: 'Whiskys' },
      { name: 'Bulleit', price: 48, category: 'Whiskys' },
      { name: 'Makers Mark', price: 45, category: 'Whiskys' },
      { name: 'Woodford Reserve', price: 48, category: 'Whiskys' },
      { name: 'Jack Daniels', price: 38, category: 'Whiskys' },
      { name: 'Jim Beam', price: 32, category: 'Whiskys' },
      { name: 'Jagermeister', price: 33, category: 'Outros' },
      { name: 'Lua Nova (Cachaça)', price: 13, category: 'Outros' },
      { name: 'GOAT IPA (Pequeno - 350ml)', price: 20, category: 'Chopps' },
      { name: 'GOAT IPA (Grande - 500ml)', price: 29, category: 'Chopps' },
      { name: 'GOAT APA (Pequeno - 350ml)', price: 19, category: 'Chopps' },
      { name: 'GOAT APA (Grande - 500ml)', price: 28, category: 'Chopps' },
      { name: 'GOAT PILS (Pequeno - 350ml)', price: 12, category: 'Chopps' },
      { name: 'GOAT PILS (Grande - 500ml)', price: 19, category: 'Chopps' },
      { name: 'RED GOAT (Pequeno - 350ml)', price: 19, category: 'Chopps' },
      { name: 'RED GOAT (Grande - 500ml)', price: 28, category: 'Chopps' },
      { name: 'JUAN CALOTO Dry Stout (Pequeno - 350ml)', price: 22, category: 'Chopps' },
      { name: 'JUAN CALOTO Dry Stout (Grande - 500ml)', price: 33, category: 'Chopps' },
      { name: 'GOAT & COKE Jack and Coke (Pequeno)', price: 25, category: 'Drinks' },
      { name: 'GOAT & COKE Jack and Coke (Grande)', price: 38, category: 'Drinks' },
    ];

    let currentMenuCodeNum = 283039;
    let currentMenuId = 480511;

    for (const item of items) {
      const menuCode = `mi${currentMenuCodeNum.toString().padStart(6, '0')}`;
      await connection.query(
        `INSERT INTO menu_items (id, code, establishmentId, name, price, category, createdAt) 
        VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [currentMenuId, menuCode, establishmentId, item.name, item.price, item.category]
      );
      currentMenuCodeNum++;
      currentMenuId++;
    }

    // Ativar flag hasMenu no estabelecimento
    await connection.query(
      "UPDATE establishments SET hasMenu = 1 WHERE id = ?",
      [establishmentId]
    );

    console.log(`Sucesso! ${items.length} itens inseridos e flag hasMenu ativada.`);

  } finally {
    await connection.end();
  }
}

main().catch(console.error);
