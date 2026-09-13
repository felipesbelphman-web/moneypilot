import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildFinancialFlowSeries } from "../../src/components/financial-flow/financial-flow-series.ts";
import { calculateDashboardFinancialSummary } from "../../src/components/dashboard/dashboard-financial-summary.ts";
import type { Transaction } from "../../src/components/transactions/transaction-model.ts";

const tx = (id: string, dateISO: string, type: "income" | "expense", amount: number): Transaction => ({ id, dateISO, type, amount, description: "private description", category: "Private category", categoryColor: "#000", classification: { kind: "legacy", categoryId: null, categoryNameSnapshot: "Private category", categoryColorSnapshot: "#000", normalizedCategorySnapshot: "private category" }, payment: "Card", date: "legacy", origin: "Manual" });

test("series preserves civil calendar lengths and ascending dates", () => {
  for (const [month, days] of [["2025-02", 28], ["2024-02", 29], ["2026-04", 30], ["2026-01", 31]] as const) { const result = buildFinancialFlowSeries({ month, transactions: [] }); assert.equal(result.available, true); if (!result.available) continue; assert.equal(result.points.length, days); assert.equal(result.points[0].dateISO, `${month}-01`); assert.equal(result.points.at(-1)?.dateISO, `${month}-${days}`); assert.deepEqual(result.points.map((point) => point.day), Array.from({ length: days }, (_, index) => index + 1)); }
});
test("empty month has available legitimate zero days and totals", () => {
  const result = buildFinancialFlowSeries({ month: "2026-09", transactions: [] }); assert.equal(result.available, true); if (!result.available) return; assert.deepEqual(result.totals, { income: 0, expenses: 0, netCashFlow: 0 }); assert.ok(result.points.every((point) => point.income === 0 && point.expense === 0 && point.net === 0));
});
test("series excludes other months without timezone conversion", () => {
  const result = buildFinancialFlowSeries({ month: "2026-09", transactions: [tx("a", "2026-09-01", "income", 10), tx("b", "2026-08-31", "income", 50)] }); assert.equal(result.available, true); if (!result.available) return; assert.equal(result.points[0].income, 10); assert.equal(result.totals.income, 10);
});
test("daily income, expenses and net use exact decimal aggregation", () => {
  const result = buildFinancialFlowSeries({ month: "2026-09", transactions: [tx("a", "2026-09-03", "income", 0.1), tx("b", "2026-09-03", "income", 0.2), tx("c", "2026-09-03", "expense", 0.1001), tx("d", "2026-09-03", "expense", 0.0001)] }); assert.equal(result.available, true); if (!result.available) return; const point = result.points[2]; assert.equal(point.income, 0.3); assert.equal(point.expense, 0.1002); assert.equal(point.net, 0.1998);
});
test("empty days repeat safe cumulative values", () => {
  const result = buildFinancialFlowSeries({ month: "2026-09", transactions: [tx("a", "2026-09-01", "income", 10), tx("b", "2026-09-03", "expense", 2)] }); assert.equal(result.available, true); if (!result.available) return; assert.deepEqual(result.points.slice(0, 3).map((point) => point.cumulativeNet), [10, 10, 8]);
});
test("alternating days, cancellation and negative totals remain exact", () => {
  const result = buildFinancialFlowSeries({ month: "2026-09", transactions: [tx("a", "2026-09-01", "income", 10), tx("b", "2026-09-02", "expense", 10), tx("c", "2026-09-03", "expense", 2.5)] }); assert.equal(result.available, true); if (!result.available) return; assert.deepEqual(result.points.slice(0, 3).map((point) => point.cumulativeNet), [10, 0, -2.5]); assert.equal(result.totals.netCashFlow, -2.5);
});
test("transaction order does not affect points or totals", () => {
  const values = [tx("a", "2026-09-04", "income", 10.0001), tx("b", "2026-09-04", "income", 0.0001), tx("c", "2026-09-02", "expense", 3)]; assert.deepEqual(buildFinancialFlowSeries({ month: "2026-09", transactions: values }), buildFinancialFlowSeries({ month: "2026-09", transactions: [...values].reverse() }));
});
test("last cumulative values equal independently calculated totals", () => {
  const result = buildFinancialFlowSeries({ month: "2026-09", transactions: [tx("a", "2026-09-01", "income", 12.25), tx("b", "2026-09-30", "expense", 2.25)] }); assert.equal(result.available, true); if (!result.available) return; const last = result.points.at(-1); assert.deepEqual(last && { income: last.cumulativeIncome, expenses: last.cumulativeExpense, netCashFlow: last.cumulativeNet }, result.totals);
});
test("invalid operands fail atomically with sanitized reasons", () => {
  for (const amount of [Number.NaN, Infinity, 1.23456]) { const result = buildFinancialFlowSeries({ month: "2026-09", transactions: [tx("private-id", "2026-09-12", "income", amount)] }); assert.deepEqual(result, { available: false, unavailableReason: "invalid_operand", points: [], totals: null }); assert.equal(JSON.stringify(result).includes("private"), false); }
});
test("unsafe daily and cumulative aggregates publish no partial points", () => {
  const maximum = 900719925474.0991; const daily = buildFinancialFlowSeries({ month: "2026-09", transactions: [tx("a", "2026-09-01", "income", maximum), tx("b", "2026-09-01", "income", 0.0001)] }); assert.deepEqual(daily, { available: false, unavailableReason: "unsafe_aggregate", points: [], totals: null }); const cumulative = buildFinancialFlowSeries({ month: "2026-09", transactions: [tx("a", "2026-09-01", "income", maximum), tx("b", "2026-09-02", "income", 0.0001)] }); assert.deepEqual(cumulative, { available: false, unavailableReason: "unsafe_aggregate", points: [], totals: null });
});
test("series totals match dashboard summary for the same period", () => {
  const transactions = [tx("a", "2026-09-01", "income", 0.1), tx("b", "2026-09-02", "income", 0.2), tx("c", "2026-09-03", "expense", 0.1)]; const summary = calculateDashboardFinancialSummary({ transactions, budgets: [], budgetAdjustments: {}, goals: [], goalContributionPlans: {}, month: "2026-09", now: new Date(2026, 8, 15) }); assert.equal(summary.aggregationAvailable, true); if (!summary.aggregationAvailable) return; const series = buildFinancialFlowSeries({ month: "2026-09", transactions, expectedTotals: { income: summary.income, expenses: summary.expenses, netCashFlow: summary.netCashFlow } }); assert.equal(series.available, true); if (series.available) assert.deepEqual(series.totals, { income: summary.income, expenses: summary.expenses, netCashFlow: summary.netCashFlow });
});
test("summary unavailability and inconsistent totals block chart points", () => {
  const source = readFileSync(new URL("../../src/components/financial-flow/FinancialFlow.tsx", import.meta.url), "utf8"); assert.match(source, /aggregationAvailable && income !== null && expenses !== null && netCashFlow !== null/); const result = buildFinancialFlowSeries({ month: "2026-09", transactions: [tx("a", "2026-09-01", "income", 10)], expectedTotals: { income: 11, expenses: 0, netCashFlow: 11 } }); assert.deepEqual(result, { available: false, unavailableReason: "unsafe_aggregate", points: [], totals: null });
});
test("render integration keeps numeric data separate from formatting", () => {
  const source = readFileSync(new URL("../../src/components/financial-flow/FinancialFlow.tsx", import.meta.url), "utf8"); assert.match(source, /dailySeries = series\.points/); assert.match(source, /seriesAvailable && props\.transactions\.length > 0/); assert.doesNotMatch(source, /parseFloat\(|parseInt\(/);
});
test("blank category does not invalidate the monetary time series", () => {
  const value = { ...tx("blank", "2026-09-01", "expense", 5), category: " " }; const result = buildFinancialFlowSeries({ month: "2026-09", transactions: [value] }); assert.equal(result.available, true); if (result.available) assert.deepEqual(result.totals, { income: 0, expenses: 5, netCashFlow: -5 });
});
test("invalid financial type blocks the series instead of becoming an expense", () => {
  const value = tx("private", "2026-09-01", "expense", 5); Object.defineProperty(value, "type", { value: "transfer" }); const result = buildFinancialFlowSeries({ month: "2026-09", transactions: [value] }); assert.deepEqual(result, { available: false, unavailableReason: "invalid_transaction_type", points: [], totals: null }); assert.equal(JSON.stringify(result).includes("private"), false);
});
