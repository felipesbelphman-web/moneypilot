export type GoalPriority = "primary" | "secondary";

export type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string;
  priority: GoalPriority;
};

export function normalizeGoalName(name: string) {
  return name.trim().toLocaleLowerCase();
}

export function selectPrimaryGoal(goals: Goal[]) {
  return goals.find((goal) => goal.priority === "primary") ?? goals[0] ?? null;
}

export function isValidTargetMonth(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function formatGoalTargetDate(targetDate: string, language: Language) {
  if (!isValidTargetMonth(targetDate)) return targetDate;
  const [year, month] = targetDate.split("-").map(Number);
  const locale = language === "pt" ? "pt-PT" : language === "es" ? "es-ES" : "en-IE";
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, 1)))
    .replace(/^./, (letter) => letter.toLocaleUpperCase(locale));
}
import type { Language } from "@/components/LanguageProvider";
