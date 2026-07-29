import { createHash } from "node:crypto";
import { db } from "./db";

/**
 * Sliding-window rate limit backed by Postgres.
 *
 * In-memory counters are useless on Vercel — every cold start is a fresh
 * process, so a bot just keeps hitting new instances. Redis would work but is
 * another vendor for one table's worth of state, so the counter lives in the
 * database the app already has.
 */
const WINDOW_MINUTES = 15;
const MAX_PER_WINDOW = 5;

/**
 * A salted hash of the caller's IP. Raw addresses are never stored — the salt
 * makes the bucket useless for reidentifying a visitor later.
 */
function bucketFor(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || "unknown";
  const salt = process.env.ADMIN_SESSION_SECRET ?? "unsalted";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export type RateLimitResult = { allowed: boolean; retryAfterMinutes: number };

export async function checkRateLimit(
  request: Request,
): Promise<RateLimitResult> {
  const bucket = bucketFor(request);
  const pool = db();

  // Housekeeping: drop anything already outside the window. Cheap at this scale
  // and it keeps the table from growing without bound.
  await pool.query(
    `DELETE FROM rate_limit_hits WHERE at < now() - ($1 || ' minutes')::interval`,
    [WINDOW_MINUTES],
  );

  const { rows } = await pool.query<{ hits: string }>(
    `SELECT count(*) AS hits FROM rate_limit_hits
      WHERE bucket = $1 AND at > now() - ($2 || ' minutes')::interval`,
    [bucket, WINDOW_MINUTES],
  );

  if (Number(rows[0]?.hits ?? 0) >= MAX_PER_WINDOW) {
    return { allowed: false, retryAfterMinutes: WINDOW_MINUTES };
  }

  await pool.query("INSERT INTO rate_limit_hits (bucket) VALUES ($1)", [bucket]);
  return { allowed: true, retryAfterMinutes: 0 };
}
