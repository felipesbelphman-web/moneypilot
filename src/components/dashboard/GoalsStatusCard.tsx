import Image from "next/image";
import { useCurrency } from "@/components/CurrencyProvider";
import Link from "next/link";
import type { DashboardGoalSummary } from "@/components/dashboard/dashboard-financial-summary";
import type { Language } from "@/components/LanguageProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { formatGoalTargetDate } from "@/components/goals/goal-model";
import { translations } from "@/i18n/translations";
import { GoalProgressRadial } from "@/components/dashboard/GoalProgressRadial";

export function GoalsStatusCard({ goal, currentMonth, showValues }: { goal: DashboardGoalSummary | null; currentMonth: string; showValues: boolean }) {
  const { language } = useLanguage();
  const t = translations[language].appDashboard;
  const displayGoal = goal && Number.isFinite(goal.goal.targetAmount) && goal.goal.targetAmount > 0 && Number.isFinite(goal.goal.savedAmount) && goal.goal.savedAmount >= 0 ? goal : null;
  const [year, monthNumber] = currentMonth.split("-");
  const periodLabel = `${translations[language].financialFlow.months[Number(monthNumber) - 1]} ${year}`;
  return <article className="flex min-h-[208px] w-full min-w-0 flex-col justify-between overflow-hidden rounded-[19.307px] border border-[#28313B] bg-[rgba(8,11,15,0.20)] p-[12px] box-border">
    <div className="flex items-center justify-between gap-[8px]"><div className="flex min-w-0 items-center gap-[7px]"><Image src="/moneypilot/dashboard-goal-target-icon.svg" alt="" width={18} height={18} className="size-[18px]" /><div className="min-w-0"><h2 className="text-[14px] font-semibold leading-none text-[#F5F7FA]">{t.goalsStatus}</h2><span className="mt-[3px] block text-[7.5px] text-[#9CA6B2]">{t.currentPeriod.replace("{period}", periodLabel)}</span></div></div><Link href="/goals" className="shrink-0 text-[9px] font-medium text-[var(--dashboard-brand-primary)]">{t.viewAll}</Link></div>
    {displayGoal ? <GoalDetails goal={displayGoal} showValues={showValues} language={language} /> : <div className="flex h-[112px] w-full min-w-0 flex-col items-center justify-center gap-[7px] rounded-[10px] border border-[#1E427A] bg-[var(--surface-blue-medium)] px-[14px] text-center"><strong className="text-[14px] text-[var(--goal-card-title)]">{t.noGoalYet}</strong><p className="text-[10px] leading-[14px] text-[#9CA6B2]">{t.createGoalHelp}</p></div>}
    <Link href="/goals" className="mt-[8px] flex h-[28px] w-full items-center justify-center gap-[24px] rounded-[8px] border border-[var(--dashboard-brand-primary)] text-[11.5px] font-medium text-[var(--dashboard-brand-primary)]">{displayGoal ? t.viewAllGoals : t.createGoal} <span>→</span></Link>
  </article>;
}

function GoalDetails({ goal, showValues, language }: { goal: DashboardGoalSummary; showValues: boolean; language: Language }) {
  const { formatMoney: money } = useCurrency();
  const t = translations[language].appDashboard;
  const { calculation, contributionPlan } = goal;
  const progress = Math.round(calculation.visualProgressPercent);
  const hidden = "••••••";
  const status = calculation.isCompleted ? t.goalCompleted : calculation.isPastDue ? t.reviewTargetDate : goal.isContributionPlanStale ? t.reviewNeeded : contributionPlan ? t.planActive : t.onSchedule;
  const required = calculation.requiredMonthlyContribution === null ? "—" : money(calculation.requiredMonthlyContribution);
  return <div className="flex h-[112px] w-full min-w-0 flex-col gap-[6px] rounded-[10px] border border-[#1E427A] bg-[var(--surface-blue-medium)] p-[9px] box-border">
    <div className="flex items-center justify-between gap-[8px]"><div className="flex min-w-0 items-center gap-[5px] text-[8px] font-semibold text-[var(--dashboard-brand-primary)]"><Image src="/moneypilot/dashboard-goal-star-icon.svg" alt="" width={10} height={10} className="size-[10px]" /><span className="min-w-0 break-words">{goal.goal.name}</span></div><span className="rounded-full bg-[#22C55E]/10 px-[7px] py-[2px] text-[7px] font-medium text-[#22C55E]">{status}</span></div>
    {!showValues ? <div className="flex flex-1 items-center justify-center text-[9px] text-[#9CA6B2]">{t.valuesHidden}</div> : <div className="flex min-w-0 items-center gap-[9px]"><div className="size-[66px] shrink-0"><GoalProgressRadial percent={progress} /></div>
      <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-[8px] gap-y-[2px] text-[8px]"><Metric label={t.saved} value={showValues ? money(goal.goal.savedAmount) : hidden} /><Metric label={t.target} value={showValues ? money(goal.goal.targetAmount) : hidden} /><Metric label={t.remaining} value={showValues ? money(calculation.remainingAmount) : hidden} /><Metric label={t.requiredPerMonth} value={showValues ? required : hidden} /><span className="col-span-2 break-words text-[#9CA6B2]">{t.targetLabel} {formatGoalTargetDate(goal.goal.targetDate, language)}</span>{contributionPlan && <span className="col-span-2 break-words text-[var(--dashboard-brand-accent)]">{t.planTargetLabel} {showValues ? money(contributionPlan.monthlyTarget) : hidden}{goal.isContributionPlanStale ? ` · ${t.reviewNeeded}` : ` · ${t.active}`}</span>}</div>
    </div>}
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <span className="truncate text-[#9CA6B2]">{label}: <strong className="numeric-value text-[#F5F7FA]">{value}</strong></span>; }
