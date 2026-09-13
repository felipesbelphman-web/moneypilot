import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { calculateDashboardFinancialSummary } from "../../src/components/dashboard/dashboard-financial-summary.ts";
import type { Transaction } from "../../src/components/transactions/transaction-model.ts";
import { aggregateMoney } from "../../src/lib/domain/money-aggregation.ts";

const month = "2026-09";
const now = new Date(2026, 8, 15);
const transaction = (id: string, type: "income" | "expense", amount: number, category = "Food"): Transaction => ({ id, type, amount, category, description: "private description", categoryColor: "#000", classification: { kind: "legacy", categoryId: null, categoryNameSnapshot: category, categoryColorSnapshot: "#000", normalizedCategorySnapshot: category.trim().toLocaleLowerCase() }, payment: "Card", date: "legacy", dateISO: `${month}-10`, origin: "Manual" });
const summary = (transactions: Transaction[], budgets: Parameters<typeof calculateDashboardFinancialSummary>[0]["budgets"] = []) => calculateDashboardFinancialSummary({ transactions, budgets, budgetAdjustments: {}, goals: [], goalContributionPlans: {}, month, now });

test("safe aggregation handles valid decimal cases", () => {
  assert.deepEqual(aggregateMoney([]), { available: true, value: 0 }); assert.deepEqual(aggregateMoney([12.3456]), { available: true, value: 12.3456 }); assert.deepEqual(aggregateMoney([100, 50.25, 0.0001]), { available: true, value: 150.2501 }); assert.deepEqual(aggregateMoney([0.1, 0.2]), { available: true, value: 0.3 }); assert.deepEqual(aggregateMoney([10.0001, 0.0001, 0.0001]), { available: true, value: 10.0003 });
});
test("safe aggregation handles signs, cancellation and normalized zero", () => {
  assert.deepEqual(aggregateMoney([10, -10]), { available: true, value: 0 }); assert.deepEqual(aggregateMoney([-10, 2.5]), { available: true, value: -7.5 }); const zero = aggregateMoney([-0]); assert.equal(zero.available && Object.is(zero.value, -0), false);
});
test("safe aggregation rejects invalid operands without private details", () => {
  for (const value of [1.23456, Number.NaN, Infinity, 900719925474.0992]) assert.deepEqual(aggregateMoney([value]), { available: false, reason: "invalid_operand" }); assert.equal(JSON.stringify(aggregateMoney([Number.NaN])).includes("private"), false);
});
test("safe aggregation rejects unsafe aggregate and is order-independent", () => {
  assert.deepEqual(aggregateMoney([900719925474.0991, 0.0001]), { available: false, reason: "unsafe_aggregate" }); assert.deepEqual(aggregateMoney([10.0001, -3, 0.2]), aggregateMoney([0.2, 10.0001, -3]));
});
test("summary distinguishes valid empty month from unavailability", () => {
  const result = summary([]); assert.equal(result.aggregationAvailable, true); assert.equal(result.income, 0); assert.equal(result.expenses, 0); assert.equal(result.netCashFlow, 0); assert.deepEqual(result.categorySpending, []);
});
test("summary safely aggregates income, expenses and exact net", () => {
  const result = summary([transaction("i1", "income", 0.1), transaction("i2", "income", 0.2), transaction("e1", "expense", 0.1)]); assert.equal(result.income, 0.3); assert.equal(result.expenses, 0.1); assert.equal(result.netCashFlow, 0.2); for (const value of [result.income, result.expenses, result.netCashFlow]) assert.equal(Number.isFinite(value), true);
});
test("summary handles income-only and expense-only", () => {
  assert.equal(summary([transaction("i", "income", 20)]).netCashFlow, 20); assert.equal(summary([transaction("e", "expense", 20)]).netCashFlow, -20);
});
test("category totals are exact, coherent and normalized", () => {
  const result = summary([transaction("a", "expense", 0.1, "Food"), transaction("b", "expense", 0.2, " food "), transaction("c", "expense", 10, "Travel")]); assert.equal(result.expenses, 10.3); assert.equal(result.categorySpending.length, 2); assert.equal(result.categorySpending.find((item) => item.category === "Food")?.amount, 0.3); assert.deepEqual(aggregateMoney(result.categorySpending.map((item) => item.amount)), { available: true, value: result.expenses });
});
test("invalid aggregation publishes no false totals or partial distribution", () => {
  const result = summary([transaction("valid", "expense", 10), transaction("private-id", "expense", Number.NaN, "Private category")]); assert.equal(result.aggregationAvailable, false); assert.equal(result.aggregationUnavailableReason, "invalid_operand"); assert.equal(result.income, null); assert.equal(result.expenses, null); assert.equal(result.netCashFlow, null); assert.equal(result.safeSavingsCapacity, null); assert.deepEqual(result.categorySpending, []); assert.equal(result.monthlyStatus, "unavailable"); assert.match(JSON.stringify(result), /"income":null/);
});
test("unsafe aggregate disables derived inputs", () => {
  const result = summary([transaction("a", "income", 900719925474.0991), transaction("b", "income", 0.0001)]); assert.equal(result.aggregationAvailable, false); assert.equal(result.aggregationUnavailableReason, "unsafe_aggregate"); assert.equal(result.income, null); assert.equal(result.expenses, null); assert.equal(result.netCashFlow, null); assert.equal(result.incomeAveragePerDay, null);
});
test("budget overlap remains a distinct reason", () => {
  const budgets = [{ id: "a", category: "Food", subtitle: "Food", budget: 100, month, color: "#000" }, { id: "b", category: " food ", subtitle: "Food", budget: 100, month, color: "#000" }]; const result = summary([], budgets); assert.equal(result.aggregationAvailable, true); assert.equal(result.aggregationUnavailableReason, null); assert.equal(result.safeSavingsCapacity, null); assert.equal(result.plannedBudgetTotal, null); assert.equal(result.budgetSpentTotal, null); assert.equal(result.remainingBudget, null); assert.equal(result.budgetProjection.unavailableReason, "overlapping_categories"); assert.equal(result.monthlyStatus, "unavailable");
});
test("next best action guards unavailable transaction aggregates", () => {
  const source = readFileSync(new URL("../../src/components/dashboard/next-best-action.ts", import.meta.url), "utf8"); assert.match(source, /if \(!aggregationAvailable \|\| netCashFlow === null\).*transaction_aggregation_unavailable/);
});
test("insights guards income usage and recommendations", () => {
  const source = readFileSync(new URL("../../src/app/insights/page.tsx", import.meta.url), "utf8"); assert.match(source, /summary\.aggregationAvailable && summary\.income > 0/); assert.match(source, /aggregationAvailable: summary\.aggregationAvailable/);
});
test("AI summary maps unavailable monetary aggregates to null", () => {
  const source = readFileSync(new URL("../../src/ai/tools/financial-summary.ts", import.meta.url), "utf8"); for (const field of ["income", "expenses", "netCashFlow"]) assert.match(source, new RegExp(`${field}: summary\\.aggregationAvailable \\? summary\\.${field} : null`));
});
test("dashboard visual consumers narrow before formatting nullable totals", () => {
  const kpi = readFileSync(new URL("../../src/components/dashboard/DashboardKpiCards.tsx", import.meta.url), "utf8"); const flow = readFileSync(new URL("../../src/components/financial-flow/FinancialFlow.tsx", import.meta.url), "utf8"); assert.match(kpi, /aggregationAvailable && netCashFlow !== null/); assert.match(flow, /aggregationAvailable && income !== null/); assert.match(flow, /aggregationAvailable && expenses !== null/);
});
test("dashboard preserves monetary KPIs while taxonomy is unavailable", () => {
  const result = summary([transaction("income", "income", 40, ""), transaction("expense", "expense", 15, " ")]);
  assert.equal(result.aggregationAvailable, true); if (!result.aggregationAvailable) return;
  assert.equal(result.income, 40); assert.equal(result.expenses, 15); assert.equal(result.netCashFlow, 25); assert.equal(result.incomeAveragePerDay, 40 / 15); assert.equal(result.largestIncome, 40); assert.equal(result.transactionCount, 2);
  assert.equal(result.categoryAggregationAvailable, false); assert.equal(result.categoryAggregationUnavailableReason, "missing_category"); assert.deepEqual(result.categorySpending, []); assert.equal(result.topSpendingCategory, null);
});
test("dashboard taxonomy failure is independent of budget overlap", () => {
  const budgets = [{ id: "a", category: "Food", subtitle: "Food", budget: 100, month, color: "#000" }, { id: "b", category: " food ", subtitle: "Food", budget: 100, month, color: "#000" }];
  const result = summary([transaction("expense", "expense", 15, "")], budgets); assert.equal(result.aggregationAvailable, true); assert.equal(result.categoryAggregationAvailable, false); assert.equal(result.categoryAggregationUnavailableReason, "missing_category"); assert.equal(result.budgetProjection.unavailableReason, "overlapping_categories");
});
test("category consumers narrow independently from monetary consumers", () => {
  const insights = readFileSync(new URL("../../src/app/insights/page.tsx", import.meta.url), "utf8"); const ai = readFileSync(new URL("../../src/ai/tools/financial-summary.ts", import.meta.url), "utf8"); const flow = readFileSync(new URL("../../src/components/financial-flow/FinancialFlow.tsx", import.meta.url), "utf8");
  assert.match(insights, /available={summary\.categoryAggregationAvailable}/); assert.match(ai, /topSpendingCategories: summary\.categoryAggregationAvailable/); assert.match(flow, /categoryAggregationAvailable && expenses !== null/); assert.match(flow, /aggregationAvailable && income !== null && expenses !== null && netCashFlow !== null/);
});
