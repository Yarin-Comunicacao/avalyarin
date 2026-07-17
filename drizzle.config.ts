import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

// TiDB Cloud requires SSL - append ssl parameter if not already present
let dbUrl = connectionString;
if (connectionString.includes("tidbcloud.com") && !connectionString.includes("ssl=")) {
  const separator = connectionString.includes("?") ? "&" : "?";
  dbUrl = `${connectionString}${separator}ssl={"rejectUnauthorized":true}`;
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: dbUrl,
  },
});
