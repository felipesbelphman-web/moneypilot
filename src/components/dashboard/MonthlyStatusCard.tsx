import Image from "next/image";

export function MonthlyStatusCard() {
  return (
    <article className="flex h-[212px] w-[236px] shrink-0 flex-col items-start justify-between overflow-hidden rounded-[19.307px] border border-[#28313B] bg-[rgba(8,11,15,0.20)] p-[14px]">
      <div className="flex items-center gap-[7px]">
        <Image src="/moneypilot/dashboard-monthly-status-icon.svg" alt="" width={18} height={18} className="size-[18px]" />
        <h2 className="text-[14.2px] font-semibold text-[#F5F7FA]">Status do mês</h2>
      </div>
      <div className="flex w-full flex-col gap-[12px]">
        <div className="rounded-[10px] bg-[#22C55E]/10 px-[10px] py-[9px]"><p className="text-[13.2px] font-semibold text-[#22C55E]">No caminho certo</p></div>
        <p className="text-[10.4px] leading-[14px] text-[#9CA6B2]">Você usou 59,7% da renda e ainda faltam 9 dias para o próximo pagamento. Alimentação está acima do ritmo esperado, mas o mês ainda pode fechar dentro do planejado.</p>
      </div>
      <button type="button" className="flex h-[28px] w-full items-center justify-center gap-[24px] text-[9.8px] font-medium text-[#3B82F6]">Ver diagnóstico <span>→</span></button>
    </article>
  );
}
