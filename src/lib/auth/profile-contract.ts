import { isCurrencyCode, isLanguage, type CurrencyCode, type Language } from "@/i18n/config";
import type { Tables, TablesInsert, TablesUpdate } from "@/lib/supabase/database.types";

export type ProfileRow = Tables<"profiles">;
export type ProfileInsert = TablesInsert<"profiles">;
export type ProfileUpdate = TablesUpdate<"profiles">;
export type ProfileAvatarMode = "photo" | "initials";

export type UserProfile = Omit<ProfileRow, "avatar_mode" | "currency_code" | "locale"> & {
  avatar_mode: ProfileAvatarMode;
  currency_code: CurrencyCode;
  locale: Language;
};

export type ProfilePreferences = Pick<UserProfile, "currency_code" | "locale">;

export type ProfileErrorCode =
  | "authentication_required"
  | "profile_not_found"
  | "preference_invalid"
  | "conflict"
  | "ownership_denied"
  | "financial_data_exists"
  | "persistence_unavailable"
  | "unknown_persistence_error";

export class ProfileError extends Error {
  readonly code: ProfileErrorCode;

  constructor(code: ProfileErrorCode) {
    super(code);
    this.name = "ProfileError";
    this.code = code;
  }
}

export function profileRowToUserProfile(row: ProfileRow): UserProfile {
  if (!isLanguage(row.locale) || !isCurrencyCode(row.currency_code) || !isProfileAvatarMode(row.avatar_mode)) {
    throw new ProfileError("preference_invalid");
  }
  return { ...row, locale: row.locale, currency_code: row.currency_code, avatar_mode: row.avatar_mode };
}

export function profilePreferencesRowToDomain(row: Pick<ProfileRow, "currency_code" | "locale">): ProfilePreferences {
  if (!isLanguage(row.locale) || !isCurrencyCode(row.currency_code)) {
    throw new ProfileError("preference_invalid");
  }
  return { locale: row.locale, currency_code: row.currency_code };
}

export function mapProfilePersistenceError(error: unknown): ProfileError {
  if (error instanceof ProfileError) return error;
  const code = readStringProperty(error, "code");
  if (code === "PGRST116") return new ProfileError("profile_not_found");
  if (code === "23505") return new ProfileError("conflict");
  if (code === "23514") return new ProfileError("preference_invalid");
  if (code === "42501") return new ProfileError("ownership_denied");
  if (code === "invalid_credentials" || code === "session_not_found") return new ProfileError("authentication_required");
  if (isNetworkFailure(error, code)) return new ProfileError("persistence_unavailable");
  return new ProfileError("unknown_persistence_error");
}

export type ProfilePreferenceLoadResult =
  | { status: "success"; data: ProfilePreferences }
  | { status: "failure"; error: ProfileError };

export async function settleProfilePreferenceLoad(loader: () => Promise<ProfilePreferences>): Promise<ProfilePreferenceLoadResult> {
  try {
    return { status: "success", data: await loader() };
  } catch (error: unknown) {
    return { status: "failure", error: mapProfilePersistenceError(error) };
  }
}

function isProfileAvatarMode(value: string): value is ProfileAvatarMode {
  return value === "photo" || value === "initials";
}

function isNetworkFailure(error: unknown, code: string | null) {
  if (error instanceof TypeError) return true;
  if (code && ["ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "NETWORK_ERROR", "FETCH_ERROR"].includes(code)) return true;
  const message = readStringProperty(error, "message");
  return message !== null && /fetch|network|connection|timeout/i.test(message);
}

function readStringProperty(value: unknown, property: string) {
  if (typeof value !== "object" || value === null || !(property in value)) return null;
  const propertyValue = (value as Record<string, unknown>)[property];
  return typeof propertyValue === "string" ? propertyValue : null;
}
