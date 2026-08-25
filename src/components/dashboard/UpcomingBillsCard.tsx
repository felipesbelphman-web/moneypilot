import Image from "next/image";

const bills = [
  { name: "Internet", date: "27 Ago", value: "€15,00" },
  { name: "Energia", date: "29 Ago", value: "€42,00" },
  { name: "Aluguel", date: "01 Set", value: "€500,00" },
];

export function UpcomingBillsCard({ showValues }: { showValues: boolean }) {
  return (
    <article className="flex h-[212px] w-[236px] shrink-0 flex-col items-center justify-between overflow-hidden rounded-[19.307px] border border-[#28313B] bg-[rgba(8,11,15,0.20)] p-[14px]">
      <div className="flex w-full flex-col gap-[12px]">
        <div className="flex items-center gap-[7px]">
          <Image src="/moneypilot/dashboard-upcoming-bills-icon.svg" alt="" width={18} height={18} className="size-[18px]" />
          <h2 className="text-[14.2px] font-semibold text-[#F5F7FA]">Próximas contas</h2>
        </div>
        <div className="flex items-center justify-between"><strong className="min-w-[70px] text-[16px] text-[#F5F7FA]">{showValues ? "€557,00" : "••••••"}</strong><span className="text-[9.5px] text-[#9CA6B2]">até 01 Set</span></div>
      </div>
      <div className="flex w-full flex-col gap-[12px]">
        {bills.map((bill) => <div key={bill.name} className="flex items-center justify-between"><div className="flex flex-col gap-px"><strong className="text-[10.5px] font-medium text-[#F5F7FA]">{bill.name}</strong><span className="text-[8.5px] text-[#9CA6B2]">{bill.date}</span></div><strong className="min-w-[48px] text-right text-[10.5px] font-semibold text-[#F5F7FA]">{showValues ? bill.value : "••••••"}</strong></div>)}
      </div>
      <button type="button" className="flex h-[28px] w-full items-center justify-center gap-[24px] text-[9.8px] font-medium text-[#3B82F6]">Ver calendário <span>→</span></button>
    </article>
  );
}
