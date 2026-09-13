import type { Budget, BudgetAdjustment } from "../budgets/budget-model.ts";
import { calculateBudgetProjection } from "../budgets/budget-projection.ts";
import type { Transaction } from "../transactions/transaction-model.ts";
import { aggregateMoney, normalizeDerivedMoneyResult } from "../../lib/domain/money-aggregation.ts";

export const SAFE_CAPACITY_RATIO = 0.5;
type UnavailableReason = "overlapping_categories" | "invalid_operand" | "unsafe_aggregate";
export type GoalSavingsCapacity =
  | { available: true; unavailableReason: null; month: string; plannedTotal: number; spentTotal: number; remainingBudget: number; projectedTotal: number; projectedDifference: number; activeAdjustmentTarget: number | null; rawCapacity: number; safeMonthlyCapacity: number; source: "budget_headroom" | "active_adjustment" | "none"; canContribute: boolean }
  | { available: false; unavailableReason: UnavailableReason; month: string; plannedTotal: null; spentTotal: null; remainingBudget: null; projectedTotal: null; projectedDifference: null; activeAdjustmentTarget: null; rawCapacity: null; safeMonthlyCapacity: null; source: "unavailable"; canContribute: false };
type Input = { budgets: Budget[]; transactions: Transaction[]; month: string; adjustment?: BudgetAdjustment; now?: Date };
export function getCurrentFinancialMonth(now: Date = new Date()) { return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; }
export function calculateGoalSavingsCapacity({ budgets, transactions, month, adjustment, now = new Date() }: Input): GoalSavingsCapacity {
  const projection = calculateBudgetProjection({ budgets, transactions, month, now });
  if (!projection.available) return unavailable(month, projection.unavailableReason);
  if (adjustment && !aggregateMoney([adjustment.targetRemainingSpend]).available) return unavailable(month, "invalid_operand");
  const headroom = projection.projectedDifference < 0 ? aggregateMoney([-projection.projectedDifference]) : { available: true, value: 0 } as const;
  if (!headroom.available) return unavailable(month, headroom.reason);
  const rawCapacity = projection.canProject && projection.plannedTotal > 0 ? headroom.value : 0;
  const safeMonthlyCapacity = normalizeDerivedMoneyResult(rawCapacity * SAFE_CAPACITY_RATIO);
  if (!safeMonthlyCapacity.available) return unavailable(month, safeMonthlyCapacity.reason);
  const hasCapacity = safeMonthlyCapacity.value > 0;
  return { available: true, unavailableReason: null, month, plannedTotal: projection.plannedTotal, spentTotal: projection.spentTotal, remainingBudget: projection.remainingBudget,
    projectedTotal: projection.projectedTotal, projectedDifference: projection.projectedDifference, activeAdjustmentTarget: adjustment?.targetRemainingSpend ?? null,
    rawCapacity, safeMonthlyCapacity: safeMonthlyCapacity.value, source: adjustment ? "active_adjustment" : hasCapacity ? "budget_headroom" : "none", canContribute: hasCapacity };
}
function unavailable(month: string, unavailableReason: UnavailableReason): GoalSavingsCapacity {
  return { available: false, unavailableReason, month, plannedTotal: null, spentTotal: null, remainingBudget: null, projectedTotal: null, projectedDifference: null,
    activeAdjustmentTarget: null, rawCapacity: null, safeMonthlyCapacity: null, source: "unavailable", canContribute: false };
}
