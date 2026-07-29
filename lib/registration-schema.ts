import { z } from "zod";
import { EVENT } from "./event";

/**
 * The one definition of a valid registration. The API validates against this on
 * the server — the browser's own `required` attributes are a convenience, not a
 * control.
 *
 * Messages are written to be shown to a person: what is wrong and what to do.
 */
export const registrationSchema = z
  .object({
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

    email: z
      .string()
      .trim()
      .min(1, "Please enter your email.")
      .max(200, "That email is too long.")
      .pipe(z.email("That doesn't look like an email address.")),

    mobile: z
      .string()
      .trim()
      .min(1, "Please enter a mobile number — we text the weather that morning.")
      .refine(
        (value) => {
          const digits = value.replace(/\D/g, "");
          return digits.length >= 10 && digits.length <= 15;
        },
        "Please enter a mobile number with area code, like (203) 555-0142.",
      ),

    guestCount: z.coerce
      .number()
      .int("Pick 1 or 2.")
      .min(1, "Pick 1 or 2.")
      .max(
        EVENT.maxGuestsPerRegistration,
        `You can bring up to ${EVENT.maxGuestsPerRegistration - 1} guest. For a bigger group, email ${EVENT.contact.email}.`,
      ),

    guestNames: z
      .string()
      .trim()
      .max(200, "Please shorten this to 200 characters.")
      .optional()
      .or(z.literal("")),

    dietary: z
      .string()
      .trim()
      .max(500, "Please shorten this to 500 characters.")
      .optional()
      .or(z.literal("")),

    charterExperience: z
      .enum(["first_time", "experienced"])
      .optional()
      .or(z.literal("")),

    notes: z
      .string()
      .trim()
      .max(1000, "Please shorten this to 1000 characters.")
      .optional()
      .or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    // A guest with no name is a person the mate can't account for.
    if (value.guestCount > 1 && !value.guestNames?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["guestNames"],
        message: "Please add your guest's name so we know who's aboard.",
      });
    }
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
