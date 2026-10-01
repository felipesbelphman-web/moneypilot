import assert from "node:assert/strict";
import test from "node:test";
import { retrieveFinanceCollection, financeCollectionPaginationDefaults } from "../../src/lib/persistence/finance-collection-pagination.ts";
import { FinanceError } from "../../src/lib/domain/finance-error.ts";
import { paginatedSdkHarness, owner, cap } from "./finance-completeness-http-harness.mts";

const rows = (count: number) => Array.from({ length: count }, (_, i) => ({
  id: String(i + 1).padStart(3, "0"), user_id: owner, date_iso: "2026-09-01", created_at: "2026-09-01T00:00:00Z", amount: i + 1,
}));
type Row = ReturnType<typeof rows>[number];
const identity = (row: Row) => row.id;
const incomplete = (error: unknown) => error instanceof FinanceError && error.code === "repository_unavailable" && error.details?.reason === "incomplete_collection";

for (const size of [cap - 1, cap, cap + 1, 2 * cap + 1, 3 * cap + 1]) {
  test(`exhaustive SDK retrieval: ${size} rows with cap ${cap}`, async () => {
    const source = rows(size);
    const harness = paginatedSdkHarness({ rows: [...source].reverse().concat({ ...source[0], user_id: "foreign", id: "000" }) });
    const result = await retrieveFinanceCollection({ fetchPage: harness.fetchPage, identity, pageSize: cap });
    assert.deepEqual(result, source);
    assert.deepEqual(harness.requests.map(request => request.from), Array.from({ length: Math.ceil(size / cap) }, (_, i) => i * cap));
    assert.ok(harness.requests.every(request => request.limit === cap));
  });
}

test("server cap below requested size advances by actual rows, preserving order", async () => {
  const harness = paginatedSdkHarness({ rows: rows(9), serverCap: 2 });
  assert.deepEqual(await retrieveFinanceCollection({ fetchPage: harness.fetchPage, identity, pageSize: 7 }), rows(9));
  assert.deepEqual(harness.requests.map(request => request.from), [0, 2, 4, 6, 8]);
  assert.ok(harness.requests.every(request => request.limit === 7));
});

test("successful empty retrieval stops after one GET", async () => {
  const harness = paginatedSdkHarness({ rows: rows(0) });
  assert.deepEqual(await retrieveFinanceCollection({ fetchPage: harness.fetchPage, identity }), []);
  assert.equal(harness.requests.length, 1);
});

for (const failurePage of [2, 3]) {
  test(`page ${failurePage} failure rejects without publishing accumulated rows`, async () => {
    const harness = paginatedSdkHarness({ rows: rows(9), beforePage: call => call === failurePage ? { status: 400 } : undefined });
    let published = false;
    await assert.rejects(retrieveFinanceCollection({ fetchPage: harness.fetchPage, identity, pageSize: 4 }).then(value => { published = true; return value; }),
      error => error instanceof FinanceError && error.code === "ownership_denied" && error.message === "ownership_denied");
    assert.equal(published, false);
    assert.equal(harness.requests.length, failurePage);
  });
}

for (const totalHeader of [null, "*", "invalid", "-1", "9007199254740992"]) {
  test(`SDK count metadata ${String(totalHeader)} fails closed`, async () => {
    const harness = paginatedSdkHarness({ rows: rows(1), beforePage: () => ({ totalHeader }) });
    await assert.rejects(retrieveFinanceCollection({ fetchPage: harness.fetchPage, identity }), incomplete);
  });
}

for (const count of [undefined, null, NaN, 0.5, Infinity]) {
  test(`direct callback count ${String(count)} is rejected`, async () => {
    await assert.rejects(retrieveFinanceCollection({
      fetchPage: async () => ({ data: rows(1), count: count as number | null, error: null }), identity,
    }), incomplete);
  });
}

for (const key of [undefined, null, "", "   ", 3]) {
  test(`invalid identity ${String(key)} is rejected`, async () => {
    const harness = paginatedSdkHarness({ rows: rows(1) });
    await assert.rejects(retrieveFinanceCollection({ fetchPage: harness.fetchPage, identity: () => key as string }), incomplete);
  });
}

