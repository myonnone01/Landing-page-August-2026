/**
 * The boat sails on Eastern time no matter where the server or the reader is,
 * so every displayed time is pinned to that zone rather than the runtime's.
 */
const ZONE = "America/New_York";

/** "3:30 PM" */
export function time(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: ZONE,
  }).format(new Date(iso));
}

/** "Tuesday, August 25, 2026" */
export function dateLong(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: ZONE,
  }).format(new Date(iso));
}

/** "Aug 25, 3:12 PM" — compact, for the admin roster timestamps. */
export function stamp(value: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: ZONE,
  }).format(new Date(value));
}

/** Anything empty renders as an em dash, never "undefined". */
export function orDash(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const s = String(value).trim();
  return s.length > 0 ? s : "—";
}
