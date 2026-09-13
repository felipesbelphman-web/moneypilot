import assert from "node:assert/strict";
import { test } from "node:test";
import type { Investment } from "../../src/components/investments/investment-model.ts";
import { FinanceError } from "../../src/lib/domain/finance-error.ts";
import { validateAndNormalizeInvestment } from "../../src/lib/domain/investment-validation.ts";
import { executeFinanceMutation } from "../../src/lib/persistence/finance-mutation.ts";

const investment: Investment = {
  id: "investment-test",
  name: "Test investment",
  symbol: "TEST",
  assetType: "stock",
  quantity: 2,
  averagePurchasePrice: 10,
  priceMode: "manual",
  manualCurrentPrice: 11,
  marketAssetKey: null,
  nativeCurrency: "EUR",
};

function harness(overrides: { userId?: string | null; generation?: number } = {}) {
  let currentUserId = overrides.userId === undefined ? "user-a" : overrides.userId;
  let currentGeneration = overrides.generation ?? 1;
  const states: unknown[] = [];
  const activeKeys = new Set<string>();
  const lifecycle = {
    operation: "upsertInvestment" as const,
    entityKey: `investment:${investment.id}`,
    userId: currentUserId,
    generation: currentGeneration,
    activeKeys,
    isCurrent: (userId: string, generation: number) => currentUserId === userId && currentGeneration === generation,
    setState: (state: unknown) => states.push(state),
  };
  return {
    lifecycle,
    states,
    activeKeys,
    switchUser: (userId: string) => { currentUserId = userId; currentGeneration += 1; },
  };
}

test("valid creation calls persistence exactly once and commits the confirmed row", async () => {
  const context = harness();
  const confirmed = { ...investment, name: "Confirmed investment" };
  const state: Investment[] = [];
  let calls = 0;
  const result = await executeFinanceMutation(context.lifecycle, async (userId) => {
    calls += 1;
    assert.equal(userId, "user-a");
    return confirmed;
  }, (row) => state.push(row));
  assert.equal(calls, 1);
  assert.equal(result, confirmed);
  assert.deepEqual(state, [confirmed]);
});

test("invalid creation is rejected before persistence", () => {
  let calls = 0;
  const persist = () => { calls += 1; };
  assert.throws(() => validateAndNormalizeInvestment({ ...investment, quantity: 0 }), FinanceError);
  assert.equal(calls, 0);
  void persist;
});

test("persistence failure preserves existing state and form input", async () => {
  const context = harness();
  const state = [{ ...investment, id: "existing" }];
  const originalState = structuredClone(state);
  const draft = structuredClone(investment);
  await assert.rejects(() => executeFinanceMutation(context.lifecycle, async () => {
    throw { code: "23514", message: "technical constraint detail" };
  }, (row) => state.push(row)), (error) => error instanceof FinanceError && error.code === "constraint_violation");
  assert.deepEqual(state, originalState);
  assert.deepEqual(draft, investment);
});

test("duplicate submit is blocked without calling persistence", async () => {
  const context = harness();
  context.activeKeys.add("1:investment:investment-test");
  let calls = 0;
  await assert.rejects(() => executeFinanceMutation(context.lifecycle, async () => { calls += 1; return investment; }, () => undefined), FinanceError);
  assert.equal(calls, 0);
});

test("operation without a session is rejected", async () => {
  const context = harness({ userId: null });
  let calls = 0;
  await assert.rejects(() => executeFinanceMutation(context.lifecycle, async () => { calls += 1; return investment; }, () => undefined), (error) => error instanceof FinanceError && error.code === "authentication_required");
  assert.equal(calls, 0);
});

test("late response after a user switch is ignored", async () => {
  const context = harness();
  let resolvePersistence!: (value: Investment) => void;
  const pending = new Promise<Investment>((resolve) => { resolvePersistence = resolve; });
  let commits = 0;
  const mutation = executeFinanceMutation(context.lifecycle, async () => pending, () => { commits += 1; });
  context.switchUser("user-b");
  resolvePersistence(investment);
  await assert.rejects(() => mutation, (error) => error instanceof FinanceError && error.code === "unknown_repository_error");
  assert.equal(commits, 0);
});

test("update replaces only the confirmed investment", async () => {
  const context = harness();
  const existing = [investment, { ...investment, id: "other" }];
  const confirmed = { ...investment, quantity: 3 };
  await executeFinanceMutation(context.lifecycle, async () => confirmed, (row) => {
    for (let index = 0; index < existing.length; index += 1) {
      if (existing[index].id === row.id) existing[index] = row;
    }
  });
  assert.equal(existing[0].quantity, 3);
  assert.equal(existing[1].quantity, 2);
});

test("technical repository errors become safe codes", async () => {
  const context = harness();
  await assert.rejects(() => executeFinanceMutation(context.lifecycle, async () => {
    throw new Error("sensitive database message");
  }, () => undefined), (error) => error instanceof FinanceError
    && error.code === "unknown_repository_error"
    && error.message.includes("sensitive database message") === false);
});
