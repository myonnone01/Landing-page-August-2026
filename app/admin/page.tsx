import type { Metadata } from "next";
import { PasscodeGate } from "@/components/admin/PasscodeGate";
import { Roster } from "@/components/admin/Roster";
import { isSignedIn } from "@/lib/admin-auth";
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
  if (!(await isSignedIn())) {
    return <PasscodeGate />;
  }

  // Only fetched after the gate passes, so registrant data never reaches an
  // unauthenticated response.
  const registrations = await listRegistrations();

  return <Roster registrations={registrations} capacity={capacity()} />;
}