for (const [table, key] of [["budget_adjustments", "month"], ["goal_contribution_plans", "goal_id"]] as const) {
  test(`${key} identity is supported without resource coupling`, async () => {
    const source = Array.from({ length: 5 }, (_, i) => ({ [key]: key === "month" ? `2026-0${i + 1}` : `goal-${i}`, user_id: owner }));
    const harness = paginatedSdkHarness({ rows: source, table, order: key, projection: `${key},user_id` });
    assert.deepEqual(await retrieveFinanceCollection({ fetchPage: harness.fetchPage, identity: row => row[key], pageSize: 4 }), source);
  });
}

test("premature empty page rejects missing coverage", async () => {
  const harness = paginatedSdkHarness({ rows: rows(9), beforePage: call => call === 2 ? { body: [] } : undefined });
  await assert.rejects(retrieveFinanceCollection({ fetchPage: harness.fetchPage, identity, pageSize: 4 }), incomplete);
});

for (const [label, body, page] of [
  ["duplicate within page", [rows(1)[0], rows(1)[0]], 1],
  ["overlap across pages", rows(4), 2],
  ["skipped page with premature exhaustion", [], 2],
] as const) {
  test(label, async () => {
    const harness = paginatedSdkHarness({ rows: rows(9), beforePage: call => call === page ? { body } : undefined });
    await assert.rejects(retrieveFinanceCollection({ fetchPage: harness.fetchPage, identity, pageSize: 4 }), incomplete);
  });
}

test("accumulation exceeding N fails rather than returning extra rows", async () => {
  const harness = paginatedSdkHarness({ rows: rows(8), beforePage: () => ({ totalHeader: "5" }) });
  await assert.rejects(retrieveFinanceCollection({ fetchPage: harness.fetchPage, identity, pageSize: 4 }), incomplete);
});

for (const mutation of ["insert", "delete"] as const) {
  test(`${mutation} before a later boundary changes count and restarts from zero`, async () => {
    const original = rows(9);
    const changed = mutation === "insert" ? [{ ...original[0], id: "000" }, ...original] : original.slice(1);
    const harness = paginatedSdkHarness({ rows: original, beforePage: call => call >= 2 ? { rows: changed } : undefined });
    assert.deepEqual(await retrieveFinanceCollection({ fetchPage: harness.fetchPage, identity, pageSize: 4 }), changed);
    assert.deepEqual(harness.requests.slice(0, 3).map(request => request.from), [0, 4, 0]);
  });
}

test("repeated count drift fails after one restart", async () => {
  const harness = paginatedSdkHarness({ rows: rows(9), beforePage: call => ({ rows: rows(call === 1 ? 9 : call < 4 ? 10 : 11) }) });
  await assert.rejects(retrieveFinanceCollection({ fetchPage: harness.fetchPage, identity, pageSize: 4 }), incomplete);
  assert.deepEqual(harness.requests.map(request => request.from), [0, 4, 0, 4]);
});

test("count drift fails immediately when restarts are disabled", async () => {
  const harness = paginatedSdkHarness({ rows: rows(9), beforePage: call => call > 1 ? { rows: rows(10) } : undefined });
  await assert.rejects(retrieveFinanceCollection({ fetchPage: harness.fetchPage, identity, pageSize: 4, maxRestarts: 0 }), incomplete);
  assert.equal(harness.requests.length, 2);
});

test("same-count membership replacement can escape detection; success is NOT snapshot consistency", async () => {
  const original = rows(5);
  const changed = [...original.slice(0, 4), { ...original[4], id: "006" }];
  const harness = paginatedSdkHarness({ rows: original, beforePage: call => call > 1 ? { rows: changed } : undefined });
  const result = await retrieveFinanceCollection({ fetchPage: harness.fetchPage, identity, pageSize: 4 });
  assert.deepEqual(result.map(row => row.id), ["001", "002", "003", "004", "006"]);
  assert.notDeepEqual(result, original);
});

