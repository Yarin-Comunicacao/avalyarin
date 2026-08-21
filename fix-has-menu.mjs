import mysql from "mysql2/promise";

async function main() {
  const DATABASE_URL = "mysql://4LUtXE4vPqQU3CD.root:sCS5ECjAEZ66Z5MzGo25@gateway06.us-east-1.prod.aws.tidbcloud.com:4000/WG3U3sVg2ZrW6m8T99FRdE";
  
  const connection = await mysql.createConnection({
    uri: DATABASE_URL,
    ssl: { rejectUnauthorized: true }
  });
  
  console.log("Updating hasMenu status for all establishments...");
  
  await connection.execute("UPDATE establishments SET hasMenu = 1, status = 'active'");
  
  console.log("✅ All establishments updated to hasMenu=1 and status=active!");
  await connection.end();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
