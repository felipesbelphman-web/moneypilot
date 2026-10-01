import assert from "node:assert/strict";
import test from "node:test";
import { financeProviderHarness } from "./finance-provider-harness.mts";
import { createEmptyFinanceData, settleFinanceResourceLoaders, type FinanceResourceLoaders } from "../../src/lib/persistence/finance-hydration.ts";
import { financeResourceNames, type FinanceResourceName, type PersistedFinanceData } from "../../src/lib/persistence/finance-persistence-model.ts";
import { getGoalsAvailability } from "../../src/components/goals/goal-availability.ts";

const settings = { openingBalance: 100, openingDate: "2026-01-01" };
const transaction: PersistedFinanceData["transactions"][number] = { id: "t", description: "Test", category: "Food", categoryColor: "#000", classification: { kind: "legacy", categoryId: null, categoryNameSnapshot: "Food", categoryColorSnapshot: "#000", normalizedCategorySnapshot: "food" }, payment: "Card", date: "1 Jan 2026", dateISO: "2026-01-01", origin: "Manual", type: "expense", amount: 10 };
const plan = { goalId: "g", monthlyTarget: 100, baselineRequiredMonthlyContribution: 50, savingsBoost: 50, createdAt: "2026-01-01T00:00:00Z" };
const data = (): PersistedFinanceData => ({ ...createEmptyFinanceData(), accountBalanceSettings: settings, transactions: [transaction], goals: [{ id: "g", name: "Goal", targetAmount: 1000, savedAmount: 100, targetDate: "2099-01", priority: "primary" }] });
async function result(values = data(), failures: FinanceResourceName[] = []) {
  const loaders = Object.fromEntries(financeResourceNames.map(resource => [resource, async () => {
    if (failures.includes(resource)) throw new TypeError("private load failure");
    return values[resource];
  }])) as FinanceResourceLoaders;
  return settleFinanceResourceLoaders(loaders);
}

test("provider distinguishes successful empty transactions from an initial failed empty resource", async () => {
  for (const fail of [false, true]) {
    const h = financeProviderHarness();
    let state = await h.flush();
    assert.equal(state.resourceStatuses.transactions.status, "loading");
    assert.equal(state.resourceStatuses.transactions.hasSnapshot, false);
    h.loads[0].resolve(await result(createEmptyFinanceData(), fail ? ["transactions"] : []));
    state = await h.flush();
    assert.equal(state.transactions.length, 0);
    assert.equal(state.resourceStatuses.transactions.status, fail ? "error" : "ready");
    assert.equal(state.resourceStatuses.transactions.hasSnapshot, !fail);
    assert.equal(getGoalsAvailability(state.resourceStatuses).canApplyPlan, !fail);
    h.dispose();
  }
});

test("each failed financial resource retains its snapshot without remaining ready", async () => {
  for (const resource of financeResourceNames) {
    const h = financeProviderHarness(); await h.flush();
    h.loads[0].resolve(await result()); let state = await h.flush();
    const previous = state[resource];
    h.auth("user-a"); state = await h.flush();
    assert.equal(state.resourceStatuses[resource].status, "loading");
    assert.equal(state.resourceStatuses[resource].hasSnapshot, true);
    h.loads[1].resolve(await result(createEmptyFinanceData(), [resource])); state = await h.flush();
    assert.equal(state[resource], previous);
    assert.equal(state.resourceStatuses[resource].status, "error");
    assert.equal(state.resourceStatuses[resource].hasSnapshot, true);
    assert.equal(state.resourceStatuses[resource].error?.code, "repository_unavailable");
    if (resource === "transactions" || resource === "accountBalanceSettings") assert.equal(state.accountBalance, null);
    h.dispose();
  }
});

test("account balance requires successful settings and transactions, and recovers after failure", async () => {
  for (const resource of ["transactions", "accountBalanceSettings"] as const) {
    const h = financeProviderHarness(); await h.flush();
    h.loads[0].resolve(await result(data(), [resource])); let state = await h.flush();
    assert.equal(state.accountBalance, null);
    h.auth("user-a"); await h.flush(); h.loads[1].resolve(await result()); state = await h.flush();
    assert.equal(state.accountBalance, 90);
    assert.equal(state.resourceStatuses[resource].status, "ready");
    assert.equal(state.resourceStatuses[resource].error, null);
    assert.equal(getGoalsAvailability(state.resourceStatuses).canApplyPlan, true);
    h.dispose();
  }
});

