import type { Goal } from "./goal-model.ts";
import { aggregateMoney, normalizeDerivedMoneyResult, type MoneyAggregationResult } from "../../lib/domain/money-aggregation.ts";

type GoalUnavailableReason = "invalid_operand" | "unsafe_aggregate";
export type GoalCalculation =
  | { available: true; unavailableReason: null; remainingAmount: number; progressRatio: number; actualProgressPercent: number; progressPercent: number; visualProgressPercent: number; monthsRemaining: number; requiredMonthlyContribution: number | null; isCompleted: boolean; isPastDue: boolean; isDueThisMonth: boolean }
  | { available: false; unavailableReason: GoalUnavailableReason; remainingAmount: null; progressRatio: null; actualProgressPercent: null; progressPercent: null; visualProgressPercent: null; monthsRemaining: null; requiredMonthlyContribution: null; isCompleted: null; isPastDue: null; isDueThisMonth: null };
export type GoalCollectionTotals =
  | { available: true; unavailableReason: null; targetAmount: number; savedAmount: number; remainingAmount: number; progressRatio: number | null; progressPercent: number | null }
  | { available: false; unavailableReason: GoalUnavailableReason; targetAmount: null; savedAmount: null; remainingAmount: null; progressRatio: null; progressPercent: null };

export function parseTargetMonth(targetDate: string) {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(targetDate);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) };
}

export function calculateGoal(goal: Pick<Goal, "targetAmount" | "savedAmount" | "targetDate">, now: Date = new Date()): GoalCalculation {
  const operands = aggregateMoney([goal.targetAmount, goal.savedAmount]);
  if (!operands.available || goal.targetAmount <= 0 || goal.savedAmount < 0) return unavailable(operands.available ? "invalid_operand" : operands.reason);
  const difference = aggregateMoney([goal.targetAmount, -goal.savedAmount]);
  if (!difference.available) return unavailable(difference.reason);
  const remainingAmount = Math.max(0, difference.value);
  const progressRatio = goal.savedAmount / goal.targetAmount;
  const progressPercent = progressRatio * 100;
  if (!Number.isFinite(progressRatio) || progressRatio < 0 || !Number.isFinite(progressPercent)) return unavailable("invalid_operand");
  const isCompleted = remainingAmount === 0;
  const target = parseTargetMonth(goal.targetDate);
  const calendarDifference = target
    ? (target.year - now.getFullYear()) * 12 + (target.month - (now.getMonth() + 1))
    : null;
  const monthsRemaining = calendarDifference === null ? 0 : Math.max(0, calendarDifference);
  const isPastDue = calendarDifference !== null && calendarDifference < 0 && !isCompleted;
  const isDueThisMonth = calendarDifference === 0 && !isCompleted;
  const required = calculateRequiredMonthlyContribution(remainingAmount, calendarDifference, isCompleted);
  if (required && !required.available) return unavailable(required.reason);
  const visualProgressPercent = Math.min(100, progressPercent);
  return { available: true, unavailableReason: null, remainingAmount, progressRatio, actualProgressPercent: progressPercent, progressPercent: visualProgressPercent, visualProgressPercent, monthsRemaining, requiredMonthlyContribution: required?.value ?? null, isCompleted, isPastDue, isDueThisMonth };
}

export function calculateGoalCollectionTotals(goals: readonly Pick<Goal, "targetAmount" | "savedAmount" | "targetDate">[]): GoalCollectionTotals {
  const target = aggregateMoney(goals.map((goal) => goal.targetAmount));
  const saved = aggregateMoney(goals.map((goal) => goal.savedAmount));
  if (!target.available || !saved.available) return unavailableTotals(!target.available ? target.reason : saved.available ? "unsafe_aggregate" : saved.reason);
  const remainingValues: number[] = [];
  for (const goal of goals) {
    const calculation = calculateGoal(goal);
    if (!calculation.available) return unavailableTotals(calculation.unavailableReason);
    remainingValues.push(calculation.remainingAmount);
  }
  const remaining = aggregateMoney(remainingValues);
  if (!remaining.available) return unavailableTotals(remaining.reason);
  const progressRatio = target.value > 0 ? saved.value / target.value : null;
  if (progressRatio !== null && !Number.isFinite(progressRatio)) return unavailableTotals("unsafe_aggregate");
  return { available: true, unavailableReason: null, targetAmount: target.value, savedAmount: saved.value, remainingAmount: remaining.value, progressRatio, progressPercent: progressRatio === null ? null : progressRatio * 100 };
}

function calculateRequiredMonthlyContribution(remainingAmount: number, calendarDifference: number | null, isCompleted: boolean): MoneyAggregationResult | null {
  if (isCompleted) return { available: true, value: 0 };
  if (calendarDifference === null || calendarDifference < 0) return null;
  if (calendarDifference === 0) return { available: true, value: remainingAmount };
  return normalizeDerivedMoneyResult(remainingAmount / calendarDifference);
}
function unavailable(unavailableReason: GoalUnavailableReason): GoalCalculation { return { available: false, unavailableReason, remainingAmount: null, progressRatio: null, actualProgressPercent: null, progressPercent: null, visualProgressPercent: null, monthsRemaining: null, requiredMonthlyContribution: null, isCompleted: null, isPastDue: null, isDueThisMonth: null }; }
function unavailableTotals(unavailableReason: GoalUnavailableReason): GoalCollectionTotals { return { available: false, unavailableReason, targetAmount: null, savedAmount: null, remainingAmount: null, progressRatio: null, progressPercent: null }; }
