import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
const conn = await mysql.createConnection(DATABASE_URL);

// Find the user
const [users] = await conn.execute("SELECT * FROM users WHERE email = 'yarinagencia@gmail.com'");
console.log('Found users:', JSON.stringify(users, null, 2));

if (users.length === 0) {
  console.log('\nUser not found yet. Listing all users:');
  const [allUsers] = await conn.execute("SELECT id, name, email, role FROM users");
  console.log(JSON.stringify(allUsers, null, 2));
} else {
  // Promote to admin
  await conn.execute("UPDATE users SET role = 'admin' WHERE email = 'yarinagencia@gmail.com'");
  console.log('\n✅ User yarinagencia@gmail.com promoted to admin!');
}

await conn.end();
