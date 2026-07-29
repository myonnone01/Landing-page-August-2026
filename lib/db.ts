import { Pool } from "pg";

/**
 * One pool per process. Cached on globalThis so Next's dev-mode module reloading
 * doesn't leak a new pool on every edit.
 */
const globalForDb = globalThis as unknown as { pool?: Pool };

export function db(): Pool {
  if (globalForDb.pool) return globalForDb.pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and fill it in.",
    );
  }

  const pool = new Pool({
    connectionString,
    // Serverless invocations are short-lived and numerous; keep the per-instance
    // ceiling low and lean on Neon's pooled endpoint for the rest.
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });

  // A pool error with no listener takes the process down. Log the error itself
  // only — pool errors never contain registrant data, but keep it terse anyway.
  pool.on("error", (err) => {
    console.error("[db] idle client error:", err.message);
  });

  globalForDb.pool = pool;
  return pool;
}
