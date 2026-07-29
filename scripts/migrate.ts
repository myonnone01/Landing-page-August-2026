/**
 * Applies db/schema.sql. Idempotent — safe to run against an existing database.
 *
 *   npm run db:migrate
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. See .env.example.");
  }

  const sql = readFileSync(join(process.cwd(), "db", "schema.sql"), "utf8");
  const pool = new Pool({ connectionString, max: 1 });

  try {
    await pool.query(sql);
    console.log("Schema applied.");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
