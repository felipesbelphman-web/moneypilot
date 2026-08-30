import type { BudgetProjection } from "@/components/budgets/budget-projection";
import type { DashboardGoalSummary, DashboardMonthlyStatus } from "@/components/dashboard/dashboard-financial-summary";

export type DashboardNextBestActionType = "review_budget" | "update_goal_date" | "review_goal_plan" | "create_budget" | "create_goal" | "build_savings_plan" | "follow_savings_plan" | "goal_completed" | "no_action";

export type DashboardNextBestAction = {
  type: DashboardNextBestActionType;
  title: string;
  description: string;
  ctaLabel: string | null;
  href: string | null;
  tone: "positive" | "warning" | "neutral";
  reason: string;
  amount: number | null;
};

type Input = { monthlyStatus: DashboardMonthlyStatus; budgetProjection: BudgetProjection; safeSavingsCapacity: number; primaryGoal: DashboardGoalSummary | null; hasActiveBudgetAdjustment: boolean };

export function calculateNextBestAction({ monthlyStatus, budgetProjection, safeSavingsCapacity, primaryGoal, hasActiveBudgetAdjustment }: Input): DashboardNextBestAction {
  if (monthlyStatus === "over_budget") return { type: "review_budget", title: hasActiveBudgetAdjustment ? "Recovery plan active" : "Review your monthly budget", description: hasActiveBudgetAdjustment ? "Your recovery target is active. Review progress against the current projection." : "Your current projection is above the planned budget.", ctaLabel: "Review budget", href: "/budgets", tone: "warning", reason: hasActiveBudgetAdjustment ? "budget_projection_over_with_active_adjustment" : "budget_projection_over_planned_total", amount: budgetProjection.adjustmentNeeded };
  if (primaryGoal?.calculation.isPastDue) return { type: "update_goal_date", title: "Update your goal date", description: "Your primary goal is past its target date and needs review.", ctaLabel: "Review goal", href: "/goals", tone: "warning", reason: "primary_goal_past_due", amount: null };
  if (primaryGoal?.isContributionPlanStale) return { type: "review_goal_plan", title: "Review your savings plan", description: "Your budget or goal changed since this plan was created.", ctaLabel: "Review plan", href: "/goals", tone: "warning", reason: "goal_contribution_plan_stale", amount: primaryGoal.contributionPlan?.monthlyTarget ?? null };
  if (monthlyStatus === "no_budget") return { type: "create_budget", title: "Create a monthly budget", description: "A budget lets MoneyPilot project spending and find safe savings capacity.", ctaLabel: "Create budget", href: "/budgets", tone: "neutral", reason: "no_monthly_budget", amount: null };
  if (!primaryGoal) return { type: "create_goal", title: "Create your first goal", description: "Turn your available financial capacity into a clear target.", ctaLabel: "Create goal", href: "/goals", tone: "neutral", reason: "no_primary_goal", amount: null };
  if (!primaryGoal.calculation.isCompleted && safeSavingsCapacity > 0 && !primaryGoal.contributionPlan) return { type: "build_savings_plan", title: "Put your budget headroom to work", description: "MoneyPilot found conservative monthly capacity that could support your primary goal.", ctaLabel: "Review savings plan", href: "/goals", tone: "positive", reason: "safe_capacity_available_for_goal", amount: safeSavingsCapacity };
  if (!primaryGoal.calculation.isCompleted && primaryGoal.contributionPlan) return { type: "follow_savings_plan", title: "Stay on your savings plan", description: "Your saved monthly target is ready to guide this goal.", ctaLabel: "View goal", href: "/goals", tone: "positive", reason: "active_goal_contribution_plan", amount: primaryGoal.contributionPlan.monthlyTarget };
  if (primaryGoal.calculation.isCompleted) return { type: "goal_completed", title: "Goal completed", description: "Your primary goal has reached its target.", ctaLabel: "View goals", href: "/goals", tone: "positive", reason: "primary_goal_completed", amount: null };
  return { type: "no_action", title: "You're on track this month", description: "Projected spending is within your configured monthly budget.", ctaLabel: null, href: null, tone: "positive", reason: "within_budget_no_priority_action", amount: null };
}
