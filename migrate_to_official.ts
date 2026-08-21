import mysql from "mysql2/promise";
import { categories } from "./server/lib/data_source";

async function migrate() {
  const OFFICIAL_DB_URL = 'mysql://3o1KcwvkeAxCR1d.root:VZJWyUmn9hTODT1L@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/avalyarin';
  
  try {
    const connection = await mysql.createConnection({
      uri: OFFICIAL_DB_URL,
      ssl: { rejectUnauthorized: true }
    });
    
    console.log("Conectado ao banco oficial 'avalyarin'.");

    // 1. Verificar tabelas existentes
    const [tables]: any = await connection.execute("SHOW TABLES");
    const tableList = tables.map((t: any) => Object.values(t)[0]);
    console.log("Tabelas encontradas:", tableList.join(", "));

    if (!tableList.includes("establishments") || !tableList.includes("menu_items")) {
      console.error("Erro: Tabelas essenciais não encontradas. Verifique se as migrações foram rodadas.");
      await connection.end();
      return;
    }

    // 2. Importar todos os estabelecimentos da fonte legada
    console.log("Iniciando importação de estabelecimentos e cardápios...");
    let estCount = 0;
    let itemCount = 0;

    for (const cat of categories) {
      if (!cat.establishments) continue;
      for (const sourceEst of cat.establishments) {
        const [estRows]: any = await connection.execute("SELECT id FROM establishments WHERE slug = ?", [sourceEst.id]);
        
        if (estRows.length > 0) {
          const establishmentId = estRows[0].id;
          console.log(`Sincronizando ${sourceEst.name} (ID: ${establishmentId})...`);
          
          if (sourceEst.menu && sourceEst.menu.length > 0) {
            for (const item of sourceEst.menu) {
              const itemCode = `mi${Math.floor(Math.random() * 900000 + 100000)}`;
              const category = item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : "Outros";
              
              await connection.execute(
                "INSERT IGNORE INTO menu_items (establishmentId, code, name, description, price, category, imageUrl) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [establishmentId, itemCode, item.name, item.description || null, item.price || 0, category, item.image || null]
              );
              
              await connection.execute(
                "INSERT IGNORE INTO menu_categories (establishmentId, name, sortOrder) VALUES (?, ?, ?)",
                [establishmentId, category, 0]
              );
              itemCount++;
            }
            await connection.execute("UPDATE establishments SET hasMenu = 1, status = 'active' WHERE id = ?", [establishmentId]);
          }
          estCount++;
        }
      }
    }

    console.log(`✅ Migração concluída!`);
    console.log(`Estabelecimentos processados: ${estCount}`);
    console.log(`Itens de cardápio inseridos: ${itemCount}`);

    await connection.end();
  } catch (err) {
    console.error("Erro durante a migração:", err);
  }
}

migrate();
