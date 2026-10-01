import assert from "node:assert/strict";
import test from "node:test";
import { budgetProjection, budgetRows, cap, cappedRepository, owner, transactionProjection, transactionRows } from "./finance-completeness-http-harness.mts";
import { createEmptyFinanceData, mergeFinanceLoadResult } from "../../src/lib/persistence/finance-hydration.ts";
import { beginFinanceResourceHydration, createFinanceResourceStatuses, settleFinanceResourceStatuses } from "../../src/lib/persistence/finance-resource-status.ts";

for (const size of [cap - 1, cap, cap + 1, 2 * cap + 1]) {
  test(`transaction boundary: ${Math.min(size, cap)} returned / ${size} matching`, async () => {
    const rows = transactionRows(size);
    const foreign = { ...rows[0], user_id: "other-owner", id: "foreign", date_iso: "2027-01-01" };
    const harness = cappedRepository({ transactions: [...rows].reverse().concat(foreign) });
    const result = (await harness.repository.loadFinanceData(owner)).transactions;
    assert.equal(result.status, size > cap ? "failure" : "success");
    if (result.status === "success") {
      assert.deepEqual(result.data.map(row => row.id), rows.map(row => row.id));
      assert.equal(result.data[0].dateISO, rows[0].date_iso);
      assert.equal("user_id" in result.data[0], false);
    } else {
      assert.equal(result.error.code, "repository_unavailable");
      assert.deepEqual(result.error.details, { reason: "incomplete_collection" });
      assert.equal("data" in result, false);
    }
    const requests = harness.observations.filter(item => item.url.pathname.endsWith("/transactions"));
    assert.equal(requests.length, 1);
    const [request] = requests;
    assert.equal(request.method, "GET");
    assert.equal(request.prefer, "count=exact");
    assert.equal(request.url.searchParams.get("select"), transactionProjection);
    assert.equal(request.url.searchParams.get("order"), "date_iso.desc,created_at.desc,id.asc");
    assert.equal(request.range, `0-${Math.min(size, cap) - 1}/${size}`);
    assert.deepEqual(request.ids, rows.slice(0, cap).map(row => row.id));
    assert.equal(harness.observations.length, 7, "No companion count request or pagination");
  });
}

for (const countMetadata of ["missing", "unknown"] as const) {
  test(`${countMetadata} HTTP count metadata fails closed`, async () => {
    const harness = cappedRepository({ transactions: transactionRows(1), countMetadata });
    const result = (await harness.repository.loadFinanceData(owner)).transactions;
    assert.equal(result.status, "failure");
    if (result.status === "failure") assert.equal(result.error.details?.reason, "incomplete_collection");
  });
}

test("empty collections request exact counts; singleton succeeds without count", async () => {
  const harness = cappedRepository();
  const result = await harness.repository.loadFinanceData(owner);
  for (const [resource, value] of Object.entries(result)) {
    assert.equal(value.status, "success");
    if (value.status === "success") assert.deepEqual(value.data, resource === "accountBalanceSettings" ? null : []);
  }
  assert.equal(harness.observations.length, 7);
  for (const request of harness.observations) {
    assert.equal(request.method, "GET");
    assert.equal(request.prefer, request.url.pathname.endsWith("/account_balance_settings") ? null : "count=exact");
  }
});

test("null collection body fails even with exact zero", async () => {
  const harness = cappedRepository({ nullTransactions: true });
  assert.equal((await harness.repository.loadFinanceData(owner)).transactions.status, "failure");
});

test("query failure takes precedence over missing count and remains sanitized", async () => {
  const harness = cappedRepository({ failTable: "transactions", countMetadata: "missing" });
  const result = (await harness.repository.loadFinanceData(owner)).transactions;
  assert.equal(result.status, "failure");
  if (result.status === "failure") {
    assert.equal(result.error.code, "ownership_denied");
    assert.equal(result.error.message, "ownership_denied");
    assert.equal(result.error.details, undefined);
  }
});

