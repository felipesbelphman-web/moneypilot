import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { Budget } from "../../src/components/budgets/budget-model.ts";
import { calculateBudgetProjection, canApplyBudgetAdjustment, createBudgetAdjustment } from "../../src/components/budgets/budget-projection.ts";
import { calculateBudgetMonthProgress } from "../../src/components/budgets/budget-period.ts";
import { calculateGoalSavingsCapacity } from "../../src/components/goals/goal-savings-capacity.ts";
import type { Transaction } from "../../src/components/transactions/transaction-model.ts";

const month = "2026-09";
const now = new Date(2026, 8, 15);
const budget = (id: string, category: string, amount: number, budgetMonth = month): Budget => ({ id, category, subtitle: category, budget: amount, month: budgetMonth, color: "#000" });
const expense = (id: string, category: string, amount: number, dateISO = `${month}-10`): Transaction => ({ id, category, amount, dateISO, type: "expense", description: "private", categoryColor: "#000", classification: { kind: "legacy", categoryId: null, categoryNameSnapshot: category, categoryColorSnapshot: "#000", normalizedCategorySnapshot: category.trim().toLocaleLowerCase() }, payment: "Card", date: "legacy", origin: "Manual" });

test("empty budgets preserve available zero totals without inventing a usage ratio", () => {
  const result = calculateBudgetProjection({ budgets: [], transactions: [], month, now }); assert.equal(result.available, true); if (!result.available) return;
  assert.equal(result.plannedTotal, 0); assert.equal(result.spentTotal, 0); assert.equal(result.remainingBudget, 0); assert.equal(result.budgetUsedRatio, null); assert.equal(result.budgetUsage.available, false);
});
test("planned, spent and remaining totals use exact decimal aggregation", () => {
  const result = calculateBudgetProjection({ budgets: [budget("a", "Food", 0.1), budget("b", "Travel", 0.2)], transactions: [expense("a", "Food", 0.0001), expense("b", "Food", 0.0002), expense("c", "Travel", 0.1)], month, now });
  assert.equal(result.available, true); if (!result.available) return; assert.equal(result.plannedTotal, 0.3); assert.equal(result.spentTotal, 0.1003); assert.equal(result.remainingBudget, 0.1997);
});
test("overspending preserves above-100 usage and safe negative remaining", () => {
  const result = calculateBudgetProjection({ budgets: [budget("a", "Food", 10)], transactions: [expense("a", "Food", 12.3456)], month, now });
  assert.equal(result.available, true); if (!result.available) return; assert.equal(result.remainingBudget, -2.3456); assert.ok((result.budgetUsedPercent ?? 0) > 100); assert.equal(result.adjustmentNeeded > 0, true);
});
test("projection preserves 28, 29, 30 and 31 day civil calendars", () => {
  for (const [selected, date, days] of [["2023-02", new Date(2023, 1, 1), 28], ["2024-02", new Date(2024, 1, 1), 29], ["2026-09", new Date(2026, 8, 1), 30], ["2026-01", new Date(2026, 0, 1), 31]] as const) { const progress = calculateBudgetMonthProgress(selected, date); assert.equal(progress.remainingDays, days - 1); assert.equal(progress.monthElapsedRatio, 1 / days); }
});
test("past, current and future periods preserve projection policy", () => {
  const values = [expense("a", "Food", 10)]; const budgets = [budget("a", "Food", 100)];
  const past = calculateBudgetProjection({ budgets, transactions: values, month, now: new Date(2026, 9, 1) }); const current = calculateBudgetProjection({ budgets, transactions: values, month, now }); const future = calculateBudgetProjection({ budgets, transactions: values, month, now: new Date(2026, 7, 1) });
  assert.equal(past.available && past.projectedTotal, 10); assert.equal(current.available && current.projectedTotal, 20); assert.equal(future.available && future.projectedTotal, 10); assert.equal(future.canProject, false);
});
test("invalid operands and unsafe totals fail atomically with sanitized reasons", () => {
  const invalid = calculateBudgetProjection({ budgets: [budget("private", "Private", Number.NaN)], transactions: [], month, now }); assert.equal(invalid.available, false); assert.equal(invalid.unavailableReason, "invalid_operand"); assert.equal(invalid.plannedTotal, null);
  const unsafe = calculateBudgetProjection({ budgets: [budget("a", "A", 900719925474.0991), budget("b", "B", 0.0001)], transactions: [], month, now }); assert.equal(unsafe.available, false); assert.equal(unsafe.unavailableReason, "unsafe_aggregate"); assert.equal(JSON.stringify(unsafe).includes("Private"), false);
});
test("an unsafe category spend prevents every aggregate and recommendation", () => {
  const result = calculateBudgetProjection({ budgets: [budget("a", "Food", 100)], transactions: [expense("a", "Food", Infinity)], month, now }); assert.equal(result.available, false); assert.equal(result.spentTotal, null); assert.equal(result.adjustmentNeeded, null); assert.equal(createBudgetAdjustment(month, result), null);
});
test("overlap remains distinct from monetary failures", () => {
  const overlap = calculateBudgetProjection({ budgets: [budget("a", " Food ", 10), budget("b", "food", Number.NaN)], transactions: [], month, now }); assert.equal(overlap.available, false); assert.equal(overlap.unavailableReason, "overlapping_categories");
  const monetary = calculateBudgetProjection({ budgets: [budget("a", "Food", Number.NaN)], transactions: [], month, now }); assert.equal(monetary.unavailableReason, "invalid_operand");
});
test("savings capacity is safe, buffered and unavailable without artificial zero", () => {
  const valid = calculateGoalSavingsCapacity({ budgets: [budget("a", "Food", 100)], transactions: [expense("a", "Food", 10)], month, now }); assert.equal(valid.available, true); if (valid.available) { assert.equal(valid.rawCapacity, 80); assert.equal(valid.safeMonthlyCapacity, 40); }
  const invalid = calculateGoalSavingsCapacity({ budgets: [budget("a", "Food", Number.NaN)], transactions: [], month, now }); assert.equal(invalid.available, false); assert.equal(invalid.safeMonthlyCapacity, null); assert.equal(invalid.canContribute, false);
});
test("valid results and failures are order-independent", () => {
  const budgets = [budget("a", "Food", 10.0001), budget("b", "Travel", 20.0002)]; const transactions = [expense("a", "Food", 0.1), expense("b", "Travel", 0.2)];
  assert.deepEqual(calculateBudgetProjection({ budgets, transactions, month, now }), calculateBudgetProjection({ budgets: [...budgets].reverse(), transactions: [...transactions].reverse(), month, now }));
});
test("adjustment requires a fully available projection", () => {
  const valid = calculateBudgetProjection({ budgets: [budget("a", "Food", 10)], transactions: [expense("a", "Food", 20)], month, now }); assert.equal(canApplyBudgetAdjustment(valid), true); assert.notEqual(createBudgetAdjustment(month, valid), null);
  const invalid = calculateBudgetProjection({ budgets: [budget("a", "Food", Infinity)], transactions: [], month, now }); assert.equal(canApplyBudgetAdjustment(invalid), false); assert.equal(createBudgetAdjustment(month, invalid), null);
});
test("essential consumers narrow unavailable budgets and AI serializes null", () => {
  const modal = readFileSync(new URL("../../src/components/budgets/BudgetProjectionModal.tsx", import.meta.url), "utf8"); const tool = readFileSync(new URL("../../src/ai/tools/financial-summary.ts", import.meta.url), "utf8"); const dashboard = readFileSync(new URL("../../src/components/dashboard/dashboard-financial-summary.ts", import.meta.url), "utf8");
  assert.match(modal, /if \(!projection\.available\) return null/); assert.match(tool, /summary\.budgetProjection\.available \? summary\.plannedBudgetTotal : null/); assert.match(dashboard, /budgetProjection\.available \? budgetProjection\.plannedTotal : null/);
});
