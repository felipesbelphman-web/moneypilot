import Image from "next/image";
import Link from "next/link";

export function TransactionDecisionCards({ onShowRelated }: { onShowRelated: () => void }) {
  return (
    <div className="absolute left-0 top-[680px] flex h-[86px] w-[1090px] justify-between">
      <article className="flex h-[86px] w-[539px] flex-col gap-[5px] rounded-[18px] border border-[#28313B] bg-[rgba(8,11,15,0.22)] px-[14px] pb-[10px] pt-[11px] shadow-[0_8px_18px_rgba(0,0,0,0.24)] backdrop-blur-[7px]">
        <div className="flex h-[18px] w-full items-center justify-between">
          <div className="flex items-center gap-[7px]"><Image src="/moneypilot/transactions/icons/sparkles-outline.svg" alt="" width={16} height={16} className="size-[16px]" /><h2 className="text-[12px] font-semibold">Padrão detectado</h2></div>
          <span className="rounded-full bg-[#3B82F6]/12 px-[8px] py-[4px] text-[9px] font-semibold leading-none text-[#3B82F6]">5× em 3 dias</span>
        </div>
        <p className="text-[10.5px] font-medium">Supermercado apareceu 5 vezes nos últimos 3 dias.</p>
        <button type="button" onClick={onShowRelated} className="w-fit text-[9.5px] font-medium text-[#3B82F6]">Ver transações relacionadas →</button>
      </article>

      <article className="flex h-[86px] w-[539px] flex-col gap-[5px] rounded-[18px] border border-[#28313B] bg-[rgba(8,11,15,0.22)] px-[14px] pb-[10px] pt-[11px] shadow-[0_8px_18px_rgba(0,0,0,0.24)] backdrop-blur-[7px]">
        <div className="flex h-[18px] w-full items-center justify-between">
          <div className="flex items-center gap-[7px]"><Image src="/moneypilot/transactions/icons/target.svg" alt="" width={16} height={16} className="size-[16px]" /><h2 className="text-[12px] font-semibold">Impacto na meta</h2></div>
          <span className="rounded-full bg-[#3B82F6]/12 px-[8px] py-[4px] text-[9px] font-semibold leading-none text-[#3B82F6]">VIAGEM</span>
        </div>
        <p className="text-[10.5px] font-medium">Compras somam €134,60; no ritmo atual, Viagem pode atrasar ~12 dias.</p>
        <Link href="/goals" className="w-fit text-[9.5px] font-medium text-[#3B82F6]">Ver impacto na meta →</Link>
      </article>
    </div>
  );
}
