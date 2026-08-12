import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await createConnection(process.env.DATABASE_URL);

// Find yarinagencia user
const [users] = await conn.execute(
  "SELECT id, username, email, role FROM users WHERE email LIKE '%yarinagencia%' OR username LIKE '%yarin%' LIMIT 5"
);
console.log("=== yarinagencia user ===");
console.log(JSON.stringify(users, null, 2));

if (users.length > 0) {
  const userId = users[0].id;
  
  // Count their non-broadcast groups (what the limit should check)
  const [nonBroadcast] = await conn.execute(
    `SELECT COUNT(*) as cnt FROM \`groups\` WHERE creatorId = ? AND type != 'broadcast'`,
    [userId]
  );
  console.log("\n=== Non-broadcast groups created by yarinagencia ===");
  console.log(JSON.stringify(nonBroadcast, null, 2));
  
  // Count ALL groups (including broadcast) - the old buggy count
  const [allGroups] = await conn.execute(
    `SELECT COUNT(*) as cnt FROM \`groups\` WHERE creatorId = ?`,
    [userId]
  );
  console.log("\n=== ALL groups created by yarinagencia (old buggy count) ===");
  console.log(JSON.stringify(allGroups, null, 2));
  
  // List broadcast groups yarinagencia is a member of
  const [broadcasts] = await conn.execute(
    `SELECT g.id, g.name, g.linkedEntityType, g.linkedEntityId, gm.joinedAt, gm.leftAt, gm.hidden
     FROM group_members gm
     JOIN \`groups\` g ON gm.groupId = g.id
     WHERE gm.userId = ? AND g.type = 'broadcast' AND gm.leftAt IS NULL
     ORDER BY gm.joinedAt DESC`,
    [userId]
  );
  console.log(`\n=== Broadcast groups yarinagencia is a member of (${broadcasts.length} total) ===`);
  console.log(JSON.stringify(broadcasts, null, 2));
}

await conn.end();
