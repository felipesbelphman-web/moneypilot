import Image from "next/image";

export function GoalsStatusCard({ showValues }: { showValues: boolean }) {
  return (
    <article className="flex h-[208px] w-[353px] shrink-0 flex-col justify-between overflow-hidden rounded-[19.307px] border border-[#28313B] bg-[rgba(8,11,15,0.20)] p-[12px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[7px]">
          <Image src="/moneypilot/dashboard-goal-target-icon.svg" alt="" width={18} height={18} className="size-[18px]" />
          <h2 className="text-[14px] font-semibold text-[#F5F7FA]">Status das Metas</h2>
        </div>
        <span className="text-[9px] font-medium text-[#3B82F6]">Ver todas →</span>
      </div>

      <div className="flex h-[112px] w-full flex-col gap-[8px] rounded-[10px] border border-[#1E427A] bg-[#0B1323]/85 p-[9px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[5px] text-[8px] font-semibold text-[#3B82F6]">
            <Image src="/moneypilot/dashboard-goal-star-icon.svg" alt="" width={10} height={10} className="size-[10px]" />
            META PRINCIPAL
          </div>
          <span className="rounded-full bg-[#22C55E]/10 px-[8px] py-[3px] text-[7.5px] font-medium text-[#22C55E]">Dentro do prazo</span>
        </div>
        <div className="flex items-center gap-[9px]">
          <div className="relative grid size-[70px] shrink-0 place-items-center rounded-full bg-[conic-gradient(#3B82F6_0_25%,#17365A_25%_100%)]">
            <div className="absolute size-[61px] rounded-full bg-[#0B1323]" />
            <strong className="relative text-[21px] font-semibold text-[#F5F7FA]">25%</strong>
          </div>
          <div className="flex w-[225px] flex-col gap-[5px]">
            <p className="text-[13.5px] font-semibold text-[#F5F7FA]">Viagem para Itália</p>
            <p className="min-w-[120px] text-[11px]">
              {showValues ? <><strong className="font-semibold text-[#3B82F6]">€1.500</strong> <span className="text-[#9CA6B2]">de €6.000</span></> : <strong className="font-semibold text-[#3B82F6]">••••••</strong>}
            </p>
            <div className="h-[6px] w-[210px] overflow-hidden rounded-[3px] bg-[#28313B]/75"><div className="h-full w-1/4 rounded-[3px] bg-[#3B82F6]" /></div>
            <p className="text-[10.4px] text-[#9CA6B2]">Previsão: Maio 2028</p>
          </div>
        </div>
      </div>

      <button type="button" className="flex h-[28px] w-full items-center justify-center gap-[24px] rounded-[8px] border border-[#28313B] text-[11.5px] font-medium text-[#3B82F6]">Ver todas as metas <span>→</span></button>
    </article>
  );
}
