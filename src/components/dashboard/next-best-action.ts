import type { Language } from "@/components/LanguageProvider";
import { canUseBudgetProjection, type BudgetProjection } from "@/components/budgets/budget-projection";
import type { BudgetAdjustment } from "@/components/budgets/budget-model";
import type { DashboardGoalSummary, DashboardMonthlyStatus } from "@/components/dashboard/dashboard-financial-summary";
import { translations } from "@/i18n/translations";
import { activeBudgetPlanCopyByLanguage, periodActionCopyByLanguage } from "@/i18n/dashboard-copy";

export type DashboardNextBestActionType = "recovery_plan" | "review_budget" | "update_goal_date" | "review_goal_plan" | "insufficient_current_data" | "create_budget" | "create_goal" | "build_savings_plan" | "follow_savings_plan" | "goal_completed" | "no_action" | "historical_over_budget" | "historical_within_budget" | "historical_no_budget" | "historical_insufficient_data" | "future_period";

export type DashboardNextBestAction = {
  type: DashboardNextBestActionType;
  href: string | null;
  tone: "positive" | "warning" | "neutral";
  reason: string;
  amount: number | null;
  amountKind?: "net_cash_flow" | "budget_exceeded";
  activeBudgetAdjustment?: Pick<BudgetAdjustment, "targetRemainingSpend" | "adjustmentNeeded" | "baselineProjectedTotal">;
};

export type DashboardNextBestActionCopy = { title: string; description: string; ctaLabel: string | null };

type Input = { selectedMonth?: string; currentMonth?: string; aggregationAvailable: boolean; monthlyStatus: DashboardMonthlyStatus; budgetProjection: BudgetProjection; safeSavingsCapacity: number | null; netCashFlow: number | null; primaryGoal: DashboardGoalSummary | null; goalsAvailable?: boolean; hasGoals?: boolean; activeBudgetAdjustment?: BudgetAdjustment; hasTransactions?: boolean; hasCurrentTransactions?: boolean };

