import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * A single shared passcode, exchanged for a signed session cookie.
 *
 * This is deliberately the weakest part of the app. See the README for what it
 * does and does not protect against, and what a real login would cost.
 */
export const ADMIN_COOKIE = "mb_admin";

/** Long enough to cover the morning of the event without a re-login. */
const SESSION_HOURS = 12;

function secret(): string {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value) {
    throw new Error(
      "ADMIN_SESSION_SECRET is not set. Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  return value;
}

/** Constant-time compare. Hashing first makes the inputs equal length. */
function matches(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function passcodeIsCorrect(attempt: string): boolean {
  const expected = process.env.ADMIN_PASSCODE;
  if (!expected) {
    throw new Error("ADMIN_PASSCODE is not set. See .env.example.");
  }
  return matches(attempt, expected);
}

function sign(expiresAt: number): string {
  return createHmac("sha256", secret()).update(String(expiresAt)).digest("hex");
}

/** Token is `expiry.signature` — self-contained, so no server-side session store. */
export function issueToken(now: Date = new Date()): string {
  const expiresAt = now.getTime() + SESSION_HOURS * 60 * 60 * 1000;
  return `${expiresAt}.${sign(expiresAt)}`;
}

export function tokenIsValid(token: string | undefined, now = Date.now()): boolean {
  if (!token) return false;

  const [rawExpiry, signature] = token.split(".");
  if (!rawExpiry || !signature) return false;

  const expiresAt = Number(rawExpiry);
  if (!Number.isFinite(expiresAt) || expiresAt < now) return false;

  return matches(signature, sign(expiresAt));
}

/** True when the current request carries a valid admin session. */
export async function isSignedIn(): Promise<boolean> {
  const store = await cookies();
  return tokenIsValid(store.get(ADMIN_COOKIE)?.value);
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_HOURS * 60 * 60,
};
