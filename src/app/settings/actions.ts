"use server";

import { getCurrentAccount } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import type { Language } from "@/components/LanguageProvider";
import type { CurrencyCode } from "@/i18n/config";

export async function getSettingsAccount() {
  return getCurrentAccount();
}

export async function markWelcomeSeen() {
  const account = await getCurrentAccount();

  if (account.profile.has_seen_welcome) {
    return {
      hasSeenWelcome: true,
    };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      has_seen_welcome: true,
    })
    .eq("id", account.profile.id);

  if (error) {
    throw new Error(`Failed to update welcome state: ${error.message}`);
  }

  return {
    hasSeenWelcome: true,
  };
}

export async function updateDisplayName(displayName: string) {
  const account = await getCurrentAccount();
  const supabase = await createClient();

  const cleanDisplayName = displayName.trim().replace(/\s+/g, " ");

  if (!cleanDisplayName) {
    throw new Error("Display name is required");
  }

  const nameParts = cleanDisplayName.split(" ");

  if (nameParts.length < 2) {
    throw new Error("First name and last name are required");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: cleanDisplayName,
    })
    .eq("id", account.profile.id);

  if (error) {
    throw new Error(`Failed to update display name: ${error.message}`);
  }

  return {
    displayName: cleanDisplayName,
  };
}

export async function updateProfilePreferences(input: {
  locale: Language;
  currencyCode: CurrencyCode;
}) {
  const account = await getCurrentAccount();
  const supabase = await createClient();

  if (input.currencyCode !== account.profile.currency_code) {
    const tables = [
      "transactions",
      "budgets",
      "budget_adjustments",
      "goals",
      "goal_contribution_plans",
      "investments",
    ] as const;
    const checks = await Promise.all(
      tables.map((table) => supabase
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq("user_id", account.profile.id)),
    );

    if (checks.some((result) => result.error)) {
      throw new Error("Failed to verify whether the financial account is empty");
    }
    if (checks.some((result) => (result.count ?? 0) > 0)) {
      throw new Error("Base currency cannot be changed while financial data exists");
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      locale: input.locale,
      currency_code: input.currencyCode,
    })
    .eq("id", account.profile.id);

  if (error) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  return {
    locale: input.locale,
    currencyCode: input.currencyCode,
  };
}
