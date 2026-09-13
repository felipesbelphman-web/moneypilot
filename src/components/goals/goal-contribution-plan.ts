import { aggregateMoney, normalizeDerivedMoneyResult } from "../../lib/domain/money-aggregation.ts";

export type GoalContributionPlan = {
  goalId: string;
  monthlyTarget: number;
  baselineRequiredMonthlyContribution: number;
  savingsBoost: number;
  createdAt: string;
};

export type GoalPlanImpact = {
  monthsWithoutPlan: number | null;
  monthsWithPlan: number | null;
  estimatedMonthsEarlier: number;
};

export function calculateGoalPlanImpact(remainingAmount: number, baselineMonthlyContribution: number | null, newMonthlyContribution: number | null): GoalPlanImpact {
  if (!Number.isFinite(remainingAmount) || remainingAmount <= 0 || baselineMonthlyContribution === null || !Number.isFinite(baselineMonthlyContribution) || baselineMonthlyContribution <= 0 || newMonthlyContribution === null || !Number.isFinite(newMonthlyContribution) || newMonthlyContribution <= 0) {
    return { monthsWithoutPlan: null, monthsWithPlan: null, estimatedMonthsEarlier: 0 };
  }
  const monthsWithoutPlan = remainingAmount / baselineMonthlyContribution;
  const monthsWithPlan = remainingAmount / newMonthlyContribution;
  return { monthsWithoutPlan, monthsWithPlan, estimatedMonthsEarlier: Math.max(0, monthsWithoutPlan - monthsWithPlan) };
}

export function calculateGoalPlanMonthlyTarget(requiredMonthlyContribution: number, savingsBoost: number) {
  return aggregateMoney([requiredMonthlyContribution, savingsBoost]);
}

export function isGoalContributionPlanStale(plan: GoalContributionPlan, currentRequiredContribution: number | null, currentSavingsCapacity: number) {
  if (currentRequiredContribution === null) return true;
  const baselineDifference = aggregateMoney([plan.baselineRequiredMonthlyContribution, -currentRequiredContribution]);
  const capacityDifference = aggregateMoney([plan.savingsBoost, -currentSavingsCapacity]);
  if (!baselineDifference.available || !capacityDifference.available) return true;
  const normalizedBaseline = normalizeDerivedMoneyResult(Math.abs(baselineDifference.value));
  const normalizedCapacity = normalizeDerivedMoneyResult(Math.abs(capacityDifference.value));
  return !normalizedBaseline.available || !normalizedCapacity.available || normalizedBaseline.value > 0.01 || normalizedCapacity.value > 0.01;
}
