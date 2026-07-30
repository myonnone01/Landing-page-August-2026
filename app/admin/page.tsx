import type { Metadata } from "next";
import { PasscodeGate } from "@/components/admin/PasscodeGate";
import { Roster } from "@/components/admin/Roster";
import { SetupNotice } from "@/components/SetupNotice";
import { isSignedIn } from "@/lib/admin-auth";
import { missingEnv } from "@/lib/config";
import { capacity } from "@/lib/event";
import { listRegistrations } from "@/lib/registrations";

// Nothing about this page is cacheable, and it must never be prerendered with
// somebody's roster baked in.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Roster",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  // The gate itself needs the passcode and the signing key, so check before it
  // rather than letting the sign-in action throw.
  const missing = missingEnv();
  if (missing.length > 0) {
    return <SetupNotice missing={missing} />;
  }

  if (!(await isSignedIn())) {
    return <PasscodeGate />;
  }

  // Only fetched after the gate passes, so registrant data never reaches an
  // unauthenticated response.
  const registrations = await listRegistrations();

  return <Roster registrations={registrations} capacity={capacity()} />;
}
