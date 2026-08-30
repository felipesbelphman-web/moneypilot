import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";

export function UpcomingBillsCard() {
  const { language } = useLanguage(); const t = translations[language].appDashboard;
  return <article className="flex h-[212px] w-[236px] shrink-0 flex-col items-center justify-between overflow-hidden rounded-[19.307px] border border-[#28313B] bg-[rgba(8,11,15,0.20)] p-[14px]">
    <div className="flex w-full items-center gap-[7px]"><Image src="/moneypilot/dashboard-upcoming-bills-icon.svg" alt="" width={18} height={18} className="size-[18px]" /><h2 className="text-[14.2px] font-semibold text-[#F5F7FA]">{t.upcomingBills}</h2></div>
    <div className="flex flex-1 flex-col items-center justify-center gap-[8px] px-[10px] text-center"><strong className="text-[13px] text-[#F5F7FA]">No scheduled bills</strong><p className="text-[10px] leading-[14px] text-[#9CA6B2]">Scheduled bills are not available yet.</p></div><div className="h-[28px] w-full" />
  </article>;
}
