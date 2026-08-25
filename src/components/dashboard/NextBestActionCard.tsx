import Image from "next/image";

export function NextBestActionCard() {
  return (
    <article className="flex h-[208px] w-[236px] shrink-0 flex-col gap-[14px] overflow-hidden rounded-[19.307px] border border-[#28313B] bg-[rgba(8,11,15,0.20)] px-[14px] py-[12px]">
      <div className="flex h-[19px] items-center gap-[8px]">
        <Image src="/moneypilot/dashboard-next-best-action-icon.svg" alt="" width={18} height={18} className="size-[18px]" />
        <h2 className="whitespace-nowrap text-[14px] font-semibold text-[#F5F7FA]">Próxima melhor ação</h2>
      </div>
      <div className="flex flex-col gap-[12px]">
        <div className="flex h-[55px] flex-col gap-[3px] overflow-hidden">
          <p className="text-[9.5px] font-semibold tracking-[0.38px] text-[#3B82F6]">OPORTUNIDADE DETECTADA</p>
          <p className="text-[18px] font-semibold leading-none text-[#F5F7FA]">Libere €100/mês</p>
          <p className="text-[11.5px] text-[#9CA6B2]">Reduza €25/semana em alimentação.</p>
        </div>
        <div className="flex h-[42px] flex-col gap-[2px] rounded-[8px] border border-[#1E427A]/80 bg-[#0B1323]/85 px-[10px] py-[6px]">
          <div className="flex items-center justify-between text-[10px]"><span className="font-medium text-[#9CA6B2]">Impacto na meta</span><strong className="text-[10.5px] text-[#60A5FA]">≈ 3 meses antes</strong></div>
          <p className="whitespace-nowrap text-[9.5px] text-[#94A5A5]">Viagem • mantendo o restante do plano</p>
        </div>
      </div>
      <button type="button" className="flex h-[28px] w-full items-center justify-center gap-[8px] rounded-[7.7px] bg-[#3B82F6] text-[12.5px] font-medium text-[#F5F7FA]">Aplicar plano <span>→</span></button>
    </article>
  );
}
