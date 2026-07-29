"use client";

import { useState } from "react";
import { EVENT } from "@/lib/event";

export type FormMode = "open" | "waitlist" | "closed";

type Props = {
  mode: FormMode;
};

/** Field-level messages keyed by field name, as returned by the API. */
type FieldErrors = Record<string, string>;

type Submitted = {
  fullName: string;
  waitlisted: boolean;
};

const inputClass =
  "mt-1.5 w-full rounded-md border-0 bg-white px-3.5 py-2.5 text-[0.95rem] text-sound-900 ring-1 ring-shoal-400/30 placeholder:text-shoal-400/70 focus:ring-2 focus:ring-sound-900";

const labelClass = "block font-sans text-[0.9rem] font-medium text-sound-900";

const hintClass = "mt-1 block font-sans text-[0.8rem] text-shoal-400";

export function RegistrationForm({ mode }: Props) {
  const [guestCount, setGuestCount] = useState(1);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState<Submitted | null>(null);

  if (mode === "closed") {
    return <ClosedNotice />;
  }

  if (submitted) {
    return <Confirmation submitted={submitted} />;
  }

  async function handleSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setPending(true);
    setFormError(null);
    setFieldErrors({});

    const form = formEvent.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        // Say what went wrong and what to do about it — never fail silently.
        if (data?.fieldErrors) setFieldErrors(data.fieldErrors);
        setFormError(
          data?.message ??
            `Something went wrong on our end (error ${res.status}). Try again, or text ${EVENT.contact.name.split(" ")[0]} at ${EVENT.contact.mobile}.`,
        );
        setPending(false);
        return;
      }

      setSubmitted({
        fullName: String(payload.fullName ?? ""),
        waitlisted: Boolean(data?.waitlisted),
      });
    } catch {
      setFormError(
        `Couldn't reach the server. Check your connection and try again — or just text ${EVENT.contact.name.split(" ")[0]} at ${EVENT.contact.mobile}.`,
      );
      setPending(false);
    }
  }

  return (
    <div>
      {mode === "waitlist" && (
        <p className="mb-6 rounded-md bg-white px-4 py-3 text-[0.9rem] text-sound-900 ring-1 ring-dusk-400/50">
          <strong className="font-semibold">The boat is full.</strong> You can
          still sign up — you&apos;ll go on the waitlist in order, and I&apos;ll
          text you if a spot opens.
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="max-w-xl">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            name="fullName"
            label="Full name"
            required
            autoComplete="name"
            error={fieldErrors.fullName}
          />
          <Field
            name="company"
            label="Company"
            required
            autoComplete="organization"
            error={fieldErrors.company}
          />
          <Field
            name="email"
            label="Email"
            type="email"
            required
            autoComplete="email"
            error={fieldErrors.email}
          />
          <Field
            name="mobile"
            label="Mobile"
            type="tel"
            required
            autoComplete="tel"
            hint="For weather and dock texts on the day."
            error={fieldErrors.mobile}
          />
        </div>

        <div className="mt-5">
          <label htmlFor="guestCount" className={labelClass}>
            How many of you, including yourself?
          </label>
          <select
            id="guestCount"
            name="guestCount"
            value={guestCount}
            onChange={(e) => setGuestCount(Number(e.target.value))}
            className={`${inputClass} max-w-[10rem]`}
          >
            {Array.from(
              { length: EVENT.maxGuestsPerRegistration },
              (_, i) => i + 1,
            ).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          {fieldErrors.guestCount && <FieldError id="guestCount" message={fieldErrors.guestCount} />}
        </div>

        {guestCount > 1 && (
          <div className="mt-5">
            <Field
              name="guestNames"
              label="Your guest's name"
              required
              hint="So the mate knows who's aboard."
              error={fieldErrors.guestNames}
            />
          </div>
        )}

        <div className="mt-5">
          <Field
            name="dietary"
            label="Dietary restrictions or allergies"
            error={fieldErrors.dietary}
          />
        </div>

        <fieldset className="mt-6">
          <legend className={labelClass}>
            Been on a charter before?
            <span className="font-normal text-shoal-400"> (optional)</span>
          </legend>
          <span className={hintClass}>Helps the mate plan.</span>
          <div className="mt-2.5 flex flex-wrap gap-x-6 gap-y-2">
            {[
              { value: "first_time", label: "First time" },
              { value: "experienced", label: "Done it before" },
            ].map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 text-[0.95rem] text-sound-500"
              >
                <input
                  type="radio"
                  name="charterExperience"
                  value={option.value}
                  className="h-4 w-4 accent-sound-900"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-6">
          <label htmlFor="notes" className={labelClass}>
            Anything I should know?
            <span className="font-normal text-shoal-400"> (optional)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className={inputClass}
            aria-describedby={fieldErrors.notes ? "notes-error" : undefined}
          />
          {fieldErrors.notes && <FieldError id="notes" message={fieldErrors.notes} />}
        </div>

        {formError && (
          <p
            role="alert"
            className="mt-6 rounded-md bg-white px-4 py-3 text-[0.9rem] text-sound-900 ring-1 ring-dusk-400"
          >
            {formError}
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-sound-900 px-6 py-3 font-display text-[1rem] font-semibold text-deck-50 transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {pending
              ? "Saving…"
              : mode === "waitlist"
                ? "Add me to the waitlist"
                : "Save my spot"}
          </button>
          {mode === "open" && (
            <p className="font-mono text-[0.75rem] text-shoal-400">
              RSVP by {EVENT.rsvpDeadlineLabel}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required = false,
  autoComplete,
  hint,
  error,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
  error?: string;
}) {
  const describedBy =
    [hint ? `${name}-hint` : null, error ? `${name}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}
        {!required && (
          <span className="font-normal text-shoal-400"> (optional)</span>
        )}
      </label>
      {hint && (
        <span id={`${name}-hint`} className={hintClass}>
          {hint}
        </span>
      )}
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={inputClass}
      />
      {error && <FieldError id={name} message={error} />}
    </div>
  );
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p
      id={`${id}-error`}
      className="mt-1.5 font-sans text-[0.8rem] font-medium text-sound-900"
    >
      {message}
    </p>
  );
}

function ClosedNotice() {
  const firstName = EVENT.contact.name.split(" ")[0];
  return (
    <div className="max-w-xl rounded-md bg-white px-5 py-5 ring-1 ring-shoal-400/25">
      <h3 className="font-display text-xl font-semibold text-sound-900">
        Registration is closed
      </h3>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-sound-500">
        We closed the list on {EVENT.rsvpDeadlineLabel} so the boat could get a
        final count. If you still want to come, text {firstName} at{" "}
        <a
          href={`sms:${EVENT.contact.mobile.replace(/[^\d+]/g, "")}`}
          className="font-medium text-sound-900 underline decoration-shoal-400 underline-offset-2"
        >
          {EVENT.contact.mobile}
        </a>{" "}
        and he&apos;ll see what he can do.
      </p>
    </div>
  );
}

function Confirmation({ submitted }: { submitted: Submitted }) {
  const firstName = submitted.fullName.trim().split(" ")[0] || "You";

  return (
    <div className="max-w-xl">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.22em] text-shoal-400">
        {submitted.waitlisted ? "On the waitlist" : "Confirmed"}
      </p>
      <h3 className="mt-2 font-display text-3xl font-bold tracking-tight text-sound-900 sm:text-4xl">
        {submitted.waitlisted
          ? `You're on the list, ${firstName}.`
          : `You're on the boat, ${firstName}.`}
      </h3>
      <p className="mt-3 text-[0.95rem] leading-relaxed text-sound-500">
        {submitted.waitlisted ? (
          <>
            The boat is full right now. I&apos;ll text you at the number you
            gave me if a spot opens up before {EVENT.rsvpDeadlineLabel}.
          </>
        ) : (
          <>
            Be at {EVENT.venue} by 3:30 PM on Tuesday, August 25. The boat
            leaves at 4:00. I&apos;ll text you the morning of with the weather.
          </>
        )}
      </p>

      {!submitted.waitlisted && (
        <a
          href="/api/calendar"
          download="presidio-middlebank-charter.ics"
          className="mt-7 inline-block rounded-md bg-sound-900 px-6 py-3 font-display text-[1rem] font-semibold text-deck-50 transition-opacity hover:opacity-90"
        >
          Add to calendar
        </a>
      )}
    </div>
  );
}
