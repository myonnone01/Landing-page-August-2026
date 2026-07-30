import { z } from "zod";

/**
 * The one definition of a valid registration. The API validates against this on
 * the server — the browser's own `required` attributes are a convenience, not a
 * control.
 *
 * Fields match the previous event site: name, company, job title, email, phone
 * and dietary needs.
 */
export const registrationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Please enter your full name.")
    .max(120, "That name is too long for our roster — 120 characters max."),

  company: z
    .string()
    .trim()
    .min(1, "Please tell us where you work.")
    .max(120, "Please shorten this to 120 characters."),

  jobTitle: z
    .string()
    .trim()
    .max(120, "Please shorten this to 120 characters.")
    .optional()
    .or(z.literal("")),

  email: z
    .string()
    .trim()
    .min(1, "Please enter your email.")
    .max(200, "That email is too long.")
    .pipe(z.email("That doesn't look like an email address.")),

  /**
   * Required here, though it was optional last year — the day-of plan is to
   * text everyone the weather and any dock changes.
   */
  phoneNumber: z
    .string()
    .trim()
    .min(1, "Please add a phone number — we text the weather that morning.")
    .refine(
      (value) => {
        const digits = value.replace(/\D/g, "");
        return digits.length >= 10 && digits.length <= 15;
      },
      "Please enter a number with area code, like (203) 555-0142.",
    ),

  dietaryNeeds: z
    .string()
    .trim()
    .max(500, "Please keep this under 500 characters.")
    .optional()
    .or(z.literal("")),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

/** Collapse a ZodError into { fieldName: firstMessage } for the form to render. */
export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
