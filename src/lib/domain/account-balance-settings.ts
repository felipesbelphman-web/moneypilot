import type { Transaction } from "@/components/transactions/transaction-model";
import { civilDateToUtcTimestamp } from "../dates/civil-date.ts";
import { FinanceError } from "./finance-error.ts";
import { validateMoney } from "./decimal-guard.ts";
import { aggregateMoney } from "./money-aggregation.ts";

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
  try {
    const normalized = validateAndNormalizeAccountBalanceSettings(settings);
    const operands = [normalized.openingBalance];
    for (const transaction of transactions) {
      if (transaction.dateISO < normalized.openingDate) continue;
      if (transaction.type !== "income" && transaction.type !== "expense") return null;
      validateMoney(transaction.amount, "amount", "positive");
      operands.push(transaction.type === "income" ? transaction.amount : -transaction.amount);
    }

    const balance = aggregateMoney(operands);
    // Preserve the public unavailable state for invalid operands or unsafe totals.
    return balance.available ? balance.value : null;
  } catch (error) {
    if (error instanceof FinanceError) return null;
    throw error;
  }
}

export function calculateCompleteCurrentBalance(
  settings: AccountBalanceSettings | null,
  transactions: readonly Transaction[],
  transactionsComplete: boolean,
): number | null {
  return transactionsComplete ? calculateCurrentBalance(settings, transactions) : null;
}
