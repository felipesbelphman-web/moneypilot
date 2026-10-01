import assert from "node:assert/strict";
import test from "node:test";
import { calculateTransactionKpiAggregates } from "../../src/components/transactions/transaction-period-aggregates.ts";
import { month, transaction } from "./finance-availability-render-harness.mts";

for (const amount of [NaN, Infinity, 1.23456, 900719925474.0992]) test(`invalid previous expense ${amount} preserves current totals`, () => {
  const result = calculateTransactionKpiAggregates([transaction({ type: "income", amount: 100 }), transaction(), transaction({ dateISO: "2026-08-10", amount })], month);
  assert.equal(result.available, true); assert.equal(result.income, 100); assert.equal(result.expenses, 20); assert.equal(result.netCashFlow, 80);
  assert.equal(result.previousExpenses, null); assert.equal(result.expenseVariation?.available, false); assert.equal(result.categoryComparisonAvailable, false);
  assert.equal(result.categoryAggregationAvailable, true);
});
test("previous overflow and invalid type do not invalidate current totals", () => {
  for (const previous of [
    [transaction({ dateISO: "2026-08-10", amount: 900719925474.0991 }), transaction({ dateISO: "2026-08-10", amount: 0.0001 })],
    [transaction({ dateISO: "2026-08-10", type: "transfer" as never })],
  ]) {
    const result = calculateTransactionKpiAggregates([transaction(), ...previous], month);
    assert.equal(result.available, true); assert.equal(result.expenses, 20); assert.equal(result.expenseVariation?.available, false);
  }
});
test("prior taxonomy failure suppresses category growth but preserves current categories and money comparison", () => {
  const result = calculateTransactionKpiAggregates([transaction(), transaction({ dateISO: "2026-08-10", amount: 10, category: "" })], month);
  assert.equal(result.available, true); assert.equal(result.categoryAggregationAvailable, true); assert.equal(result.categoryComparisonAvailable, false);
  assert.equal(result.expenseVariation?.available, true); assert.equal(result.risingCategory, null); assert.equal(result.categoryTotals[0].amount, 20);
});
test("zero previous denominator stays unavailable and valid precision/comparisons are preserved", () => {
  const zero = calculateTransactionKpiAggregates([transaction()], month);
  assert.deepEqual(zero.expenseVariation, { available: false, reason: "zero_denominator" });
  const valid = calculateTransactionKpiAggregates([transaction({ amount: 0.1 }), transaction({ amount: 0.2 }), transaction({ dateISO: "2026-08-10", amount: 0.1 })], month);
  assert.equal(valid.expenses, 0.3); assert.deepEqual(valid.expenseVariation, { available: true, value: 2 });
  assert.equal(valid.categoryComparisonAvailable, true); assert.equal(valid.risingCategory?.growth, 2);
});
test("invalid current totals remain unavailable", () => {
  const result = calculateTransactionKpiAggregates([transaction({ amount: NaN })], month);
  assert.equal(result.available, false); assert.equal(result.expenses, null);
});
