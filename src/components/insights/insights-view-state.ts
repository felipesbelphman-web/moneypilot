import { areFinanceResourcesReady, type FinanceResourceStatuses } from "../../lib/persistence/finance-resource-status.ts";
import { calculateDashboardFinancialSummary, type DashboardCategorySpending } from "../dashboard/dashboard-financial-summary.ts";
import { calculateNextBestAction } from "../dashboard/next-best-action.ts";
import { calculateCurrentTransactionAggregates } from "../transactions/transaction-period-aggregates.ts";
import { calculateBudgetProjection } from "../budgets/budget-projection.ts";
import { calculateGoalSavingsCapacity } from "../goals/goal-savings-capacity.ts";
import { calculateGoal } from "../goals/goal-calculations.ts";
import { selectPrimaryGoal } from "../goals/goal-model.ts";

import { readyTransactionPeriod, type TransactionPeriodState } from "../../lib/persistence/transaction-period-state.ts";
import { requireCompletePeriodResult } from "../../lib/persistence/finance-query-contracts.ts";
import { financialMonthRange } from "../../lib/dates/financial-month-range.ts";

export const insightsPrerequisites = {
  transactions: ["transactions"],
  goal: ["goals"],
  projection: ["transactions", "budgets"],
  savings: ["transactions", "budgets", "budgetAdjustments"],
  recommendation: ["transactions", "budgets", "budgetAdjustments", "goals", "goalContributionPlans"],
} as const;

type Input = Omit<Parameters<typeof calculateDashboardFinancialSummary>[0], "transactions"> & { resourceStatuses: FinanceResourceStatuses; period: TransactionPeriodState };

export function areInsightsPrerequisitesReady(statuses: FinanceResourceStatuses, period: TransactionPeriodState, required: readonly (keyof FinanceResourceStatuses)[]) {
  return required.every(resource => resource === "transactions" ? period.status === "ready" : areFinanceResourcesReady(statuses, [resource]));
}

export function insightsFinancialExistence(input: {
  period: TransactionPeriodState; resourceStatuses: FinanceResourceStatuses;
  globalTransactionCount: number; budgetCount: number; goalCount: number;
}): boolean | null {
  const { period, resourceStatuses: statuses } = input;
  if ((readyTransactionPeriod(period)?.items.length ?? 0) > 0
    || (statuses.budgets.status === "ready" && input.budgetCount > 0)
    || (statuses.goals.status === "ready" && input.goalCount > 0)
    || (statuses.transactions.status === "ready" && input.globalTransactionCount > 0)) return true;
  return areFinanceResourcesReady(statuses, ["transactions", "budgets", "goals"]) ? false : null;
}

export function getInsightsViewState(data: Input) {
  const { resourceStatuses: statuses, month, now } = data;
  const result = readyTransactionPeriod(data.period);
  const rows = result ? [...requireCompletePeriodResult(result, financialMonthRange(month)).items] : null;
  const ready = (required: readonly (keyof FinanceResourceStatuses)[]) => areInsightsPrerequisitesReady(statuses, data.period, required);
  const transactions = rows && ready(insightsPrerequisites.transactions) ? calculateCurrentTransactionAggregates(rows, month) : null;
  const projection = rows && ready(insightsPrerequisites.projection) ? calculateBudgetProjection({ transactions: rows, budgets: data.budgets, month, now }) : null;
  const savings = rows && ready(insightsPrerequisites.savings) ? calculateGoalSavingsCapacity({ transactions: rows, budgets: data.budgets, adjustment: data.budgetAdjustments[month], month, now }) : null;
  const goal = ready(insightsPrerequisites.goal) ? selectPrimaryGoal(data.goals) : null;
  const goalCalculation = goal ? calculateGoal(goal, now) : null;
  const summary = rows && ready(insightsPrerequisites.recommendation) ? calculateDashboardFinancialSummary({ ...data, transactions: rows }) : null;
  const action = summary ? calculateNextBestAction({ aggregationAvailable: summary.aggregationAvailable, monthlyStatus: summary.monthlyStatus, budgetProjection: summary.budgetProjection, safeSavingsCapacity: summary.safeSavingsCapacity, netCashFlow: summary.netCashFlow, primaryGoal: summary.primaryGoal, goalsAvailable: summary.goalsAvailable, hasGoals: summary.hasGoals, activeBudgetAdjustment: data.budgetAdjustments[month], hasCurrentTransactions: summary.hasTransactions }) : null;
  const categorySpending: DashboardCategorySpending[] | null = transactions?.categoryAggregationAvailable ? transactions.categoryTotals.map<DashboardCategorySpending>(item => ({ category: item.category ?? "", localizationKey: item.category === null ? "uncategorized" : undefined, amount: item.amount, percentage: transactions.expenses > 0 ? item.amount / transactions.expenses : 0 })).sort((a, b) => b.amount - a.amount) : null;
  return { transactions, projection, savings, goal, goalCalculation, summary, action, categorySpending };
}
