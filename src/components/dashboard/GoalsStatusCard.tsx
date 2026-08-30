import Image from "next/image";
import { useCurrency } from "@/components/CurrencyProvider";
import Link from "next/link";
import type { DashboardGoalSummary } from "@/components/dashboard/dashboard-financial-summary";
import type { Language } from "@/components/LanguageProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { formatGoalTargetDate } from "@/components/goals/goal-model";
import { translations } from "@/i18n/translations";

export function GoalsStatusCard({ goal, showValues }: { goal: DashboardGoalSummary | null; showValues: boolean }) {
  const { language } = useLanguage();
  const t = translations[language].appDashboard;
  return <article className="flex h-[208px] w-[353px] shrink-0 flex-col justify-between overflow-hidden rounded-[19.307px] border border-[#28313B] bg-[rgba(8,11,15,0.20)] p-[12px]">
    <div className="flex items-center justify-between"><div className="flex items-center gap-[7px]"><Image src="/moneypilot/dashboard-goal-target-icon.svg" alt="" width={18} height={18} className="size-[18px]" /><h2 className="text-[14px] font-semibold text-[#F5F7FA]">{t.goalsStatus}</h2></div><Link href="/goals" className="text-[9px] font-medium text-[#3B82F6]">{t.viewAll}</Link></div>
    {goal ? <GoalDetails goal={goal} showValues={showValues} language={language} /> : <div className="flex h-[112px] w-full flex-col items-center justify-center gap-[7px] rounded-[10px] border border-[#1E427A] bg-[var(--surface-blue-medium)] px-[14px] text-center"><strong className="text-[14px] text-[var(--goal-card-title)]">No goal yet</strong><p className="text-[10px] leading-[14px] text-[#9CA6B2]">Create a financial goal to start tracking progress.</p></div>}
    <Link href="/goals" className="flex h-[28px] w-full items-center justify-center gap-[24px] rounded-[8px] border border-[#28313B] text-[11.5px] font-medium text-[#3B82F6]">{goal ? t.viewAllGoals : "Create goal"} <span>→</span></Link>
  </article>;
}

function GoalDetails({ goal, showValues, language }: { goal: DashboardGoalSummary; showValues: boolean; language: Language }) {
  const { formatMoney: money } = useCurrency();
  const { calculation, contributionPlan } = goal;
  const progress = Math.round(calculation.progressPercent);
  const hidden = "••••••";
  const status = calculation.isCompleted ? "Goal completed" : calculation.isPastDue ? "Review target date" : goal.isContributionPlanStale ? "Review needed" : contributionPlan ? "Plan active" : "On schedule";
  const required = calculation.requiredMonthlyContribution === null ? "—" : money(calculation.requiredMonthlyContribution);
  return <div className="flex h-[112px] w-full flex-col gap-[6px] rounded-[10px] border border-[#1E427A] bg-[var(--surface-blue-medium)] p-[9px]">
    <div className="flex items-center justify-between"><div className="flex min-w-0 items-center gap-[5px] text-[8px] font-semibold text-[#3B82F6]"><Image src="/moneypilot/dashboard-goal-star-icon.svg" alt="" width={10} height={10} className="size-[10px]" /><span className="truncate">{goal.goal.name}</span></div><span className="rounded-full bg-[#22C55E]/10 px-[7px] py-[2px] text-[7px] font-medium text-[#22C55E]">{status}</span></div>
    <div className="flex items-center gap-[9px]"><div className="relative grid size-[66px] shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#3B82F6 0 ${progress}%, #17365A ${progress}% 100%)` }}><div className="absolute size-[57px] rounded-full bg-[var(--surface-blue-medium)]" /><strong className="relative text-[18px] font-semibold text-[#3B82F6]">{progress}%</strong></div>
      <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-[8px] gap-y-[2px] text-[8px]"><Metric label="Saved" value={showValues ? money(goal.goal.savedAmount) : hidden} /><Metric label="Target" value={showValues ? money(goal.goal.targetAmount) : hidden} /><Metric label="Remaining" value={showValues ? money(calculation.remainingAmount) : hidden} /><Metric label="Required / month" value={showValues ? required : hidden} /><span className="col-span-2 truncate text-[#9CA6B2]">Target: {formatGoalTargetDate(goal.goal.targetDate, language)}</span>{contributionPlan && <span className="col-span-2 truncate text-[#60A5FA]">Plan target: {showValues ? money(contributionPlan.monthlyTarget) : hidden}{goal.isContributionPlanStale ? " · Review needed" : " · Active"}</span>}</div>
    </div>
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <span className="truncate text-[#9CA6B2]">{label}: <strong className="text-[#F5F7FA]">{value}</strong></span>; }
