import { SavingsTrendChart } from "@/components/charts/SavingsTrendChart";

export function MonthlySavingsCard({ showValues }: { showValues: boolean }) {
  return (
    <article className="flex h-[212px] w-[236px] shrink-0 flex-col overflow-hidden rounded-[19px] border border-[#28313B] bg-[rgba(8,11,15,0.20)] px-[12px] py-[13px] shadow-[inset_0_1px_0_rgba(255,255,255,0.025),0_10px_24px_rgba(0,0,0,0.08)] backdrop-blur-[12px]">
      <div className="flex w-full items-start justify-between">
        <div>
          <h2 className="text-[13.5px] font-semibold leading-none text-[#F5F7FA]">Economia este mês</h2>
          <div className="mt-[7px] flex items-end gap-[6px]">
            <strong className="text-[20px] font-semibold leading-none tracking-[-0.4px] text-[#F5F7FA]">{showValues ? "€682,00" : "••••••"}</strong>
            <span className="text-[9px] font-semibold text-[#22C55E]">+12,6% ↗</span>
          </div>
        </div>
        <button type="button" className="flex h-[24px] items-center gap-[4px] rounded-[7px] border border-[#28313B] bg-[#1A2027]/70 px-[7px] text-[8px] font-medium text-[#9CA6B2]">
          Semanal <span aria-hidden="true">⌄</span>
        </button>
      </div>
      <div className="mt-[5px] h-[112px] w-full"><SavingsTrendChart /></div>
      <div className="mt-auto flex w-full items-center justify-between border-t border-[#28313B] pt-[6px]">
        <div className="flex items-center gap-[5px] text-[8px] text-[#9CA6B2]"><span className="size-[5px] rounded-full bg-[#9CA6B2]" />Meta <strong className="text-[9px] text-[#F5F7FA]">{showValues ? "€1.000" : "••••••"}</strong></div>
        <div className="flex items-center gap-[5px]"><span className="text-[8px] text-[#7F8996]">alcançado</span><strong className="text-[10px] text-[#F5F7FA]">68%</strong></div>
      </div>
    </article>
  );
}
