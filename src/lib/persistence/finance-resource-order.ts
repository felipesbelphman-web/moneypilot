import type { FinanceResourceName } from "./finance-persistence-model.ts";

export type FinanceOrderTerm = Readonly<{
  column: string;
  ascending: boolean;
}>;

export const financeResourceOrder: Readonly<Record<FinanceResourceName, readonly FinanceOrderTerm[]>> = {
  accountBalanceSettings: [],
  transactions: [
    { column: "date_iso", ascending: false },
    { column: "created_at", ascending: false },
    { column: "id", ascending: true },
  ],
  budgets: [
    { column: "month", ascending: false },
    { column: "created_at", ascending: false },
    { column: "id", ascending: true },
  ],
  budgetAdjustments: [{ column: "month", ascending: false }],
  goals: [
    { column: "target_date", ascending: true },
    { column: "created_at", ascending: true },
    { column: "id", ascending: true },
  ],
  goalContributionPlans: [{ column: "goal_id", ascending: true }],
  investments: [
    { column: "created_at", ascending: true },
    { column: "id", ascending: true },
  ],
};

type OrderableQuery = {
  order(column: string, options: { ascending: boolean }): OrderableQuery;
};

export function applyFinanceResourceOrder<Query extends OrderableQuery>(query: Query, resource: FinanceResourceName): Query {
  let ordered: OrderableQuery = query;
  for (const term of financeResourceOrder[resource]) {
    ordered = ordered.order(term.column, { ascending: term.ascending });
  }
  return ordered as Query;
}

export function compareByFinanceOrder(
  terms: readonly FinanceOrderTerm[],
  left: Readonly<Record<string, string | number | null>>,
  right: Readonly<Record<string, string | number | null>>,
) {
  for (const term of terms) {
    const comparison = compareNullable(left[term.column] ?? null, right[term.column] ?? null);
    if (comparison !== 0) return term.ascending ? comparison : -comparison;
  }
  return 0;
}

function compareNullable(left: string | number | null, right: string | number | null) {
  if (left === right) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return left < right ? -1 : 1;
}
