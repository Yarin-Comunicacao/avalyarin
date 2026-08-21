import mysql from "mysql2/promise";

async function test() {
  const OFFICIAL_DB_URL = 'mysql://3o1KcwvkeAxCR1d.root:VZJWyUmn9hTODT1L@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/avalyarin';

  try {
    const connection = await mysql.createConnection({
      uri: OFFICIAL_DB_URL,
      ssl: { rejectUnauthorized: true }
    });
    
    console.log("Conectado ao banco oficial.");

    // Criar uma tabela de teste para validação visual do usuário
    console.log("Criando tabela 'manus_test'...");
    await connection.execute("CREATE TABLE IF NOT EXISTS manus_test (id INT PRIMARY KEY, message VARCHAR(255))");
    await connection.execute("INSERT INTO manus_test (id, message) VALUES (1, 'Manus esteve aqui!') ON DUPLICATE KEY UPDATE message = 'Manus esteve aqui de novo!'");
    
    console.log("Tabela 'manus_test' criada e populada.");

    // Listar tabelas para confirmar do meu lado
    const [tables]: any = await connection.execute("SHOW TABLES");
    console.log("Tabelas no banco:", JSON.stringify(tables.map((t: any) => Object.values(t)[0]), null, 2));

    await connection.end();
  } catch (err) {
    console.error("Erro no teste:", err);
  }
}

test();
