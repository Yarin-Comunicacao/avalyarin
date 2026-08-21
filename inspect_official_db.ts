import mysql from "mysql2/promise";

async function inspect() {
  const OFFICIAL_DB_URL = 'mysql://3o1KcwvkeAxCR1d.root:VZJWyUmn9hTODT1L@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/avalyarin';

  try {
    const connection = await mysql.createConnection({
      uri: OFFICIAL_DB_URL,
      ssl: { rejectUnauthorized: true }
    });
    
    console.log("Conectado ao banco oficial.");

    // 1. Verificar Mania de Churrasco na tabela establishments
    const [ests]: any = await connection.execute(
      "SELECT id, slug, name, status, hasMenu FROM establishments WHERE name LIKE '%Mania%'"
    );
    console.log("Estabelecimentos 'Mania' no banco:", JSON.stringify(ests, null, 2));

    // 2. Contar itens totais em menu_items
    const [totalItems]: any = await connection.execute("SELECT count(*) as count FROM menu_items");
    console.log("Total de itens em menu_items:", totalItems[0].count);

    // 3. Listar os IDs de estabelecimento que possuem itens
    const [estIdsWithItems]: any = await connection.execute(
      "SELECT establishmentId, count(*) as count FROM menu_items GROUP BY establishmentId"
    );
    console.log("IDs de estabelecimentos com itens:", JSON.stringify(estIdsWithItems, null, 2));

    // 4. Se o ID 30000017 não tiver itens, tentar inserir um item de teste manualmente
    const targetId = 30000017;
    const hasTarget = estIdsWithItems.some((row: any) => row.establishmentId === targetId);
    
    if (!hasTarget) {
      console.log(`ID ${targetId} não tem itens. Tentando inserção manual de teste...`);
      const [res]: any = await connection.execute(
        "INSERT INTO menu_items (establishmentId, code, name, price, category) VALUES (?, ?, ?, ?, ?)",
        [targetId, 'test-code-123', 'Item de Teste Manus', 99.99, 'Teste']
      );
      console.log("Resultado da inserção manual:", JSON.stringify(res, null, 2));
    }

    await connection.end();
  } catch (err) {
    console.error("Erro na inspeção:", err);
  }
}

inspect();
