import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { calculateDashboardFinancialSummary } from "../../src/components/dashboard/dashboard-financial-summary.ts";
import { calculateSafeRatio, calculateTransactionKpiAggregates, getPreviousTransactionMonth } from "../../src/components/transactions/transaction-period-aggregates.ts";
import type { Transaction } from "../../src/components/transactions/transaction-model.ts";
import { inspectCategoryReference } from "../../src/lib/domain/category-integrity.ts";
import { aggregateMoney } from "../../src/lib/domain/money-aggregation.ts";

const month = "2026-09";
const tx = (id: string, dateISO: string, type: "income" | "expense", amount: number, category = "Food"): Transaction => ({ id, dateISO, type, amount, category, description: "private description", categoryColor: "#000", classification: { kind: "legacy", categoryId: null, categoryNameSnapshot: category, categoryColorSnapshot: "#000", normalizedCategorySnapshot: category.trim().toLocaleLowerCase() }, payment: "Card", date: "legacy", origin: "Manual" });

test("empty period is available with zero totals and semantic ratio absence", () => {
  const result = calculateTransactionKpiAggregates([], month); assert.equal(result.available, true); if (!result.available) return; assert.equal(result.income, 0); assert.equal(result.expenses, 0); assert.equal(result.netCashFlow, 0); assert.equal(result.largestIncome, null); assert.deepEqual(result.incomeUsage, { available: false, reason: "zero_denominator" }); assert.deepEqual(result.categoryTotals, []);
});
test("income-only, expense-only and mixed periods preserve signs", () => {
  const income = calculateTransactionKpiAggregates([tx("i", `${month}-01`, "income", 10)], month); assert.equal(income.available && income.netCashFlow, 10); const expense = calculateTransactionKpiAggregates([tx("e", `${month}-01`, "expense", 10)], month); assert.equal(expense.available && expense.netCashFlow, -10); const mixed = calculateTransactionKpiAggregates([tx("i", `${month}-01`, "income", 10), tx("e", `${month}-02`, "expense", 4)], month); assert.equal(mixed.available && mixed.netCashFlow, 6);
});
test("period filtering and previous-month calculation preserve civil months", () => {
  assert.equal(getPreviousTransactionMonth("2026-01"), "2025-12"); assert.equal(getPreviousTransactionMonth("2024-03"), "2024-02"); const leapFebruary = calculateTransactionKpiAggregates([tx("leap", "2024-02-29", "expense", 3)], "2024-02"); assert.equal(leapFebruary.available && leapFebruary.expenses, 3); const result = calculateTransactionKpiAggregates([tx("a", "2026-09-01", "expense", 2), tx("b", "2026-10-01", "expense", 8)], month); assert.equal(result.available && result.expenses, 2);
});
test("decimal totals preserve four places without item rounding", () => {
  const result = calculateTransactionKpiAggregates([tx("a", `${month}-01`, "income", 0.1), tx("b", `${month}-02`, "income", 0.2), tx("c", `${month}-03`, "expense", 0.0001), tx("d", `${month}-04`, "expense", 10.0001)], month); assert.equal(result.available, true); if (!result.available) return; assert.equal(result.income, 0.3); assert.equal(result.expenses, 10.0002); assert.equal(result.netCashFlow, -9.7002);
});
test("transaction order does not affect aggregates", () => {
  const values = [tx("a", `${month}-01`, "income", 10), tx("b", `${month}-02`, "expense", 2), tx("c", `${month}-03`, "expense", 0.1)]; const forward = calculateTransactionKpiAggregates(values, month); const reverse = calculateTransactionKpiAggregates([...values].reverse(), month); assert.deepEqual({ ...forward, monthTransactions: [] }, { ...reverse, monthTransactions: [] });
});
test("safe ratios distinguish zero, absence, above 100 and invalid values", () => {
  assert.deepEqual(calculateSafeRatio(0, 10), { available: true, value: 0 }); assert.deepEqual(calculateSafeRatio(1, 0), { available: false, reason: "zero_denominator" }); assert.deepEqual(calculateSafeRatio(20, 10), { available: true, value: 2 }); assert.deepEqual(calculateSafeRatio(Infinity, 1), { available: false, reason: "invalid_operand" }); assert.deepEqual(calculateSafeRatio(Number.MAX_VALUE, Number.MIN_VALUE), { available: false, reason: "invalid_operand" });
});
test("monthly variation handles positive, negative, unchanged and minus 100 percent", () => {
  for (const [current, previous, expected] of [[15, 10, 0.5], [5, 10, -0.5], [10, 10, 0], [0, 10, -1]] as const) { const result = calculateTransactionKpiAggregates([tx("c", `${month}-01`, "expense", current), tx("p", "2026-08-01", "expense", previous)], month); assert.equal(result.available, true); if (result.available) assert.deepEqual(result.expenseVariation, { available: true, value: expected }); }
});
test("zero previous expense makes comparison unavailable", () => {
  const result = calculateTransactionKpiAggregates([tx("c", `${month}-01`, "expense", 10)], month); assert.equal(result.available, true); if (result.available) assert.deepEqual(result.expenseVariation, { available: false, reason: "zero_denominator" });
});
test("legacy category totals use normalized snapshot identity and safe growth", () => {
  const result = calculateTransactionKpiAggregates([tx("a", `${month}-01`, "expense", 0.1, "Food"), tx("b", `${month}-02`, "expense", 0.2, "Food"), tx("c", `${month}-03`, "expense", 5, " food "), tx("p", "2026-08-01", "expense", 0.1, "Food")], month); assert.equal(result.available, true); if (!result.available) return; assert.equal(result.categoryTotals.length, 1); assert.deepEqual(result.risingCategory, { categoryKey: "legacy:food", category: "Food", amount: 5.3, growth: 52 });
});
test("new categories do not invent growth and growth ties remain stable", () => {
  const fresh = calculateTransactionKpiAggregates([tx("a", `${month}-01`, "expense", 10, "New")], month); assert.equal(fresh.available && fresh.risingCategory, null); const values = [tx("a", `${month}-01`, "expense", 20, "A"), tx("b", "2026-08-01", "expense", 10, "A"), tx("c", `${month}-01`, "expense", 40, "B"), tx("d", "2026-08-01", "expense", 20, "B")]; const tied = calculateTransactionKpiAggregates(values, month); assert.equal(tied.available && tied.risingCategory?.category, "A");
});
test("invalid and unsafe operands fail atomically without private data", () => {
  for (const amount of [Number.NaN, Infinity, 1.23456]) { const result = calculateTransactionKpiAggregates([tx("private-id", `${month}-01`, "expense", amount, "Private category")], month); assert.equal(result.available, false); if (!result.available) { assert.equal(result.unavailableReason, "invalid_operand"); assert.equal(result.expenses, null); assert.deepEqual(result.categoryTotals, []); assert.equal(result.unavailableReason.includes("Private"), false); } } const unsafe = calculateTransactionKpiAggregates([tx("a", `${month}-01`, "expense", 900719925474.0991), tx("b", `${month}-02`, "expense", 0.0001)], month); assert.equal(unsafe.available, false); if (!unsafe.available) assert.equal(unsafe.unavailableReason, "unsafe_aggregate");
});
test("largest income uses null for absence and a real maximum otherwise", () => {
  const none = calculateTransactionKpiAggregates([tx("e", `${month}-01`, "expense", 2)], month); assert.equal(none.available && none.largestIncome, null); const result = calculateTransactionKpiAggregates([tx("a", `${month}-01`, "income", 10), tx("b", `${month}-02`, "income", 10)], month); assert.equal(result.available && result.largestIncome, 10);
});
test("transactions KPIs match dashboard summary totals", () => {
  const transactions = [tx("a", `${month}-01`, "income", 0.1), tx("b", `${month}-02`, "income", 0.2), tx("c", `${month}-03`, "expense", 0.1)]; const kpis = calculateTransactionKpiAggregates(transactions, month); const summary = calculateDashboardFinancialSummary({ transactions, budgets: [], budgetAdjustments: {}, goals: [], goalContributionPlans: {}, month, now: new Date(2026, 8, 15) }); assert.equal(kpis.available, true); assert.equal(summary.aggregationAvailable, true); if (kpis.available && summary.aggregationAvailable) assert.deepEqual({ income: kpis.income, expenses: kpis.expenses, netCashFlow: kpis.netCashFlow }, { income: summary.income, expenses: summary.expenses, netCashFlow: summary.netCashFlow });
});
test("real cards narrow availability before formatting or percentage copy", () => {
  const source = readFileSync(new URL("../../src/components/transactions/TransactionsKpiCards.tsx", import.meta.url), "utf8"); assert.match(source, /aggregates\.available \? money\(aggregates\.expenses\) : "—"/); assert.match(source, /aggregates\.available && aggregates\.incomeUsage\.available/); assert.doesNotMatch(source, /expenseTotal\s*\/|expenseTotal\s*-/);
});

