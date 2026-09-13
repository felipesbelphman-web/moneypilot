import Image from "next/image";
import { useCurrency } from "@/components/CurrencyProvider";
import Link from "next/link";
import { resolveNextBestActionCopy, type DashboardNextBestAction } from "@/components/dashboard/next-best-action";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";
import { activeBudgetPlanCopyByLanguage } from "@/i18n/dashboard-copy";

export function NextBestActionCard({ action, month, currentMonth }: { action: DashboardNextBestAction; month: string; currentMonth: string }) {
  const { language } = useLanguage();
  const { formatMoney: money } = useCurrency(); const t = translations[language].appDashboard;
  const copy = resolveNextBestActionCopy(action, language);
  const activePlanCopy = activeBudgetPlanCopyByLanguage[language];
  const accent = action.tone === "warning" ? "#F59E0B" : action.tone === "positive" ? "#22C55E" : "var(--dashboard-brand-primary)";
  const [year, monthNumber] = month.split("-");
  const periodLabel = `${translations[language].financialFlow.months[Number(monthNumber) - 1]} ${year}`;
  const periodCaption = month === currentMonth ? t.currentPeriod.replace("{period}", periodLabel) : periodLabel;
  const actionHref = action.type === "insufficient_current_data"
    ? `/transactions?month=${month}`
    : action.type === "recovery_plan" || action.type === "review_budget" || action.type === "create_budget"
      ? `/budgets?month=${month}`
      : action.href;
  return <article className="flex min-h-[208px] w-full min-w-0 flex-col overflow-hidden rounded-[19.307px] border border-[#28313B] bg-[rgba(8,11,15,0.20)] px-[14px] py-[12px] box-border">
    <div className="flex h-[27px] shrink-0 items-center gap-[8px]"><Image src="/moneypilot/dashboard-next-best-action-icon.svg" alt="" width={18} height={18} className="size-[18px]" /><div className="min-w-0"><h2 className="whitespace-nowrap text-[14px] font-semibold leading-none text-[#F5F7FA]">{t.nextBestAction}</h2><span className="mt-[3px] block text-[7.5px] text-[#9CA6B2]">{periodCaption}</span></div></div>
    <div className="mt-[10px] flex min-h-0 flex-1 flex-col gap-[4px]"><p className="text-[9px] font-semibold uppercase tracking-[0.38px]" style={{ color: accent }}>{action.tone === "warning" ? t.needsAttention : t.moneyPilotInsight}</p><p className="text-[14px] font-semibold leading-[16px] text-[#F5F7FA]">{copy.title}</p>{action.type === "recovery_plan" && action.activeBudgetAdjustment ? <div className="grid gap-[2px] text-[9px] leading-[11px]"><p className="text-[#9CA6B2]">{activePlanCopy.targetLabel}: <strong className="numeric-value text-[#F5F7FA]">{money(action.activeBudgetAdjustment.targetRemainingSpend)}</strong></p><p className="text-[#9CA6B2]">{activePlanCopy.reductionAtSaveLabel}: <strong className="numeric-value" style={{ color: accent }}>{money(action.activeBudgetAdjustment.adjustmentNeeded)}</strong></p></div> : action.amount !== null && <p className="text-[9px] leading-[12px] text-[#9CA6B2]">{action.amountKind === "net_cash_flow" ? t.netCashFlow : t.budgetExceeded}: <strong className="numeric-value text-[12px]" style={{ color: accent }}>{money(action.amount)}</strong></p>}<p className="financial-copy-condensed text-[9px] leading-[11px] text-[#9CA6B2]">{copy.description}</p></div>
    {actionHref && copy.ctaLabel ? <Link href={actionHref} className="mt-auto flex h-[28px] w-full shrink-0 items-center justify-center gap-[8px] rounded-[7.7px] bg-[var(--dashboard-brand-primary-hover)] text-[11px] font-medium text-[#F5F7FA] transition-colors hover:bg-[var(--dashboard-brand-primary)] active:bg-[var(--dashboard-brand-primary-active)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dashboard-focus)] disabled:bg-[var(--dashboard-brand-soft)]">{copy.ctaLabel} <span>→</span></Link> : null}
  </article>;
}
