import { db } from "./db";
import type { RegistrationInput } from "./registration-schema";

export type Registration = {
  id: string;
  createdAt: Date;
  fullName: string;
  company: string;
  email: string;
  mobile: string;
  guestCount: number;
  guestNames: string | null;
  dietary: string | null;
  charterExperience: "first_time" | "experienced" | null;
  notes: string | null;
  waitlisted: boolean;
};

/** Arbitrary but stable key. Serializes the read-then-insert on capacity. */
const CAPACITY_LOCK = 778811;

type Row = {
  id: string;
  created_at: Date;
  full_name: string;
  company: string;
  email: string;
  mobile: string;
  guest_count: number;
  guest_names: string | null;
  dietary: string | null;
  charter_experience: "first_time" | "experienced" | null;
  notes: string | null;
  waitlisted: boolean;
};

function toRegistration(row: Row): Registration {
  return {
    id: row.id,
    createdAt: row.created_at,
    fullName: row.full_name,
    company: row.company,
    email: row.email,
    mobile: row.mobile,
    guestCount: row.guest_count,
    guestNames: row.guest_names,
    dietary: row.dietary,
    charterExperience: row.charter_experience,
    notes: row.notes,
    waitlisted: row.waitlisted,
  };
}

/** Empty optional strings become NULL so the admin table shows an em dash. */
function nullIfBlank(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** People confirmed aboard, counting guests. Excludes the waitlist. */
export async function confirmedHeadcount(): Promise<number> {
  const { rows } = await (await db()).query<{ total: string | null }>(
    "SELECT sum(guest_count) AS total FROM registrations WHERE NOT waitlisted",
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
      "SELECT sum(guest_count) AS total FROM registrations WHERE NOT waitlisted",
    );
    const taken = Number(rows[0]?.total ?? 0);

    // A party only boards whole — if both seats don't fit, the party waits.
    const waitlisted = taken + input.guestCount > capacity;

    await client.query(
      `INSERT INTO registrations
         (full_name, company, email, mobile, guest_count, guest_names,
          dietary, charter_experience, notes, waitlisted)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        input.fullName,
        input.company,
        input.email,
        input.mobile,
        input.guestCount,
        nullIfBlank(input.guestNames),
        nullIfBlank(input.dietary),
        nullIfBlank(input.charterExperience || undefined),
        nullIfBlank(input.notes),
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
  const { rows } = await (await db()).query<Row>(
    "SELECT * FROM registrations ORDER BY created_at DESC",
  );
  return rows.map(toRegistration);
}

/** Returns false when the id matched nothing, so the caller can say so. */
export async function deleteRegistration(id: string): Promise<boolean> {
  const result = await (await db()).query("DELETE FROM registrations WHERE id = $1", [
    id,
  ]);
  return (result.rowCount ?? 0) > 0;
}
