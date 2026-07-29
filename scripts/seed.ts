/**
 * Inserts obviously-fake registrations so the admin page has something to show
 * during development.
 *
 *   npm run db:seed        add the rows
 *   npm run db:seed -- --reset   wipe the table first
 *
 * Every address is @example.com and every number is in the 555 reserved range,
 * so seeded rows are unmistakable if they ever reach a real database.
 */
import { Pool } from "pg";

const FAKE = [
  {
    full_name: "Dana Whitfield",
    company: "Harborline Logistics",
    email: "dana.whitfield@example.com",
    mobile: "(203) 555-0142",
    guest_count: 2,
    guest_names: "Marcus Whitfield",
    dietary: "Shellfish allergy",
    charter_experience: "first_time",
    notes: "Driving up from Stamford, might be a few minutes early.",
  },
  {
    full_name: "Priya Raghunathan",
    company: "Northfield Health",
    email: "p.raghunathan@example.com",
    mobile: "(860) 555-0119",
    guest_count: 1,
    guest_names: null,
    dietary: "Vegetarian",
    charter_experience: "experienced",
    notes: null,
  },
  {
    full_name: "Tom Beaulieu",
    company: "Cordis Manufacturing",
    email: "tbeaulieu@example.com",
    mobile: "(475) 555-0188",
    guest_count: 2,
    guest_names: "Erin Beaulieu",
    dietary: null,
    charter_experience: "first_time",
    notes: "Never been on a boat. How rough does it get?",
  },
  {
    full_name: "Sylvia Okonkwo",
    company: "Meridian Trust",
    email: "sokonkwo@example.com",
    mobile: "(203) 555-0173",
    guest_count: 1,
    guest_names: null,
    dietary: null,
    charter_experience: "experienced",
    notes: null,
  },
  {
    full_name: "Ray Castellano",
    company: "Bridgeport Steel",
    email: "ray.c@example.com",
    mobile: "(203) 555-0106",
    guest_count: 1,
    guest_names: null,
    dietary: "No pork",
    charter_experience: null,
    notes: null,
  },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. See .env.example.");
  }

  const pool = new Pool({ connectionString, max: 1 });

  try {
    if (process.argv.includes("--reset")) {
      await pool.query("TRUNCATE registrations, rate_limit_hits");
      console.log("Cleared registrations and rate limit hits.");
    }

    let added = 0;
    for (const row of FAKE) {
      const result = await pool.query(
        `INSERT INTO registrations
           (full_name, company, email, mobile, guest_count, guest_names,
            dietary, charter_experience, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (lower(email)) DO NOTHING`,
        [
          row.full_name,
          row.company,
          row.email,
          row.mobile,
          row.guest_count,
          row.guest_names,
          row.dietary,
          row.charter_experience,
          row.notes,
        ],
      );
      added += result.rowCount ?? 0;
    }

    const { rows } = await pool.query<{ people: string | null }>(
      "SELECT sum(guest_count) AS people FROM registrations WHERE NOT waitlisted",
    );
    console.log(
      `Added ${added} registration(s). Confirmed headcount is now ${rows[0]?.people ?? 0}.`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
