import type { Budget, BudgetAdjustment } from "@/components/budgets/budget-model";
import { calculateBudgetProjection } from "@/components/budgets/budget-projection";
import type { Transaction } from "@/components/transactions/transaction-model";

// Conservative MVP buffer. A future version may make this configurable.
export const SAFE_CAPACITY_RATIO = 0.5;

export type GoalSavingsCapacity = {
  month: string;
  plannedTotal: number;
  spentTotal: number;
  remainingBudget: number;
  projectedTotal: number;
  projectedDifference: number;
  activeAdjustmentTarget: number | null;
  rawCapacity: number;
  safeMonthlyCapacity: number;
  source: "budget_headroom" | "active_adjustment" | "none";
  canContribute: boolean;
};

type Input = { budgets: Budget[]; transactions: Transaction[]; month: string; adjustment?: BudgetAdjustment; now?: Date };

export function getCurrentFinancialMonth(now: Date = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function calculateGoalSavingsCapacity({ budgets, transactions, month, adjustment, now = new Date() }: Input): GoalSavingsCapacity {
  const projection = calculateBudgetProjection({ budgets, transactions, month, now });
  const projectedHeadroom = Math.max(0, projection.plannedTotal - projection.projectedTotal);
  const rawCapacity = projection.canProject && projection.plannedTotal > 0 ? projectedHeadroom : 0;
  const safeMonthlyCapacity = rawCapacity * SAFE_CAPACITY_RATIO;
  const hasCapacity = Number.isFinite(safeMonthlyCapacity) && safeMonthlyCapacity > 0;
  return {
    month,
    plannedTotal: projection.plannedTotal,
    spentTotal: projection.spentTotal,
    remainingBudget: projection.remainingBudget,
    projectedTotal: projection.projectedTotal,
    projectedDifference: projection.projectedDifference,
    activeAdjustmentTarget: adjustment?.targetRemainingSpend ?? null,
    rawCapacity,
    safeMonthlyCapacity: hasCapacity ? safeMonthlyCapacity : 0,
    source: adjustment ? "active_adjustment" : hasCapacity ? "budget_headroom" : "none",
    canContribute: hasCapacity,
  };
}
