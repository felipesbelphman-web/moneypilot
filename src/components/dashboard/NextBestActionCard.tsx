import Image from "next/image";
import { useCurrency } from "@/components/CurrencyProvider";
import Link from "next/link";
import type { DashboardNextBestAction } from "@/components/dashboard/next-best-action";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";

export function NextBestActionCard({ action }: { action: DashboardNextBestAction }) {
  const { language } = useLanguage();
  const { formatMoney: money } = useCurrency(); const t = translations[language].appDashboard;
  const accent = action.tone === "warning" ? "#F59E0B" : action.tone === "positive" ? "#22C55E" : "#3B82F6";
  return <article className="flex h-[208px] w-[236px] shrink-0 flex-col gap-[14px] overflow-hidden rounded-[19.307px] border border-[#28313B] bg-[rgba(8,11,15,0.20)] px-[14px] py-[12px]">
    <div className="flex h-[19px] items-center gap-[8px]"><Image src="/moneypilot/dashboard-next-best-action-icon.svg" alt="" width={18} height={18} className="size-[18px]" /><h2 className="whitespace-nowrap text-[14px] font-semibold text-[#F5F7FA]">{t.nextBestAction}</h2></div>
    <div className="flex min-h-0 flex-1 flex-col gap-[6px]"><p className="text-[9px] font-semibold uppercase tracking-[0.38px]" style={{ color: accent }}>{action.tone === "warning" ? "Needs attention" : "MoneyPilot insight"}</p><p className="text-[14px] font-semibold leading-[16px] text-[#F5F7FA]">{action.title}</p>{action.amount !== null && <strong className="text-[12px]" style={{ color: accent }}>{money(action.amount)}</strong>}<p className="text-[9.5px] leading-[12px] text-[#9CA6B2]">{action.description}</p></div>
    {action.href && action.ctaLabel ? <Link href={action.href} className="flex h-[28px] w-full shrink-0 items-center justify-center gap-[8px] rounded-[7.7px] bg-[#3B82F6] text-[11px] font-medium text-[#F5F7FA]">{action.ctaLabel} <span>→</span></Link> : <div className="h-[28px] shrink-0" />}
  </article>;
}
