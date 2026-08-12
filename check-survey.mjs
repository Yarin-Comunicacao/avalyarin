import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute(
  "SELECT * FROM survey_questions WHERE phase = 'onboarding' ORDER BY id ASC"
);
console.log(JSON.stringify(rows, null, 2));
console.log(`\nTotal: ${rows.length} perguntas`);
await conn.end();
