import { areFinanceResourcesReady, type FinanceResourceStatuses } from "../../lib/persistence/finance-resource-status.ts";
import { requireCompletePeriodResult, validateTransactionDateRange, type TransactionDateRange } from "../../lib/persistence/finance-query-contracts.ts";
import type { TransactionPeriodState } from "../../lib/persistence/transaction-period-state.ts";
import { financialMonthRange } from "../../lib/dates/financial-month-range.ts";
import { calendarDays, shiftDay } from "./financial-calendar-model.ts";
import { calculateDashboardFinancialSummary, calculateDashboardTransactionSummary, createGoalSummary, getDashboardMonth, type DashboardMonthlyStatus } from "./dashboard-financial-summary.ts";
import { calculateBudgetProjection } from "../budgets/budget-projection.ts";
import { calculateGoalSavingsCapacity } from "../goals/goal-savings-capacity.ts";
import { selectPrimaryGoal } from "../goals/goal-model.ts";
import { calculateNextBestAction } from "./next-best-action.ts";
import type { Transaction } from "../transactions/transaction-model.ts";

export type DashboardViewState = "loading" | "error" | "empty" | "ready";
export type DashboardSectionStatus = Exclude<DashboardViewState, "empty">;
type DashboardViewStateInput = { isLoading: boolean; error: Error | string | null; hasFinancialData: boolean | null };
export function resolveDashboardViewState({ isLoading, error, hasFinancialData }: DashboardViewStateInput): DashboardViewState {
  if (isLoading) return "loading";
  if (error) return "error";
  return hasFinancialData === false ? "empty" : "ready";
}

export function dashboardFinancialRange(month: string): TransactionDateRange | null {
  try { return financialMonthRange(month); } catch { return null; }
}
export function dashboardCalendarRange(month: string): TransactionDateRange | null {
  if (!dashboardFinancialRange(month)) return null;
  const days = calendarDays(month);
  try { return validateTransactionDateRange({ startISO: days[0], endExclusiveISO: shiftDay(days[days.length - 1], 1) }); } catch { return null; }
}
export function getDashboardPeriodCoverage(period: TransactionPeriodState, range: TransactionDateRange | null): { rows: Transaction[] | null; status: DashboardSectionStatus } {
  if (!range) return { rows: null, status: "error" };
  if (period.status === "ready") {
    try { return { rows: [...requireCompletePeriodResult(period.result, range).items], status: "ready" }; } catch { return { rows: null, status: "error" }; }
  }
  return { rows: null, status: period.status === "error" ? "error" : "loading" };
}
export function dashboardPrerequisiteStatus(...statuses: string[]): DashboardSectionStatus {
  return statuses.includes("error") ? "error" : statuses.every(status => status === "ready") ? "ready" : "loading";
}

export function dashboardFinancialExistence(input: {
  selectedRows: readonly Transaction[] | null; resourceStatuses: FinanceResourceStatuses;
  transactions: readonly Transaction[]; budgets: readonly unknown[]; goals: readonly unknown[]; accountBalanceSettings: unknown | null;
}): boolean | null {
  const { resourceStatuses: statuses } = input;
  if ((input.selectedRows?.length ?? 0) > 0
    || (statuses.transactions.status === "ready" && input.transactions.length > 0)
    || (statuses.budgets.status === "ready" && input.budgets.length > 0)
    || (statuses.goals.status === "ready" && input.goals.length > 0)
    || (statuses.accountBalanceSettings.status === "ready" && input.accountBalanceSettings !== null)) return true;
  return areFinanceResourcesReady(statuses, ["transactions", "budgets", "goals", "accountBalanceSettings"]) ? false : null;
}

type Input = Omit<Parameters<typeof calculateDashboardFinancialSummary>[0], "transactions"> & { period: TransactionPeriodState; resourceStatuses: FinanceResourceStatuses };
export function getDashboardFinancialView(data: Input) {
  const { month, resourceStatuses: statuses, now = new Date() } = data;
  const coverage = getDashboardPeriodCoverage(data.period, dashboardFinancialRange(month));
  const rows = coverage.rows;
  const projectionStatus = dashboardPrerequisiteStatus(coverage.status, statuses.budgets.status);
  const savingsStatus = dashboardPrerequisiteStatus(projectionStatus, statuses.budgetAdjustments.status);
  const goalsStatus = dashboardPrerequisiteStatus(statuses.goals.status);
  const plansStatus = dashboardPrerequisiteStatus(goalsStatus, statuses.goalContributionPlans.status);
  const metrics = rows === null ? null : calculateDashboardTransactionSummary({ transactions: rows, month, now });
  const projection = rows !== null && projectionStatus === "ready" ? calculateBudgetProjection({ transactions: rows, budgets: data.budgets, month, now }) : null;
  const savings = rows !== null && savingsStatus === "ready" ? calculateGoalSavingsCapacity({ transactions: rows, budgets: data.budgets, adjustment: data.budgetAdjustments[month], month, now }) : null;
  const goal = goalsStatus === "ready" ? selectPrimaryGoal(data.goals) : null;
  // Plan absence/review are meaningful only when their separate prerequisites are ready.
  const primaryGoal = goal ? createGoalSummary(goal, plansStatus === "ready" ? data.goalContributionPlans[goal.id] : undefined, savings?.available ? savings.safeMonthlyCapacity : null, now) : null;
  const goalStatus = goal && !primaryGoal ? "error" : goalsStatus;
  const planReviewStatus = dashboardPrerequisiteStatus(plansStatus, savingsStatus, savings && !savings.available ? "error" : "ready");
  const monthlyStatus: DashboardMonthlyStatus = !metrics?.aggregationAvailable || !projection?.available ? "unavailable" : projection.plannedTotal <= 0 ? "no_budget" : projection.projectedOverBudget ? "over_budget" : "within_budget";
  const recommendationStatus = dashboardPrerequisiteStatus(savingsStatus, goalStatus, plansStatus);
  const action = recommendationStatus === "ready" && metrics && projection && savings
    ? calculateNextBestAction({ selectedMonth: month, currentMonth: getDashboardMonth(now), aggregationAvailable: metrics.aggregationAvailable, monthlyStatus, budgetProjection: projection, safeSavingsCapacity: metrics.aggregationAvailable && savings.available ? savings.safeMonthlyCapacity : null, netCashFlow: metrics.netCashFlow, primaryGoal, goalsAvailable: !goal || primaryGoal !== null, hasGoals: data.goals.length > 0, activeBudgetAdjustment: data.budgetAdjustments[month], hasTransactions: metrics.hasTransactions }) : null;
  return { ...coverage, metrics, projection, savings, primaryGoal, monthlyStatus, action, projectionStatus, savingsStatus, goalsStatus: goalStatus, plansStatus, planReviewStatus, recommendationStatus };
}
