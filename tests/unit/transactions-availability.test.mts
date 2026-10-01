import assert from "node:assert/strict";
import test from "node:test";
import { availabilityHarness, financeData, readyStatuses, transaction, withStatus } from "./finance-availability-render-harness.mts";

const page = "src/app/transactions/page.tsx";
for (const status of ["loading", "error", "unavailable"] as const) {
  for (const retained of [false, true]) test(`Transactions ${status}, retained=${retained}: both layouts hide totals, rows, counts and selection`, () => {
    const data = financeData(); data.transactions = retained ? Array.from({ length: 17 }, (_, i) => transaction({ id: String(i) })) : [];
    data.resourceStatuses = withStatus("transactions", status, retained);
    const harness = availabilityHarness(data);
    const html = harness.render(page);
    assert.ok(!harness.calls.includes("calculateTransactionKpiAggregates"));
    assert.doesNotMatch(html, /Trusted grocery|EUR 340|No transactions in|type="checkbox"|aria-label="Pagination"|17 results/);
    assert.match(html, /data-mobile-transaction-cards/);
    assert.match(html, /data-transactions-table/);
    const message = status === "loading" ? "Loading transactions" : "Unable to load transactions";
    assert.ok(html.split(message).length >= 11, "Both lists and all eight KPI cards show unavailable feedback");
    assert.match(html, /not enough data yet to estimate the impact/);
  });
}

test("unavailable transaction arrays are not inspected by page filtering or KPIs", () => {
  const data = financeData(); data.resourceStatuses = withStatus("transactions", "error", true);
  data.transactions = new Proxy(data.transactions, { get() { throw new Error("Unavailable transactions read"); } });
  assert.doesNotThrow(() => availabilityHarness(data).render(page));
});

test("ready empty transactions render valid zero and empty presentation on both layouts", () => {
  const data = financeData(); data.transactions = [];
  const harness = availabilityHarness(data); const html = harness.render(page);
  assert.equal(harness.calls.filter(name => name === "calculateTransactionKpiAggregates").length, 1);
  assert.match(html, /EUR 0\.00/);
  assert.ok((html.match(/No transactions/gi) ?? []).length >= 2);
  assert.doesNotMatch(html, /Unable to load transactions|Loading transactions/);
});

test("unrelated failures do not block transactions; goals only gate their decision card", () => {
  for (const resource of ["goals", "budgets", "budgetAdjustments", "goalContributionPlans", "categories", "investments", "accountBalanceSettings"] as const) {
    const data = financeData(); data.resourceStatuses = withStatus(resource, "error"); data.hydrationError = new Error("unrelated"); data.isHydrating = true;
    const html = availabilityHarness(data).render(page);
    assert.match(html, /Trusted grocery/); assert.match(html, /EUR 20\.00/);
    assert.doesNotMatch(html, /Unable to load transactions|Loading transactions/);
    if (resource === "goals") assert.match(html, /Unable to load the data for this analysis/);
  }
});

test("goal absence is only presented after goals are ready", () => {
  const data = financeData(); data.goals = [];
  const harness = availabilityHarness(data);
  for (const status of ["loading", "error", "unavailable"] as const) {
    data.resourceStatuses = withStatus("goals", status);
    assert.doesNotMatch(harness.render(page), /No goals created/);
  }
  data.resourceStatuses = withStatus("transactions", "error");
  assert.match(harness.render(page), /No goals created/);
});

test("failed refresh hides retained rows and recovery restores both layouts", () => {
  const harness = availabilityHarness(); const ready = harness.render(page);
  harness.data.resourceStatuses = withStatus("transactions", "loading", true);
  assert.doesNotMatch(harness.render(page), /Trusted grocery/);
  harness.data.resourceStatuses = withStatus("transactions", "error", true);
  assert.doesNotMatch(harness.render(page), /Trusted grocery/);
  harness.data.resourceStatuses = readyStatuses();
  assert.equal(harness.render(page), ready);
});
