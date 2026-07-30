/**
 * Inserts obviously-fake registrations so the admin page has something to show
 * during development.
 *
 *   npm run db:seed             add the rows
 *   npm run db:seed -- --reset  wipe the table first
 *
 * Every address is @example.com and every number is in the 555 reserved range,
 * so seeded rows are unmistakable if they ever reach a real database.
 */
import { Pool } from "pg";
import { SCHEMA_SQL } from "../lib/schema";

const FAKE = [
  {
    full_name: "Dana Whitfield",
    company: "Harborline Logistics",
    job_title: "VP Infrastructure",
    email: "dana.whitfield@example.com",
    phone_number: "(203) 555-0142",
    dietary_needs: "Shellfish allergy",
  },
  {
    full_name: "Priya Raghunathan",
    company: "Northfield Health",
    job_title: "Director of Security",
    email: "p.raghunathan@example.com",
    phone_number: "(860) 555-0119",
    dietary_needs: "Vegetarian",
  },
  {
    full_name: "Tom Beaulieu",
    company: "Cordis Manufacturing",
    job_title: null,
    email: "tbeaulieu@example.com",
    phone_number: "(475) 555-0188",
    dietary_needs: null,
  },
  {
    full_name: "Sylvia Okonkwo",
    company: "Meridian Trust",
    job_title: "CTO",
    email: "sokonkwo@example.com",
    phone_number: "(203) 555-0173",
    dietary_needs: null,
  },
  {
    full_name: "Ray Castellano",
    company: "Bridgeport Steel",
    job_title: "IT Manager",
    email: "ray.c@example.com",
    phone_number: "(203) 555-0106",
    dietary_needs: "No pork",
  },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. See .env.example.");
  }

  const pool = new Pool({ connectionString, max: 1 });

  try {
    // Seeding a fresh database should not require a separate setup step.
    await pool.query(SCHEMA_SQL);

    if (process.argv.includes("--reset")) {
      await pool.query("TRUNCATE registrations, rate_limit_hits");
      console.log("Cleared registrations and rate limit hits.");
    }

    let added = 0;
    for (const row of FAKE) {
      const result = await pool.query(
        `INSERT INTO registrations
           (full_name, company, job_title, email, phone_number, dietary_needs)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (lower(email)) DO NOTHING`,
        [
          row.full_name,
          row.company,
          row.job_title,
          row.email,
          row.phone_number,
          row.dietary_needs,
        ],
      );
      added += result.rowCount ?? 0;
    }

    const { rows } = await pool.query<{ people: string }>(
      "SELECT count(*) AS people FROM registrations WHERE NOT waitlisted",
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
