import Image from "next/image";
import { useCurrency } from "@/components/CurrencyProvider";
import Link from "next/link";
import type { BudgetProjection } from "@/components/budgets/budget-projection";
import type { DashboardMonthlyStatus } from "@/components/dashboard/dashboard-financial-summary";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";

export function MonthlyStatusCard({ status, projection }: { status: DashboardMonthlyStatus; projection: BudgetProjection }) {
  const { language } = useLanguage();
  const { formatMoney: money } = useCurrency(); const t = translations[language].appDashboard;
  const content = status === "within_budget" ? { label: "On track", description: "Projected spending is within your monthly budget.", color: "#22C55E", background: "var(--surface-green-strong)" } : status === "over_budget" ? { label: "Needs attention", description: "Projected spending is above your monthly budget.", color: "#F59E0B", background: "rgba(245,158,11,0.12)" } : { label: "No budget yet", description: "Create a monthly budget to unlock spending projections.", color: "#60A5FA", background: "var(--surface-blue-medium)" };
  return <article className="flex h-[212px] w-[236px] shrink-0 flex-col items-start justify-between overflow-hidden rounded-[19.307px] border border-[#28313B] bg-[rgba(8,11,15,0.20)] p-[14px]">
    <div className="flex items-center gap-[7px]"><Image src="/moneypilot/dashboard-monthly-status-icon.svg" alt="" width={18} height={18} className="size-[18px]" /><h2 className="text-[14.2px] font-semibold text-[#F5F7FA]">{t.monthStatus}</h2></div>
    <div className="flex w-full flex-col gap-[8px]"><div className="rounded-[10px] px-[10px] py-[7px]" style={{ background: content.background }}><p className="text-[13.2px] font-semibold" style={{ color: content.color }}>{content.label}</p></div><p className="text-[9.5px] leading-[12px] text-[#9CA6B2]">{content.description}</p>{status !== "no_budget" && <div className="flex justify-between text-[8.5px] text-[#9CA6B2]"><span>Budget <strong className="text-[#F5F7FA]">{money(projection.plannedTotal)}</strong></span><span>Projected <strong className="text-[#F5F7FA]">{money(projection.projectedTotal)}</strong></span></div>}</div>
    <Link href={status === "no_budget" ? "/budgets" : "/insights"} className="flex h-[28px] w-full items-center justify-center gap-[16px] text-[9.8px] font-medium text-[#3B82F6]">{status === "no_budget" ? "Create budget" : t.viewDiagnosis} <span>→</span></Link>
  </article>;
}
