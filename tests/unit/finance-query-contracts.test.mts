import assert from "node:assert/strict";
import { test } from "node:test";
import { FinanceError } from "../../src/lib/domain/finance-error.ts";
import {
  createCursorPagination,
  createOffsetPagination,
  requireCompletePeriodResult,
  type FinancialQueryResult,
} from "../../src/lib/persistence/finance-query-contracts.ts";
import { compareByFinanceOrder, financeResourceOrder } from "../../src/lib/persistence/finance-resource-order.ts";

test("transaction ordering uses deterministic tie breakers", () => {
  const rows = [
    { date_iso: "2026-09-08", created_at: "2026-09-08T12:00:00Z", id: "b" },
    { date_iso: "2026-09-08", created_at: "2026-09-08T12:00:00Z", id: "a" },
    { date_iso: "2026-09-07", created_at: "2026-09-09T12:00:00Z", id: "c" },
  ];
  assert.deepEqual(rows.sort((left, right) => compareByFinanceOrder(financeResourceOrder.transactions, left, right)).map((row) => row.id), ["a", "b", "c"]);
});

test("every collection has a canonical stable ordering", () => {
  assert.deepEqual(financeResourceOrder.budgets.map((term) => term.column), ["month", "created_at", "id"]);
  assert.deepEqual(financeResourceOrder.budgetAdjustments.map((term) => term.column), ["month"]);
  assert.deepEqual(financeResourceOrder.goals.map((term) => term.column), ["target_date", "created_at", "id"]);
  assert.deepEqual(financeResourceOrder.goalContributionPlans.map((term) => term.column), ["goal_id"]);
  assert.deepEqual(financeResourceOrder.investments.map((term) => term.column), ["created_at", "id"]);
});

for (const [label, page, pageSize, field, reason] of [
  ["zero page", 0, 10, "page", "positive"],
  ["negative page", -1, 10, "page", "positive"],
  ["fractional page", 1.5, 10, "page", "positive"],
  ["zero page size", 1, 0, "pageSize", "positive"],
  ["infinite page size", 1, Number.POSITIVE_INFINITY, "pageSize", "finite"],
] as const) {
  test(`rejects ${label}`, () => {
    assert.throws(() => createOffsetPagination(page, pageSize), (error) => error instanceof FinanceError
      && error.details?.field === field && error.details.reason === reason);
  });
}

test("creates explicitly typed offset and cursor pagination", () => {
  assert.deepEqual(createOffsetPagination(2, 25), { kind: "offset", page: 2, pageSize: 25 });
  assert.deepEqual(createCursorPagination("  cursor-token  ", 25), { kind: "cursor", after: "cursor-token", pageSize: 25 });
});

test("rejects invalid cursor page sizes", () => {
  assert.throws(() => createCursorPagination(null, -1), FinanceError);
});

test("does not allow a partial page to be used as a complete financial period", () => {
  const page: FinancialQueryResult<number> = {
    completeness: "partial",
    items: [10, 20],
    total: 100,
    pagination: createOffsetPagination(1, 2),
  };
  assert.throws(() => requireCompletePeriodResult(page), (error) => error instanceof FinanceError
    && error.code === "validation_error" && error.details?.field === "completeness");
});

test("accepts only explicitly complete period data for totals", () => {
  const complete: FinancialQueryResult<number> = {
    completeness: "complete",
    range: { fromISO: "2026-09-01", toISO: "2026-09-30" },
    items: [10, 20],
  };
  assert.equal(requireCompletePeriodResult(complete), complete);
});
