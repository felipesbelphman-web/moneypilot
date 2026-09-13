import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { mapProfilePersistenceError, type UserProfile } from "@/lib/auth/profile-contract";
import { ProfileRepository } from "@/lib/auth/profile-repository";

export type { UserProfile } from "@/lib/auth/profile-contract";

export type CurrentAccount = {
  email: string;
  profile: UserProfile;
  avatarUrl: string | null;
};

export async function getOptionalCurrentAccount(): Promise<CurrentAccount | null> {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError) {
    throw mapProfilePersistenceError(claimsError);
  }
  if (!userId) {
    return null;
  }

  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  if (userError) {
    throw mapProfilePersistenceError(userError);
  }
  if (!userData.user?.email) {
    return null;
  }

  const profile = await new ProfileRepository(supabase).getProfile(userId);

  let avatarUrl: string | null = null;

  if (profile.avatar_path) {
    const { data: signedAvatar, error: avatarError } = await supabase.storage
      .from("avatars")
      .createSignedUrl(profile.avatar_path, 60 * 60);

    if (avatarError) throw mapProfilePersistenceError(avatarError);

    avatarUrl = signedAvatar?.signedUrl ?? null;
  }

  return {
    email: userData.user.email,
    profile,
    avatarUrl,
  };
}

export async function getCurrentAccount(): Promise<CurrentAccount> {
  const account = await getOptionalCurrentAccount();

  if (!account) {
    redirect("/auth?mode=login");
  }

  return account;
}
