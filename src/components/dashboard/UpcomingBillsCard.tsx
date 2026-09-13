import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";

export function UpcomingBillsCard() {
  const { language } = useLanguage(); const t = translations[language].appDashboard;
  return <article className="flex min-h-[212px] w-full min-w-0 flex-col overflow-hidden rounded-[19.307px] border border-[#28313B] bg-[rgba(8,11,15,0.20)] p-[14px] box-border">
    <div className="flex w-full shrink-0 items-center gap-[7px]"><Image src="/moneypilot/dashboard-upcoming-bills-icon.svg" alt="" width={18} height={18} className="size-[18px]" /><h2 className="truncate text-[14.2px] font-semibold text-[#F5F7FA]">{t.upcomingBills}</h2></div>
    <div className="flex min-h-0 w-full flex-1 flex-col items-stretch justify-center gap-[8px] px-[10px]">
      <div className="flex w-full flex-col gap-[8px]" aria-label={t.noScheduledBills}>
        <strong className="text-center text-[13px] text-[#F5F7FA]">{t.noScheduledBills}</strong>
        <p className="text-center text-[10px] leading-[14px] text-[#9CA6B2]">{t.scheduledBillsUnavailable}</p>
      </div>
    </div>
    <div className="h-[28px] w-full shrink-0" />
  </article>;
}