test("category integrity preserves literal, accented, Unicode and historical names", () => {
  for (const category of ["Food", " food ", "Alimentação", "食費", "Removed historical category"]) {
    assert.deepEqual(inspectCategoryReference(category, "expense"), { available: true, unavailableReason: null, category, type: "expense" });
  }
});
test("category integrity distinguishes missing and blank categories", () => {
  assert.deepEqual(inspectCategoryReference("", "expense"), { available: false, unavailableReason: "missing_category", category: null, type: null });
  assert.deepEqual(inspectCategoryReference("   ", "expense"), { available: false, unavailableReason: "missing_category", category: null, type: null });
});
test("category integrity validates financial type without adding it to text identity", () => {
  assert.equal(inspectCategoryReference("Salary", "income").available, true);
  assert.equal(inspectCategoryReference("Food", "expense").available, true);
  assert.equal(inspectCategoryReference("Same", "income").available, true);
  assert.equal(inspectCategoryReference("Same", "expense").available, true);
  assert.deepEqual(inspectCategoryReference("Food", "transfer"), { available: false, unavailableReason: "invalid_transaction_type", category: null, type: null });
});
test("category integrity reports incompatible expected type", () => {
  assert.deepEqual(inspectCategoryReference("Salary", "income", "expense"), { available: false, unavailableReason: "incompatible_category_type", category: null, type: null });
});
test("transaction aggregates use normalized legacy snapshot identity", () => {
  const result = calculateTransactionKpiAggregates([tx("a", `${month}-01`, "expense", 1, "Food"), tx("b", `${month}-02`, "expense", 2, "food"), tx("c", `${month}-03`, "expense", 3, " Food ")], month);
  assert.equal(result.available, true); if (!result.available) return;
  assert.deepEqual(result.categoryTotals.map((item) => item.category), ["Food"]);
  assert.equal(result.categoryTotals.length, 1);
});
test("linked identity uses category id and uncategorized never uses legacy text", () => {
  const linkedA = { ...tx("a", `${month}-01`, "expense", 1), classification: { kind: "linked", categoryId: "category-a", categoryNameSnapshot: "Food", categoryColorSnapshot: "#000", normalizedCategorySnapshot: "food" } as const };
  const linkedB = { ...tx("b", `${month}-02`, "expense", 2), classification: { kind: "linked", categoryId: "category-b", categoryNameSnapshot: "Food", categoryColorSnapshot: "#000", normalizedCategorySnapshot: "food" } as const };
  const uncategorized = { ...tx("u", `${month}-03`, "expense", 3, "Legacy must not group"), category: null, categoryColor: null, classification: { kind: "uncategorized", categoryId: null, categoryNameSnapshot: null, categoryColorSnapshot: null, normalizedCategorySnapshot: null } as const };
  const result = calculateTransactionKpiAggregates([linkedA, linkedB, uncategorized], month);
  assert.equal(result.categoryAggregationAvailable, true);
  if (!result.categoryAggregationAvailable) return;
  assert.deepEqual(result.categoryTotals.map((item) => [item.categoryKey, item.category]), [["linked:category-a", "Food"], ["linked:category-b", "Food"], ["__moneypilot_transaction_uncategorized__", null]]);
});
test("invalid taxonomy preserves money and prevents partial distributions", () => {
  const invalid = tx("private-id", `${month}-01`, "expense", 10, "   ");
  const aggregates = calculateTransactionKpiAggregates([tx("valid", `${month}-02`, "expense", 5), invalid], month);
  const dashboard = calculateDashboardFinancialSummary({ transactions: [invalid], budgets: [], budgetAdjustments: {}, goals: [], goalContributionPlans: {}, month, now: new Date(2026, 8, 15) });
  assert.equal(aggregates.available, true); assert.equal(aggregates.expenses, 15); assert.equal(aggregates.netCashFlow, -15); assert.equal(aggregates.monthTransactions.length, 2); assert.equal(aggregates.categoryAggregationAvailable, false); assert.equal(aggregates.categoryAggregationUnavailableReason, "missing_category"); assert.deepEqual(aggregates.categoryTotals, []);
  assert.equal(dashboard.aggregationAvailable, true); assert.equal(dashboard.expenses, 10); assert.equal(dashboard.netCashFlow, -10); assert.equal(dashboard.categoryAggregationAvailable, false); assert.equal(dashboard.categoryAggregationUnavailableReason, "missing_category"); assert.deepEqual(dashboard.categorySpending, []);
});
test("blank income category preserves general metrics and monthly comparison", () => {
  const result = calculateTransactionKpiAggregates([tx("income", `${month}-03`, "income", 50, ""), tx("expense", `${month}-04`, "expense", 10, "Food"), tx("previous", "2026-08-04", "expense", 5, "Food")], month);
  assert.equal(result.available, true); if (!result.available) return;
  assert.equal(result.income, 50); assert.equal(result.expenses, 10); assert.equal(result.netCashFlow, 40); assert.equal(result.largestIncome, 50); assert.deepEqual(result.expenseVariation, { available: true, value: 1 }); assert.equal(result.monthTransactions.length, 2);
  assert.equal(result.categoryAggregationAvailable, false); assert.equal(result.risingCategory, null); assert.deepEqual(result.categoryTotals, []);
});
test("monetary failure takes precedence over missing taxonomy deterministically", () => {
  const values = [tx("missing", `${month}-01`, "expense", 10, " "), tx("invalid", `${month}-02`, "expense", Number.NaN, "Food")];
  for (const transactions of [values, [...values].reverse()]) {
    const result = calculateTransactionKpiAggregates(transactions, month); assert.equal(result.available, false); if (result.available) continue;
    assert.equal(result.unavailableReason, "invalid_operand"); assert.equal(result.categoryAggregationUnavailableReason, "invalid_operand"); assert.equal(result.expenses, null); assert.deepEqual(result.categoryTotals, []); assert.equal(result.unavailableReason.includes("missing"), false);
  }
});
test("invalid financial type precedes monetary and taxonomy failures", () => {
  const invalidType = tx("private", `${month}-01`, "expense", Number.NaN, ""); Object.defineProperty(invalidType, "type", { value: "transfer" });
  const result = calculateTransactionKpiAggregates([invalidType], month); assert.equal(result.available, false); if (result.available) return;
  assert.equal(result.unavailableReason, "invalid_transaction_type"); assert.equal(result.categoryAggregationUnavailableReason, "invalid_transaction_type"); assert.equal(result.income, null); assert.equal(result.expenses, null); assert.equal(result.unavailableReason.includes("private"), false);
});
test("valid taxonomy keeps category groups complete and equal to expenses", () => {
  const result = calculateTransactionKpiAggregates([tx("a", `${month}-01`, "expense", 0.1, "Food"), tx("b", `${month}-02`, "expense", 0.2, "Travel")], month);
  assert.equal(result.available, true); assert.equal(result.categoryAggregationAvailable, true); if (!result.available || !result.categoryAggregationAvailable) return;
  assert.deepEqual(aggregateMoney(result.categoryTotals.map((item) => item.amount)), { available: true, value: 0.3 }); assert.equal(result.expenses, 0.3); assert.equal(result.categoryTotals.some((item) => item.category === "Other"), false);
});
