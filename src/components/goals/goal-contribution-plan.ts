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

export function calculateGoalPlanImpact(remainingAmount: number, baselineMonthlyContribution: number | null, newMonthlyContribution: number): GoalPlanImpact {
  if (!Number.isFinite(remainingAmount) || remainingAmount <= 0 || baselineMonthlyContribution === null || !Number.isFinite(baselineMonthlyContribution) || baselineMonthlyContribution <= 0 || !Number.isFinite(newMonthlyContribution) || newMonthlyContribution <= 0) {
    return { monthsWithoutPlan: null, monthsWithPlan: null, estimatedMonthsEarlier: 0 };
  }
  const monthsWithoutPlan = remainingAmount / baselineMonthlyContribution;
  const monthsWithPlan = remainingAmount / newMonthlyContribution;
  return { monthsWithoutPlan, monthsWithPlan, estimatedMonthsEarlier: Math.max(0, monthsWithoutPlan - monthsWithPlan) };
}

export function isGoalContributionPlanStale(plan: GoalContributionPlan, currentRequiredContribution: number | null, currentSavingsCapacity: number) {
  return currentRequiredContribution === null
    || Math.abs(plan.baselineRequiredMonthlyContribution - currentRequiredContribution) > 0.01
    || Math.abs(plan.savingsBoost - currentSavingsCapacity) > 0.01;
}
