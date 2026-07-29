import { EVENT, FULL_ADDRESS } from "@/lib/event";
import { time } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * A plain .ics download. Not an invite and not an email — a file the registrant
 * clicks, so nothing is sent on their behalf and no address book is touched.
 *
 * The calendar block starts at the 3:30 arrival rather than the 4:00 sail time,
 * because the useful thing to have on a calendar is when to be standing on the
 * dock.
 */
export async function GET() {
  const body = buildIcs();

  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="presidio-middlebank-charter.ics"',
      "Cache-Control": "no-store",
    },
  });
}

function buildIcs(): string {
  const description = [
    `Be at the dock by ${time(EVENT.arriveBy)}. ${EVENT.boat} leaves at ${time(EVENT.sailAt)} with or without you.`,
    `Back at the dock by ${time(EVENT.returnAt)}.`,
    "",
    `All fishing gear is provided — rods, reels, tackle and bait. No experience needed.`,
    "Bring soft-soled shoes, a layer for when the sun drops, sunglasses and sunscreen.",
    "",
    `Questions or running late: ${EVENT.contact.name}, ${EVENT.contact.mobile}`,
  ].join("\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Presidio//Middlebank Charter//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    // Stable UID, so re-downloading updates the entry instead of duplicating it.
    "UID:presidio-middlebank-charter-2026-08-25@presidio.com",
    `DTSTAMP:${utcStamp(new Date())}`,
    `DTSTART:${utcStamp(new Date(EVENT.arriveBy))}`,
    `DTEND:${utcStamp(new Date(EVENT.returnAt))}`,
    `SUMMARY:${escapeText(`${EVENT.host} charter — ${EVENT.boat}`)}`,
    `LOCATION:${escapeText(FULL_ADDRESS)}`,
    `DESCRIPTION:${escapeText(description)}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  // RFC 5545 wants CRLF line endings.
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

/**
 * Times are written in UTC with a Z suffix. That is unambiguous without shipping
 * a VTIMEZONE block, and every calendar renders it back in the reader's zone.
 */
function utcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Escape per RFC 5545: backslash, semicolon, comma, and newlines. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Content lines are limited to 75 octets and continue with CRLF + a single
 * space. Folding on octets rather than characters keeps multi-byte characters
 * (the em dashes in the description) from being split down the middle.
 */
function foldLine(line: string): string {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;

  const chunks: string[] = [];
  let start = 0;
  let limit = 75;

  while (start < bytes.length) {
    let end = Math.min(start + limit, bytes.length);
    // Back off if we landed inside a UTF-8 continuation byte (0b10xxxxxx).
    while (end > start && end < bytes.length && (bytes[end] & 0xc0) === 0x80) {
      end--;
    }
    chunks.push(bytes.subarray(start, end).toString("utf8"));
    start = end;
    // Continuation lines carry a leading space, so they hold one byte less.
    limit = 74;
  }

  return chunks.join("\r\n ");
}
