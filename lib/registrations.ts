import { db } from "./db";
import type { RegistrationInput } from "./registration-schema";

export type Registration = {
  id: string;
  createdAt: Date;
  fullName: string;
  company: string;
  jobTitle: string | null;
  email: string;
  phoneNumber: string | null;
  dietaryNeeds: string | null;
  waitlisted: boolean;
};

/** Arbitrary but stable key. Serializes the read-then-insert on capacity. */
const CAPACITY_LOCK = 778811;

type Row = {
  id: string;
  created_at: Date;
  full_name: string;
  company: string;
  job_title: string | null;
  email: string;
  phone_number: string | null;
  dietary_needs: string | null;
  waitlisted: boolean;
};

function toRegistration(row: Row): Registration {
  return {
    id: row.id,
    createdAt: row.created_at,
    fullName: row.full_name,
    company: row.company,
    jobTitle: row.job_title,
    email: row.email,
    phoneNumber: row.phone_number,
    dietaryNeeds: row.dietary_needs,
    waitlisted: row.waitlisted,
  };
}

/** Empty optional strings become NULL so the admin table shows an em dash. */
function nullIfBlank(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * People confirmed aboard. One seat per registration — the form no longer
 * collects guests, so a registration is a person.
 */
export async function confirmedHeadcount(): Promise<number> {
  const { rows } = await (
    await db()
  ).query<{ total: string | null }>(
    "SELECT count(*) AS total FROM registrations WHERE NOT waitlisted",
  );
  return Number(rows[0]?.total ?? 0);
}

export type CreateResult =
  | { status: "created"; waitlisted: boolean }
  | { status: "duplicate_email" };

/**
 * Insert a registration, deciding waitlist status against live capacity.
 *
 * The headcount read and the insert share a transaction behind an advisory lock,
 * so two people submitting at the same moment cannot both claim the last seat.
 */
export async function createRegistration(
  input: RegistrationInput,
  capacity: number,
): Promise<CreateResult> {
  const client = await (await db()).connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [CAPACITY_LOCK]);

    const dup = await client.query(
      "SELECT 1 FROM registrations WHERE lower(email) = lower($1)",
      [input.email],
    );
    if (dup.rowCount && dup.rowCount > 0) {
      await client.query("ROLLBACK");
      return { status: "duplicate_email" };
    }

    const { rows } = await client.query<{ total: string | null }>(
      "SELECT count(*) AS total FROM registrations WHERE NOT waitlisted",
    );
    const taken = Number(rows[0]?.total ?? 0);
    const waitlisted = taken + 1 > capacity;

    await client.query(
      `INSERT INTO registrations
         (full_name, company, job_title, email, phone_number, dietary_needs, waitlisted)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        input.fullName,
        input.company,
        nullIfBlank(input.jobTitle),
        input.email,
        // Blank rather than absent when the field is left empty, so it has to
        // become NULL here or the roster shows nothing instead of an em dash.
        nullIfBlank(input.phoneNumber),
        nullIfBlank(input.dietaryNeeds),
        waitlisted,
      ],
    );

    await client.query("COMMIT");
    return { status: "created", waitlisted };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

/** Newest first. The admin page re-sorts client-side. */
export async function listRegistrations(): Promise<Registration[]> {
  const { rows } = await (
    await db()
  ).query<Row>(
    `SELECT id, created_at, full_name, company, job_title, email,
            phone_number, dietary_needs, waitlisted
       FROM registrations ORDER BY created_at DESC`,
  );
  return rows.map(toRegistration);
}

/** Returns false when the id matched nothing, so the caller can say so. */
export async function deleteRegistration(id: string): Promise<boolean> {
  const result = await (
    await db()
  ).query("DELETE FROM registrations WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
