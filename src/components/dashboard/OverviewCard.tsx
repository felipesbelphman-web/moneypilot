import Image from "next/image";

export function OverviewCard() {
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

  return (
    <article className="relative h-[195px] w-[297px] shrink-0 overflow-hidden rounded-[18.26px] border border-[#28313B] bg-[rgba(8,11,15,0.20)] shadow-[inset_0_1px_0_rgba(255,255,255,0.025),0_10px_24px_rgba(0,0,0,0.08)] backdrop-blur-[12px]">
      <div className="absolute left-[17px] right-[17px] top-[18px] flex items-center justify-between">
        <h2 className="text-[12.8px] font-semibold text-[#F5F7FA]">Visão geral</h2>
        <span className="text-[11px] font-semibold text-[#F5F7FA]">Diário</span>
      </div>
      <Image src="/moneypilot/dashboard-overview-line-1.svg" alt="" width={255} height={69} className="absolute left-[17px] top-[60px] h-[69px] w-[255px]" aria-hidden="true" />
      <Image src="/moneypilot/dashboard-overview-line-2.svg" alt="" width={258} height={85} className="absolute left-[17px] top-[51px] h-[85px] w-[258px]" aria-hidden="true" />
      <Image src="/moneypilot/dashboard-overview-point.svg" alt="" width={11} height={11} className="absolute left-[160px] top-[55px] size-[11px]" aria-hidden="true" />
      <div className="absolute bottom-[18px] left-[17px] right-[17px] flex justify-between text-[6px] font-bold text-white/90">
        {months.map((month) => <span key={month}>{month}</span>)}
      </div>
    </article>
  );
}
