import assert from "node:assert/strict";
import { test } from "node:test";
import { FinanceError } from "../../src/lib/domain/finance-error.ts";
import {
  aggregateFinanceHydrationError,
  authenticationHydrationError,
  createEmptyFinanceData,
  financeDataAfterUserChange,
  isCurrentFinanceHydration,
  mergeFinanceLoadResult,
  requireCompleteFinanceData,
  settleFinanceResourceLoaders,
} from "../../src/lib/persistence/finance-hydration.ts";
import { financeResourceNames, type FinanceResourceName, type PersistedFinanceData } from "../../src/lib/persistence/finance-persistence-model.ts";

function sampleData(): PersistedFinanceData {
  return {
    accountBalanceSettings: { openingBalance: 100, openingDate: "2026-01-01", userId: "user-a", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
    transactions: [{ id: "t", description: "Test", category: "Test", categoryColor: "#000", classification: { kind: "legacy", categoryId: null, categoryNameSnapshot: "Test", categoryColorSnapshot: "#000", normalizedCategorySnapshot: "test" }, payment: "Card", date: "1 Jan 2026", dateISO: "2026-01-01", origin: "Manual", type: "expense", amount: 1 }],
    budgets: [{ id: "b", category: "Test", subtitle: "Test", budget: 1, month: "2026-01", color: "#000" }],
    budgetAdjustments: [{ month: "2026-01", targetRemainingSpend: 0, baselineProjectedTotal: 0, adjustmentNeeded: 0, suggestedWeeklyReduction: 0 }],
    goals: [{ id: "g", name: "Test", targetAmount: 1, savedAmount: 0, targetDate: "2026-12", priority: "primary" }],
    goalContributionPlans: [{ goalId: "g", monthlyTarget: 0, baselineRequiredMonthlyContribution: 0, savingsBoost: 0, createdAt: "2026-01-01T00:00:00Z" }],
    investments: [{ id: "i", name: "Test", symbol: null, assetType: "other", quantity: 1, averagePurchasePrice: 1, priceMode: "manual", manualCurrentPrice: 1, marketAssetKey: null, nativeCurrency: "GBP" }],
  };
}

function loaders(data = sampleData()) {
  return {
    accountBalanceSettings: async () => data.accountBalanceSettings,
    transactions: async () => data.transactions,
    budgets: async () => data.budgets,
    budgetAdjustments: async () => data.budgetAdjustments,
    goals: async () => data.goals,
    goalContributionPlans: async () => data.goalContributionPlans,
    investments: async () => data.investments,
  };
}

test("loads all seven financial resources successfully", async () => {
  const result = await settleFinanceResourceLoaders(loaders());
  for (const resource of financeResourceNames) assert.equal(result[resource].status, "success");
  const merged = mergeFinanceLoadResult(createEmptyFinanceData(), result);
  assert.deepEqual(merged.data, sampleData());
  assert.equal(aggregateFinanceHydrationError(merged.errors), null);
});

test("treats missing account balance settings as a successful null resource", async () => {
  const result = await settleFinanceResourceLoaders({ ...loaders(), accountBalanceSettings: async () => null });
  assert.deepEqual(result.accountBalanceSettings, { resource: "accountBalanceSettings", status: "success", data: null });
  assert.equal(aggregateFinanceHydrationError(mergeFinanceLoadResult(sampleData(), result).errors), null);
});

test("preserves previous account balance settings when only that resource fails", async () => {
  const result = await settleFinanceResourceLoaders({ ...loaders(), accountBalanceSettings: async () => { throw new TypeError("private network detail"); } });
  const merged = mergeFinanceLoadResult(sampleData(), result);
  assert.deepEqual(merged.data.accountBalanceSettings, sampleData().accountBalanceSettings);
  assert.equal(aggregateFinanceHydrationError(merged.errors)?.code, "repository_unavailable");
  assert.equal(merged.data.transactions.length, 1);
});

test("exposes a safe partial hydration error while preserving successful resources", async () => {
  const result = await settleFinanceResourceLoaders({ ...loaders(), budgets: async () => { throw new TypeError("private network detail"); } });
  const merged = mergeFinanceLoadResult(sampleData(), result);
  const error = aggregateFinanceHydrationError(merged.errors);

  assert.equal(error?.code, "repository_unavailable");
  assert.equal(error?.message.includes("private network detail"), false);
  assert.deepEqual(merged.data.budgets, sampleData().budgets);
  assert.deepEqual(merged.data.transactions, sampleData().transactions);
});

test("aggregates multiple failures predictably in canonical resource order", async () => {
  const result = await settleFinanceResourceLoaders({
    ...loaders(),
    transactions: async () => { throw { code: "42501", message: "private ownership detail" }; },
    goals: async () => { throw new TypeError("private network detail"); },
  });
  const merged = mergeFinanceLoadResult(createEmptyFinanceData(), result);

  assert.equal(aggregateFinanceHydrationError(merged.errors)?.code, "ownership_denied");
  assert.equal(merged.data.budgets.length, 1);
});

test("a later complete hydration clears the previous aggregate error", async () => {
  const failed = mergeFinanceLoadResult(createEmptyFinanceData(), await settleFinanceResourceLoaders({
    ...loaders(),
    investments: async () => { throw new TypeError("network failed"); },
  }));
  assert.ok(aggregateFinanceHydrationError(failed.errors));

  const recovered = mergeFinanceLoadResult(failed.data, await settleFinanceResourceLoaders(loaders()));
  assert.equal(aggregateFinanceHydrationError(recovered.errors), null);
});

for (const failedResource of financeResourceNames) {
  test(`isolates a ${failedResource} failure and preserves six successes`, async () => {
    let calls = 0;
    const resourceLoaders = loaders();
    resourceLoaders[failedResource] = async () => {
      calls += 1;
      throw { code: "NETWORK_ERROR", message: "sensitive upstream detail" };
    };
    const result = await settleFinanceResourceLoaders(resourceLoaders);
    const merged = mergeFinanceLoadResult(createEmptyFinanceData(), result);

    assert.equal(calls, 1);
    assert.equal(result[failedResource].status, "failure");
    assert.ok(merged.errors[failedResource] instanceof FinanceError);
    assert.equal(merged.errors[failedResource]?.code, "repository_unavailable");
    for (const resource of financeResourceNames.filter((name) => name !== failedResource)) {
      assert.equal(result[resource].status, "success");
      assert.deepEqual(merged.data[resource], sampleData()[resource]);
    }
  });
}

test("treats an empty response as a successful load", async () => {
  const result = await settleFinanceResourceLoaders({ ...loaders(), transactions: async () => [] });
  assert.deepEqual(result.transactions, { resource: "transactions", status: "success", data: [] });
});

test("keeps complete collections untruncated for existing consumers", async () => {
  const data = sampleData();
  data.transactions.push({ ...data.transactions[0], id: "t-2" });
  const result = await settleFinanceResourceLoaders(loaders(data));
  assert.deepEqual(requireCompleteFinanceData(result), data);
  assert.equal(requireCompleteFinanceData(result).transactions.length, 2);
});

test("complete-data consumers fail safely when a required resource is unavailable", async () => {
  const result = await settleFinanceResourceLoaders({ ...loaders(), budgets: async () => { throw { code: "NETWORK_ERROR", message: "private detail" }; } });
  assert.throws(() => requireCompleteFinanceData(result), (error) => error instanceof FinanceError
    && error.code === "repository_unavailable" && error.message.includes("private detail") === false);
});

test("preserves previous resource data when a refresh fails", async () => {
  const result = await settleFinanceResourceLoaders({ ...loaders(), goals: async () => { throw new TypeError("fetch failed"); } });
  assert.deepEqual(mergeFinanceLoadResult(sampleData(), result).data.goals, sampleData().goals);
});

test("keeps only the failed resource empty on first hydration", async () => {
  const result = await settleFinanceResourceLoaders({ ...loaders(), investments: async () => { throw new TypeError("fetch failed"); } });
  const merged = mergeFinanceLoadResult(createEmptyFinanceData(), result);
  assert.deepEqual(merged.data.investments, []);
  assert.equal(merged.data.transactions.length, 1);
});

test("represents an authentication failure as a safe global FinanceError", () => {
  const error = authenticationHydrationError();
  assert.equal(error.code, "authentication_required");
  assert.equal(error.message, "authentication_required");
});

test("clears previous data when the authenticated user changes", () => {
  assert.deepEqual(financeDataAfterUserChange("user-a", "user-b", sampleData()), createEmptyFinanceData());
});

test("keeps current data for a refresh by the same user", () => {
  const current = sampleData();
  assert.equal(financeDataAfterUserChange("user-a", "user-a", current), current);
});

test("rejects a delayed response from user A after switching to user B", () => {
  assert.equal(isCurrentFinanceHydration(true, 2, "user-b", 1, "user-a"), false);
  assert.equal(isCurrentFinanceHydration(true, 2, "user-b", 2, "user-b"), true);
});

test("clears all collections on logout", () => {
  assert.deepEqual(financeDataAfterUserChange("user-a", null, sampleData()), createEmptyFinanceData());
});

test("maps every rejected loader to a safe FinanceError without retry", async () => {
  const callCounts = Object.fromEntries(financeResourceNames.map((resource) => [resource, 0])) as Record<FinanceResourceName, number>;
  const reject = async (resource: FinanceResourceName): Promise<never> => {
    callCounts[resource] += 1;
    throw new Error("database internals must not escape");
  };
  const rejecting = {
    accountBalanceSettings: () => reject("accountBalanceSettings"),
    transactions: () => reject("transactions"),
    budgets: () => reject("budgets"),
    budgetAdjustments: () => reject("budgetAdjustments"),
    goals: () => reject("goals"),
    goalContributionPlans: () => reject("goalContributionPlans"),
    investments: () => reject("investments"),
  };
  const result = await settleFinanceResourceLoaders(rejecting);

  for (const resource of financeResourceNames) {
    assert.equal(callCounts[resource], 1);
    const resourceResult = result[resource];
    assert.equal(resourceResult.status, "failure");
    if (resourceResult.status === "failure") {
      assert.ok(resourceResult.error instanceof FinanceError);
      assert.equal(resourceResult.error.code, "unknown_repository_error");
      assert.equal(resourceResult.error.message.includes("database internals"), false);
    }
  }
});
