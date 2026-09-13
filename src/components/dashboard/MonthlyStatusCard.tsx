import Image from "next/image";
import Link from "next/link";
import type { BudgetProjection } from "@/components/budgets/budget-projection";
import type { DashboardMonthlyStatus } from "@/components/dashboard/dashboard-financial-summary";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";
import { MonthlyBudgetRadialGauge } from "@/components/dashboard/MonthlyBudgetRadialGauge";

export function MonthlyStatusCard({ month, currentMonth, status, projection, showValues }: { month: string; currentMonth: string; status: DashboardMonthlyStatus; projection: BudgetProjection; showValues: boolean }) {
  const { language } = useLanguage();
  const t = translations[language].appDashboard;
  const [year, monthNumber] = month.split("-");
  const periodLabel = `${translations[language].financialFlow.months[Number(monthNumber) - 1]} ${year}`;
  const isPastMonth = month < currentMonth;
  const isHistoricalWithoutBudget = isPastMonth && status === "no_budget";
  const content = status === "within_budget" ? { label: t.onTrackStatus, description: isPastMonth ? t.withinBudgetActual : t.withinBudgetProjection, color: "#22C55E", background: "var(--surface-green-strong)" } : status === "over_budget" ? { label: t.needsAttention, description: isPastMonth ? t.aboveBudgetActual : t.aboveBudgetProjection, color: "#F59E0B", background: "rgba(245,158,11,0.12)" } : isHistoricalWithoutBudget ? { label: t.noBudgetRecorded, description: t.noBudgetRecordedDescription, color: "var(--dashboard-brand-primary)", background: "var(--dashboard-brand-50)" } : { label: t.noBudgetYet, description: t.createBudgetProjection, color: "var(--dashboard-brand-primary)", background: "var(--dashboard-brand-50)" };
  const usage = projection.budgetUsage;
  const excessPercent = usage.available ? Math.max(0, usage.percent - 100) : 0;
  const excessLabel = excessPercent > 0 ? `${t.budgetExceeded} · ${t.budgetExceededBy.replace("{percentage}", excessPercent.toLocaleString(language, { maximumFractionDigits: 1 }))}` : null;
  const usageUnavailable = usage.hasOverlappingCategories ? t.budgetUsageUnavailable : content.description;
  const unavailableLabel = usage.hasOverlappingCategories ? t.budgetLabel : content.label;

  return <article className="flex min-h-[212px] w-full min-w-0 flex-col items-start justify-between overflow-hidden rounded-[19.307px] border border-[#28313B] bg-[rgba(8,11,15,0.20)] p-[14px] box-border">
    <div className="flex w-full items-center justify-between"><div className="flex items-center gap-[7px]"><Image src="/moneypilot/dashboard-monthly-status-icon.svg" alt="" width={18} height={18} className="size-[18px]" /><h2 className="text-[14.2px] font-semibold text-[#F5F7FA]">{t.monthStatus}</h2></div><span className="text-[7.5px] text-[#9CA6B2]">{periodLabel}</span></div>
    {!showValues ? <div className="flex h-[124px] w-full items-center justify-center rounded-[12px] border border-[var(--financial-flow-divider)] bg-[var(--financial-summary-surface)] px-[18px] text-center"><p className="text-[9px] font-medium text-[var(--financial-flow-muted)]">{t.valuesHidden}</p></div> : usage.available ? <MonthlyBudgetRadialGauge excessLabel={excessLabel} label={t.budgetUsedLabel} limit={usage.plannedTotal} month={month} percent={usage.percent} spent={usage.spentTotal} spentLabel={t.budgetSpentLabel} /> : <div className="flex h-[112px] w-full flex-col justify-center gap-[8px]"><div className="rounded-[10px] px-[10px] py-[7px]" style={{ background: content.background }}><p className="text-[13.2px] font-semibold" style={{ color: content.color }}>{unavailableLabel}</p></div><p className="financial-copy-condensed text-[9.5px] leading-[12px] text-[#9CA6B2]">{usageUnavailable}</p></div>}
    {!showValues || isHistoricalWithoutBudget ? <div className="h-[28px] w-full" /> : <Link href={usage.available ? "/insights" : `/budgets?month=${month}`} className="mt-auto flex h-[28px] w-full items-center justify-center gap-[16px] text-[9.8px] font-medium text-[var(--dashboard-brand-primary)]">{usage.available ? t.viewDiagnosis : t.createBudget} <span>→</span></Link>}
  </article>;
}
