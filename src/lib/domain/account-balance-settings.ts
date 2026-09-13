import type { Transaction } from "@/components/transactions/transaction-model";
import { civilDateToUtcTimestamp } from "../dates/civil-date.ts";
import { FinanceError } from "./finance-error.ts";
import { validateMoney } from "./decimal-guard.ts";

export type AccountBalanceSettings = {
  openingBalance: number;
  openingDate: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type AccountBalanceSettingsInput = Pick<AccountBalanceSettings, "openingBalance" | "openingDate">;

export function validateAndNormalizeAccountBalanceSettings(settings: AccountBalanceSettings): AccountBalanceSettings {
  validateMoney(settings.openingBalance, "openingBalance", "any");

  const openingDate = settings.openingDate.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(openingDate)) {
    throw new FinanceError("validation_error", { field: "openingDate", reason: "invalid_format" });
  }
  if (civilDateToUtcTimestamp(openingDate) === null) {
    throw new FinanceError("validation_error", { field: "openingDate", reason: "invalid_date" });
  }

  return { ...settings, openingBalance: settings.openingBalance, openingDate };
}

export function calculateCurrentBalance(
  settings: AccountBalanceSettings | null,
  transactions: readonly Transaction[],
): number | null {
  if (settings === null) return null;
  const normalized = validateAndNormalizeAccountBalanceSettings(settings);

  const balance = transactions.reduce((currentBalance, transaction) => {
    if (transaction.dateISO < normalized.openingDate) return currentBalance;
    return transaction.type === "income"
      ? currentBalance + transaction.amount
      : currentBalance - transaction.amount;
  }, normalized.openingBalance);

  // Monetary calculation boundaries follow the database numeric(18,4) scale.
  // Inputs remain untouched so intermediate per-item rounding cannot accumulate.
  return Math.round(balance * 10_000) / 10_000;
}

export function calculateCompleteCurrentBalance(
  settings: AccountBalanceSettings | null,
  transactions: readonly Transaction[],
  transactionsComplete: boolean,
): number | null {
  return transactionsComplete ? calculateCurrentBalance(settings, transactions) : null;
}
