"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const displayName = `${firstName} ${lastName}`.trim();

  if (!firstName || !lastName || !email || !password) {
    redirect("/auth?mode=signup&error=missing-fields");
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? "http://localhost:3000";

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
      data: {
        display_name: displayName,
      },
    },
  });

  if (error) {
    redirect("/auth?mode=signup&error=signup-failed");
  }

  revalidatePath("/", "layout");

  if (data.session) {
    redirect("/dashboard");
  }

  redirect("/auth?mode=verify-email");
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/auth?mode=login&error=missing-fields");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (error) {
  redirect(`/auth?mode=login&error=${classifySignInError(error)}`);
}

revalidatePath("/", "layout");
redirect("/dashboard");
}

function classifySignInError(error: { code?: string; name: string; status?: number }) {
  if (error.code === "invalid_credentials") {
    return "invalid-credentials";
  }

  if (
    error.name === "AuthRetryableFetchError" ||
    error.status === 0 ||
    error.status === 429 ||
    (error.status !== undefined && error.status >= 500) ||
    error.code === "request_timeout"
  ) {
    return "auth-unavailable";
  }

  return "auth-error";
}

export async function signOut() {
  const supabase = await createClient();

  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/auth?mode=login");
}
