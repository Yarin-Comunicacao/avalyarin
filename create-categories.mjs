import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // 1. Create Gastrobar category (id 60003)
  await conn.query(`
    INSERT INTO categories (id, code, slug, name, description, icon, active)
    VALUES (60003, 'ca022', 'gastrobar', 'Gastrobar', 'Gastronomia elevada em ambiente de bar', 'ChefHat', true)
  `);
  console.log('✓ Categoria Gastrobar criada (id: 60003)');
  
  // 2. Create Lanches category (id 60004)
  await conn.query(`
    INSERT INTO categories (id, code, slug, name, description, icon, active)
    VALUES (60004, 'ca023', 'lanches', 'Lanches', 'Hot dogs, pastéis e lanches tradicionais', 'UtensilsCrossed', true)
  `);
  console.log('✓ Categoria Lanches criada (id: 60004)');
  
  // 3. Reclassify 6 gastrobars from Boteco Moderno (5) to Gastrobar (60003)
  const gastrobarIds = [7715, 5499, 7713, 7714, 1177, 1720]; // Fábrica Drinks, Marú, Melts, Ministro, Oink, Othê
  
  // Update primary category
  await conn.query(`
    UPDATE establishments SET categoryId = 60003 WHERE id IN (${gastrobarIds.join(',')})
  `);
  console.log(`✓ ${gastrobarIds.length} estabs reclassificados para Gastrobar`);
  
  // Update establishment_categories table (primary link)
  for (const estabId of gastrobarIds) {
    // Remove old primary (Boteco Moderno = 5) from N:N table
    await conn.query(`
      DELETE FROM establishment_categories WHERE establishmentId = ? AND categoryId = 5
    `, [estabId]);
    // Insert new primary (Gastrobar = 60003) in N:N table
    await conn.query(`
      INSERT IGNORE INTO establishment_categories (establishmentId, categoryId, isPrimary)
      VALUES (?, 60003, true)
    `, [estabId]);
  }
  console.log('✓ Tabela N:N atualizada para Gastrobars');
  
  // 4. Move Black Dog Paulista (648) from Hamburgueria (16) to Lanches (60004)
  await conn.query(`UPDATE establishments SET categoryId = 60004 WHERE id = 648`);
  await conn.query(`DELETE FROM establishment_categories WHERE establishmentId = 648 AND categoryId = 16`);
  await conn.query(`INSERT IGNORE INTO establishment_categories (establishmentId, categoryId, isPrimary) VALUES (648, 60004, true)`);
  console.log('✓ Black Dog Paulista movido para Lanches');
  
  // 5. Also move Pastel da Praça (4117) to Lanches - it's a pastelaria, not hamburgueria
  await conn.query(`UPDATE establishments SET categoryId = 60004 WHERE id = 4117`);
  await conn.query(`DELETE FROM establishment_categories WHERE establishmentId = 4117 AND categoryId = 16`);
  await conn.query(`INSERT IGNORE INTO establishment_categories (establishmentId, categoryId, isPrimary) VALUES (4117, 60004, true)`);
  console.log('✓ Pastel da Praça movido para Lanches');
  
  // Verify
  const [gastrobars] = await conn.query(`SELECT id, name FROM establishments WHERE categoryId = 60003`);
  console.log('\nGastrobars:', gastrobars.map(e => e.name));
  
  const [lanches] = await conn.query(`SELECT id, name FROM establishments WHERE categoryId = 60004`);
  console.log('Lanches:', lanches.map(e => e.name));
  
  await conn.end();
  console.log('\n✅ Concluído!');
}

main().catch(e => { console.error(e); process.exit(1); });
