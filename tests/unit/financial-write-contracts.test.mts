import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import type { Database, Tables } from "../../src/lib/supabase/database.types.ts";

declare module "node:module" {
  export function registerHooks(hooks: {
    resolve(specifier: string, context: unknown, nextResolve: (specifier: string, context: unknown) => unknown): unknown;
  }): void;
}

const projectRoot = pathToFileURL(`${process.cwd()}\\`).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) return nextResolve(new URL(`./src/${specifier.slice(2)}.ts`, projectRoot).href, context);
    return nextResolve(specifier, context);
  },
});

const {
  SupabaseFinanceRepository,
  budgetAdjustmentProjection,
  budgetProjection,
  goalContributionPlanProjection,
  goalProjection,
  investmentProjection,
  transactionProjection,
} = await import("../../src/lib/persistence/supabase-finance-repository.ts");
const { FinanceError } = await import("../../src/lib/domain/finance-error.ts");

type TransactionRow = Tables<"transactions">;
type BudgetRow = Tables<"budgets">;
type AdjustmentRow = Tables<"budget_adjustments">;
type GoalRow = Tables<"goals">;
type PlanRow = Tables<"goal_contribution_plans">;
type InvestmentRow = Tables<"investments">;

const owner = "authenticated-owner";
const timestamps = { created_at: "2026-09-01T10:00:00Z", updated_at: "2026-09-02T11:00:00Z" };
const transactionRow: TransactionRow = { ...timestamps, user_id: owner, id: "t1", description: "Bank confirmed", category: "Food", category_color: "#123456", category_id: null, category_name_snapshot: "Food", category_color_snapshot: "#123456", normalized_category_snapshot: "food", payment: "Card", date: "1 September 2026", date_iso: "2026-09-01", origin: "Manual", type: "expense", amount: 10.1234 };
const budgetRow: BudgetRow = { ...timestamps, user_id: owner, id: "b1", category: "Food", subtitle: "Confirmed", budget: 500.25, month: "2026-09", color: "#123456" };
const adjustmentRow: AdjustmentRow = { ...timestamps, user_id: owner, month: "2026-09", target_remaining_spend: 0, baseline_projected_total: 500.25, adjustment_needed: 0, suggested_weekly_reduction: 0 };
const goalRow: GoalRow = { ...timestamps, user_id: owner, id: "g1", name: "Confirmed goal", target_amount: 1000.25, saved_amount: 0, target_date: "2027-12", priority: "primary" };
const planRow: PlanRow = { ...timestamps, user_id: owner, goal_id: "g1", monthly_target: 0, baseline_required_monthly_contribution: 50.25, savings_boost: 0 };
const investmentRow: InvestmentRow = { ...timestamps, user_id: owner, id: "i1", name: "Confirmed fund", symbol: null, asset_type: "etf", quantity: 2.1234, average_purchase_price: 100.12, price_mode: "automatic", manual_current_price: null, market_asset_key: "market-key", native_currency: "EUR" };

type CapturedRequest = { method: string; url: URL; headers: Headers; body: unknown };

