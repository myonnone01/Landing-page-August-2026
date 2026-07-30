"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "@/app/admin/actions";

const initial: SignInState = { error: null };

export function PasscodeGate() {
  const [state, action, pending] = useActionState(signIn, initial);

  return (
    <div className="mx-auto w-full max-w-sm px-5 py-24">
      <h1 className="font-display text-2xl font-bold tracking-tight text-navy-800">
        Roster
      </h1>
      <p className="mt-2 text-[0.9rem] leading-relaxed text-navy-400">
        Enter the passcode to see who is on the boat.
      </p>

      <form action={action} className="mt-7">
        <label
          htmlFor="passcode"
          className="block font-sans text-[0.9rem] font-medium text-navy-800"
        >
          Passcode
        </label>
        <input
          id="passcode"
          name="passcode"
          type="password"
          autoComplete="current-password"
          autoFocus
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "passcode-error" : undefined}
          className="mt-1.5 w-full rounded-md border-0 bg-white px-3.5 py-2.5 text-[0.95rem] text-navy-800 ring-1 ring-navy-200 focus:ring-2 focus:ring-ocean-500"
        />

        {state.error && (
          <p
            id="passcode-error"
            role="alert"
            className="mt-2 text-[0.85rem] font-medium text-navy-800"
          >
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-5 w-full rounded-md bg-ocean-600 px-5 py-2.5 font-display text-[0.95rem] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Checking…" : "Show me the roster"}
        </button>
      </form>
    </div>
  );
}
