import mysql from "mysql2/promise";
import { categories } from "./server/lib/data_source";

async function fix() {
  const OFFICIAL_DB_URL = 'mysql://3o1KcwvkeAxCR1d.root:VZJWyUmn9hTODT1L@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/avalyarin';
  const targetSlug = "mania-de-churrasco";

  try {
    const connection = await mysql.createConnection({
      uri: OFFICIAL_DB_URL,
      ssl: { rejectUnauthorized: true }
    });
    
    console.log("Conectado ao banco oficial.");

    // 1. Encontrar o ID para o slug exato
    const [estRows]: any = await connection.execute(
      "SELECT id, name, slug FROM establishments WHERE slug = ?",
      [targetSlug]
    );

    if (estRows.length === 0) {
      console.log(`Erro: Nenhum estabelecimento encontrado com o slug '${targetSlug}'.`);
      await connection.end();
      return;
    }

    const est = estRows[0];
    console.log(`Alvo no Banco: ${est.name} (ID: ${est.id})`);

    // 2. Coletar todos os itens de todas as ocorrências de Mania na fonte legada
    let allItems: any[] = [];
    for (const cat of categories) {
      const matches = cat.establishments?.filter((e: any) => 
        e.name && e.name.toLowerCase().includes("mania de churrasco")
      ) || [];
      
      for (const m of matches) {
        if (m.menu) {
          console.log(`Coletando ${m.menu.length} itens de '${m.name}' (${m.id})`);
          allItems = [...allItems, ...m.menu];
        }
      }
    }

    if (allItems.length === 0) {
      console.log("Erro: Nenhum item encontrado na fonte legada.");
      await connection.end();
      return;
    }

    console.log(`Total de itens para inserir: ${allItems.length}`);

    // 3. Inserir
    let count = 0;
    for (const item of allItems) {
      const itemCode = `mi${Math.floor(Math.random() * 900000 + 100000)}`;
      const category = item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : "Outros";
      
      await connection.execute(
        "INSERT IGNORE INTO menu_items (establishmentId, code, name, description, price, category, imageUrl) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [est.id, itemCode, item.name, item.description || null, item.price || 0, category, item.image || null]
      );
      
      await connection.execute(
        "INSERT IGNORE INTO menu_categories (establishmentId, name, sortOrder) VALUES (?, ?, ?)",
        [est.id, category, 0]
      );
      count++;
    }

    // 4. Atualizar flag e status
    await connection.execute(
      "UPDATE establishments SET hasMenu = 1, status = 'active' WHERE id = ?",
      [est.id]
    );

    console.log(`✅ Concluído! ${count} itens processados para ID ${est.id}.`);
    
    await connection.end();
  } catch (err) {
    console.error("Erro:", err);
  }
}

fix();
