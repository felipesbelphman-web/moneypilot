"use server";

import { getCurrentAccount } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import type { Language } from "@/components/LanguageProvider";
import { isCurrencyCode, isLanguage, type CurrencyCode } from "@/i18n/config";
import { mapProfilePersistenceError, ProfileError, type ProfileUpdate } from "@/lib/auth/profile-contract";
import { ProfileRepository } from "@/lib/auth/profile-repository";

export async function markWelcomeSeen() {
  const account = await getCurrentAccount();

  if (account.profile.has_seen_welcome) {
    return {
      hasSeenWelcome: true,
    };
  }

  const supabase = await createClient();
  const repository = new ProfileRepository(supabase);

  const update: ProfileUpdate = { has_seen_welcome: true };
  await repository.updateProfile(account.profile.id, update);

  return {
    hasSeenWelcome: true,
  };
}

const avatarMimeExtensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export async function updateProfileIdentity(formData: FormData) {
  const account = await getCurrentAccount();
  const supabase = await createClient();
  const repository = new ProfileRepository(supabase);
  const cleanDisplayName = String(formData.get("displayName") ?? "")
    .trim()
    .replace(/\s+/g, " ");
  const avatarModeValue = formData.get("avatarMode");
  const removePhoto = formData.get("removePhoto") === "true";
  const avatarFile = formData.get("avatarFile");

  if (!cleanDisplayName) {
    throw new Error("Display name is required");
  }
  if (avatarModeValue !== "photo" && avatarModeValue !== "initials") {
    throw new Error("Invalid avatar mode");
  }
  const avatarMode: "photo" | "initials" = avatarModeValue;

  let nextAvatarPath = removePhoto ? null : account.profile.avatar_path;
  let uploadedPath: string | null = null;

  if (avatarFile instanceof File && avatarFile.size > 0) {
    const extension = avatarMimeExtensions[
      avatarFile.type as keyof typeof avatarMimeExtensions
    ];

    if (!extension) {
      throw new Error("Choose a JPEG, PNG, or WebP image");
    }
    if (avatarFile.size > 5 * 1024 * 1024) {
      throw new Error("Profile photos must be 5 MB or smaller");
    }

    uploadedPath = `${account.profile.id}/avatar.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(uploadedPath, avatarFile, {
        contentType: avatarFile.type,
        upsert: true,
      });

    if (uploadError) {
      throw mapProfilePersistenceError(uploadError);
    }

    nextAvatarPath = uploadedPath;
  }

  if (avatarMode === "photo" && !nextAvatarPath) {
    throw new Error("Choose a profile photo before using photo mode");
  }

  const update: ProfileUpdate = {
    display_name: cleanDisplayName,
    avatar_mode: avatarMode,
    avatar_path: nextAvatarPath,
  };
  let confirmedProfile;
  try {
    confirmedProfile = await repository.updateProfile(account.profile.id, update);
  } catch (error: unknown) {
    if (uploadedPath && uploadedPath !== account.profile.avatar_path) {
      await supabase.storage.from("avatars").remove([uploadedPath]);
    }
    throw mapProfilePersistenceError(error);
  }

  if (removePhoto && account.profile.avatar_path) {
    const { error: removeError } = await supabase.storage
      .from("avatars")
      .remove([account.profile.avatar_path]);

    if (removeError) {
      await repository.updateProfile(account.profile.id, {
        display_name: account.profile.display_name,
        avatar_mode: account.profile.avatar_mode,
        avatar_path: account.profile.avatar_path,
      });
      throw mapProfilePersistenceError(removeError);
    }
  } else if (
    uploadedPath &&
    account.profile.avatar_path &&
    uploadedPath !== account.profile.avatar_path
  ) {
    await supabase.storage.from("avatars").remove([account.profile.avatar_path]);
  }

  let avatarUrl: string | null = null;
  if (nextAvatarPath) {
    const { data: signedAvatar, error: avatarError } = await supabase.storage
      .from("avatars")
      .createSignedUrl(nextAvatarPath, 60 * 60);
    if (avatarError) throw mapProfilePersistenceError(avatarError);
    avatarUrl = signedAvatar?.signedUrl ?? null;
  }

  return {
    displayName: confirmedProfile.display_name ?? cleanDisplayName,
    avatarMode: confirmedProfile.avatar_mode,
    avatarPath: confirmedProfile.avatar_path,
    avatarUrl,
  };
}

export async function updateProfilePreferences(input: {
  locale: Language;
  currencyCode: CurrencyCode;
}) {
  if (!isLanguage(input.locale) || !isCurrencyCode(input.currencyCode)) {
    throw new ProfileError("preference_invalid");
  }
  const account = await getCurrentAccount();
  const supabase = await createClient();
  const repository = new ProfileRepository(supabase);

  const confirmed = await repository.updatePreferences(
    account.profile.id,
    account.profile.currency_code,
    input,
  );

  return {
    locale: confirmed.locale,
    currencyCode: confirmed.currency_code,
  };
}
