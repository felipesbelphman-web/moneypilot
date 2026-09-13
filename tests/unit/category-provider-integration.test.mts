import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import type { Category } from "../../src/lib/domain/category.ts";
import { FinanceError } from "../../src/lib/domain/finance-error.ts";
import {
  aggregateFinanceHydrationError,
  createEmptyFinanceData,
  isCurrentFinanceHydration,
  mergeCategoryLoadResult,
  mergeConfirmedCategory,
  mergeFinanceLoadResult,
  selectActiveCategories,
  settleFinanceProviderHydration,
  settleFinanceResourceLoaders,
  sortCategories,
} from "../../src/lib/persistence/finance-hydration.ts";
import { executeFinanceMutation, type FinanceMutationLifecycle } from "../../src/lib/persistence/finance-mutation.ts";

const active: Category = {
  id: "category-b", userId: "user-a", name: "Groceries", type: "expense", normalizedName: "groceries",
  iconKey: "cart", colorToken: "green-500", archivedAt: null,
  createdAt: "2026-09-11T10:00:00Z", updatedAt: "2026-09-11T10:00:00Z",
};
const archived: Category = { ...active, id: "category-a", name: "Archived", normalizedName: "archived", archivedAt: "2026-09-12T10:00:00Z" };
const income: Category = { ...active, id: "category-c", name: "Salary", normalizedName: "salary", type: "income" };

function financeLoaders() {
  return {
    accountBalanceSettings: async () => null,
    transactions: async () => [],
    budgets: async () => [],
    budgetAdjustments: async () => [],
    goals: async () => [],
    goalContributionPlans: async () => [],
    investments: async () => [],
  };
}

test("starts categories hydration in parallel with all financial resources", async () => {
  let financeStarted = false;
  let categoriesStarted = false;
  let releaseFinance!: () => void;
  let releaseCategories!: () => void;
  const financeGate = new Promise<void>((resolve) => { releaseFinance = resolve; });
  const categoriesGate = new Promise<void>((resolve) => { releaseCategories = resolve; });

  const pending = settleFinanceProviderHydration(
    async () => { financeStarted = true; await financeGate; return settleFinanceResourceLoaders(financeLoaders()); },
    async () => { categoriesStarted = true; await categoriesGate; return [active]; },
  );

  assert.equal(financeStarted, true);
  assert.equal(categoriesStarted, true);
  releaseFinance();
  releaseCategories();
  const result = await pending;
  assert.equal(result.finance.transactions.status, "success");
  assert.deepEqual(result.categories, { resource: "categories", status: "success", data: [active] });
});

test("accepts an empty categories collection as successful hydration", async () => {
  const result = await settleFinanceProviderHydration(
    () => settleFinanceResourceLoaders(financeLoaders()),
    async () => [],
  );
  assert.deepEqual(result.categories, { resource: "categories", status: "success", data: [] });
});

test("orders categories deterministically and derives only active categories", () => {
  const ordered = sortCategories([income, active, archived]);
  assert.deepEqual(ordered.map((category) => category.id), ["category-a", "category-b", "category-c"]);
  assert.deepEqual(selectActiveCategories(ordered).map((category) => category.id), ["category-b", "category-c"]);
});

test("a categories failure preserves valid finance resources and previous categories", async () => {
  const result = await settleFinanceProviderHydration(
    () => settleFinanceResourceLoaders(financeLoaders()),
    async () => { throw new TypeError("private network detail"); },
  );
  const finance = mergeFinanceLoadResult(createEmptyFinanceData(), result.finance);
  const categories = mergeCategoryLoadResult([active], result.categories);
  assert.deepEqual(finance.data, createEmptyFinanceData());
  assert.deepEqual(categories.categories, [active]);
  assert.equal(categories.error?.code, "repository_unavailable");
  assert.equal(categories.error?.message.includes("private"), false);
});

