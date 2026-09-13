import type { Goal, GoalPriority } from "@/components/goals/goal-model";
import type { GoalContributionPlan } from "@/components/goals/goal-contribution-plan";
import { FinanceError } from "./finance-error.ts";
import { validateMoney } from "./decimal-guard.ts";

export function validateAndNormalizeGoal(goal: Goal): Goal {
  const normalized = {
    ...goal,
    id: requiredText(goal.id, "id"),
    name: requiredText(goal.name, "name"),
    targetDate: validateTargetMonth(goal.targetDate),
  };

  validateMoney(normalized.targetAmount, "targetAmount", "positive");
  validateMoney(normalized.savedAmount, "savedAmount", "nonnegative");
  if (normalized.savedAmount > normalized.targetAmount) {
    throw new FinanceError("validation_error", { field: "savedAmount", reason: "allowed_value" });
  }
  const priority = parseGoalPriority(normalized.priority);
  return { ...normalized, priority };
}

export function validateGoalContributionPlan(plan: GoalContributionPlan): GoalContributionPlan {
  if (typeof plan.goalId !== "string" || !plan.goalId.trim()) {
    throw new FinanceError("validation_error", { field: "goalId", reason: "required" });
  }
  validateNonnegativeNumber(plan.monthlyTarget, "monthlyTarget");
  validateNonnegativeNumber(plan.baselineRequiredMonthlyContribution, "baselineRequiredMonthlyContribution");
  validateNonnegativeNumber(plan.savingsBoost, "savingsBoost");
  validateTimestamp(plan.createdAt, "createdAt");
  return { ...plan };
}

function requiredText(value: string, field: string) {
  if (typeof value !== "string") throw new FinanceError("validation_error", { field, reason: "required" });
  const normalized = value.trim();
  if (!normalized) throw new FinanceError("validation_error", { field, reason: "required" });
  return normalized;
}

function validateTargetMonth(value: string) {
  if (typeof value !== "string") {
    throw new FinanceError("validation_error", { field: "targetDate", reason: "invalid_format" });
  }
  const normalized = value.trim();
  if (!/^\d{4}-\d{2}$/.test(normalized)) {
    throw new FinanceError("validation_error", { field: "targetDate", reason: "invalid_format" });
  }
  const month = Number(normalized.slice(5));
  if (month < 1 || month > 12) {
    throw new FinanceError("validation_error", { field: "targetDate", reason: "invalid_date" });
  }
  return normalized;
}

export function parseGoalPriority(value: unknown): GoalPriority {
  if (value === "primary" || value === "secondary") return value;
  throw new FinanceError("validation_error", { field: "priority", reason: "allowed_value" });
}

function validateNonnegativeNumber(value: number, field: string) {
  validateMoney(value, field, "nonnegative");
}

function validateTimestamp(value: string, field: string) {
  if (typeof value !== "string" || !value.trim() || !Number.isFinite(Date.parse(value))) {
    throw new FinanceError("validation_error", { field, reason: "invalid_date" });
  }
}