test("value edits without count/identity changes can produce an undetectable mixed-version result", async () => {
  const original = rows(5);
  const changed = original.map(row => ({ ...row, amount: 100 }));
  const harness = paginatedSdkHarness({ rows: original, beforePage: call => call > 1 ? { rows: changed } : undefined });
  const result = await retrieveFinanceCollection({ fetchPage: harness.fetchPage, identity, pageSize: 4 });
  assert.deepEqual(result.map(row => row.amount), [1, 2, 3, 4, 100]);
  assert.notDeepEqual(result, original);
  assert.notDeepEqual(result, changed);
});

test("page budget includes discarded restart pages", async () => {
  const harness = paginatedSdkHarness({ rows: rows(9), beforePage: call => call > 1 ? { rows: rows(10) } : undefined });
  await assert.rejects(retrieveFinanceCollection({ fetchPage: harness.fetchPage, identity, pageSize: 4, maxPages: 2 }), incomplete);
  assert.equal(harness.requests.length, 2);
});

test("row safety limit rejects an oversized count before accumulating", async () => {
  const harness = paginatedSdkHarness({ rows: rows(9) });
  await assert.rejects(retrieveFinanceCollection({ fetchPage: harness.fetchPage, identity, maxRows: 8 }), incomplete);
  assert.equal(harness.requests.length, 1);
});

test("defaults are explicit application protections", () => {
  assert.deepEqual(financeCollectionPaginationDefaults, { pageSize: 200, maxPages: 500, maxRows: 100000, maxRestarts: 1 });
});

test("pre-aborted cancellation sends no request", async () => {
  const harness = paginatedSdkHarness({ rows: rows(5) });
  const controller = new AbortController();
  controller.abort("private cancellation reason");
  await assert.rejects(retrieveFinanceCollection({ fetchPage: harness.fetchPage, identity, signal: controller.signal }),
    error => error instanceof FinanceError && error.message === "repository_unavailable");
  assert.equal(harness.requests.length, 0);
});

test("in-flight cancellation rejects even if fetch callback ignores signal", async () => {
  const controller = new AbortController();
  let enter!: () => void;
  const entered = new Promise<void>(resolve => { enter = resolve; });
  const result = retrieveFinanceCollection<Row>({ identity, signal: controller.signal, fetchPage: () => {
    enter();
    return new Promise(() => {});
  } });
  const rejected = assert.rejects(result, error => error instanceof FinanceError && error.code === "repository_unavailable");
  await entered;
  controller.abort();
  await rejected;
});

test("pages are sequential and partial rows are not published while waiting", async () => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let enter!: () => void;
  const entered = new Promise<void>(resolve => { enter = resolve; });
  let calls = 0;
  let published = false;
  const harness = paginatedSdkHarness({ rows: rows(5) });
  const pending = retrieveFinanceCollection({ identity, pageSize: 4, fetchPage: async request => {
    calls++;
    if (calls === 1) { enter(); await gate; }
    return harness.fetchPage(request);
  } }).then(result => { published = true; return result; });
  await entered;
  assert.equal(calls, 1);
  assert.equal(published, false);
  release();
  assert.deepEqual(await pending, rows(5));
  assert.equal(calls, 2);
});

for (const data of [null, undefined, {}]) {
  test(`invalid page body ${JSON.stringify(data)} fails closed`, async () => {
    await assert.rejects(retrieveFinanceCollection<Row>({ identity,
      fetchPage: async () => ({ data: data as Row[] | null, count: 0, error: null }),
    }), incomplete);
  });
}

test("invalid safety options fail before any query", async () => {
  const harness = paginatedSdkHarness({ rows: rows(5) });
  for (const options of [{ pageSize: 0 }, { maxPages: -1 }, { maxRows: 0.5 }, { maxRestarts: 2 as 1 }]) {
    await assert.rejects(retrieveFinanceCollection({ fetchPage: harness.fetchPage, identity, ...options }), incomplete);
  }
  assert.equal(harness.requests.length, 0);
});