test("successful rehydration replaces preserved categories and clears its error", () => {
  const recovered = mergeCategoryLoadResult([active], { resource: "categories", status: "success", data: [income] });
  assert.deepEqual(recovered.categories, [income]);
  assert.equal(recovered.error, null);
});

test("category errors follow existing resources in canonical aggregation order", () => {
  const categoryError = new FinanceError("repository_unavailable");
  const budgetError = new FinanceError("ownership_denied");
  assert.equal(aggregateFinanceHydrationError({ categories: categoryError }), categoryError);
  assert.equal(aggregateFinanceHydrationError({ categories: categoryError, budgets: budgetError }), budgetError);
});

test("confirmed category mutations insert or replace while preserving ordering", () => {
  assert.deepEqual(mergeConfirmedCategory([income], active).map((category) => category.id), ["category-b", "category-c"]);
  const updated = { ...active, name: "Food", normalizedName: "food" };
  assert.deepEqual(mergeConfirmedCategory([income, active], updated).find((category) => category.id === active.id), updated);
  const archivedConfirmed = { ...updated, archivedAt: "2026-09-12T10:00:00Z" };
  assert.equal(mergeConfirmedCategory([updated], archivedConfirmed)[0]?.archivedAt, "2026-09-12T10:00:00Z");
  assert.equal(mergeConfirmedCategory([archivedConfirmed], { ...archivedConfirmed, archivedAt: null })[0]?.archivedAt, null);
});

function mutationLifecycle(state: { userId: string | null; generation: number }) {
  const statuses: string[] = [];
  const lifecycle: FinanceMutationLifecycle<"updateCategory"> = {
    operation: "updateCategory",
    entityKey: `category:${active.id}`,
    userId: state.userId,
    generation: state.generation,
    activeKeys: new Set(),
    isCurrent: (userId, generation) => state.userId === userId && state.generation === generation,
    setState: (next) => { statuses.push(next.status); },
  };
  return { lifecycle, statuses };
}

test("failed category mutations preserve state and expose only safe errors", async () => {
  const state = [active];
  const before = [...state];
  const context = mutationLifecycle({ userId: "user-a", generation: 1 });
  await assert.rejects(executeFinanceMutation(context.lifecycle, async () => {
    throw { code: "23505", message: "private database detail" };
  }, (confirmed: Category) => { state.splice(0, state.length, ...mergeConfirmedCategory(state, confirmed)); }),
  (error) => error instanceof FinanceError && error.code === "duplicate_record" && !error.message.includes("private"));
  assert.deepEqual(state, before);
  assert.deepEqual(context.statuses, ["saving", "error"]);
});

test("stale category mutations cannot commit after a user change", async () => {
  const state = { userId: "user-a" as string | null, generation: 1 };
  const context = mutationLifecycle(state);
  let release!: (category: Category) => void;
  const remote = new Promise<Category>((resolve) => { release = resolve; });
  let commits = 0;
  const pending = executeFinanceMutation(context.lifecycle, async () => remote, () => { commits += 1; });
  state.userId = "user-b";
  state.generation += 1;
  release(active);
  await assert.rejects(pending, (error) => error instanceof FinanceError && error.code === "unknown_repository_error");
  assert.equal(commits, 0);
});

test("hydration guards reject old users and logged-out generations", () => {
  assert.equal(isCurrentFinanceHydration(true, 2, "user-b", 1, "user-a"), false);
  assert.equal(isCurrentFinanceHydration(true, 2, null, 2, "user-a"), false);
});

test("provider exposes category state and mutations, clears logout state, and has no delete", async () => {
  const source = await readFile("src/components/FinanceDataProvider.tsx", "utf8");
  assert.match(source, /categories: Category\[\]/);
  assert.match(source, /activeCategories: Category\[\]/);
  assert.match(source, /setCategories\(\[\]\)/);
  assert.match(source, /categoryRepository\.listAllCategories\(\)/);
  for (const method of ["createCategory", "updateCategory", "archiveCategory", "restoreCategory"]) assert.match(source, new RegExp(method));
  assert.doesNotMatch(source, /deleteCategory/);
});
