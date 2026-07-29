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
   * Registration closes at the end of this day, Eastern. The brief said
   * "Friday, August 15" but Aug 15 2026 is a Saturday; confirmed as Friday
   * Aug 14. Stored as the first instant that is too late.
   */
  rsvpClosesAt: `2026-08-15T00:00:00${EDT_OFFSET}`,
  rsvpDeadlineLabel: "Friday, August 14",

  maxGuestsPerRegistration: 2,

  // TODO(host): mobile is a placeholder — the brief left it blank. It is shown
  // on the page and written into the .ics description. Replace before sending
  // the URL to anyone.
  contact: {
    name: "Mike Yonnone",
    email: "mike.yonnone@gmail.com",
    mobile: "(555) 555-0142",
  },

  sponsors: [
    { name: "Komprise", href: "https://komprise.com" },
    { name: "Illumio", href: "https://illumio.com" },
  ],
} as const;

export const FULL_ADDRESS = `${EVENT.venue}, ${EVENT.street}, ${EVENT.city}, ${EVENT.state} ${EVENT.zip}`;

/** Total seats, counting hosts. Set EVENT_CAPACITY in the environment. */
export function capacity(): number {
  const raw = process.env.EVENT_CAPACITY;
  const n = Number(raw);
  if (!raw || !Number.isInteger(n) || n <= 0) {
    throw new Error(
      `EVENT_CAPACITY must be a positive integer, got ${JSON.stringify(raw)}. See .env.example.`,
    );
  }
  return n;
}

/** True once the RSVP deadline has passed. */
export function registrationClosed(now: Date = new Date()): boolean {
  return now.getTime() >= new Date(EVENT.rsvpClosesAt).getTime();
}
