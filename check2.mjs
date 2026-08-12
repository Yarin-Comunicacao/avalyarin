import { createConnection } from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await createConnection(process.env.DATABASE_URL);

// Find yarinagencia user
const [users] = await conn.execute(
  "SELECT id, username, email, role FROM users WHERE email = 'yarinagencia@gmail.com' LIMIT 1"
);
console.log("User:", JSON.stringify(users[0]));
const userId = users[0].id;

// Count non-broadcast groups created
const [nonBroadcast] = await conn.execute(
  `SELECT COUNT(*) as cnt FROM \`groups\` WHERE creatorId = ? AND type != 'broadcast'`, [userId]
);
console.log("Non-broadcast groups created:", nonBroadcast[0].cnt);

// Count ALL groups created (old buggy count)
const [allGroups] = await conn.execute(
  `SELECT COUNT(*) as cnt FROM \`groups\` WHERE creatorId = ?`, [userId]
);
console.log("ALL groups created (old buggy count):", allGroups[0].cnt);

// Count broadcast memberships
const [broadcastCount] = await conn.execute(
  `SELECT COUNT(*) as cnt FROM group_members gm JOIN \`groups\` g ON gm.groupId = g.id WHERE gm.userId = ? AND g.type = 'broadcast' AND gm.leftAt IS NULL`, [userId]
);
console.log("Broadcast groups as member:", broadcastCount[0].cnt);

// Check which estabs yarinagencia actually saved (business_followers)
const [savedEstabs] = await conn.execute(
  `SELECT COUNT(*) as cnt FROM business_followers WHERE userId = ?`, [userId]
);
console.log("Estabs actually saved/followed:", savedEstabs[0].cnt);

// Check user_saves (if exists)
try {
  const [saves] = await conn.execute(
    `SELECT COUNT(*) as cnt FROM user_saves WHERE userId = ?`, [userId]
  );
  console.log("user_saves:", saves[0].cnt);
} catch(e) {
  console.log("No user_saves table");
}

// Check the batch script date - all joined at same time = batch script
const [batchCheck] = await conn.execute(
  `SELECT MIN(gm.joinedAt) as earliest, MAX(gm.joinedAt) as latest, COUNT(*) as total
   FROM group_members gm JOIN \`groups\` g ON gm.groupId = g.id
   WHERE gm.userId = ? AND g.type = 'broadcast' AND gm.leftAt IS NULL`, [userId]
);
console.log("Broadcast membership dates:", JSON.stringify(batchCheck[0]));

await conn.end();
