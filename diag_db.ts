import mysql from "mysql2/promise";

async function check() {
  const DATABASE_URL = "mysql://4LUtXE4vPqQU3CD.root:sCS5ECjAEZ66Z5MzGo25@gateway06.us-east-1.prod.aws.tidbcloud.com:4000/WG3U3sVg2ZrW6m8T99FRdE";
  
  try {
    const connection = await mysql.createConnection({
      uri: DATABASE_URL,
      ssl: { rejectUnauthorized: true }
    });
    
    console.log("Conectado ao TiDB.");
    
    const [estRows]: any = await connection.execute(
      "SELECT id, slug, name, hasMenu, status FROM establishments WHERE name LIKE '%Mania%'"
    );
    
    console.log(`Encontrados ${estRows.length} estabelecimentos.`);
    
    for (const est of estRows) {
      const [menuRows]: any = await connection.execute(
        "SELECT count(*) as count FROM menu_items WHERE establishmentId = ?",
        [est.id]
      );
      console.log(`ID: ${est.id}, Slug: ${est.slug}, Name: ${est.name}, Items: ${menuRows[0].count}, Status: ${est.status}`);
    }
    
    await connection.end();
  } catch (err) {
    console.error("Erro na consulta:", err);
  }
}

check();
