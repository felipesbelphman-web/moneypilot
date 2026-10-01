import assert from "node:assert/strict";
import test from "node:test";
import { cappedRepository, owner, transactionRows, transactionProjection } from "./finance-completeness-http-harness.mts";
import { requireCompletePeriodResult, type TransactionDateRange } from "../../src/lib/persistence/finance-query-contracts.ts";
import { FinanceError } from "../../src/lib/domain/finance-error.ts";

const september = { startISO: "2026-09-01", endExclusiveISO: "2026-10-01" };
const august = { startISO: "2026-08-01", endExclusiveISO: "2026-09-01" };
const incomplete = (error: unknown) => error instanceof FinanceError && error.code === "repository_unavailable" && error.details?.reason === "incomplete_collection";

for (const size of [0, 3, 4, 5, 9]) {
  test(`bounded period returns ${size} complete mapped rows using exact-count pages`, async () => {
    const rows = transactionRows(size);
    const foreign = { ...transactionRows(1)[0], user_id: "foreign", id: "foreign" };
    const h = cappedRepository({ transactions: [...rows].reverse().concat(foreign) });
    const result = await h.repository.listTransactionsForPeriod(owner, september);
    assert.equal(result.completeness, "complete");
    assert.deepEqual(result.range, september);
    assert.deepEqual(result.items.map(row => row.id), rows.map(row => row.id));
    assert.equal(requireCompletePeriodResult(result, september), result);
    for (const row of result.items) {
      assert.equal(row.amount, 10);
      assert.equal(row.categoryColor, "#123456");
      assert.equal("user_id" in row, false);
    }
    assert.deepEqual(h.observations.map(row => row.from), size > 8 ? [0, 4, 8] : size > 4 ? [0, 4] : [0]);
    for (const request of h.observations) {
      assert.equal(request.url.pathname, "/rest/v1/transactions");
      assert.equal(request.method, "GET");
      assert.equal(request.prefer, "count=exact");
      assert.equal(request.url.searchParams.get("limit"), "200");
      assert.equal(request.url.searchParams.get("user_id"), `eq.${owner}`);
      assert.equal(request.url.searchParams.get("select"), transactionProjection);
      assert.equal(request.url.searchParams.get("order"), "date_iso.desc,created_at.desc,id.asc");
      assert.deepEqual(request.url.searchParams.getAll("date_iso"), ["gte.2026-09-01", "lt.2026-10-01"]);
    }
  });
}

for (const [startISO, lastDay, endExclusiveISO, before] of [
  ["2026-09-01", "2026-09-30", "2026-10-01", "2026-08-31"],
  ["2028-02-01", "2028-02-29", "2028-03-01", "2028-01-31"],
  ["2026-12-01", "2026-12-31", "2027-01-01", "2026-11-30"],
]) {
  test(`${startISO}: start and last day included, neighboring periods excluded`, async () => {
    const rows = transactionRows(4).map((row, i) => ({ ...row, date_iso: [startISO, lastDay, endExclusiveISO, before][i] }));
    const h = cappedRepository({ transactions: rows });
    const result = await h.repository.listTransactionsForPeriod(owner, { startISO, endExclusiveISO });
    assert.deepEqual(result.items.map(row => row.dateISO), [lastDay, startISO]);
    assert.equal(h.observations[0].total, 2);
  });
}

for (const range of [
  { startISO: "2026-02-29", endExclusiveISO: "2026-03-01" },
  { startISO: "2026-09-01", endExclusiveISO: "2026-09-31" },
  { startISO: "2026-9-01", endExclusiveISO: "2026-10-01" },
  { startISO: " 2026-09-01", endExclusiveISO: "2026-10-01" },
  { startISO: "2026-09-01T00:00:00Z", endExclusiveISO: "2026-10-01" },
  { startISO: "2026-09-01", endExclusiveISO: "2026-09-01" },
  { startISO: "2026-10-01", endExclusiveISO: "2026-09-01" },
  { startISO: "0000-01-01", endExclusiveISO: "0000-02-01" },
  { startISO: "0099-01-01", endExclusiveISO: "0099-02-01" },
  { startISO: null, endExclusiveISO: "2026-10-01" },
  undefined,
]) {
  test(`invalid range ${JSON.stringify(range)} rejects before querying`, async () => {
    const h = cappedRepository();
    await assert.rejects(h.repository.listTransactionsForPeriod(owner, range as TransactionDateRange), error => error instanceof FinanceError && error.code === "validation_error");
    assert.equal(h.observations.length, 0);
  });
}

test("caller range mutation cannot alter query filters or returned coverage", async () => {
  const range = { ...september };
  const h = cappedRepository({ transactions: transactionRows(5), beforePage: () => { Object.assign(range, august); return undefined; } });
  const result = await h.repository.listTransactionsForPeriod(owner, range);
  assert.deepEqual(range, august);
  assert.deepEqual(result.range, september);
  assert.notEqual(result.range, range);
  for (const request of h.observations) assert.deepEqual(request.url.searchParams.getAll("date_iso"), ["gte.2026-09-01", "lt.2026-10-01"]);
});

test("same date preserves created_at descending and id ascending across pages", async () => {
  const rows = transactionRows(5).map(row => ({ ...row, date_iso: "2026-09-15" }));
  rows[4].created_at = "2026-09-02T10:00:00Z";
  const h = cappedRepository({ transactions: rows.reverse() });
  const result = await h.repository.listTransactionsForPeriod(owner, september);
  assert.deepEqual(result.items.map(row => row.id), ["t05", "t01", "t02", "t03", "t04"]);
});

