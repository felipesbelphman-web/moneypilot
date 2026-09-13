import type { Budget, BudgetAdjustment } from "@/components/budgets/budget-model";
import { FinanceError } from "./finance-error.ts";
import { validateMoney } from "./decimal-guard.ts";

export function validateAndNormalizeBudget(budget: Budget): Budget {
  const normalized = {
    ...budget,
    id: requiredText(budget.id, "id"),
    category: requiredText(budget.category, "category"),
    subtitle: requiredText(budget.subtitle, "subtitle"),
    month: validateMonth(budget.month),
    color: requiredText(budget.color, "color"),
  };

  validateMoney(normalized.budget, "budget", "positive");
  return normalized;
}

export function validateAndNormalizeBudgetAdjustment(adjustment: BudgetAdjustment): BudgetAdjustment {
  const normalized = { ...adjustment, month: validateMonth(adjustment.month) };
  validateNonnegativeNumber(normalized.targetRemainingSpend, "targetRemainingSpend");
  validateNonnegativeNumber(normalized.baselineProjectedTotal, "baselineProjectedTotal");
  validateNonnegativeNumber(normalized.adjustmentNeeded, "adjustmentNeeded");
  validateNonnegativeNumber(normalized.suggestedWeeklyReduction, "suggestedWeeklyReduction");
  return normalized;
}

function requiredText(value: string, field: string) {
  if (typeof value !== "string") throw new FinanceError("validation_error", { field, reason: "required" });
  const normalized = value.trim();
  if (!normalized) throw new FinanceError("validation_error", { field, reason: "required" });
  return normalized;
}

function validateMonth(value: string) {
  if (typeof value !== "string") {
    throw new FinanceError("validation_error", { field: "month", reason: "invalid_format" });
  }
  const normalized = value.trim();
  if (!/^\d{4}-\d{2}$/.test(normalized)) {
    throw new FinanceError("validation_error", { field: "month", reason: "invalid_format" });
  }
  const month = Number(normalized.slice(5));
  if (month < 1 || month > 12) {
    throw new FinanceError("validation_error", { field: "month", reason: "invalid_date" });
  }
  return normalized;
}

function validateNonnegativeNumber(value: number, field: string) {
  validateMoney(value, field, "nonnegative");
}
