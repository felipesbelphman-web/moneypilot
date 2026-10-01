import assert from "node:assert/strict";
import test from "node:test";
import { cappedRepository, owner, transactionRows } from "./finance-completeness-http-harness.mts";
import { createEmptyFinanceData, mergeFinanceLoadResult, mergeCategoryLoadResult, settleCategoryLoader } from "../../src/lib/persistence/finance-hydration.ts";
import { createFinanceResourceStatuses, beginFinanceResourceHydration, settleFinanceResourceStatuses } from "../../src/lib/persistence/finance-resource-status.ts";
import { FinanceError } from "../../src/lib/domain/finance-error.ts";
const projections = await import("../../src/lib/persistence/supabase-finance-repository.ts");
const { categoryProjection } = await import("../../src/lib/persistence/supabase-category-repository.ts");

const cases = [
  { resource: "budgets", table: "budgets", key: "id", domainKey: "id", projection: projections.budgetProjection, order: "month.desc,created_at.desc,id.asc", field: "budget", value: 12.3456 },
  { resource: "budgetAdjustments", table: "budget_adjustments", key: "month", domainKey: "month", projection: projections.budgetAdjustmentProjection, order: "month.desc", field: "baselineProjectedTotal", value: 12.3456 },
  { resource: "goals", table: "goals", key: "id", domainKey: "id", projection: projections.goalProjection, order: "target_date.asc,created_at.asc,id.asc", field: "targetAmount", value: 12.3456 },
  { resource: "goalContributionPlans", table: "goal_contribution_plans", key: "goal_id", domainKey: "goalId", projection: projections.goalContributionPlanProjection, order: "goal_id.asc", field: "baselineRequiredMonthlyContribution", value: 12.3456 },
  { resource: "investments", table: "investments", key: "id", domainKey: "id", projection: projections.investmentProjection, order: "created_at.asc,id.asc", field: "quantity", value: 2.1234 },
] as const;
type Case = typeof cases[number];
const timestamps = { created_at: "2026-09-01T00:00:00Z", updated_at: "2026-09-01T00:00:00Z" };
function fixtures(item: Case, count: number): Record<string, unknown>[] {
  return Array.from({ length: count }, (_, i) => {
    const base = { ...timestamps, user_id: owner, id: `row-${i + 1}`, month: `2026-${String(i + 1).padStart(2, "0")}` };
    switch (item.resource) {
      case "budgets": return { ...base, category: "Food", subtitle: "Synthetic", budget: 12.3456, color: "#123456" };
      case "budgetAdjustments": return { ...base, target_remaining_spend: 0, baseline_projected_total: 12.3456, adjustment_needed: 0, suggested_weekly_reduction: 0 };
      case "goals": return { ...base, name: "Synthetic", target_amount: 12.3456, saved_amount: 0, target_date: "2027-12", priority: "primary" };
      case "goalContributionPlans": return { ...base, goal_id: `goal-${i + 1}`, monthly_target: 0, baseline_required_monthly_contribution: 12.3456, savings_boost: 0 };
      case "investments": return { ...base, name: "Synthetic", symbol: null, asset_type: "etf", quantity: 2.1234, average_purchase_price: 12.3456, price_mode: "automatic", manual_current_price: null, market_asset_key: "synthetic", native_currency: "EUR" };
    }
  });
}

