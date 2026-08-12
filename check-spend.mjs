import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute(
  "SELECT id, questionId, title, phase, CAST(options AS CHAR) as opts FROM survey_questions WHERE questionId LIKE '%spend%' OR title LIKE '%gasto%' OR title LIKE '%Gasto%'"
);
for (const row of rows) {
  console.log(`\n=== ID: ${row.id} | questionId: ${row.questionId} | phase: ${row.phase} ===`);
  console.log(`Title: ${row.title}`);
  console.log(`Options: ${row.opts}`);
}
await conn.end();