test("successfully empty transactions preserve opening balance and legitimate zero", async () => {
  for (const openingBalance of [100, 0]) {
    const h = financeProviderHarness(); await h.flush();
    h.loads[0].resolve(await result({ ...createEmptyFinanceData(), accountBalanceSettings: { ...settings, openingBalance } }));
    assert.equal((await h.flush()).accountBalance, openingBalance); h.dispose();
  }
});

test("user switch and logout reset financial values and snapshot status; old responses are ignored", async () => {
  const h = financeProviderHarness(); await h.flush(); h.loads[0].resolve(await result()); await h.flush();
  h.auth("user-a"); await h.flush(); // A refresh will finish after the account changes.
  h.auth("user-b"); let state = await h.flush();
  assert.equal(state.transactions.length, 0); assert.equal(state.goals.length, 0); assert.equal(state.accountBalanceSettings, null);
  for (const status of Object.values(state.resourceStatuses)) { assert.equal(status.status, "loading"); assert.equal(status.hasSnapshot, false); }
  h.loads[1].resolve(await result()); state = await h.flush();
  assert.equal(state.transactions.length, 0); assert.equal(state.resourceStatuses.transactions.status, "loading");
  h.loads[2].resolve(await result(createEmptyFinanceData())); state = await h.flush();
  assert.equal(state.resourceStatuses.transactions.status, "ready");
  h.auth(null); state = await h.flush();
  for (const status of Object.values(state.resourceStatuses)) { assert.equal(status.status, "unavailable"); assert.equal(status.hasSnapshot, false); }
  assert.equal(state.accountBalance, null); assert.equal(state.transactions.length, 0); h.dispose();
});

test("provider rejects a saved plan callback during refresh and after failure, then permits recovery", async () => {
  const h = financeProviderHarness(); await h.flush(); h.loads[0].resolve(await result());
  const submit = (await h.flush()).upsertGoalContributionPlan;
  h.auth("user-a"); await h.flush();
  await assert.rejects(submit(plan), { message: "repository_unavailable" });
  h.loads[1].resolve(await result(data(), ["transactions"])); await h.flush();
  await assert.rejects(submit(plan), { message: "repository_unavailable" }); assert.equal(h.plans.length, 0);
  h.auth("user-a"); await h.flush(); h.loads[2].resolve(await result()); await h.flush();
  await submit(plan); assert.equal(h.plans.length, 1); h.dispose();
});

test("a successful transaction mutation does not promote a failed collection to ready", async () => {
  const h = financeProviderHarness(); await h.flush(); h.loads[0].resolve(await result(data(), ["transactions"]));
  const state = await h.flush(); await state.createTransaction({ ...transaction, category: "Food", categoryColor: "#000" });
  const next = h.render(); assert.equal(next.transactions.length, 1);
  assert.equal(next.resourceStatuses.transactions.status, "error"); assert.equal(next.resourceStatuses.transactions.hasSnapshot, false);
  assert.equal(next.accountBalance, null); h.dispose();
});

test("unexpected hydration rejection and authentication failure cannot leave resources ready", async () => {
  const h = financeProviderHarness(); await h.flush(); h.loads[0].reject(new TypeError("private detail"));
  for (const status of Object.values((await h.flush()).resourceStatuses)) { assert.equal(status.status, "error"); assert.equal(status.hasSnapshot, false); }
  h.dispose();
  const auth = financeProviderHarness({ authFails: true });
  for (const status of Object.values((await auth.flush()).resourceStatuses)) { assert.equal(status.status, "error"); assert.equal(status.error?.code, "authentication_required"); }
  assert.equal(auth.loads.length, 0); auth.dispose();
});

test("category failure is tracked independently and does not block Goals", async () => {
  const h = financeProviderHarness({ categoriesFail: true }); await h.flush(); h.loads[0].resolve(await result());
  const state = await h.flush(); assert.equal(state.resourceStatuses.categories.status, "error");
  assert.equal(state.resourceStatuses.categories.hasSnapshot, false); assert.equal(getGoalsAvailability(state.resourceStatuses).canApplyPlan, true);
  h.dispose();
});
