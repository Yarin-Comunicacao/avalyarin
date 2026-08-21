import mysql from "mysql2/promise";
import { categories } from "./server/lib/data_source";

async function fix() {
  const OFFICIAL_DB_URL = 'mysql://3o1KcwvkeAxCR1d.root:VZJWyUmn9hTODT1L@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/avalyarin';
  const targetId = 30000017;
  const targetSlug = "mania-de-churrasco";

  try {
    const connection = await mysql.createConnection({
      uri: OFFICIAL_DB_URL,
      ssl: { rejectUnauthorized: true }
    });
    
    console.log("Conectado ao banco oficial.");

    // 1. Obter o maior ID atual em menu_items
    const [maxRows]: any = await connection.execute("SELECT MAX(id) as maxId FROM menu_items");
    let nextId = (maxRows[0].maxId || 0) + 1;
    if (nextId < 1000) nextId = 1000; // Garantir um range razoável
    
    console.log(`Próximo ID disponível: ${nextId}`);

    // 2. Coletar itens da fonte legada
    let allItems: any[] = [];
    for (const cat of categories) {
      const matches = cat.establishments?.filter((e: any) => 
        e.id === targetSlug || (e.name && e.name.toLowerCase().includes("mania de churrasco"))
      ) || [];
      for (const m of matches) {
        if (m.menu) allItems = [...allItems, ...m.menu];
      }
    }

    // Remover duplicatas por nome para não poluir
    const uniqueItems = Array.from(new Map(allItems.map(item => [item.name, item])).values());

    console.log(`Inserindo ${uniqueItems.length} itens únicos para o ID ${targetId}...`);

    for (const item of uniqueItems) {
      const itemCode = `mi${Math.floor(Math.random() * 900000 + 100000)}`;
      const category = item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : "Outros";
      
      await connection.execute(
        "INSERT IGNORE INTO menu_items (id, establishmentId, code, name, description, price, category, imageUrl, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())",
        [nextId++, targetId, itemCode, item.name, item.description || null, String(item.price || 0), category, item.image || null]
      );
      
      await connection.execute(
        "INSERT IGNORE INTO menu_categories (establishmentId, name, sortOrder) VALUES (?, ?, ?)",
        [targetId, category, 0]
      );
    }

    await connection.execute("UPDATE establishments SET hasMenu = 1, status = 'active' WHERE id = ?", [targetId]);

    console.log(`✅ Concluído! Cardápio da Mania de Churrasco populado com IDs manuais.`);
    
    await connection.end();
  } catch (err) {
    console.error("Erro:", err);
  }
}

fix();
