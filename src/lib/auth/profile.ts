import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type UserProfile = {
  id: string;
  display_name: string | null;
  locale: string;
  currency_code: string;
  has_seen_welcome: boolean;
  created_at: string;
  updated_at: string;
};

export type CurrentAccount = {
  email: string;
  profile: UserProfile;
};

export async function getCurrentAccount(): Promise<CurrentAccount> {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/auth?mode=login");
  }

  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  if (userError || !userData.user?.email) {
    redirect("/auth?mode=login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
  "id, display_name, locale, currency_code, has_seen_welcome, created_at, updated_at",
)
    .eq("id", userId)
    .single<UserProfile>();

  if (profileError) {
    throw new Error(`Failed to load user profile: ${profileError.message}`);
  }

  return {
    email: userData.user.email,
    profile,
  };
}