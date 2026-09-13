export function calculateBudgetMonthProgress(month: string, now: Date) {
  const [year, monthNumber] = month.split("-").map(Number);
  const daysInMonth = Number.isInteger(year) && monthNumber >= 1 && monthNumber <= 12
    ? new Date(year, monthNumber, 0).getDate()
    : 0;
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  if (daysInMonth === 0) return { monthElapsedRatio: 0, remainingDays: 0, canProject: false };
  if (month < currentMonth) return { monthElapsedRatio: 1, remainingDays: 0, canProject: false };
  if (month > currentMonth) return { monthElapsedRatio: 0, remainingDays: daysInMonth, canProject: false };

  const elapsedDays = Math.min(Math.max(now.getDate(), 1), daysInMonth);
  return { monthElapsedRatio: elapsedDays / daysInMonth, remainingDays: daysInMonth - elapsedDays, canProject: true };
}

export function projectSpendAtCurrentPace(spent: number, canProject: boolean, monthElapsedRatio: number) {
  return canProject && monthElapsedRatio > 0 ? spent / monthElapsedRatio : spent;
}

export function calculateBudgetIndicatorStatus(budget: number, spent: number, canProject = false, monthElapsedRatio = 0): BudgetIndicatorStatus {
  if (spent > budget) return "Limite ultrapassado";
  if (canProject && projectSpendAtCurrentPace(spent, canProject, monthElapsedRatio) > budget) return "Risco de ultrapassar";
  return "Dentro do limite";
}
export type BudgetIndicatorStatus = "Dentro do limite" | "Risco de ultrapassar" | "Limite ultrapassado";