test("completeness is checked before mapping invalid rows", async () => {
  const rows = transactionRows(5).map(row => ({ ...row, amount: -1 }));
  const result = (await cappedRepository({ transactions: rows }).repository.loadFinanceData(owner)).transactions;
  assert.equal(result.status, "failure");
  if (result.status === "failure") assert.equal(result.error.details?.reason, "incomplete_collection");
});

test("timestamp and ID tie breakers precede rejection of capped results", async () => {
  const rows = transactionRows(5).map(row => ({ ...row, date_iso: "2026-09-30" }));
  rows[4].created_at = "2026-09-02T10:00:00Z";
  const harness = cappedRepository({ transactions: rows.reverse() });
  assert.equal((await harness.repository.loadFinanceData(owner)).transactions.status, "failure");
  assert.deepEqual(harness.observations.find(row => row.url.pathname.endsWith("/transactions"))!.ids, ["t05", "t01", "t02", "t03"]);
});

test("a cap cutting August cannot become trusted data even with complete September", async () => {
  const rows = transactionRows(5);
  for (let index = 2; index < rows.length; index++) rows[index].date_iso = `2026-08-${30 - index}`;
  const harness = cappedRepository({ transactions: rows.reverse() });
  assert.equal((await harness.repository.loadFinanceData(owner)).transactions.status, "failure");
  const request = harness.observations.find(row => row.url.pathname.endsWith("/transactions"))!;
  assert.equal(request.dates.filter(date => date.startsWith("2026-09")).length, 2);
  assert.equal(request.dates.filter(date => date.startsWith("2026-08")).length, 2);
  assert.equal(rows.filter(row => row.date_iso.startsWith("2026-08")).length, 3);
});

test("budgets exhaust capped rows with unchanged projection and ordering", async () => {
  const harness = cappedRepository({ budgets: budgetRows(5).reverse() });
  const result = (await harness.repository.loadFinanceData(owner)).budgets;
  assert.equal(result.status, "success");
  if (result.status === "success") assert.equal(result.data.length, 5);
  assert.equal(harness.observations.filter(row => row.url.pathname.endsWith("/budgets")).length, 2);
  const request = harness.observations.find(row => row.url.pathname.endsWith("/budgets"))!;
  assert.equal(request.url.searchParams.get("select"), budgetProjection);
  assert.equal(request.url.searchParams.get("order"), "month.desc,created_at.desc,id.asc");
  assert.equal(request.range, "0-3/5");
});

test("hydration retains complete snapshots on failure and becomes ready after recovery", async () => {
  const complete = await cappedRepository({ transactions: transactionRows(3) }).repository.loadFinanceData(owner);
  const previous = mergeFinanceLoadResult(createEmptyFinanceData(), complete);
  const ready = settleFinanceResourceStatuses(createFinanceResourceStatuses(), previous.errors);
  const partial = await cappedRepository({ transactions: transactionRows(5) }).repository.loadFinanceData(owner);
  const failed = mergeFinanceLoadResult(previous.data, partial);
  assert.equal(failed.data.transactions, previous.data.transactions);
  const statuses = settleFinanceResourceStatuses(beginFinanceResourceHydration(ready), failed.errors);
  assert.equal(statuses.transactions.status, "error");
  assert.equal(statuses.transactions.hasSnapshot, true);
  const initial = mergeFinanceLoadResult(createEmptyFinanceData(), partial);
  const initialStatuses = settleFinanceResourceStatuses(createFinanceResourceStatuses(), initial.errors);
  assert.equal(initialStatuses.transactions.status, "error");
  assert.equal(initialStatuses.transactions.hasSnapshot, false);
  const recovery = mergeFinanceLoadResult(failed.data, complete);
  assert.equal(settleFinanceResourceStatuses(beginFinanceResourceHydration(statuses), recovery.errors).transactions.status, "ready");
});
