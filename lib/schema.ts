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
  job_title     text,
  email         text        NOT NULL,
  phone_number  text,
  dietary_needs text,

  -- Set when the registration arrived after the boat was already full.
  waitlisted    boolean     NOT NULL DEFAULT false
);

-- Columns added after the first deployment. A table created by the block above
-- already has them; one created by an earlier version does not.
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS job_title     text;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS phone_number  text;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS dietary_needs text;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS waitlisted    boolean NOT NULL DEFAULT false;

/*
 * Converge a table left over from the first version of this site, which
 * collected guest counts and a couple of fields the form no longer asks for.
 *
 * Carrying values across before dropping anything, and only dropping at all
 * when nothing would be lost: mobile becomes phone_number, dietary becomes
 * dietary_needs, and the retired columns go only if the table is empty. A
 * populated table keeps them, so this can never destroy a real registration.
 */
DO $$
DECLARE
  row_count bigint;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_name = 'registrations' AND column_name = 'mobile') THEN
    UPDATE registrations SET phone_number = mobile
      WHERE phone_number IS NULL AND mobile IS NOT NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_name = 'registrations' AND column_name = 'dietary') THEN
    UPDATE registrations SET dietary_needs = dietary
      WHERE dietary_needs IS NULL AND dietary IS NOT NULL;
  END IF;

  SELECT count(*) INTO row_count FROM registrations;

  IF row_count = 0 THEN
    ALTER TABLE registrations DROP COLUMN IF EXISTS mobile;
    ALTER TABLE registrations DROP COLUMN IF EXISTS dietary;
    ALTER TABLE registrations DROP COLUMN IF EXISTS guest_count;
    ALTER TABLE registrations DROP COLUMN IF EXISTS guest_names;
    ALTER TABLE registrations DROP COLUMN IF EXISTS charter_experience;
    ALTER TABLE registrations DROP COLUMN IF EXISTS notes;
  ELSE
    -- Keep the old columns, but stop them blocking inserts that omit them.
    IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_name = 'registrations' AND column_name = 'guest_count') THEN
      ALTER TABLE registrations ALTER COLUMN guest_count SET DEFAULT 1;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_name = 'registrations' AND column_name = 'mobile') THEN
      ALTER TABLE registrations ALTER COLUMN mobile DROP NOT NULL;
    END IF;
  END IF;
END $$;

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
