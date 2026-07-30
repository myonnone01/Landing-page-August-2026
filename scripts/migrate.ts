/**
 * Applies the schema explicitly.
 *
 *   npm run db:migrate
 *
 * You normally do not need this: the app applies the schema itself on its first
 * database call, so a fresh deployment has no migration step. This exists for
 * when you want to set the tables up ahead of time, or confirm a connection
 * string works before pointing the site at it.
 *
 * Idempotent — safe to re-run.
 */
import { Pool } from "pg";
import { SCHEMA_SQL } from "../lib/schema";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. See .env.example.");
  }

  const pool = new Pool({ connectionString, max: 1 });

  try {
    await pool.query(SCHEMA_SQL);
    const { rows } = await pool.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' ORDER BY table_name`,
    );
    console.log(
      `Schema applied. Tables: ${rows.map((r) => r.table_name).join(", ")}`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
