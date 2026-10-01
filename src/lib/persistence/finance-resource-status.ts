import type { FinanceError } from "../domain/finance-error.ts";
import { financeResourceNames, type FinanceHydrationErrors, type FinanceHydrationResourceName } from "./finance-persistence-model.ts";

// "ready" means the latest hydration succeeded, not proven backend completeness.
// A successful empty result is a snapshot too. Retained snapshots are not ready.
export type FinanceResourceStatus =
  | { status: "ready"; hasSnapshot: true; error: null }
  | { status: "loading" | "unavailable"; hasSnapshot: boolean; error: null }
  | { status: "error"; hasSnapshot: boolean; error: FinanceError };
export type FinanceResourceStatuses = Readonly<Record<FinanceHydrationResourceName, FinanceResourceStatus>>;
const resources = [...financeResourceNames, "categories"] as const;

export function createFinanceResourceStatuses(): FinanceResourceStatuses {
  return Object.fromEntries(resources.map(resource => [resource, { status: "unavailable", hasSnapshot: false, error: null }])) as FinanceResourceStatuses;
}

export function beginFinanceResourceHydration(previous: FinanceResourceStatuses): FinanceResourceStatuses {
  return Object.fromEntries(resources.map(resource => [resource, { status: "loading", hasSnapshot: previous[resource].hasSnapshot, error: null }])) as FinanceResourceStatuses;
}

export function settleFinanceResourceStatuses(previous: FinanceResourceStatuses, errors: FinanceHydrationErrors): FinanceResourceStatuses {
  return Object.fromEntries(resources.map(resource => [resource, errors[resource]
    ? { status: "error", hasSnapshot: previous[resource].hasSnapshot, error: errors[resource] }
    : { status: "ready", hasSnapshot: true, error: null }])) as FinanceResourceStatuses;
}

export function failFinanceResourceStatuses(previous: FinanceResourceStatuses, error: FinanceError): FinanceResourceStatuses {
  return Object.fromEntries(resources.map(resource => [resource, { status: "error", hasSnapshot: previous[resource].hasSnapshot, error }])) as FinanceResourceStatuses;
}

export function areFinanceResourcesReady(statuses: FinanceResourceStatuses, required: readonly FinanceHydrationResourceName[]): boolean {
  return required.every(resource => statuses[resource].status === "ready");
}
