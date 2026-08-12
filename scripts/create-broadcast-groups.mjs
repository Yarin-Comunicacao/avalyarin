/**
 * Batch script: Create broadcast groups for all existing
 * establishments, specialists, and critics.
 *
 * Run with: node scripts/create-broadcast-groups.mjs
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { eq, and, sql } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sslOptions = DATABASE_URL.includes('tidbcloud.com')
  ? { ssl: { rejectUnauthorized: true } }
  : {};

const pool = mysql.createPool({ uri: DATABASE_URL, ...sslOptions });
const db = drizzle(pool);

function generateGroupCode() {
  const num = Math.floor(Math.random() * 999999) + 1;
  return `gr${String(num).padStart(6, '0')}`;
}

async function main() {
  console.log('=== Criando grupos de transmissão em batch ===\n');

  // 1. Get all establishments (active ones)
  const [estabs] = await pool.query(
    `SELECT id, name FROM establishments WHERE status = 'active' OR status IS NULL`
  );
  console.log(`Estabelecimentos encontrados: ${estabs.length}`);

  // 2. Get specialists (users with role = 'specialist')
  const [specialists] = await pool.query(
    `SELECT id, name, username FROM users WHERE role = 'specialist'`
  );
  console.log(`Especialistas encontrados: ${specialists.length}`);

  // 3. Get critics (users with role = 'critic')
  const [critics] = await pool.query(
    `SELECT id, name, username FROM users WHERE role = 'critic'`
  );
  console.log(`Críticos encontrados: ${critics.length}`);

  // 4. Get existing broadcast groups to avoid duplicates
  const [existingGroups] = await pool.query(
    `SELECT linkedEntityId, linkedEntityType FROM \`groups\` WHERE type = 'broadcast'`
  );
  const existingSet = new Set(
    existingGroups.map(g => `${g.linkedEntityType}:${g.linkedEntityId}`)
  );
  console.log(`Grupos de transmissão já existentes: ${existingGroups.length}\n`);

  // We need a "system" creator for establishment groups.
  // Use the first owner/admin user, or user ID 1
  const [owners] = await pool.query(
    `SELECT id FROM users WHERE role = 'owner' LIMIT 1`
  );
  const systemCreatorId = owners.length > 0 ? owners[0].id : 1;
  console.log(`Creator ID para estabs (owner): ${systemCreatorId}\n`);

  let created = 0;
  let skipped = 0;

  // --- Establishments ---
  console.log('--- Estabelecimentos ---');
  for (const estab of estabs) {
    const key = `establishment:${estab.id}`;
    if (existingSet.has(key)) {
      skipped++;
      continue;
    }

    const code = generateGroupCode();
    try {
      const [result] = await pool.query(
        `INSERT INTO \`groups\` (code, name, description, type, creatorId, linkedEntityId, linkedEntityType, isFixed, memberCount, createdAt, updatedAt)
         VALUES (?, ?, ?, 'broadcast', ?, ?, 'establishment', 1, 1, NOW(), NOW())`,
        [code, estab.name, `Grupo de Transmissão de ${estab.name}`, systemCreatorId, estab.id]
      );
      const groupId = result.insertId;

      // Add creator as member
      await pool.query(
        `INSERT INTO group_members (groupId, userId, role, joinedAt) VALUES (?, ?, 'creator', NOW())`,
        [groupId, systemCreatorId]
      );

      created++;
    } catch (err) {
      console.error(`  Erro ao criar grupo para estab ${estab.id} (${estab.name}):`, err.message);
    }
  }
  console.log(`  Criados: ${created} | Já existiam: ${skipped}\n`);

  // --- Specialists ---
  let createdSpec = 0;
  let skippedSpec = 0;
  console.log('--- Especialistas ---');
  for (const spec of specialists) {
    const key = `specialist:${spec.id}`;
    if (existingSet.has(key)) {
      skippedSpec++;
      continue;
    }

    const code = generateGroupCode();
    const groupName = spec.name || spec.username || `Especialista #${spec.id}`;
    try {
      const [result] = await pool.query(
        `INSERT INTO \`groups\` (code, name, description, type, creatorId, linkedEntityId, linkedEntityType, isFixed, memberCount, createdAt, updatedAt)
         VALUES (?, ?, ?, 'broadcast', ?, ?, 'specialist', 1, 1, NOW(), NOW())`,
        [code, groupName, `Grupo de Transmissão de ${groupName}`, spec.id, spec.id]
      );
      const groupId = result.insertId;

      await pool.query(
        `INSERT INTO group_members (groupId, userId, role, joinedAt) VALUES (?, ?, 'creator', NOW())`,
        [groupId, spec.id]
      );

      createdSpec++;
    } catch (err) {
      console.error(`  Erro ao criar grupo para specialist ${spec.id}:`, err.message);
    }
  }
  console.log(`  Criados: ${createdSpec} | Já existiam: ${skippedSpec}\n`);

  // --- Critics ---
  let createdCritic = 0;
  let skippedCritic = 0;
  console.log('--- Críticos ---');
  for (const critic of critics) {
    const key = `critic:${critic.id}`;
    if (existingSet.has(key)) {
      skippedCritic++;
      continue;
    }

    const code = generateGroupCode();
    const groupName = critic.name || critic.username || `Crítico #${critic.id}`;
    try {
      const [result] = await pool.query(
        `INSERT INTO \`groups\` (code, name, description, type, creatorId, linkedEntityId, linkedEntityType, isFixed, memberCount, createdAt, updatedAt)
         VALUES (?, ?, ?, 'broadcast', ?, ?, 'critic', 1, 1, NOW(), NOW())`,
        [code, groupName, `Grupo de Transmissão de ${groupName}`, critic.id, critic.id]
      );
      const groupId = result.insertId;

      await pool.query(
        `INSERT INTO group_members (groupId, userId, role, joinedAt) VALUES (?, ?, 'creator', NOW())`,
        [groupId, critic.id]
      );

      createdCritic++;
    } catch (err) {
      console.error(`  Erro ao criar grupo para critic ${critic.id}:`, err.message);
    }
  }
  console.log(`  Criados: ${createdCritic} | Já existiam: ${skippedCritic}\n`);

  // Summary
  const totalCreated = created + createdSpec + createdCritic;
  const totalSkipped = skipped + skippedSpec + skippedCritic;
  console.log('=== RESUMO ===');
  console.log(`Total criados: ${totalCreated}`);
  console.log(`Total já existiam: ${totalSkipped}`);
  console.log(`Total processados: ${totalCreated + totalSkipped}`);

  await pool.end();
  process.exit(0);
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
