/**
 * Which required environment variables are absent.
 *
 * EVENT_CAPACITY is deliberately not here — it has a default, so a missing
 * value is not a failure.
 */
export function missingEnv(): string[] {
  const required = [
    "DATABASE_URL",
    "ADMIN_PASSCODE",
    "ADMIN_SESSION_SECRET",
  ] as const;

  return required.filter((name) => {
    const value = process.env[name];
    return value === undefined || value.trim() === "";
  });
}

/**
 * The public page only needs the database. The admin variables can be missing
 * without stopping anyone from registering.
 */
export function missingEnvForPublicPage(): string[] {
  return missingEnv().filter((name) => name === "DATABASE_URL");
}
