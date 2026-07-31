import { EventDetails } from "@/components/EventDetails";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { LocationMap } from "@/components/LocationMap";
import { RegistrationForm, type FormMode } from "@/components/RegistrationForm";
import { SetupNotice } from "@/components/SetupNotice";
import { missingEnvForPublicPage } from "@/lib/config";
import { capacity, registrationClosed } from "@/lib/event";
import { confirmedHeadcount } from "@/lib/registrations";

// The waitlist switch depends on the live count, so never serve from a cache.
// The remaining count itself is deliberately not shown to the public.
export const dynamic = "force-dynamic";

export default async function Page() {
  const missing = missingEnvForPublicPage();
  if (missing.length > 0) {
    return <SetupNotice missing={missing} />;
  }

  const seats = capacity();

  // The form is useless without the database, so an unreachable database gets
  // an honest page with a working phone number rather than a stack trace.
  let seatsTaken: number;
  try {
    seatsTaken = await confirmedHeadcount();
  } catch (error) {
    console.error(
      "[page] could not read the headcount:",
      error instanceof Error ? error.message : error,
    );
    return <SetupNotice missing={[]} />;
  }

  const spotsLeft = Math.max(0, seats - seatsTaken);

  const mode: FormMode = registrationClosed()
    ? "closed"
    : spotsLeft === 0
      ? "waitlist"
      : "open";

  return (
    <main>
      <Hero />
      <EventDetails />
      <LocationMap />
      <RegistrationForm mode={mode} />
      <Footer />
    </main>
  );
}
