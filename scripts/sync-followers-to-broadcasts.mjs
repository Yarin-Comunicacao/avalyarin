/**
 * Batch script: Sync existing followers to broadcast groups.
 * - Users who saved an establishment → join that estab's broadcast group
 * - Users who follow a specialist → join that specialist's broadcast group
 * - Users who follow a critic (user_follows) → join that critic's broadcast group
 *
 * Run with: node scripts/sync-followers-to-broadcasts.mjs
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sslOptions = DATABASE_URL.includes('tidbcloud.com')
  ? { ssl: { rejectUnauthorized: true } }
  : {};

const pool = mysql.createPool({ uri: DATABASE_URL, ...sslOptions });

async function main() {
  console.log('=== Sincronizando seguidores existentes com grupos de transmissão ===\n');

  // 1. Get all broadcast groups indexed by entity
  const [broadcastGroups] = await pool.query(
    `SELECT id, linkedEntityId, linkedEntityType FROM \`groups\` WHERE type = 'broadcast'`
  );
  
  // Build lookup maps
  const estabGroupMap = new Map(); // establishmentId -> groupId
  const specialistGroupMap = new Map(); // userId (specialist) -> groupId
  const criticGroupMap = new Map(); // userId (critic) -> groupId
  
  for (const g of broadcastGroups) {
    if (g.linkedEntityType === 'establishment') estabGroupMap.set(g.linkedEntityId, g.id);
    else if (g.linkedEntityType === 'specialist') specialistGroupMap.set(g.linkedEntityId, g.id);
    else if (g.linkedEntityType === 'critic') criticGroupMap.set(g.linkedEntityId, g.id);
  }

  console.log(`Grupos broadcast: ${broadcastGroups.length} (${estabGroupMap.size} estabs, ${specialistGroupMap.size} specialists, ${criticGroupMap.size} critics)\n`);

  // 2. Get existing group_members to avoid duplicates
  const [existingMembers] = await pool.query(
    `SELECT groupId, userId FROM group_members WHERE groupId IN (SELECT id FROM \`groups\` WHERE type = 'broadcast')`
  );
  const memberSet = new Set(existingMembers.map(m => `${m.groupId}:${m.userId}`));
  console.log(`Membros já existentes em grupos broadcast: ${existingMembers.length}\n`);

  let added = 0;
  let skipped = 0;

  // 3. Sync saved establishments → broadcast groups
  const [savedEstabs] = await pool.query(
    `SELECT userId, establishmentId FROM user_saved_establishments`
  );
  console.log(`--- Estabelecimentos salvos: ${savedEstabs.length} registros ---`);
  
  for (const save of savedEstabs) {
    const groupId = estabGroupMap.get(save.establishmentId);
    if (!groupId) continue; // no broadcast group for this estab
    
    const key = `${groupId}:${save.userId}`;
    if (memberSet.has(key)) {
      skipped++;
      continue;
    }

    try {
      await pool.query(
        `INSERT INTO group_members (groupId, userId, role, joinedAt) VALUES (?, ?, 'follower', NOW())`,
        [groupId, save.userId]
      );
      memberSet.add(key);
      added++;
    } catch (err) {
      if (err.code !== 'ER_DUP_ENTRY') {
        console.error(`  Erro: user ${save.userId} → group ${groupId}:`, err.message);
      }
    }
  }
  console.log(`  Adicionados: ${added} | Já existiam: ${skipped}\n`);

  // 4. Sync specialist follows → broadcast groups
  let addedSpec = 0;
  let skippedSpec = 0;
  const [specFollows] = await pool.query(
    `SELECT userId, specialistId FROM specialist_follows`
  );
  console.log(`--- Follows de especialistas: ${specFollows.length} registros ---`);
  
  for (const follow of specFollows) {
    const groupId = specialistGroupMap.get(follow.specialistId);
    if (!groupId) continue;
    
    const key = `${groupId}:${follow.userId}`;
    if (memberSet.has(key)) {
      skippedSpec++;
      continue;
    }

    try {
      await pool.query(
        `INSERT INTO group_members (groupId, userId, role, joinedAt) VALUES (?, ?, 'follower', NOW())`,
        [groupId, follow.userId]
      );
      memberSet.add(key);
      addedSpec++;
    } catch (err) {
      if (err.code !== 'ER_DUP_ENTRY') {
        console.error(`  Erro: user ${follow.userId} → specialist group ${groupId}:`, err.message);
      }
    }
  }
  console.log(`  Adicionados: ${addedSpec} | Já existiam: ${skippedSpec}\n`);

  // 5. Sync user_follows where followingId is a critic → broadcast groups
  let addedCritic = 0;
  let skippedCritic = 0;
  const [criticFollows] = await pool.query(
    `SELECT uf.followerId, uf.followingId 
     FROM user_follows uf 
     INNER JOIN users u ON u.id = uf.followingId 
     WHERE u.role = 'critic' AND uf.status = 'accepted'`
  );
  console.log(`--- Follows de críticos: ${criticFollows.length} registros ---`);
  
  for (const follow of criticFollows) {
    const groupId = criticGroupMap.get(follow.followingId);
    if (!groupId) continue;
    
    const key = `${groupId}:${follow.followerId}`;
    if (memberSet.has(key)) {
      skippedCritic++;
      continue;
    }

    try {
      await pool.query(
        `INSERT INTO group_members (groupId, userId, role, joinedAt) VALUES (?, ?, 'follower', NOW())`,
        [groupId, follow.followerId]
      );
      memberSet.add(key);
      addedCritic++;
    } catch (err) {
      if (err.code !== 'ER_DUP_ENTRY') {
        console.error(`  Erro: user ${follow.followerId} → critic group ${groupId}:`, err.message);
      }
    }
  }
  console.log(`  Adicionados: ${addedCritic} | Já existiam: ${skippedCritic}\n`);

  // 6. Update member counts for all broadcast groups
  console.log('--- Atualizando contagem de membros ---');
  const [allBroadcasts] = await pool.query(
    `SELECT id FROM \`groups\` WHERE type = 'broadcast'`
  );
  for (const g of allBroadcasts) {
    const [[{ cnt }]] = await pool.query(
      `SELECT COUNT(*) as cnt FROM group_members WHERE groupId = ? AND leftAt IS NULL`,
      [g.id]
    );
    await pool.query(
      `UPDATE \`groups\` SET memberCount = ? WHERE id = ?`,
      [cnt, g.id]
    );
  }
  console.log(`  ${allBroadcasts.length} grupos atualizados\n`);

  // Summary
  const totalAdded = added + addedSpec + addedCritic;
  const totalSkipped = skipped + skippedSpec + skippedCritic;
  console.log('=== RESUMO ===');
  console.log(`Total adicionados: ${totalAdded}`);
  console.log(`Total já existiam: ${totalSkipped}`);

  await pool.end();
  process.exit(0);
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
