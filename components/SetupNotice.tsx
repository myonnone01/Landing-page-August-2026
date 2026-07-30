import { EVENT } from "@/lib/event";
import { dateLong, time } from "@/lib/format";

/**
 * Shown instead of a crash when the app cannot reach its database or is missing
 * a required environment variable.
 *
 * Two audiences at once. A visitor gets a plain apology and a phone number that
 * still works. Whoever is setting the site up gets the names of the variables
 * that are missing — names only, never values, and never anything about the
 * database beyond "we couldn't reach it".
 */
export function SetupNotice({ missing }: { missing: string[] }) {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-24 sm:px-8">
      <p className="font-display text-[1.05rem] font-bold tracking-tight text-navy-800">
        {EVENT.host}
      </p>

      <h1 className="mt-8 font-display text-3xl leading-tight font-bold tracking-tight text-navy-800 sm:text-4xl">
        The signup page isn&apos;t working right now.
      </h1>

      <p className="mt-5 text-[1.05rem] leading-relaxed text-navy-600">
        Sorry — this is on us, not you. The trip is still happening:{" "}
        {EVENT.boat} out of {EVENT.venue} on {dateLong(EVENT.sailAt)}, at the
        dock by {time(EVENT.arriveBy)}.
      </p>

      <p className="mt-4 text-[1.05rem] leading-relaxed text-navy-600">
        To save your spot, text me at{" "}
        <a
          href={`sms:${EVENT.contact.mobile.replace(/[^\d+]/g, "")}`}
          className="font-medium text-navy-800 underline decoration-navy-300 underline-offset-4"
        >
          {EVENT.contact.mobile}
        </a>{" "}
        or email{" "}
        <a
          href={`mailto:${EVENT.contact.email}`}
          className="font-medium text-navy-800 underline decoration-navy-300 underline-offset-4"
        >
          {EVENT.contact.email}
        </a>
        .
      </p>

      <div className="mt-12 rounded-lg bg-white px-5 py-5 ring-1 ring-navy-100">
        <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-navy-400">
          For whoever set this up
        </h2>
        {missing.length > 0 ? (
          <>
            <p className="mt-2.5 text-[0.9rem] leading-relaxed text-navy-600">
              These environment variables are missing. Add them in your hosting
              settings, then redeploy — environment changes don&apos;t take
              effect without one.
            </p>
            <ul className="mt-3 space-y-1">
              {missing.map((name) => (
                <li
                  key={name}
                  className="font-mono text-[0.85rem] text-navy-800"
                >
                  {name}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-2.5 text-[0.9rem] leading-relaxed text-navy-600">
            The app couldn&apos;t reach its database. Check that{" "}
            <code className="font-mono text-navy-800">DATABASE_URL</code> is
            correct and that the database is awake — the reason is in your
            hosting logs. The schema applies itself, so there is no migration to
            run.
          </p>
        )}
      </div>
    </main>
  );
}
