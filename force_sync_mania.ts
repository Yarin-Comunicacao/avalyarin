import mysql from "mysql2/promise";
import { categories } from "./server/lib/data_source";

async function forceSync() {
  const DATABASE_URL = "mysql://4LUtXE4vPqQU3CD.root:sCS5ECjAEZ66Z5MzGo25@gateway06.us-east-1.prod.aws.tidbcloud.com:4000/WG3U3sVg2ZrW6m8T99FRdE";
  const targetId = 902260047;
  const targetSlug = "bar-do-juarez-moema";

  try {
    const connection = await mysql.createConnection({
      uri: DATABASE_URL,
      ssl: { rejectUnauthorized: true }
    });
    
    console.log("Conectado ao TiDB.");

    // 1. Verificar se o estabelecimento existe
    const [estRows]: any = await connection.execute(
      "SELECT id, name, slug FROM establishments WHERE id = ?",
      [targetId]
    );

    if (estRows.length === 0) {
      console.log(`Erro: Estabelecimento com ID ${targetId} não encontrado no banco.`);
      await connection.end();
      return;
    }

    console.log(`Estabelecimento encontrado: ${estRows[0].name} (Slug: ${estRows[0].slug})`);

    // 2. Contar itens atuais
    const [countRows]: any = await connection.execute(
      "SELECT count(*) as count FROM menu_items WHERE establishmentId = ?",
      [targetId]
    );
    console.log(`Itens atuais no cardápio: ${countRows[0].count}`);

    // 3. Buscar dados na fonte legada
    let sourceEst = null;
    for (const cat of categories) {
      const found = cat.establishments?.find((e: any) => e.id === targetSlug || targetSlug.includes(e.id));
      if (found) {
        sourceEst = found;
        break;
      }
    }

    if (!sourceEst) {
      console.log("Erro: Dados da Mania de Churrasco não encontrados na fonte legada.");
      await connection.end();
      return;
    }

    console.log(`Dados legados encontrados. Preparando para importar ${sourceEst.menu.length} itens.`);

    // 4. Importar itens
    for (const item of sourceEst.menu) {
      const itemCode = `mi${Math.floor(Math.random() * 900000 + 100000)}`;
      const category = item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : "Outros";
      
      await connection.execute(
        "INSERT IGNORE INTO menu_items (establishmentId, code, name, description, price, category, imageUrl) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [targetId, itemCode, item.name, item.description || null, item.price || 0, category, item.image || null]
      );
      
      // Garantir categoria na tabela menu_categories
      await connection.execute(
        "INSERT IGNORE INTO menu_categories (establishmentId, name, sortOrder) VALUES (?, ?, ?)",
        [targetId, category, 0]
      );
    }

    // 5. Atualizar hasMenu e status
    await connection.execute(
      "UPDATE establishments SET hasMenu = 1, status = 'active' WHERE id = ?",
      [targetId]
    );

    console.log("✅ Sincronização forçada concluída com sucesso!");

    // Verificação final
    const [finalCount]: any = await connection.execute(
      "SELECT count(*) as count FROM menu_items WHERE establishmentId = ?",
      [targetId]
    );
    console.log(`Total de itens após sincronização: ${finalCount[0].count}`);

    await connection.end();
  } catch (err) {
    console.error("Erro durante a sincronização forçada:", err);
  }
}

forceSync();
