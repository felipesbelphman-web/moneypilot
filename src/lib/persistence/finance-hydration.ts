import { FinanceError, mapFinanceRepositoryError } from "../domain/finance-error.ts";
import {
  financeResourceNames,
  type FinanceLoadResult,
  type FinanceResourceErrors,
  type FinanceResourceName,
  type FinanceResourceResult,
  type PersistedFinanceData,
} from "./finance-persistence-model.ts";
import type { Category } from "../domain/category.ts";
import type { FinanceHydrationErrors } from "./finance-persistence-model.ts";

export type FinanceResourceLoaders = {
  [Resource in FinanceResourceName]: () => Promise<PersistedFinanceData[Resource]>;
};

export async function settleFinanceResourceLoaders(loaders: FinanceResourceLoaders): Promise<FinanceLoadResult> {
  const [accountBalanceSettings, transactions, budgets, budgetAdjustments, goals, goalContributionPlans, investments] = await Promise.all([
    settleResource("accountBalanceSettings", loaders.accountBalanceSettings),
    settleResource("transactions", loaders.transactions),
    settleResource("budgets", loaders.budgets),
    settleResource("budgetAdjustments", loaders.budgetAdjustments),
    settleResource("goals", loaders.goals),
    settleResource("goalContributionPlans", loaders.goalContributionPlans),
    settleResource("investments", loaders.investments),
  ]);
  return { accountBalanceSettings, transactions, budgets, budgetAdjustments, goals, goalContributionPlans, investments };
}

export function mergeFinanceLoadResult(previous: PersistedFinanceData, result: FinanceLoadResult) {
  const data = { ...previous };
  const errors: FinanceResourceErrors = {};

  for (const resource of financeResourceNames) {
    const resourceResult = result[resource];
    if (resourceResult.status === "success") {
      assignResourceData(data, resource, resourceResult.data);
    } else {
      errors[resource] = resourceResult.error;
    }
  }

  return { data, errors };
}

export function aggregateFinanceHydrationError(errors: FinanceHydrationErrors): FinanceError | null {
  return [...financeResourceNames, "categories" as const].map((resource) => errors[resource]).find(Boolean) ?? null;
}

export type CategoryLoadResult =
  | { resource: "categories"; status: "success"; data: Category[] }
  | { resource: "categories"; status: "failure"; error: FinanceError };

export async function settleCategoryLoader(loader: () => Promise<Category[]>): Promise<CategoryLoadResult> {
  try {
    return { resource: "categories", status: "success", data: await loader() };
  } catch (error: unknown) {
    return { resource: "categories", status: "failure", error: mapFinanceRepositoryError(error) };
  }
}

export async function settleFinanceProviderHydration(
  loadFinance: () => Promise<FinanceLoadResult>,
  loadCategories: () => Promise<Category[]>,
) {
  const [finance, categories] = await Promise.all([loadFinance(), settleCategoryLoader(loadCategories)]);
  return { finance, categories };
}

export function mergeCategoryLoadResult(previous: Category[], result: CategoryLoadResult) {
  return result.status === "success"
    ? { categories: sortCategories(result.data), error: null }
    : { categories: previous, error: result.error };
}

export function sortCategories(categories: readonly Category[]): Category[] {
  return [...categories].sort((left, right) => left.type.localeCompare(right.type)
    || left.normalizedName.localeCompare(right.normalizedName)
    || left.id.localeCompare(right.id));
}

export function selectActiveCategories(categories: readonly Category[]): Category[] {
  return categories.filter((category) => category.archivedAt === null);
}

export function mergeConfirmedCategory(categories: readonly Category[], confirmed: Category): Category[] {
  const next = categories.some((category) => category.id === confirmed.id)
    ? categories.map((category) => category.id === confirmed.id ? confirmed : category)
    : [...categories, confirmed];
  return sortCategories(next);
}

export function requireCompleteFinanceData(result: FinanceLoadResult): PersistedFinanceData {
  const merged = mergeFinanceLoadResult(createEmptyFinanceData(), result);
  const firstError = aggregateFinanceHydrationError(merged.errors);
  if (firstError) throw firstError;
  return merged.data;
}

export function createEmptyFinanceData(): PersistedFinanceData {
  return {
    accountBalanceSettings: null,
    transactions: [],
    budgets: [],
    budgetAdjustments: [],
    goals: [],
    goalContributionPlans: [],
    investments: [],
  };
}

export function financeDataAfterUserChange(
  previousUserId: string | null,
  nextUserId: string | null,
  current: PersistedFinanceData,
) {
  return previousUserId === nextUserId ? current : createEmptyFinanceData();
}

export function isCurrentFinanceHydration(
  active: boolean,
  currentGeneration: number,
  currentUserId: string | null,
  requestGeneration: number,
  requestUserId: string,
) {
  return active && currentGeneration === requestGeneration && currentUserId === requestUserId;
}

async function settleResource<Resource extends FinanceResourceName>(
  resource: Resource,
  loader: () => Promise<PersistedFinanceData[Resource]>,
): Promise<FinanceResourceResult<Resource>> {
  try {
    return { resource, status: "success", data: await loader() };
  } catch (error: unknown) {
    return { resource, status: "failure", error: mapFinanceRepositoryError(error) };
  }
}

function assignResourceData<Resource extends FinanceResourceName>(
  data: PersistedFinanceData,
  resource: Resource,
  value: PersistedFinanceData[Resource],
) {
  data[resource] = value;
}

export function authenticationHydrationError(): FinanceError {
  return new FinanceError("authentication_required");
}
