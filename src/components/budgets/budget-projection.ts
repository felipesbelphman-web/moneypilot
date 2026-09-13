import type { Budget, BudgetAdjustment } from "./budget-model.ts";
import { calculateBudgetSpent, normalizeCategory } from "./budget-model.ts";
import type { Transaction } from "../transactions/transaction-model.ts";
import { calculateBudgetMonthProgress } from "./budget-period.ts";
import { aggregateMoney, normalizeDerivedMoneyResult, type MoneyAggregationResult } from "../../lib/domain/money-aggregation.ts";

type BudgetUnavailableReason = "overlapping_categories" | "invalid_operand" | "unsafe_aggregate";
type BudgetUsage =
  | { available: true; hasOverlappingCategories: false; plannedTotal: number; spentTotal: number; percent: number }
  | { available: false; hasOverlappingCategories: boolean; plannedTotal: null; spentTotal: null; percent: null };
type AvailableBudgetProjection = {
  available: true; unavailableReason: null; budgetUsage: BudgetUsage;
  plannedTotal: number; spentTotal: number; remainingBudget: number; monthElapsedRatio: number; monthElapsedPercent: number;
  budgetUsedRatio: number | null; budgetUsedPercent: number | null; projectedTotal: number; projectedDifference: number;
  projectedOverBudget: boolean; adjustmentNeeded: number; remainingDays: number; remainingWeeks: number;
  suggestedWeeklyReduction: number; currentRemainingProjectedSpend: number; remainingSpendTarget: number; canProject: boolean;
};
type UnavailableBudgetProjection = {
  available: false; unavailableReason: BudgetUnavailableReason; budgetUsage: BudgetUsage;
  plannedTotal: null; spentTotal: null; remainingBudget: null; monthElapsedRatio: number; monthElapsedPercent: number;
  budgetUsedRatio: null; budgetUsedPercent: null; projectedTotal: null; projectedDifference: null;
  projectedOverBudget: false; adjustmentNeeded: null; remainingDays: number; remainingWeeks: number;
  suggestedWeeklyReduction: null; currentRemainingProjectedSpend: null; remainingSpendTarget: null; canProject: false;
};
export type BudgetProjection = AvailableBudgetProjection | UnavailableBudgetProjection;
type BudgetProjectionInput = { budgets: Budget[]; transactions: Transaction[]; month: string; now?: Date };

export function calculateBudgetProjection({ budgets, transactions, month, now = new Date() }: BudgetProjectionInput): BudgetProjection {
  const monthBudgets = budgets.filter((budget) => budget.month === month);
  const hasOverlappingCategories = hasCanonicalBudgetOverlap(monthBudgets);
  const { monthElapsedRatio, remainingDays, canProject } = calculateBudgetMonthProgress(month, now);
  if (hasOverlappingCategories) return unavailableProjection("overlapping_categories", monthElapsedRatio, remainingDays, true);
  const plannedTotal = aggregateMoney(monthBudgets.map((budget) => budget.budget));
  const spentByBudget = monthBudgets.map((budget) => calculateBudgetSpent(budget, transactions));
  const spentFailure = spentByBudget.find((result) => !result.available);
  const spentTotal = spentFailure ?? aggregateMoney(spentByBudget.flatMap((result) => result.available ? [result.value] : []));
  if (!plannedTotal.available || !spentTotal.available) return unavailableProjection(firstFailure(plannedTotal, spentTotal), monthElapsedRatio, remainingDays);
  const remainingBudget = aggregateMoney([plannedTotal.value, -spentTotal.value]);
  const budgetUsedRatio = plannedTotal.value > 0 ? safeRatio(spentTotal.value, plannedTotal.value) : null;
  const projectedTotal = canProject ? safeProjectedMoney(spentTotal.value, monthElapsedRatio) : { available: true, value: spentTotal.value } as const;
  if (!remainingBudget.available || (budgetUsedRatio && !budgetUsedRatio.available) || !projectedTotal.available) return unavailableProjection(firstFailure(remainingBudget, ...(budgetUsedRatio ? [budgetUsedRatio] : []), projectedTotal), monthElapsedRatio, remainingDays);
  const projectedDifference = aggregateMoney([projectedTotal.value, -plannedTotal.value]);
  const currentRemaining = aggregateMoney([projectedTotal.value, -spentTotal.value]);
  if (!projectedDifference.available || !currentRemaining.available) return unavailableProjection(firstFailure(projectedDifference, currentRemaining), monthElapsedRatio, remainingDays);
  const adjustmentNeeded = positiveMoney(projectedDifference.value);
  const currentRemainingProjectedSpend = positiveMoney(currentRemaining.value);
  const remainingSpendTarget = positiveMoney(remainingBudget.value);
  const remainingWeeks = remainingDays / 7;
  const suggestedWeeklyReduction = adjustmentNeeded > 0 && remainingWeeks > 0 ? normalizeDerivedMoneyResult(adjustmentNeeded / remainingWeeks) : { available: true, value: 0 } as const;
  if (!suggestedWeeklyReduction.available) return unavailableProjection(suggestedWeeklyReduction.reason, monthElapsedRatio, remainingDays);
  const budgetUsedPercent = budgetUsedRatio?.available ? budgetUsedRatio.value * 100 : null;
  const monthElapsedPercent = monthElapsedRatio * 100;
  if ((budgetUsedPercent !== null && !Number.isFinite(budgetUsedPercent)) || !Number.isFinite(monthElapsedPercent)) return unavailableProjection("invalid_operand", monthElapsedRatio, remainingDays);
  const budgetUsage: BudgetUsage = plannedTotal.value > 0 && budgetUsedPercent !== null
    ? { available: true, hasOverlappingCategories: false, plannedTotal: plannedTotal.value, spentTotal: spentTotal.value, percent: budgetUsedPercent }
    : { available: false, hasOverlappingCategories: false, plannedTotal: null, spentTotal: null, percent: null };
  return { available: true, unavailableReason: null, budgetUsage, plannedTotal: plannedTotal.value, spentTotal: spentTotal.value, remainingBudget: remainingBudget.value,
    monthElapsedRatio, monthElapsedPercent, budgetUsedRatio: budgetUsedRatio?.available ? budgetUsedRatio.value : null, budgetUsedPercent, projectedTotal: projectedTotal.value,
    projectedDifference: projectedDifference.value, projectedOverBudget: projectedDifference.value > 0, adjustmentNeeded, remainingDays, remainingWeeks,
    suggestedWeeklyReduction: suggestedWeeklyReduction.value, currentRemainingProjectedSpend, remainingSpendTarget, canProject };
}

