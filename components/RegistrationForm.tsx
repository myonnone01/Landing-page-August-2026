"use client";

import { useState } from "react";
import { EVENT } from "@/lib/event";
import { dateLong, time } from "@/lib/format";

export type FormMode = "open" | "waitlist" | "closed";

type Props = {
  mode: FormMode;
  spotsLeft: number;
};

type FieldErrors = Record<string, string>;

type Submitted = { fullName: string; waitlisted: boolean };

const inputClass =
  "mt-1.5 w-full rounded-lg border border-navy-100 bg-white px-4 py-3 text-base text-navy-800 shadow-sm placeholder:text-navy-300 focus:border-ocean-500 focus:ring-2 focus:ring-ocean-200";

const labelClass = "block text-sm font-semibold text-navy-800";

export function RegistrationForm({ mode, spotsLeft }: Props) {
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState<Submitted | null>(null);

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
        if (data?.fieldErrors) setFieldErrors(data.fieldErrors);
        setFormError(
          data?.message ??
            `Something went wrong on our end (error ${res.status}). Try again, or text ${EVENT.contact.mobile}.`,
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
        `Couldn't reach the server. Check your connection and try again — or just text ${EVENT.contact.mobile}.`,
      );
      setPending(false);
    }
  }

  return (
    <section id="register" className="bg-white py-20">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold tracking-[0.25em] text-ocean-600 uppercase">
            {mode === "closed" ? "Registration closed" : "Reserve your spot"}
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold text-navy-800 sm:text-4xl">
            {submitted
              ? submitted.waitlisted
                ? "You're on the list"
                : "You're on the boat"
              : "Come Aboard"}
          </h2>
          {mode === "open" && !submitted && (
            <p className="mt-3 text-navy-600">
              RSVP by {EVENT.rsvpDeadlineLabel}. {spotsLeft}{" "}
              {spotsLeft === 1 ? "spot" : "spots"} left.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-navy-100 bg-sand-50 p-6 shadow-sm sm:p-10">
          {mode === "closed" ? (
            <ClosedNotice />
          ) : submitted ? (
            <Confirmation submitted={submitted} />
          ) : (
            <>
              {mode === "waitlist" && (
                <p className="mb-6 rounded-lg border border-sand-400 bg-sand-100 px-4 py-3 text-sm text-navy-800">
                  <strong className="font-semibold">The boat is full.</strong>{" "}
                  You can still sign up — you&apos;ll go on the waitlist in
                  order, and we&apos;ll text you if a spot opens.
                </p>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field
                      name="fullName"
                      label="Full Name"
                      required
                      autoComplete="name"
                      error={fieldErrors.fullName}
                    />
                  </div>
                  <Field
                    name="company"
                    label="Company"
                    required
                    autoComplete="organization"
                    error={fieldErrors.company}
                  />
                  <Field
                    name="jobTitle"
                    label="Job Title"
                    autoComplete="organization-title"
                    error={fieldErrors.jobTitle}
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
                    name="phoneNumber"
                    label="Phone Number"
                    type="tel"
                    required
                    autoComplete="tel"
                    hint="For weather and dock texts on the day."
                    error={fieldErrors.phoneNumber}
                  />
                </div>

                <div className="mt-5">
                  <label htmlFor="dietaryNeeds" className={labelClass}>
                    Dietary Needs or Accessibility Requests
                    <span className="font-normal text-navy-400"> (optional)</span>
                  </label>
                  <textarea
                    id="dietaryNeeds"
                    name="dietaryNeeds"
                    rows={3}
                    placeholder="Let us know about any allergies, accommodations, or accessibility needs."
                    className={inputClass}
                    aria-describedby={
                      fieldErrors.dietaryNeeds ? "dietaryNeeds-error" : undefined
                    }
                  />
                  {fieldErrors.dietaryNeeds && (
                    <FieldError
                      id="dietaryNeeds"
                      message={fieldErrors.dietaryNeeds}
                    />
                  )}
                </div>

                {formError && (
                  <p
                    role="alert"
                    className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                  >
                    {formError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={pending}
                  className="mt-8 w-full rounded-full bg-ocean-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-ocean-700 disabled:opacity-60"
                >
                  {pending
                    ? "Saving…"
                    : mode === "waitlist"
                      ? "Add Me to the Waitlist"
                      : "Reserve Your Spot"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
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
          <span className="font-normal text-navy-400"> (optional)</span>
        )}
      </label>
      {hint && (
        <span id={`${name}-hint`} className="mt-0.5 block text-xs text-navy-500">
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
    <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-red-700">
      {message}
    </p>
  );
}

function ClosedNotice() {
  return (
    <div className="text-center">
      <p className="text-base leading-relaxed text-navy-600">
        We closed the list on {EVENT.rsvpDeadlineLabel} so the boat could get a
        final count. If you still want to come, text me at{" "}
        <a
          href={`sms:${EVENT.contact.mobile.replace(/[^\d+]/g, "")}`}
          className="font-semibold text-ocean-700 underline underline-offset-4"
        >
          {EVENT.contact.mobile}
        </a>{" "}
        and I&apos;ll see what I can do.
      </p>
    </div>
  );
}

function Confirmation({ submitted }: { submitted: Submitted }) {
  const firstName = submitted.fullName.trim().split(" ")[0] || "You";

  return (
    <div className="text-center">
      <p className="text-lg font-semibold text-navy-800">
        {submitted.waitlisted
          ? `Thanks, ${firstName} — you're on the waitlist.`
          : `See you on the dock, ${firstName}.`}
      </p>
      <p className="mt-3 text-base leading-relaxed text-navy-600">
        {submitted.waitlisted ? (
          <>
            The boat is full right now. We&apos;ll text you at the number you
            gave us if a spot opens up before {EVENT.rsvpDeadlineLabel}.
          </>
        ) : (
          <>
            Be at {EVENT.venue} by {time(EVENT.arriveBy)} on{" "}
            {dateLong(EVENT.sailAt)}. The boat leaves at {time(EVENT.sailAt)}.
            We&apos;ll text you the morning of with the weather.
          </>
        )}
      </p>

      {!submitted.waitlisted && (
        <a
          href="/api/calendar"
          download="cast-off-with-presidio.ics"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-ocean-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-ocean-700"
        >
          Add to Calendar
        </a>
      )}
    </div>
  );
}
