import type { Budget, BudgetAdjustment } from "@/components/budgets/budget-model";
import type { GoalContributionPlan } from "@/components/goals/goal-contribution-plan";
import type { Goal } from "@/components/goals/goal-model";
import type { Investment } from "@/components/investments/investment-model";
import type { Transaction } from "@/components/transactions/transaction-model";
import type { AccountBalanceSettings } from "@/lib/domain/account-balance-settings";

/** Opaque ownership value supplied by the future authenticated session. */
export type FinanceUserId = string;

/**
 * Canonical persisted financial input. Derived calculations and UI state are
 * deliberately excluded and must be recomputed after loading these records.
 */
export type PersistedFinanceData = {
  accountBalanceSettings: AccountBalanceSettings | null;
  transactions: Transaction[];
  budgets: Budget[];
  budgetAdjustments: BudgetAdjustment[];
  goals: Goal[];
  goalContributionPlans: GoalContributionPlan[];
  investments: Investment[];
};

export const financeResourceNames = [
  "accountBalanceSettings",
  "transactions",
  "budgets",
  "budgetAdjustments",
  "goals",
  "goalContributionPlans",
  "investments",
] as const;

export type FinanceResourceName = typeof financeResourceNames[number];

export type FinanceResourceResult<Resource extends FinanceResourceName> =
  | { resource: Resource; status: "success"; data: PersistedFinanceData[Resource] }
  | { resource: Resource; status: "failure"; error: import("@/lib/domain/finance-error").FinanceError };

export type FinanceLoadResult = {
  [Resource in FinanceResourceName]: FinanceResourceResult<Resource>;
};

export type FinanceResourceErrors = Partial<Record<FinanceResourceName, import("@/lib/domain/finance-error").FinanceError>>;

export type FinanceHydrationResourceName = FinanceResourceName | "categories";
export type FinanceHydrationErrors = Partial<Record<FinanceHydrationResourceName, import("@/lib/domain/finance-error").FinanceError>>;
