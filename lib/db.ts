import { Pool } from "pg";
import { SCHEMA_SQL } from "./schema";

/**
 * One pool per process, and the schema applied once per process.
 *
 * Cached on globalThis so Next's dev-mode module reloading doesn't leak a new
 * pool on every edit, and so a warm serverless instance doesn't re-run the
 * schema on every request.
 */
const globalForDb = globalThis as unknown as {
  pool?: Pool;
  schemaReady?: Promise<void>;
};

/** Arbitrary but stable. Keeps concurrent cold starts from racing the DDL. */
const SCHEMA_LOCK = 778812;

export class MissingDatabaseUrlError extends Error {
  constructor() {
    super(
      "DATABASE_URL is not set. Copy .env.example to .env and fill it in, or add it to your hosting environment.",
    );
    this.name = "MissingDatabaseUrlError";
  }
}

function pool(): Pool {
  if (globalForDb.pool) return globalForDb.pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new MissingDatabaseUrlError();

  const created = new Pool({
    connectionString,
    // Serverless invocations are short-lived and numerous; keep the
    // per-instance ceiling low and lean on Neon's pooled endpoint for the rest.
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });

  // A pool error with no listener takes the process down. Log the error itself
  // only — pool errors never contain registrant data, but keep it terse anyway.
  created.on("error", (err) => {
    console.error("[db] idle client error:", err.message);
  });

  globalForDb.pool = created;
  return created;
}

/**
 * Applies the schema, once. Every statement is `IF NOT EXISTS`, and the
 * advisory lock serialises concurrent first-requests, so this is safe to call
 * on any code path.
 */
async function ensureSchema(p: Pool): Promise<void> {
  const client = await p.connect();
  try {
    await client.query("SELECT pg_advisory_lock($1)", [SCHEMA_LOCK]);
    await client.query(SCHEMA_SQL);
  } finally {
    await client
      .query("SELECT pg_advisory_unlock($1)", [SCHEMA_LOCK])
      .catch(() => {});
    client.release();
  }
}

/**
 * The connection pool, with the schema guaranteed to exist.
 *
 * Async because the first call in a process applies the schema. This is why
 * there is no migration step to forget when deploying.
 */
export async function db(): Promise<Pool> {
  const p = pool();

  if (!globalForDb.schemaReady) {
    // Cache the promise, not the result, so concurrent callers await the same
    // work. Clear it on failure so a transient outage doesn't permanently
    // convince the process that the schema is unavailable.
    globalForDb.schemaReady = ensureSchema(p).catch((error) => {
      globalForDb.schemaReady = undefined;
      throw error;
    });
  }

  await globalForDb.schemaReady;
  return p;
}
