/**
 * The database schema, as a string rather than a .sql file.
 *
 * It lives here so the app can apply it itself on first use — a file under
 * db/ would not reliably be bundled into a serverless function, and forgetting
 * to run a migration by hand is the single easiest way to end up with a site
 * that 500s on its first real registration.
 *
 * Every statement is idempotent, so applying it repeatedly is a no-op.
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS registrations (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),

  full_name     text        NOT NULL,
  company       text        NOT NULL,
  email         text        NOT NULL,
  mobile        text        NOT NULL,

  -- Counts the registrant plus any guest, so it is a headcount, not a +1 count.
  guest_count   integer     NOT NULL CHECK (guest_count BETWEEN 1 AND 2),
  guest_names   text,

  dietary       text,
  charter_experience text CHECK (charter_experience IN ('first_time', 'experienced')),
  notes         text,

  -- Set when the registration arrived after the boat was already full.
  waitlisted    boolean     NOT NULL DEFAULT false
);

-- One registration per person. Case-insensitive so Bob@x.com cannot double-book
-- against bob@x.com.
CREATE UNIQUE INDEX IF NOT EXISTS registrations_email_key
  ON registrations (lower(email));

CREATE INDEX IF NOT EXISTS registrations_created_at_idx
  ON registrations (created_at DESC);

-- Rate limiting. One row per accepted attempt, bucketed by a salted hash of the
-- caller's IP — never the raw address. A sliding window counts recent rows.
-- This lives in Postgres rather than Redis so the app needs no second vendor.
CREATE TABLE IF NOT EXISTS rate_limit_hits (
  bucket text        NOT NULL,
  at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rate_limit_hits_bucket_at_idx
  ON rate_limit_hits (bucket, at DESC);
`;