function repositoryRespondingWith(responseBody: unknown, status = 200) {
  const requests: CapturedRequest[] = [];
  const mockFetch: typeof fetch = async (input, init) => {
    const request = new Request(input, init);
    const text = await request.clone().text();
    requests.push({ method: request.method, url: new URL(request.url), headers: request.headers, body: text ? JSON.parse(text) : null });
    return new Response(JSON.stringify(responseBody), { status, headers: { "Content-Type": "application/json" } });
  };
  const client = createClient<Database>("http://supabase.invalid", "local-test-key", {
    global: { fetch: mockFetch }, auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return { repository: new SupabaseFinanceRepository(client), requests };
}

function selectedColumns(request: CapturedRequest) {
  return request.url.searchParams.get("select");
}

function assertOwnedPayload(body: unknown) {
  assert.equal(Reflect.get(requireObject(body), "user_id"), owner);
}

function requireObject(value: unknown): object {
  if (typeof value !== "object" || value === null) assert.fail("Expected an object response payload");
  return value;
}

function assertSingle(request: CapturedRequest) {
  assert.match(request.headers.get("accept") ?? "", /application\/vnd\.pgrst\.object\+json/);
}

test("creates one transaction with an owned payload, explicit projection and confirmed database values", async () => {
  const { repository, requests } = repositoryRespondingWith(transactionRow);
  const result = await repository.createTransaction(owner, { id: "t1", description: "Client draft", categoryWrite: { kind: "legacy", categoryName: "Food", categoryColor: "#123456" }, payment: "Card", date: "1 September 2026", dateISO: "2026-09-01", origin: "Manual", type: "expense", amount: 9 });
  assert.equal(result.description, "Bank confirmed");
  assert.equal(result.amount, 10.1234);
  const [request] = requests;
  assert.equal(request.method, "POST");
  assert.equal(request.url.pathname, "/rest/v1/transactions");
  assertOwnedPayload(request.body);
  const body = requireObject(request.body);
  assert.deepEqual([Reflect.get(body, "category_id"), Reflect.get(body, "category"), Reflect.get(body, "category_color")], [null, "Food", "#123456"]);
  for (const key of ["category_name_snapshot", "category_color_snapshot", "normalized_category_snapshot", "created_at", "updated_at"]) assert.equal(Reflect.has(body, key), false);
  assert.equal(selectedColumns(request), transactionProjection);
  assertSingle(request);
});

test("creates linked transactions without client-authored derived snapshots and blocks uncategorized inserts", async () => {
  const linkedRow = { ...transactionRow, category_id: "category-1" };
  const { repository, requests } = repositoryRespondingWith(linkedRow);
  await repository.createTransaction(owner, { id: "t1", description: "Linked", categoryWrite: { kind: "linked", categoryId: "category-1", legacyName: "Food", legacyColor: "#123456" }, payment: "Card", date: "1 September 2026", dateISO: "2026-09-01", origin: "Manual", type: "expense", amount: 9 });
  const body = requireObject(requests[0].body);
  assert.deepEqual([Reflect.get(body, "category_id"), Reflect.get(body, "category"), Reflect.get(body, "category_color")], ["category-1", "Food", "#123456"]);
  for (const key of ["category_name_snapshot", "category_color_snapshot", "normalized_category_snapshot"]) assert.equal(Reflect.has(body, key), false);
  await assert.rejects(() => repository.createTransaction(owner, { id: "t2", description: "No category", categoryWrite: { kind: "uncategorized" }, payment: "Card", date: "1 September 2026", dateISO: "2026-09-01", origin: "Manual", type: "expense", amount: 9 }), (error) => error instanceof FinanceError && error.code === "validation_error" && error.message === "validation_error");
  assert.equal(requests.length, 1);
});

test("imports transactions and requires every requested row to be returned", async () => {
  const { repository, requests } = repositoryRespondingWith([transactionRow, { ...transactionRow, id: "t2" }]);
  const input = [{ id: "t1", description: "One", categoryWrite: { kind: "legacy" as const, categoryName: "Food", categoryColor: "#123456" }, payment: "Card", date: "1 September 2026", dateISO: "2026-09-01", origin: "CSV", type: "expense" as const, amount: 1 }, { id: "t2", description: "Two", categoryWrite: { kind: "legacy" as const, categoryName: "Food", categoryColor: "#123456" }, payment: "Card", date: "2 September 2026", dateISO: "2026-09-02", origin: "CSV", type: "expense" as const, amount: 2 }];
  assert.equal((await repository.createTransactions(owner, input)).length, 2);
  assert.equal(selectedColumns(requests[0]), transactionProjection);
  assert.equal(Array.isArray(requests[0].body), true);
  if (!Array.isArray(requests[0].body)) assert.fail("Expected an array payload");
  for (const payload of requests[0].body) assertOwnedPayload(payload);
  const missing = repositoryRespondingWith([transactionRow]);
  await assert.rejects(() => missing.repository.createTransactions(owner, input), (error) => error instanceof FinanceError && error.code === "unknown_repository_error");
});

test("an empty transaction import is deliberately idempotent and sends no request", async () => {
  const { repository, requests } = repositoryRespondingWith([]);
  assert.deepEqual(await repository.createTransactions(owner, []), []);
  assert.equal(requests.length, 0);
});

test("updates a transaction only through owner and resource filters", async () => {
  const { repository, requests } = repositoryRespondingWith(transactionRow);
  await repository.updateTransaction(owner, { id: "t1", description: "Draft", payment: "Card", date: "1 September 2026", dateISO: "2026-09-01", origin: "Manual", type: "expense", amount: 10 });
  const [request] = requests;
  assert.equal(request.method, "PATCH");
  assert.equal(request.url.searchParams.get("user_id"), `eq.${owner}`);
  assert.equal(request.url.searchParams.get("id"), "eq.t1");
  assert.equal(selectedColumns(request), transactionProjection);
  assertSingle(request);
  const body = requireObject(request.body);
  for (const key of ["user_id", "category_id", "category", "category_color", "category_name_snapshot", "category_color_snapshot", "normalized_category_snapshot", "created_at", "updated_at"]) assert.equal(Reflect.has(body, key), false);
});

test("links and unlinks classification with minimal trigger-facing payloads", async () => {
  const linkedRepository = repositoryRespondingWith({ ...transactionRow, category_id: "category-1" });
  await linkedRepository.repository.updateTransactionClassification(owner, { id: "t1", categoryWrite: { kind: "linked", categoryId: "category-1", legacyName: "Food", legacyColor: "#123456" } });
  assert.deepEqual(linkedRepository.requests[0].body, { category_id: "category-1", category: "Food", category_color: "#123456" });
  assert.equal(linkedRepository.requests[0].url.searchParams.get("user_id"), `eq.${owner}`);
  const unlinkedRepository = repositoryRespondingWith({ ...transactionRow, category_name_snapshot: null, category_color_snapshot: null, normalized_category_snapshot: null });
  const result = await unlinkedRepository.repository.updateTransactionClassification(owner, { id: "t1", categoryWrite: { kind: "uncategorized" } });
  assert.deepEqual(unlinkedRepository.requests[0].body, { category_id: null });
  assert.equal(result.classification.kind, "uncategorized");
});

const upsertCases = [
  { label: "budget", table: "budgets", projection: budgetProjection, conflict: "user_id,id", row: budgetRow, run: (repository: InstanceType<typeof SupabaseFinanceRepository>) => repository.upsertBudget(owner, { id: "b1", category: "Food", subtitle: "Draft", budget: 400, month: "2026-09", color: "#123456" }) },
  { label: "budget adjustment", table: "budget_adjustments", projection: budgetAdjustmentProjection, conflict: "user_id,month", row: adjustmentRow, run: (repository: InstanceType<typeof SupabaseFinanceRepository>) => repository.upsertBudgetAdjustment(owner, { month: "2026-09", targetRemainingSpend: 0, baselineProjectedTotal: 400, adjustmentNeeded: 0, suggestedWeeklyReduction: 0 }) },
  { label: "goal", table: "goals", projection: goalProjection, conflict: "user_id,id", row: goalRow, run: (repository: InstanceType<typeof SupabaseFinanceRepository>) => repository.upsertGoal(owner, { id: "g1", name: "Draft", targetAmount: 1000, savedAmount: 0, targetDate: "2027-12", priority: "primary" }) },
  { label: "investment", table: "investments", projection: investmentProjection, conflict: "user_id,id", row: investmentRow, run: (repository: InstanceType<typeof SupabaseFinanceRepository>) => repository.upsertInvestment(owner, { id: "i1", name: "Draft", symbol: null, assetType: "etf", quantity: 2.1234, averagePurchasePrice: 100.12, priceMode: "automatic", manualCurrentPrice: null, marketAssetKey: "market-key", nativeCurrency: "EUR" }) },
] as const;

for (const item of upsertCases) {
  test(`upserts ${item.label} with official owned payload, conflict key and confirmed Row`, async () => {
    const { repository, requests } = repositoryRespondingWith(item.row);
    const result = await item.run(repository);
    assertOwnedPayload(requests[0].body);
    assert.equal(requests[0].method, "POST");
    assert.equal(requests[0].url.pathname, `/rest/v1/${item.table}`);
    assert.equal(requests[0].url.searchParams.get("on_conflict"), item.conflict);
    assert.equal(selectedColumns(requests[0]), item.projection);
    assertSingle(requests[0]);
    assert.notEqual(result, item.row);
  });
}

test("goal contribution plan never sends created_at and uses the database timestamp", async () => {
  const { repository, requests } = repositoryRespondingWith(planRow);
  const result = await repository.upsertGoalContributionPlan(owner, { goalId: "g1", monthlyTarget: 0, baselineRequiredMonthlyContribution: 50.25, savingsBoost: 0, createdAt: "1999-01-01T00:00:00Z" });
  const [request] = requests;
  assertOwnedPayload(request.body);
  assert.equal(Reflect.has(requireObject(request.body), "created_at"), false);
  assert.deepEqual(Object.keys(requireObject(request.body)).sort(), ["baseline_required_monthly_contribution", "goal_id", "monthly_target", "savings_boost", "user_id"]);
  assert.equal(request.url.searchParams.get("on_conflict"), "user_id,goal_id");
  assert.equal(selectedColumns(request), goalContributionPlanProjection);
  assert.match(goalContributionPlanProjection, /created_at/);
  assertSingle(request);
  assert.equal(result.createdAt, timestamps.created_at);
  assert.notEqual(result.createdAt, "1999-01-01T00:00:00Z");
  assert.equal(result.monthlyTarget, 0);
});

const deleteCases = [
  { label: "transaction", table: "transactions", key: "id", value: "t1", row: { id: "t1" }, run: (repository: InstanceType<typeof SupabaseFinanceRepository>) => repository.deleteTransaction(owner, "t1") },
  { label: "budget", table: "budgets", key: "id", value: "b1", row: { id: "b1" }, run: (repository: InstanceType<typeof SupabaseFinanceRepository>) => repository.deleteBudget(owner, "b1") },
  { label: "budget adjustment", table: "budget_adjustments", key: "month", value: "2026-09", row: { month: "2026-09" }, run: (repository: InstanceType<typeof SupabaseFinanceRepository>) => repository.deleteBudgetAdjustment(owner, "2026-09") },
  { label: "goal", table: "goals", key: "id", value: "g1", row: { id: "g1" }, run: (repository: InstanceType<typeof SupabaseFinanceRepository>) => repository.deleteGoal(owner, "g1") },
  { label: "goal contribution plan", table: "goal_contribution_plans", key: "goal_id", value: "g1", row: { goal_id: "g1" }, run: (repository: InstanceType<typeof SupabaseFinanceRepository>) => repository.deleteGoalContributionPlan(owner, "g1") },
  { label: "investment", table: "investments", key: "id", value: "i1", row: { id: "i1" }, run: (repository: InstanceType<typeof SupabaseFinanceRepository>) => repository.deleteInvestment(owner, "i1") },
] as const;

for (const item of deleteCases) {
  test(`deletes ${item.label} with owner, resource key, minimal projection and one-row confirmation`, async () => {
    const { repository, requests } = repositoryRespondingWith(item.row);
    await item.run(repository);
    const [request] = requests;
    assert.equal(request.method, "DELETE");
    assert.equal(request.url.pathname, `/rest/v1/${item.table}`);
    assert.equal(request.url.searchParams.get("user_id"), `eq.${owner}`);
    assert.equal(request.url.searchParams.get(item.key), `eq.${item.value}`);
    assert.equal(selectedColumns(request), item.key);
    assertSingle(request);
  });
}

test("zero-row create, upsert and delete responses are stable sanitized failures", async () => {
  const create = repositoryRespondingWith(null);
  await assert.rejects(() => create.repository.createTransaction(owner, { id: "t1", description: "Draft", categoryWrite: { kind: "legacy", categoryName: "Food", categoryColor: "#123456" }, payment: "Card", date: "1 September 2026", dateISO: "2026-09-01", origin: "Manual", type: "expense", amount: 1 }), (error) => error instanceof FinanceError && error.code === "unknown_repository_error" && error.message === "unknown_repository_error");
  const upsert = repositoryRespondingWith(null);
  await assert.rejects(() => upsert.repository.upsertGoalContributionPlan(owner, { goalId: "g1", monthlyTarget: 0, baselineRequiredMonthlyContribution: 0, savingsBoost: 0, createdAt: timestamps.created_at }), FinanceError);
  const deletion = repositoryRespondingWith(null);
  await assert.rejects(() => deletion.repository.deleteInvestment(owner, "i1"), FinanceError);
});

test("Supabase constraint and duplicate details remain sanitized", async () => {
  const constraint = repositoryRespondingWith({ code: "23514", message: "private query and payload", details: "private", hint: "private" }, 400);
  await assert.rejects(() => constraint.repository.upsertBudget(owner, { id: "b1", category: "Food", subtitle: "Draft", budget: 1, month: "2026-09", color: "#123456" }), (error) => error instanceof FinanceError && error.code === "constraint_violation" && !error.message.includes("private"));
  const duplicate = repositoryRespondingWith({ code: "23505", message: "private duplicate", details: "private", hint: "private" }, 409);
  await assert.rejects(() => duplicate.repository.upsertGoal(owner, { id: "g1", name: "Draft", targetAmount: 1, savedAmount: 0, targetDate: "2027-12", priority: "primary" }), (error) => error instanceof FinanceError && error.code === "duplicate_record" && !error.message.includes("private"));
});

test("an invalid confirmed Row is rejected instead of returning the optimistic input", async () => {
  const { repository } = repositoryRespondingWith({ ...investmentRow, quantity: 0 });
  await assert.rejects(() => repository.upsertInvestment(owner, { id: "i1", name: "Draft", symbol: null, assetType: "etf", quantity: 1, averagePurchasePrice: 1, priceMode: "automatic", manualCurrentPrice: null, marketAssetKey: "market-key", nativeCurrency: "EUR" }), (error) => error instanceof FinanceError && error.code === "validation_error");
});
