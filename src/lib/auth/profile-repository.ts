import type { SupabaseClient } from "@supabase/supabase-js";

import {
  mapProfilePersistenceError,
  profilePreferencesRowToDomain,
  profileRowToUserProfile,
  ProfileError,
  type ProfilePreferences,
  type ProfileUpdate,
  type UserProfile,
} from "@/lib/auth/profile-contract";
import type { CurrencyCode, Language } from "@/i18n/config";
import type { Database } from "@/lib/supabase/database.types";

const profileProjection = "id,display_name,locale,currency_code,has_seen_welcome,created_at,updated_at,avatar_mode,avatar_path";

const financialTables = [
  "transactions",
  "budgets",
  "budget_adjustments",
  "goals",
  "goal_contribution_plans",
  "investments",
] as const;

export class ProfileRepository {
  private readonly client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database>) {
    this.client = client;
  }

  async getProfile(userId: string): Promise<UserProfile> {
    requireProfileUserId(userId);
    const result = await this.client.from("profiles").select(profileProjection).eq("id", userId).single();
    if (result.error) throw mapProfilePersistenceError(result.error);
    if (!result.data) throw new ProfileError("profile_not_found");
    return profileRowToUserProfile(result.data);
  }

  async getPreferences(userId: string): Promise<ProfilePreferences> {
    requireProfileUserId(userId);
    const result = await this.client.from("profiles").select("locale,currency_code").eq("id", userId).single();
    if (result.error) throw mapProfilePersistenceError(result.error);
    if (!result.data) throw new ProfileError("profile_not_found");
    return profilePreferencesRowToDomain(result.data);
  }

  async updateProfile(userId: string, update: ProfileUpdate): Promise<UserProfile> {
    requireProfileUserId(userId);
    const result = await this.client.from("profiles").update(update).eq("id", userId).select(profileProjection).single();
    if (result.error) throw mapProfilePersistenceError(result.error);
    if (!result.data) throw new ProfileError("profile_not_found");
    return profileRowToUserProfile(result.data);
  }

  async assertCurrencyChangeAllowed(userId: string): Promise<void> {
    requireProfileUserId(userId);
    const collectionChecks = financialTables.map((table) => this.client
      .from(table)
      .select("user_id", { count: "exact", head: true })
      .eq("user_id", userId));
    const balanceCheck = this.client
      .from("account_balance_settings")
      .select("user_id")
      .eq("user_id", userId)
      .limit(1);
    const results = await Promise.all([...collectionChecks, balanceCheck]);

    const failed = results.find((result) => result.error);
    if (failed?.error) throw mapProfilePersistenceError(failed.error);
    const hasFinancialCollection = results.slice(0, financialTables.length).some((result) => (result.count ?? 0) > 0);
    const balanceResult = results[results.length - 1];
    const hasBalanceSettings = Array.isArray(balanceResult.data) && balanceResult.data.length > 0;
    if (hasFinancialCollection || hasBalanceSettings) throw new ProfileError("financial_data_exists");
  }

  async updatePreferences(
    userId: string,
    currentCurrency: CurrencyCode,
    input: { locale: Language; currencyCode: CurrencyCode },
  ): Promise<UserProfile> {
    if (input.currencyCode !== currentCurrency) await this.assertCurrencyChangeAllowed(userId);
    const update: ProfileUpdate = { locale: input.locale, currency_code: input.currencyCode };
    return this.updateProfile(userId, update);
  }
}

export { profileProjection };

function requireProfileUserId(userId: string) {
  if (!userId) throw new ProfileError("authentication_required");
}
