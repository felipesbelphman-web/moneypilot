import type { Budget, BudgetAdjustment } from "@/components/budgets/budget-model";
import type { GoalContributionPlan } from "@/components/goals/goal-contribution-plan";
import type { Goal } from "@/components/goals/goal-model";
import type { Transaction } from "@/components/transactions/transaction-model";

/** Opaque ownership value supplied by the future authenticated session. */
export type FinanceUserId = string;

/**
 * Canonical persisted financial input. Derived calculations and UI state are
 * deliberately excluded and must be recomputed after loading these records.
 */
export type PersistedFinanceData = {
  transactions: Transaction[];
  budgets: Budget[];
  budgetAdjustments: BudgetAdjustment[];
  goals: Goal[];
  goalContributionPlans: GoalContributionPlan[];
};
