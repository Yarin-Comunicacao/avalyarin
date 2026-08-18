import 'dotenv/config';
import mysql from 'mysql2/promise';

async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error('DATABASE_URL ausente');
  const parsedUri = new URL(uri);
  const hostname = parsedUri.hostname.toLowerCase();
  const isTiDBCloudHost = hostname === 'tidbcloud.com' || hostname.endsWith('.tidbcloud.com');
  const ssl: any = isTiDBCloudHost ? { rejectUnauthorized: true } : undefined;
  const connection = await mysql.createConnection({ uri, ssl });

  try {
    console.log('Iniciando migração do schema no TiDB...');

    // 1. business_claims: Adicionar businessRole e invitedBy
    console.log('Verificando colunas em business_claims...');
    const [claimCols]: any = await connection.query('SHOW COLUMNS FROM business_claims');
    const claimColNames = claimCols.map((c: any) => c.Field);

    if (!claimColNames.includes('businessRole')) {
      console.log('Adicionando coluna businessRole em business_claims...');
      await connection.query("ALTER TABLE business_claims ADD COLUMN businessRole ENUM('owner', 'manager', 'staff') DEFAULT 'owner' NOT NULL AFTER status");
    }

    if (!claimColNames.includes('invitedBy')) {
      console.log('Adicionando coluna invitedBy em business_claims...');
      await connection.query("ALTER TABLE business_claims ADD COLUMN invitedBy BIGINT NULL AFTER businessRole");
    }

    // 2. users: Verificar description e gender (já vimos que existem, mas garantir tipos)
    console.log('Verificando colunas em users...');
    const [userCols]: any = await connection.query('SHOW COLUMNS FROM users');
    const userColNames = userCols.map((c: any) => c.Field);

    if (!userColNames.includes('gender')) {
      console.log('Adicionando coluna gender em users...');
      await connection.query("ALTER TABLE users ADD COLUMN gender ENUM('masculino', 'feminino', 'prefiro_nao_informar') NULL");
    }

    if (!userColNames.includes('description')) {
      console.log('Adicionando coluna description em users...');
      await connection.query("ALTER TABLE users ADD COLUMN description VARCHAR(120) NULL");
    }

    // 3. menu_items: Garantir que tags seja JSON
    console.log('Verificando coluna tags em menu_items...');
    const [menuCols]: any = await connection.query('SHOW COLUMNS FROM menu_items');
    const tagsCol = menuCols.find((c: any) => c.Field === 'tags');
    if (tagsCol && tagsCol.Type.toLowerCase() !== 'json') {
      console.log('Convertendo coluna tags para JSON em menu_items...');
      await connection.query("ALTER TABLE menu_items MODIFY COLUMN tags JSON NULL");
    }

    console.log('Migração concluída com sucesso!');
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
