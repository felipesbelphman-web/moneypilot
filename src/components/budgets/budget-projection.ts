import type { Budget, BudgetAdjustment } from "@/components/budgets/budget-model";
import { calculateBudgetSpent } from "@/components/budgets/budget-model";
import type { Transaction } from "@/components/transactions/transaction-model";

export type BudgetProjection = {
  plannedTotal: number;
  spentTotal: number;
  remainingBudget: number;
  monthElapsedRatio: number;
  monthElapsedPercent: number;
  budgetUsedRatio: number;
  budgetUsedPercent: number;
  projectedTotal: number;
  projectedDifference: number;
  projectedOverBudget: boolean;
  adjustmentNeeded: number;
  remainingDays: number;
  remainingWeeks: number;
  suggestedWeeklyReduction: number;
  currentRemainingProjectedSpend: number;
  remainingSpendTarget: number;
  canProject: boolean;
};

type BudgetProjectionInput = {
  budgets: Budget[];
  transactions: Transaction[];
  month: string;
  now?: Date;
};

export function calculateBudgetProjection({ budgets, transactions, month, now = new Date() }: BudgetProjectionInput): BudgetProjection {
  const monthBudgets = budgets.filter((budget) => budget.month === month);
  const plannedTotal = monthBudgets.reduce((total, budget) => total + budget.budget, 0);
  const spentTotal = monthBudgets.reduce((total, budget) => total + calculateBudgetSpent(budget, transactions), 0);
  const remainingBudget = plannedTotal - spentTotal;
  const { monthElapsedRatio, remainingDays, canProject } = calculateMonthProgress(month, now);
  const budgetUsedRatio = plannedTotal > 0 ? spentTotal / plannedTotal : 0;
  const projectedTotal = canProject && monthElapsedRatio > 0 ? spentTotal / monthElapsedRatio : spentTotal;
  const projectedDifference = projectedTotal - plannedTotal;
  const adjustmentNeeded = Math.max(0, projectedDifference);
  const remainingWeeks = remainingDays / 7;
  const suggestedWeeklyReduction = adjustmentNeeded > 0 && remainingWeeks > 0 ? adjustmentNeeded / remainingWeeks : 0;
  const currentRemainingProjectedSpend = Math.max(0, projectedTotal - spentTotal);
  const remainingSpendTarget = Math.max(0, plannedTotal - spentTotal);

  return {
    plannedTotal,
    spentTotal,
    remainingBudget,
    monthElapsedRatio,
    monthElapsedPercent: monthElapsedRatio * 100,
    budgetUsedRatio,
    budgetUsedPercent: budgetUsedRatio * 100,
    projectedTotal,
    projectedDifference,
    projectedOverBudget: projectedDifference > 0,
    adjustmentNeeded,
    remainingDays,
    remainingWeeks,
    suggestedWeeklyReduction,
    currentRemainingProjectedSpend,
    remainingSpendTarget,
    canProject,
  };
}

export function canApplyBudgetAdjustment(projection: BudgetProjection) {
  return projection.canProject
    && projection.plannedTotal > 0
    && projection.adjustmentNeeded > 0
    && projection.remainingDays > 0;
}

export function createBudgetAdjustment(month: string, projection: BudgetProjection): BudgetAdjustment | null {
  if (!canApplyBudgetAdjustment(projection)) return null;
  return {
    month,
    targetRemainingSpend: projection.remainingSpendTarget,
    baselineProjectedTotal: projection.projectedTotal,
    adjustmentNeeded: projection.adjustmentNeeded,
    suggestedWeeklyReduction: projection.suggestedWeeklyReduction,
  };
}

function calculateMonthProgress(month: string, now: Date) {
  const [year, monthNumber] = month.split("-").map(Number);
  const daysInMonth = Number.isInteger(year) && monthNumber >= 1 && monthNumber <= 12
    ? new Date(year, monthNumber, 0).getDate()
    : 0;
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  if (daysInMonth === 0) return { monthElapsedRatio: 0, remainingDays: 0, canProject: false };
  if (month < currentMonth) return { monthElapsedRatio: 1, remainingDays: 0, canProject: false };
  if (month > currentMonth) return { monthElapsedRatio: 0, remainingDays: daysInMonth, canProject: false };

  const elapsedDays = Math.min(Math.max(now.getDate(), 1), daysInMonth);
  return {
    monthElapsedRatio: elapsedDays / daysInMonth,
    remainingDays: daysInMonth - elapsedDays,
    canProject: true,
  };
}
