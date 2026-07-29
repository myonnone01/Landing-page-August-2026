import { RegistrationForm, type FormMode } from "@/components/RegistrationForm";
import { SounderPanel } from "@/components/SounderPanel";
import { SponsorBand } from "@/components/SponsorBand";
import { EVENT, FULL_ADDRESS, capacity, registrationClosed } from "@/lib/event";
import { dateLong, time } from "@/lib/format";
import { confirmedHeadcount } from "@/lib/registrations";

// "Spots left" has to be live, so the page is never served from a cache.
export const dynamic = "force-dynamic";

export default async function Page() {
  const seats = capacity();
  const seatsTaken = await confirmedHeadcount();
  const spotsLeft = Math.max(0, seats - seatsTaken);

  const mode: FormMode = registrationClosed()
    ? "closed"
    : spotsLeft === 0
      ? "waitlist"
      : "open";

  const mapsHref = `https://maps.google.com/?q=${encodeURIComponent(FULL_ADDRESS)}`;

  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-24 sm:px-8">
      {/* ---------------------------------------------------------------- host */}
      <header className="flex items-baseline justify-between gap-4 py-7">
        <p className="font-display text-[1.05rem] font-bold tracking-tight text-sound-900">
          {EVENT.host}
        </p>
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-shoal-400">
          Customer event
        </p>
      </header>

      {/* ----------------------------------------------------------- invitation */}
      <section className="max-w-2xl pt-6 pb-12">
        <h1 className="font-display text-[2.6rem] leading-[1.05] font-bold tracking-tight text-sound-900 sm:text-[3.5rem]">
          Come out on the Sound with us.
        </h1>
        <p className="mt-6 text-[1.05rem] leading-relaxed text-sound-500">
          {EVENT.host} is taking {EVENT.boat} out of {EVENT.venue} on{" "}
          {dateLong(EVENT.sailAt)}. Four hours of fishing on Long Island Sound
          with {EVENT.operator}. We bring all the gear — you just show up.
        </p>
        <p className="mt-4 text-[1.05rem] leading-relaxed text-sound-500">
          If you have never done this before, that is the normal case. The mate
          will rig your line and take the fish off the hook.
        </p>
      </section>

      {/* --------------------------------------------- signature: the schedule */}
      <SounderPanel />

      {/* ------------------------------------------------------ the trip sheet */}
      <Section label="Trip sheet">
        <dl className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
          <Entry term="What’s included">
            Every bit of the fishing gear — rods, reels, tackle and bait.
            Nothing to rent, nothing to buy, no experience needed.
          </Entry>
          <Entry term="What to bring">
            Soft-soled shoes, a layer for when the sun drops, sunglasses and
            sunscreen. It gets cooler on the water than you expect.
          </Entry>
          <Entry term="Weather">
            We sail rain or shine. Unsafe conditions are the only thing that
            cancels this, and if that happens I will text you.
          </Entry>
          <Entry term="Guests">
            You can bring one guest. Add their name when you sign up so the mate
            knows who is aboard.
          </Entry>
        </dl>
      </Section>

      {/* ---------------------------------------------------------------- where */}
      <Section label="Where">
        <p className="font-display text-2xl leading-snug font-semibold text-sound-900">
          {EVENT.venue}
        </p>
        <p className="mt-2 text-[1rem] leading-relaxed text-sound-500">
          {EVENT.street}
          <br />
          {EVENT.city}, {EVENT.state} {EVENT.zip}
        </p>
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block font-sans text-[0.9rem] font-medium text-sound-900 underline decoration-shoal-400 underline-offset-4 hover:decoration-sound-900"
        >
          Open in Maps
        </a>
        <p className="mt-6 max-w-md text-[0.9rem] leading-relaxed text-shoal-400">
          Give yourself time to park and find the dock. Being on time here means{" "}
          {time(EVENT.arriveBy)}, not {time(EVENT.sailAt)}.
        </p>
      </Section>

      {/* ------------------------------------------------------------- register */}
      <Section
        label="Save your spot"
        readout={
          mode === "closed"
            ? "Registration closed"
            : spotsLeft === 0
              ? `Full — ${seats} of ${seats} seats taken`
              : `${seatsTaken} of ${seats} seats taken`
        }
        id="register"
      >
        <RegistrationForm mode={mode} />
      </Section>

      <SponsorBand />

      {/* --------------------------------------------------------------- footer */}
      <footer className="border-t border-shoal-400/25 pt-10">
        <p className="font-display text-[1.05rem] font-bold tracking-tight text-sound-900">
          {EVENT.host}
        </p>
        <p className="mt-2 max-w-md text-[0.9rem] leading-relaxed text-shoal-400">
          Questions, or something came up? Text or email {EVENT.contact.name}.
        </p>
        <p className="mt-3 font-mono text-[0.8rem] text-sound-500">
          <a
            href={`mailto:${EVENT.contact.email}`}
            className="underline decoration-shoal-400 underline-offset-4 hover:decoration-sound-900"
          >
            {EVENT.contact.email}
          </a>
          <span className="px-2 text-shoal-400">·</span>
          <a
            href={`sms:${EVENT.contact.mobile.replace(/[^\d+]/g, "")}`}
            className="underline decoration-shoal-400 underline-offset-4 hover:decoration-sound-900"
          >
            {EVENT.contact.mobile}
          </a>
        </p>
      </footer>
    </main>
  );
}

/**
 * The page's spine: a narrow left rail carrying a mono section label and an
 * optional readout, with content in the wide column. The top rule doubles as a
 * depth tick down the page.
 */
function Section({
  label,
  readout,
  id,
  children,
}: {
  label: string;
  readout?: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="grid gap-x-10 gap-y-5 border-t border-shoal-400/25 py-14 md:grid-cols-[8rem_minmax(0,1fr)]"
    >
      <div className="self-start md:sticky md:top-8">
        <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-shoal-400">
          {label}
        </h2>
        {readout && (
          <p className="mt-1.5 font-mono text-[0.7rem] text-shoal-400/80">
            {readout}
          </p>
        )}
      </div>
      <div>{children}</div>
    </section>
  );
}

function Entry({
  term,
  children,
}: {
  term: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-sound-900">
        {term}
      </dt>
      <dd className="mt-2 text-[0.95rem] leading-relaxed text-sound-500">
        {children}
      </dd>
    </div>
  );
}
