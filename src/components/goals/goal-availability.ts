import { areFinanceResourcesReady, type FinanceResourceStatuses } from "../../lib/persistence/finance-resource-status.ts";
import type { TransactionPeriodState } from "../../lib/persistence/transaction-period-state.ts";

export const goalPlanResources = ["goals", "budgets", "transactions", "budgetAdjustments", "goalContributionPlans"] as const;
export const periodGoalPlanResources = ["goals", "budgets", "budgetAdjustments", "goalContributionPlans"] as const;

export function getGoalsAvailability(statuses: FinanceResourceStatuses, period?: TransactionPeriodState) {
  const transactionReady = period ? period.status === "ready" : areFinanceResourcesReady(statuses, ["transactions"]);
  const required = period ? periodGoalPlanResources : goalPlanResources;
  return {
    goalsReady: areFinanceResourcesReady(statuses, ["goals"]),
    savingsReady: transactionReady && areFinanceResourcesReady(statuses, ["budgets", "budgetAdjustments"]),
    plansReady: areFinanceResourcesReady(statuses, ["goals", "goalContributionPlans"]),
    canApplyPlan: transactionReady && areFinanceResourcesReady(statuses, required),
    isLoading: required.some(resource => statuses[resource].status === "loading") || Boolean(period && ["idle", "loading", "refreshing", "stale"].includes(period.status)),
    hasError: required.some(resource => statuses[resource].status === "error") || period?.status === "error",
  };
}
