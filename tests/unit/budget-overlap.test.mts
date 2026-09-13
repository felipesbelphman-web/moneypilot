import assert from "node:assert/strict";
import test from "node:test";
import type { Budget } from "../../src/components/budgets/budget-model.ts";
import { calculateBudgetSpent, normalizeCategory } from "../../src/components/budgets/budget-model.ts";
import { calculateBudgetProjection, canApplyBudgetAdjustment, canUseBudgetProjection, hasCanonicalBudgetOverlap } from "../../src/components/budgets/budget-projection.ts";
import { calculateGoalSavingsCapacity } from "../../src/components/goals/goal-savings-capacity.ts";
import type { Transaction } from "../../src/components/transactions/transaction-model.ts";

const month = "2026-09";
const now = new Date(2026, 8, 15);
const budget = (id: string, category: string, amount = 100): Budget => ({ id, category, subtitle: category, budget: amount, month, color: "#000" });
const transaction = (id: string, category: string, amount = 10, overrides: Partial<Transaction> = {}): Transaction => ({ id, description: "item", category, categoryColor: "#000", classification: { kind: "legacy", categoryId: null, categoryNameSnapshot: category, categoryColorSnapshot: "#000", normalizedCategorySnapshot: category.trim().toLocaleLowerCase() }, payment: "Card", date: "legacy", dateISO: `${month}-10`, origin: "Manual", type: "expense", amount, ...overrides });

test("canonical category identity matches the database index contract", () => {
  assert.equal(normalizeCategory("  FOOD  "), "food");
  assert.equal(hasCanonicalBudgetOverlap([budget("a", "Food"), budget("b", " food ")]), true);
  assert.equal(hasCanonicalBudgetOverlap([budget("a", "Food"), budget("b", "Travel")]), false);
});

test("individual budget spending includes each matching expense exactly once", () => {
  const food = budget("food", " Food ");
  assert.deepEqual(calculateBudgetSpent(food, [transaction("a", "food"), transaction("b", "Travel"), transaction("c", "Food", 5, { dateISO: "2026-08-10" }), transaction("d", "FOOD", 7, { type: "income" })]), { available: true, value: 10 });
  assert.deepEqual(calculateBudgetSpent(food, []), { available: true, value: 0 });
});

test("valid aggregate totals share one category universe", () => {
  const result = calculateBudgetProjection({ budgets: [budget("food", "Food", 100), budget("travel", "Travel", 200)], transactions: [transaction("a", "Food", 10.1111), transaction("b", "food", 20.2222), transaction("c", "Travel", 30)], month, now });
  assert.equal(result.available, true); assert.equal(result.plannedTotal, 300); assert.equal(result.spentTotal, 60.3333);
  assert.equal(result.remainingBudget, 239.6667); assert.equal(result.budgetUsage.spentTotal, result.spentTotal);
  assert.equal(result.budgetUsage.plannedTotal, result.plannedTotal); assert.equal(result.budgetUsage.percent, result.spentTotal / result.plannedTotal * 100);
});

test("overlap makes every dependent financial metric explicitly unavailable", () => {
  const result = calculateBudgetProjection({ budgets: [budget("a", "Food"), budget("b", " food ")], transactions: [transaction("x", "FOOD", 25)], month, now });
  assert.equal(result.available, false); assert.equal(result.unavailableReason, "overlapping_categories");
  assert.equal(result.budgetUsage.available, false); assert.equal(result.budgetUsage.hasOverlappingCategories, true);
  for (const value of [result.plannedTotal, result.spentTotal, result.remainingBudget, result.budgetUsedRatio, result.projectedTotal, result.projectedDifference, result.adjustmentNeeded, result.suggestedWeeklyReduction]) assert.equal(value, null);
});

test("overlap disables savings capacity without manufacturing zero", () => {
  const result = calculateGoalSavingsCapacity({ budgets: [budget("a", "Food"), budget("b", "FOOD")], transactions: [transaction("x", "food", 25)], month, now });
  assert.equal(result.available, false); assert.equal(result.source, "unavailable"); assert.equal(result.canContribute, false);
  assert.equal(result.rawCapacity, null); assert.equal(result.safeMonthlyCapacity, null);
});

test("overlap cannot produce an adjustment or recommendation input", () => {
  const projection = calculateBudgetProjection({ budgets: [budget("a", "Food"), budget("b", "food")], transactions: [transaction("x", "food", 25)], month, now });
  assert.equal(canUseBudgetProjection(projection), false); assert.equal(canApplyBudgetAdjustment(projection), false);
});

test("valid over-budget percentages remain above 100 without display clamping", () => {
  const result = calculateBudgetProjection({ budgets: [budget("food", "Food", 10)], transactions: [transaction("a", "Food", 12.3456)], month, now });
  assert.equal(result.available, true); assert.equal(result.spentTotal, 12.3456); assert.ok((result.budgetUsedPercent ?? 0) > 100); assert.equal(result.budgetUsage.percent, result.budgetUsedPercent);
});