for (const item of cases) {
  for (const size of [0, 3, 9]) {
    test(`${item.resource}: ${size} rows retain mapping, scope and order through real SDK pages`, async () => {
      const source = fixtures(item, size);
      const input = source.length ? [...source].reverse().concat({ ...source[0], user_id: "foreign" }) : [];
      const h = cappedRepository({ collections: { [item.table]: input } });
      const result = (await h.repository.loadFinanceData(owner))[item.resource];
      assert.equal(result.status, "success");
      if (result.status !== "success") assert.fail("Expected complete resource");
      assert.equal(result.data.length, size);
      const expected = item.resource === "budgets" || item.resource === "budgetAdjustments" ? [...source].reverse() : source;
      assert.deepEqual(result.data.map(row => Reflect.get(row, item.domainKey)), expected.map(row => row[item.key]));
      for (const row of result.data) assert.equal(Reflect.get(row, item.field), item.value);
      const requests = h.observations.filter(request => request.url.pathname.endsWith(`/${item.table}`));
      assert.deepEqual(requests.map(request => request.from), size === 9 ? [0, 4, 8] : [0]);
      for (const request of requests) {
        assert.equal(request.method, "GET");
        assert.equal(request.prefer, "count=exact");
        assert.equal(request.url.searchParams.get("limit"), "200");
        assert.equal(request.url.searchParams.get("select"), item.projection);
        assert.equal(request.url.searchParams.get("order"), item.order);
        assert.equal(request.url.searchParams.get("user_id"), `eq.${owner}`);
      }
    });
  }

  test(`${item.resource}: duplicate ${item.key} fails instead of publishing partial rows`, async () => {
    const source = fixtures(item, 5);
    source[4][item.key] = source[0][item.key];
    const h = cappedRepository({ collections: { [item.table]: source } });
    const result = (await h.repository.loadFinanceData(owner))[item.resource];
    assert.equal(result.status, "failure");
    if (result.status === "failure") assert.equal(result.error.details?.reason, "incomplete_collection");
    assert.equal("data" in result, false);
  });

  test(`${item.resource}: middle-page query failure is sanitized and yields no data`, async () => {
    const h = cappedRepository({ collections: { [item.table]: fixtures(item, 9) }, beforePage: (table, call) => table === item.table && call === 2 ? { fail: true } : undefined });
    const result = (await h.repository.loadFinanceData(owner))[item.resource];
    assert.equal(result.status, "failure");
    if (result.status === "failure") assert.equal(result.error.message, "ownership_denied");
    assert.equal("data" in result, false);
  });
}

test("budgets restart after count drift and reject repeated instability", async () => {
  const item = cases[0];
  const original = fixtures(item, 5);
  const changed = fixtures(item, 6);
  const h = cappedRepository({ collections: { budgets: original }, beforePage: (table, call) => table === "budgets" && call > 1 ? { rows: changed } : undefined });
  const success = (await h.repository.loadFinanceData(owner)).budgets;
  assert.equal(success.status, "success");
  if (success.status === "success") assert.equal(success.data.length, 6);
  assert.deepEqual(h.observations.filter(row => row.url.pathname.endsWith("/budgets")).map(row => row.from), [0, 4, 0, 4]);
  const unstable = cappedRepository({ collections: { budgets: original }, beforePage: (table, call) => table === "budgets" ? { rows: fixtures(item, call === 1 ? 5 : call < 4 ? 6 : 7) } : undefined });
  const failed = (await unstable.repository.loadFinanceData(owner)).budgets;
  assert.equal(failed.status, "failure");
  if (failed.status === "failure") assert.equal(failed.error.details?.reason, "incomplete_collection");
});

test("budget count mismatch with premature exhaustion fails closed", async () => {
  const h = cappedRepository({ collections: { budgets: fixtures(cases[0], 5) }, beforePage: table => table === "budgets" ? { count: 6 } : undefined });
  assert.equal((await h.repository.loadFinanceData(owner)).budgets.status, "failure");
});