export function calculateNextBestAction({ selectedMonth, currentMonth, aggregationAvailable, monthlyStatus, budgetProjection, safeSavingsCapacity, netCashFlow, primaryGoal, goalsAvailable = true, hasGoals = false, activeBudgetAdjustment, hasTransactions, hasCurrentTransactions }: Input): DashboardNextBestAction {
  const periodHasTransactions = hasTransactions ?? hasCurrentTransactions ?? false;
  if (!aggregationAvailable || netCashFlow === null) return { type: "no_action", href: null, tone: "neutral", reason: "transaction_aggregation_unavailable", amount: null };
  if (!canUseBudgetProjection(budgetProjection) || monthlyStatus === "unavailable") return { type: "no_action", href: null, tone: "neutral", reason: "budget_projection_unavailable", amount: null };
  if (safeSavingsCapacity === null) return { type: "no_action", href: null, tone: "neutral", reason: "budget_projection_unavailable", amount: null };
  if (selectedMonth && currentMonth && selectedMonth > currentMonth) return { type: "future_period", href: null, tone: "neutral", reason: "future_period_has_no_recommendation", amount: null };
  if (selectedMonth && currentMonth && selectedMonth < currentMonth) {
    if (!periodHasTransactions) return { type: "historical_insufficient_data", href: null, tone: "neutral", reason: "completed_period_has_no_transactions", amount: null };
    if (monthlyStatus === "no_budget") return { type: "historical_no_budget", href: `/transactions?month=${selectedMonth}`, tone: "neutral", reason: "completed_period_has_no_budget", amount: netCashFlow, amountKind: "net_cash_flow" };
    if (monthlyStatus === "over_budget") return { type: "historical_over_budget", href: `/budgets?month=${selectedMonth}`, tone: "warning", reason: "completed_period_exceeded_budget", amount: budgetProjection.adjustmentNeeded, amountKind: "budget_exceeded" };
    return { type: "historical_within_budget", href: `/budgets?month=${selectedMonth}`, tone: netCashFlow >= 0 ? "positive" : "neutral", reason: "completed_period_within_budget", amount: netCashFlow, amountKind: "net_cash_flow" };
  }
  if (monthlyStatus === "over_budget" && activeBudgetAdjustment) return { type: "recovery_plan", href: "/budgets", tone: "warning", reason: "budget_projection_over_with_active_adjustment", amount: null, activeBudgetAdjustment };
  if (monthlyStatus === "over_budget") return { type: "review_budget", href: "/budgets", tone: "warning", reason: "budget_projection_over_planned_total", amount: budgetProjection.adjustmentNeeded };
  if (!goalsAvailable || (hasGoals && !primaryGoal)) return { type: "no_action", href: null, tone: "neutral", reason: "goal_calculation_unavailable", amount: null };
  if (primaryGoal?.calculation.isPastDue) return { type: "update_goal_date", href: "/goals", tone: "warning", reason: "primary_goal_past_due", amount: null };
  if (!periodHasTransactions) return { type: "insufficient_current_data", href: "/transactions", tone: "neutral", reason: "current_month_has_no_transactions", amount: null };
  if (primaryGoal?.isContributionPlanStale) return { type: "review_goal_plan", href: "/goals", tone: "warning", reason: "goal_contribution_plan_stale", amount: primaryGoal.contributionPlan?.monthlyTarget ?? null };
  if (monthlyStatus === "no_budget") return { type: "create_budget", href: "/budgets", tone: "neutral", reason: "no_monthly_budget", amount: null };
  if (!primaryGoal) return { type: "create_goal", href: "/goals", tone: "neutral", reason: "no_primary_goal", amount: null };
  if (!primaryGoal.calculation.isCompleted && safeSavingsCapacity > 0 && !primaryGoal.contributionPlan) return { type: "build_savings_plan", href: "/goals", tone: "positive", reason: "safe_capacity_available_for_goal", amount: safeSavingsCapacity };
  if (!primaryGoal.calculation.isCompleted && primaryGoal.contributionPlan) return { type: "follow_savings_plan", href: "/goals", tone: "positive", reason: "active_goal_contribution_plan", amount: primaryGoal.contributionPlan.monthlyTarget };
  if (primaryGoal.calculation.isCompleted) return { type: "goal_completed", href: "/goals", tone: "positive", reason: "primary_goal_completed", amount: null };
  return { type: "no_action", href: null, tone: "positive", reason: "within_budget_no_priority_action", amount: null };
}

export function resolveNextBestActionCopy(action: DashboardNextBestAction, language: Language): DashboardNextBestActionCopy {
  const copy = translations[language].appDashboard.nextActions;
  const periodCopy = periodActionCopyByLanguage[language];
  switch (action.type) {
    case "recovery_plan": return toCopy(activeBudgetPlanCopyByLanguage[language]);
    case "review_budget": return toCopy(copy.reviewBudget);
    case "update_goal_date": return toCopy(copy.updateGoalDate);
    case "insufficient_current_data": return toCopy(copy.insufficientCurrentData);
    case "review_goal_plan": return toCopy(copy.reviewGoalPlan);
    case "create_budget": return toCopy(copy.createBudget);
    case "create_goal": return toCopy(copy.createGoal);
    case "build_savings_plan": return toCopy(copy.buildSavingsPlan);
    case "follow_savings_plan": return toCopy(copy.followSavingsPlan);
    case "goal_completed": return toCopy(copy.goalCompleted);
    case "no_action": return toCopy(copy.noAction);
    case "historical_over_budget": return toCopy(periodCopy.historicalOverBudget);
    case "historical_within_budget": return toCopy(periodCopy.historicalWithinBudget);
    case "historical_no_budget": return toCopy(periodCopy.historicalNoBudget);
    case "historical_insufficient_data": return toCopy(periodCopy.historicalInsufficientData);
    case "future_period": return toCopy(periodCopy.futurePeriod);
  }
}

function toCopy(copy: { title: string; description: string; cta: string }): DashboardNextBestActionCopy {
  return { title: copy.title, description: copy.description, ctaLabel: copy.cta || null };
}
