import type { AccountBalanceSettings } from "../domain/account-balance-settings.ts";
import { mapFinanceRepositoryError, type FinanceError } from "../domain/finance-error.ts";

export type AccountBalanceSettingsLoadResult =
  | { resource: "accountBalanceSettings"; status: "success"; data: AccountBalanceSettings | null }
  | { resource: "accountBalanceSettings"; status: "failure"; error: FinanceError };

export async function settleAccountBalanceSettings(
  loader: () => Promise<AccountBalanceSettings | null>,
): Promise<AccountBalanceSettingsLoadResult> {
  try {
    return { resource: "accountBalanceSettings", status: "success", data: await loader() };
  } catch (error: unknown) {
    return { resource: "accountBalanceSettings", status: "failure", error: mapFinanceRepositoryError(error) };
  }
}

export function mergeAccountBalanceSettings(
  previous: AccountBalanceSettings | null,
  result: AccountBalanceSettingsLoadResult,
) {
  return result.status === "success" ? result.data : previous;
}

export function accountBalanceSettingsAfterUserChange(
  previousUserId: string | null,
  nextUserId: string | null,
  current: AccountBalanceSettings | null,
) {
  return previousUserId === nextUserId ? current : null;
}