function categories() {
  return Array.from({ length: 11 }, (_, i) => ({ ...timestamps, id: `cat-${String(i).padStart(2, "0")}`, user_id: owner,
    name: `Category ${i}`, normalized_name: `category ${String(i).padStart(2, "0")}`, type: "expense", icon_key: "shopping_cart", color_token: "green-500", archived_at: i >= 9 ? "2026-09-02T00:00:00Z" : null }));
}
for (const method of ["listCategories", "listAllCategories"] as const) {
  test(`${method}: multi-page filter, ordering, owner and mapping are preserved`, async () => {
    const source = categories();
    const h = cappedRepository({ collections: { categories: [...source].reverse().concat({ ...source[0], user_id: "foreign" }) } });
    const result = await h.categoryRepository[method]();
    assert.deepEqual(result.map(row => row.id), source.slice(0, method === "listCategories" ? 9 : 11).map(row => row.id));
    assert.equal(result[0].colorToken, "green-500");
    assert.equal(result[0].userId, owner);
    assert.equal(result.filter(row => row.archivedAt !== null).length, method === "listCategories" ? 0 : 2);
    assert.deepEqual(h.observations.map(row => row.from), [0, 4, 8]);
    for (const request of h.observations) {
      assert.equal(request.url.searchParams.get("select"), categoryProjection);
      assert.equal(request.url.searchParams.get("order"), "type.asc,normalized_name.asc,id.asc");
      assert.equal(request.url.searchParams.get("archived_at"), method === "listCategories" ? "is.null" : null);
      assert.equal(request.url.searchParams.get("user_id"), `eq.${owner}`);
      assert.equal(request.prefer, "count=exact");
    }
  });

  test(`${method}: later failure retains old categories as unavailable until recovery`, async () => {
    const h = cappedRepository({ collections: { categories: categories() } });
    const complete = await settleCategoryLoader(() => h.categoryRepository[method]());
    const previous = mergeCategoryLoadResult([], complete);
    const bad = cappedRepository({ collections: { categories: categories() }, beforePage: (_table, call) => call === 2 ? { fail: true } : undefined });
    const failure = await settleCategoryLoader(() => bad.categoryRepository[method]());
    assert.equal(failure.status, "failure");
    const retained = mergeCategoryLoadResult(previous.categories, failure);
    assert.equal(retained.categories, previous.categories);
    assert.ok(retained.error);
    const ready = settleFinanceResourceStatuses(createFinanceResourceStatuses(), {});
    const failed = settleFinanceResourceStatuses(beginFinanceResourceHydration(ready), { categories: retained.error });
    assert.equal(failed.categories.status, "error");
    assert.equal(failed.categories.hasSnapshot, true);
    const recovered = mergeCategoryLoadResult(retained.categories, complete);
    assert.equal(recovered.error, null);
    assert.equal(settleFinanceResourceStatuses(beginFinanceResourceHydration(failed), {}).categories.status, "ready");
  });

  test(`${method}: duplicate identity fails`, async () => {
    const source = categories();
    source[4].id = source[0].id;
    const h = cappedRepository({ collections: { categories: source } });
    await assert.rejects(h.categoryRepository[method](), error => error instanceof FinanceError && error.details?.reason === "incomplete_collection");
  });
}

test("exhaustive budget hydration retains old data on failure and recovers to ready", async () => {
  const complete = await cappedRepository({ collections: { budgets: fixtures(cases[0], 5) } }).repository.loadFinanceData(owner);
  const old = mergeFinanceLoadResult(createEmptyFinanceData(), complete);
  const ready = settleFinanceResourceStatuses(createFinanceResourceStatuses(), old.errors);
  const failure = await cappedRepository({ collections: { budgets: fixtures(cases[0], 9) }, beforePage: (table, call) => table === "budgets" && call === 2 ? { fail: true } : undefined }).repository.loadFinanceData(owner);
  const retained = mergeFinanceLoadResult(old.data, failure);
  assert.equal(retained.data.budgets, old.data.budgets);
  const failed = settleFinanceResourceStatuses(beginFinanceResourceHydration(ready), retained.errors);
  assert.equal(failed.budgets.status, "error");
  assert.equal(failed.budgets.hasSnapshot, true);
  const recovered = mergeFinanceLoadResult(retained.data, complete);
  assert.equal(settleFinanceResourceStatuses(beginFinanceResourceHydration(failed), recovered.errors).budgets.status, "ready");
});

test("transactions remain single-response fail-closed while singleton retains maybeSingle semantics", async () => {
  const h = cappedRepository({ transactions: transactionRows(5) });
  const result = await h.repository.loadFinanceData(owner);
  assert.equal(result.transactions.status, "failure");
  assert.deepEqual(result.accountBalanceSettings, { resource: "accountBalanceSettings", status: "success", data: null });
  for (const table of ["transactions", "account_balance_settings"]) {
    const requests = h.observations.filter(row => row.url.pathname.endsWith(`/${table}`));
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url.searchParams.has("limit"), false);
    assert.equal(requests[0].url.searchParams.has("offset"), false);
  }
});
