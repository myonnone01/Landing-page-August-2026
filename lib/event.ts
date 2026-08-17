/**
 * Single source of truth for every fact about the trip.
 *
 * Copy on the page, the .ics file, and the admin stats all read from here, so
 * a detail only ever needs changing in one place. Capacity lives in the
 * environment instead (it is the one value that differs between dev and prod).
 */

/** Eastern Daylight Time is UTC-4 in late August. */
const EDT_OFFSET = "-04:00";

export const EVENT = {
  /** Carried over from the previous event site, so the series reads as one. */
  title: "Cast Off with Presidio",

  host: "Presidio",
  hostBlurb: "technology solutions and managed services",

  boat: "The Middlebank",
  operator: "Middlebank Sport Fishing",

  venue: "Captain's Cove Seaport",
  street: "1 Bostwick Ave",
  city: "Bridgeport",
  state: "CT",
  zip: "06605",

  /** Sail and return, in ISO-with-offset so the .ics is unambiguous. */
  sailAt: `2026-08-25T16:00:00${EDT_OFFSET}`,
  returnAt: `2026-08-25T20:00:00${EDT_OFFSET}`,
  /** Be at the dock by this time. The boat does not wait. */
  arriveBy: `2026-08-25T15:30:00${EDT_OFFSET}`,

  /**
   * Registration stays open until the boat pulls away — the same instant as
   * sailAt, so signing up is possible right through the day of the trip.
   *
   * Deliberately not the end of Aug 25: the boat is back at the dock by 8:00
   * PM, so a registration taken that evening could not be honoured. This is
   * the first instant that is too late.
   */
  rsvpClosesAt: `2026-08-25T16:00:00${EDT_OFFSET}`,
  rsvpDeadlineLabel: "Tuesday, August 25",

  /**
   * Catering and drinks were confirmed as carrying over from last year's
   * event, alongside the fishing gear the brief specified.
   */
  provided: "Catering, drinks, and all fishing gear",

  contact: {
    name: "Mike Yonnone",
    email: "myonnone@presidio.com",
    mobile: "(203) 450-7593",
  },

  sponsors: [
    { name: "Komprise", href: "https://komprise.com" },
    { name: "Illumio", href: "https://illumio.com" },
    { name: "Silk", href: "https://silk.us" },
  ],
} as const;

export const FULL_ADDRESS = `${EVENT.venue}, ${EVENT.street}, ${EVENT.city}, ${EVENT.state} ${EVENT.zip}`;

/** Used when EVENT_CAPACITY is unset, so a missing variable cannot break the page. */
export const DEFAULT_CAPACITY = 50;

/**
 * Total seats, counting hosts. Override with EVENT_CAPACITY.
 *
 * A bad value falls back to the default and logs, rather than throwing — a typo
 * in an environment variable should not take the registration page down.
 */
export function capacity(): number {
  const raw = process.env.EVENT_CAPACITY;
  if (raw === undefined || raw.trim() === "") return DEFAULT_CAPACITY;

  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    console.error(
      `[event] EVENT_CAPACITY must be a positive integer, got ${JSON.stringify(raw)}. Falling back to ${DEFAULT_CAPACITY}.`,
    );
    return DEFAULT_CAPACITY;
  }
  return n;
}

/** True once the RSVP deadline has passed. */
export function registrationClosed(now: Date = new Date()): boolean {
  return now.getTime() >= new Date(EVENT.rsvpClosesAt).getTime();
}