for (const countMetadata of ["missing", "unknown"] as const) {
  test(`${countMetadata} count rejects without period result`, async () => {
    const h = cappedRepository({ transactions: transactionRows(1), countMetadata });
    await assert.rejects(h.repository.listTransactionsForPeriod(owner, september), incomplete);
  });
}

for (const failurePage of [2, 3]) {
  test(`failure on page ${failurePage} publishes no period data`, async () => {
    const h = cappedRepository({ transactions: transactionRows(9), beforePage: (_table, call) => call === failurePage ? { fail: true } : undefined });
    let published = false;
    await assert.rejects(h.repository.listTransactionsForPeriod(owner, september).then(value => { published = true; return value; }), error => error instanceof FinanceError && error.message === "ownership_denied");
    assert.equal(published, false);
  });
}

test("bounded count drift restarts with the same scope; repeated drift fails", async () => {
  const h = cappedRepository({ transactions: transactionRows(5), beforePage: (_table, call) => call > 1 ? { rows: transactionRows(6) } : undefined });
  assert.equal((await h.repository.listTransactionsForPeriod(owner, september)).items.length, 6);
  assert.deepEqual(h.observations.map(row => row.from), [0, 4, 0, 4]);
  for (const request of h.observations) assert.deepEqual(request.url.searchParams.getAll("date_iso"), ["gte.2026-09-01", "lt.2026-10-01"]);
  const unstable = cappedRepository({ beforePage: (_table, call) => ({ rows: transactionRows(call === 1 ? 5 : call < 4 ? 6 : 7) }) });
  await assert.rejects(unstable.repository.listTransactionsForPeriod(owner, september), incomplete);
});

test("duplicate transaction identity rejects assembled period", async () => {
  const rows = transactionRows(5);
  rows[4].id = rows[0].id;
  const h = cappedRepository({ transactions: rows });
  await assert.rejects(h.repository.listTransactionsForPeriod(owner, september), incomplete);
});

for (const date of ["2026-08-31", "2026-10-01"]) {
  test(`unexpected returned row ${date} fails after mapping`, async () => {
    const rows = transactionRows(1);
    const h = cappedRepository({ transactions: rows, beforePage: () => ({ body: [{ ...rows[0], date_iso: date }] }) });
    await assert.rejects(h.repository.listTransactionsForPeriod(owner, september), incomplete);
  });
}

test("existing mapper rejects invalid rows after complete bounded retrieval", async () => {
  const rows = transactionRows(1).map(row => ({ ...row, date_iso: "2026-09-31" }));
  const h = cappedRepository({ transactions: rows });
  await assert.rejects(h.repository.listTransactionsForPeriod(owner, september), error => error instanceof FinanceError && error.code === "validation_error");
});

for (const [failCurrent, failPrevious] of [[false, true], [true, false], [false, false], [true, true]]) {
  test(`independent periods: current failed=${failCurrent}, previous failed=${failPrevious}`, async () => {
    const source = transactionRows(2).map((row, i) => ({ ...row, date_iso: i ? "2026-08-15" : "2026-09-15" }));
    let failing = true;
    const h = cappedRepository({ transactions: source, beforePage: (_table, _call, _from, url) => {
      const current = url.searchParams.getAll("date_iso").includes("gte.2026-09-01");
      return failing && (current ? failCurrent : failPrevious) ? { fail: true } : undefined;
    } });
    const outcomes = await Promise.allSettled([
      h.repository.listTransactionsForPeriod(owner, september), h.repository.listTransactionsForPeriod(owner, august),
    ]);
    assert.equal(outcomes[0].status, failCurrent ? "rejected" : "fulfilled");
    assert.equal(outcomes[1].status, failPrevious ? "rejected" : "fulfilled");
    for (const [index, scope] of [september, august].entries()) {
      const outcome = outcomes[index];
      if (outcome.status === "fulfilled") {
        assert.equal(requireCompletePeriodResult(outcome.value, scope), outcome.value);
        assert.throws(() => requireCompletePeriodResult(outcome.value, index === 0 ? august : september), FinanceError);
      }
    }
    // Recover only rejected requests. Existing successful results retain identity.
    failing = false;
    const recovered = [...outcomes];
    for (const [index, scope] of [september, august].entries()) {
      if (outcomes[index].status === "rejected") recovered[index] = { status: "fulfilled", value: await h.repository.listTransactionsForPeriod(owner, scope) };
      else assert.equal(recovered[index], outcomes[index]);
      assert.equal(recovered[index].status, "fulfilled");
    }
  });
}

test("global transaction read stays unbounded single-response and fail-closed", async () => {
  const h = cappedRepository({ transactions: transactionRows(5) });
  assert.equal((await h.repository.loadFinanceData(owner)).transactions.status, "failure");
  const requests = h.observations.filter(row => row.url.pathname.endsWith("/transactions"));
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url.searchParams.has("date_iso"), false);
  assert.equal(requests[0].url.searchParams.has("offset"), false);
  assert.equal(requests[0].url.searchParams.has("limit"), false);
  assert.equal(requests[0].url.searchParams.get("order"), "date_iso.desc,created_at.desc,id.asc");
  assert.equal(requests[0].url.searchParams.get("select"), transactionProjection);
});
