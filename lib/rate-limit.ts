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

export type Limit = {
  /** Distinguishes counters, so registration and sign-in don't share a budget. */
  name: string;
  max: number;
  windowMinutes: number;
};

/** The registration form. Generous enough for a real person fixing a typo. */
export const REGISTER_LIMIT: Limit = {
  name: "register",
  max: 5,
  windowMinutes: 15,
};

/**
 * The admin passcode form. A single shared secret is the weakest part of this
 * app, so at least make it not brute-forceable online.
 */
export const ADMIN_LOGIN_LIMIT: Limit = {
  name: "admin-login",
  max: 8,
  windowMinutes: 15,
};

/** First hop in x-forwarded-for, which is the client as far as Vercel is concerned. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for") ?? "";
  return forwarded.split(",")[0]?.trim() || "unknown";
}

/**
 * A salted hash of the caller's IP. Raw addresses are never stored — the salt
 * makes the bucket useless for reidentifying a visitor later.
 */
function bucketFor(limit: Limit, ip: string): string {
  const salt = process.env.ADMIN_SESSION_SECRET ?? "unsalted";
  return createHash("sha256")
    .update(`${salt}:${limit.name}:${ip}`)
    .digest("hex")
    .slice(0, 32);
}

export type RateLimitResult = { allowed: boolean; retryAfterMinutes: number };

export async function checkRateLimit(
  limit: Limit,
  ip: string,
): Promise<RateLimitResult> {
  const bucket = bucketFor(limit, ip);
  const pool = db();

  // Housekeeping: drop anything already outside the longest window we use.
  // Cheap at this scale and it keeps the table from growing without bound.
  await pool.query(
    `DELETE FROM rate_limit_hits WHERE at < now() - interval '1 hour'`,
  );

  const { rows } = await pool.query<{ hits: string }>(
    `SELECT count(*) AS hits FROM rate_limit_hits
      WHERE bucket = $1 AND at > now() - ($2 || ' minutes')::interval`,
    [bucket, limit.windowMinutes],
  );

  if (Number(rows[0]?.hits ?? 0) >= limit.max) {
    return { allowed: false, retryAfterMinutes: limit.windowMinutes };
  }

  await pool.query("INSERT INTO rate_limit_hits (bucket) VALUES ($1)", [bucket]);
  return { allowed: true, retryAfterMinutes: 0 };
}
