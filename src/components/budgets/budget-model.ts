import type { Transaction } from "../transactions/transaction-model.ts";
import { calculateBudgetIndicatorStatus, type BudgetIndicatorStatus } from "./budget-period.ts";
import { aggregateMoney } from "../../lib/domain/money-aggregation.ts";

export type BudgetStatus = BudgetIndicatorStatus;

export type Budget = {
  id: string;
  category: string;
  subtitle: string;
  budget: number;
  month: string;
  color: string;
};

export type BudgetWithProgress = Budget & {
  spent: number | null;
  status: BudgetStatus | null;
};

export type BudgetAdjustment = {
  month: string;
  targetRemainingSpend: number;
  baselineProjectedTotal: number;
  adjustmentNeeded: number;
  suggestedWeeklyReduction: number;
};

export function normalizeCategory(category: string) {
  return category.trim().toLocaleLowerCase();
}

export function calculateBudgetSpent(budget: Pick<Budget, "category" | "month">, transactions: Transaction[]) {
  const category = normalizeCategory(budget.category);
  return aggregateMoney(transactions.flatMap((transaction) => {
    const matches = transaction.type === "expense"
      && transaction.classification.kind !== "uncategorized"
      && transaction.category !== null
      && normalizeCategory(transaction.category) === category
      && transaction.dateISO.slice(0, 7) === budget.month;

    return matches ? [transaction.amount] : [];
  }));
}

export function calculateBudgetStatus(budget: number, spent: number | null, canProject = false, monthElapsedRatio = 0): BudgetStatus | null {
  return spent === null ? null : calculateBudgetIndicatorStatus(budget, spent, canProject, monthElapsedRatio);
}
