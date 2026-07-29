"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  cookieOptions,
  isSignedIn,
  issueToken,
  passcodeIsCorrect,
} from "@/lib/admin-auth";
import { deleteRegistration } from "@/lib/registrations";

export type SignInState = { error: string | null };

export async function signIn(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const attempt = String(formData.get("passcode") ?? "");

  if (!attempt) {
    return { error: "Enter the passcode." };
  }

  if (!passcodeIsCorrect(attempt)) {
    // Deliberately vague — no hint about length or which character was wrong.
    return { error: "That passcode isn't right." };
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE, issueToken(), cookieOptions);
  revalidatePath("/admin");
  return { error: null };
}

export async function signOut(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  revalidatePath("/admin");
}

export type DeleteState = { error: string | null; deleted: string | null };

export async function removeRegistration(
  _prev: DeleteState,
  formData: FormData,
): Promise<DeleteState> {
  // Every mutation re-checks the session. The cookie is the only gate, so it is
  // checked here rather than trusted from whoever rendered the page.
  if (!(await isSignedIn())) {
    return { error: "Your session expired. Reload and enter the passcode again.", deleted: null };
  }

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "that entry");

  if (!id) {
    return { error: "Nothing to delete — no id was submitted.", deleted: null };
  }

  try {
    const removed = await deleteRegistration(id);
    if (!removed) {
      return {
        error: `${name} was already gone — someone may have deleted it in another tab.`,
        deleted: null,
      };
    }
    revalidatePath("/admin");
    revalidatePath("/");
    return { error: null, deleted: name };
  } catch (error) {
    console.error(
      "[admin] delete failed:",
      error instanceof Error ? error.message : error,
    );
    return {
      error: "The database rejected that delete. Nothing was removed.",
      deleted: null,
    };
  }
}
