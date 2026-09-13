import assert from "node:assert/strict";
import { test } from "node:test";
import type { Budget, BudgetAdjustment } from "../../src/components/budgets/budget-model.ts";
import { validateAndNormalizeBudget, validateAndNormalizeBudgetAdjustment } from "../../src/lib/domain/budget-validation.ts";
import { FinanceError } from "../../src/lib/domain/finance-error.ts";

const validBudget: Budget = {
  id: "budget-1",
  category: "Alimentação",
  subtitle: "Compras do mês",
  budget: 500,
  month: "2026-09",
  color: "#64707D",
};

const validAdjustment: BudgetAdjustment = {
  month: "2026-09",
  targetRemainingSpend: 100,
  baselineProjectedTotal: 650,
  adjustmentNeeded: 150,
  suggestedWeeklyReduction: 37.5,
};

function expectValidationError(action: () => unknown, field: string, reason: string) {
  assert.throws(action, (error) => error instanceof FinanceError
    && error.code === "validation_error"
    && error.details?.field === field
    && error.details.reason === reason);
}

test("accepts a valid budget", () => {
  assert.deepEqual(validateAndNormalizeBudget(validBudget), validBudget);
});

test("normalizes budget external whitespace only", () => {
  const normalized = validateAndNormalizeBudget({
    ...validBudget,
    id: "  budget-1  ", category: "  Alimentação Especial  ", subtitle: "  Compras do mês  ",
    month: "  2026-09  ", color: "  #64707D  ",
  });
  assert.deepEqual(normalized, { ...validBudget, category: "Alimentação Especial" });
});

test("rejects an empty budget category", () => expectValidationError(() => validateAndNormalizeBudget({ ...validBudget, category: "   " }), "category", "required"));
test("rejects an empty budget subtitle", () => expectValidationError(() => validateAndNormalizeBudget({ ...validBudget, subtitle: "   " }), "subtitle", "required"));
test("rejects an empty budget id", () => expectValidationError(() => validateAndNormalizeBudget({ ...validBudget, id: "   " }), "id", "required"));
test("rejects an invalid budget month format", () => expectValidationError(() => validateAndNormalizeBudget({ ...validBudget, month: "2026-9" }), "month", "invalid_format"));
test("rejects an impossible budget month", () => expectValidationError(() => validateAndNormalizeBudget({ ...validBudget, month: "2026-13" }), "month", "invalid_date"));
test("rejects a zero budget", () => expectValidationError(() => validateAndNormalizeBudget({ ...validBudget, budget: 0 }), "budget", "positive"));
test("rejects a negative budget", () => expectValidationError(() => validateAndNormalizeBudget({ ...validBudget, budget: -1 }), "budget", "positive"));
test("rejects a NaN budget", () => expectValidationError(() => validateAndNormalizeBudget({ ...validBudget, budget: Number.NaN }), "budget", "finite"));
test("rejects an infinite budget", () => expectValidationError(() => validateAndNormalizeBudget({ ...validBudget, budget: Number.POSITIVE_INFINITY }), "budget", "finite"));
test("rejects an empty budget color", () => expectValidationError(() => validateAndNormalizeBudget({ ...validBudget, color: "   " }), "color", "required"));

test("accepts a valid budget adjustment", () => {
  assert.deepEqual(validateAndNormalizeBudgetAdjustment(validAdjustment), validAdjustment);
});

test("allows zero for every budget adjustment value", () => {
  const zeroAdjustment = { month: "2026-09", targetRemainingSpend: 0, baselineProjectedTotal: 0, adjustmentNeeded: 0, suggestedWeeklyReduction: 0 };
  assert.deepEqual(validateAndNormalizeBudgetAdjustment(zeroAdjustment), zeroAdjustment);
});

for (const field of ["targetRemainingSpend", "baselineProjectedTotal", "adjustmentNeeded", "suggestedWeeklyReduction"] as const) {
  test(`rejects a negative ${field}`, () => {
    expectValidationError(() => validateAndNormalizeBudgetAdjustment({ ...validAdjustment, [field]: -1 }), field, "nonnegative");
  });

  for (const [label, value] of [["NaN", Number.NaN], ["infinity", Number.POSITIVE_INFINITY]] as const) {
    test(`rejects ${label} for ${field}`, () => {
      expectValidationError(() => validateAndNormalizeBudgetAdjustment({ ...validAdjustment, [field]: value }), field, "finite");
    });
  }
}

test("rejects an invalid adjustment month format", () => expectValidationError(() => validateAndNormalizeBudgetAdjustment({ ...validAdjustment, month: "09/2026" }), "month", "invalid_format"));
test("rejects an impossible adjustment month", () => expectValidationError(() => validateAndNormalizeBudgetAdjustment({ ...validAdjustment, month: "2026-00" }), "month", "invalid_date"));

test("does not recalculate budget adjustment values", () => {
  const values = { ...validAdjustment, targetRemainingSpend: 12.34, baselineProjectedTotal: 567.89, adjustmentNeeded: 45.67, suggestedWeeklyReduction: 8.9 };
  assert.deepEqual(validateAndNormalizeBudgetAdjustment(values), values);
});
