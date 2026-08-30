import type { Goal } from "@/components/goals/goal-model";

export type GoalCalculation = {
  remainingAmount: number;
  progressRatio: number;
  progressPercent: number;
  monthsRemaining: number;
  requiredMonthlyContribution: number | null;
  isCompleted: boolean;
  isPastDue: boolean;
  isDueThisMonth: boolean;
};

export function parseTargetMonth(targetDate: string) {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(targetDate);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) };
}

export function calculateGoal(goal: Pick<Goal, "targetAmount" | "savedAmount" | "targetDate">, now: Date = new Date()): GoalCalculation {
  const targetAmount = Number.isFinite(goal.targetAmount) ? Math.max(0, goal.targetAmount) : 0;
  const savedAmount = Number.isFinite(goal.savedAmount) ? Math.max(0, goal.savedAmount) : 0;
  const remainingAmount = Math.max(0, targetAmount - savedAmount);
  const rawProgress = targetAmount > 0 ? savedAmount / targetAmount : 0;
  const progressRatio = Math.min(1, Math.max(0, Number.isFinite(rawProgress) ? rawProgress : 0));
  const isCompleted = remainingAmount === 0 && targetAmount > 0;
  const target = parseTargetMonth(goal.targetDate);
  const calendarDifference = target
    ? (target.year - now.getFullYear()) * 12 + (target.month - (now.getMonth() + 1))
    : 0;
  const monthsRemaining = Math.max(0, calendarDifference);
  const isPastDue = Boolean(target && calendarDifference < 0 && !isCompleted);
  const isDueThisMonth = Boolean(target && calendarDifference === 0 && !isCompleted);
  const requiredMonthlyContribution = isCompleted
    ? 0
    : isPastDue || !target
      ? null
      : isDueThisMonth
        ? remainingAmount
        : remainingAmount > 0 && monthsRemaining > 0
          ? remainingAmount / monthsRemaining
          : null;

  return { remainingAmount, progressRatio, progressPercent: progressRatio * 100, monthsRemaining, requiredMonthlyContribution, isCompleted, isPastDue, isDueThisMonth };
}