export function hasCanonicalBudgetOverlap(budgets: Pick<Budget, "category">[]) {
  const categories = new Set<string>();
  for (const budget of budgets) { const category = normalizeCategory(budget.category); if (categories.has(category)) return true; categories.add(category); }
  return false;
}
function safeRatio(numerator: number, denominator: number): MoneyAggregationResult {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return { available: false, reason: "invalid_operand" };
  const value = numerator / denominator;
  return Number.isFinite(value) ? { available: true, value } : { available: false, reason: "invalid_operand" };
}
function safeProjectedMoney(spent: number, elapsedRatio: number) {
  if (!Number.isFinite(elapsedRatio) || elapsedRatio <= 0) return { available: false, reason: "invalid_operand" } as const;
  return normalizeDerivedMoneyResult(spent / elapsedRatio);
}
function positiveMoney(value: number) { return value > 0 ? value : 0; }
function firstFailure(...results: MoneyAggregationResult[]): "invalid_operand" | "unsafe_aggregate" {
  const failure = results.find((result) => !result.available);
  return failure && !failure.available ? failure.reason : "unsafe_aggregate";
}
function unavailableProjection(reason: BudgetUnavailableReason, monthElapsedRatio: number, remainingDays: number, overlap = false): BudgetProjection {
  const monthElapsedPercent = Number.isFinite(monthElapsedRatio * 100) ? monthElapsedRatio * 100 : 0;
  return { available: false, unavailableReason: reason, budgetUsage: { available: false, hasOverlappingCategories: overlap, plannedTotal: null, spentTotal: null, percent: null },
    plannedTotal: null, spentTotal: null, remainingBudget: null, monthElapsedRatio, monthElapsedPercent, budgetUsedRatio: null, budgetUsedPercent: null,
    projectedTotal: null, projectedDifference: null, projectedOverBudget: false, adjustmentNeeded: null, remainingDays, remainingWeeks: remainingDays / 7,
    suggestedWeeklyReduction: null, currentRemainingProjectedSpend: null, remainingSpendTarget: null, canProject: false };
}
export function canApplyBudgetAdjustment(projection: BudgetProjection): projection is AvailableBudgetProjection {
  return projection.available && projection.canProject && projection.plannedTotal > 0 && projection.adjustmentNeeded > 0 && projection.remainingDays > 0;
}
export function canUseBudgetProjection(projection: BudgetProjection): projection is AvailableBudgetProjection { return projection.available; }
export function createBudgetAdjustment(month: string, projection: BudgetProjection): BudgetAdjustment | null {
  if (!canApplyBudgetAdjustment(projection)) return null;
  return { month, targetRemainingSpend: projection.remainingSpendTarget, baselineProjectedTotal: projection.projectedTotal, adjustmentNeeded: projection.adjustmentNeeded, suggestedWeeklyReduction: projection.suggestedWeeklyReduction };
}
