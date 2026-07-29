import { EVENT, capacity, registrationClosed } from "@/lib/event";
import { REGISTER_LIMIT, checkRateLimit, clientIp } from "@/lib/rate-limit";
import {
  fieldErrorsFrom,
  registrationSchema,
} from "@/lib/registration-schema";
import { createRegistration } from "@/lib/registrations";

/**
 * Never prerender or cache this — it writes.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // 1. Deadline. Checked server-side so a stale open tab can't slip through.
  if (registrationClosed()) {
    return Response.json(
      {
        message: `Registration closed on ${EVENT.rsvpDeadlineLabel}. Text ${EVENT.contact.name.split(" ")[0]} at ${EVENT.contact.mobile} if you still want to come.`,
      },
      { status: 403 },
    );
  }

  // 2. Rate limit. This URL goes out over email; a bot should not be able to
  //    fill the boat.
  let limit;
  try {
    limit = await checkRateLimit(REGISTER_LIMIT, clientIp(request.headers));
  } catch (error) {
    console.error("[register] rate limit check failed:", error);
    return Response.json(
      {
        message:
          "We couldn't reach the database. Try again in a minute — nothing was saved.",
      },
      { status: 503 },
    );
  }

  if (!limit.allowed) {
    return Response.json(
      {
        message: `That's a few too many tries in a row. Wait ${limit.retryAfterMinutes} minutes and try again, or text ${EVENT.contact.mobile}.`,
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterMinutes * 60) } },
    );
  }

  // 3. Parse the body.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { message: "We couldn't read that submission. Please try again." },
      { status: 400 },
    );
  }

  // 4. Validate on the server. The browser's checks are a convenience only.
  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        message: "A couple of fields need fixing — see the notes below.",
        fieldErrors: fieldErrorsFrom(parsed.error),
      },
      { status: 400 },
    );
  }

  // 5. Persist.
  try {
    const result = await createRegistration(parsed.data, capacity());

    if (result.status === "duplicate_email") {
      return Response.json(
        {
          message: `That email is already on the list. If you need to change your registration, email ${EVENT.contact.email} rather than signing up twice.`,
          fieldErrors: { email: "This email is already registered." },
        },
        { status: 409 },
      );
    }

    return Response.json(
      { waitlisted: result.waitlisted },
      { status: 201 },
    );
  } catch (error) {
    // Log the failure, never the submission — registrant details stay out of
    // the logs and live only in the database and the CSV export.
    console.error(
      "[register] insert failed:",
      error instanceof Error ? error.message : error,
    );
    return Response.json(
      {
        message: `Something broke on our end and your spot was not saved. Please try again, or text ${EVENT.contact.mobile}.`,
      },
      { status: 500 },
    );
  }
}
