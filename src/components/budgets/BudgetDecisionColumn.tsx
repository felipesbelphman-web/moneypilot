import Image from "next/image";
import Link from "next/link";

const iconRoot = "/moneypilot/budgets/icons";

export function BudgetDecisionColumn() {
  return (
    <aside className="relative h-[516px] w-[330px] shrink-0">
      <section className="absolute left-0 top-0 flex h-[158px] w-[330px] flex-col gap-[6px] overflow-hidden rounded-[18px] border border-[#28313B] bg-[rgba(8,11,15,0.22)] px-[12px] py-[10px] shadow-[0_8px_18px_rgba(0,0,0,0.24)] backdrop-blur-[3.5px]">
        <div className="flex h-[20px] items-center gap-[7px]"><Image src={`${iconRoot}/sparkles.svg`} alt="" width={18} height={18} className="size-[18px]" /><h2 className="text-[12px] font-semibold">Próxima melhor ação</h2></div>
        <p className="text-[8.5px] font-semibold leading-[10px] text-[#3B82F6]">PRIORIDADE</p>
        <p className="text-[16.5px] font-semibold leading-[19px]">Recupere €34,60</p>
        <p className="w-[306px] text-[9.2px] leading-[12px] text-[#9CA6B2]">Compras já passou do limite. Reduza ~€9/semana até o fim do mês.</p>
        <button type="button" className="flex h-[26px] w-[306px] items-center justify-center gap-[7px] rounded-[8px] bg-[#3B82F6] text-[10px] font-semibold"><span>Aplicar ajuste</span><Image src={`${iconRoot}/arrow-right.svg`} alt="" width={16} height={16} className="size-[16px]" /></button>
      </section>

      <section className="absolute left-0 top-[170px] flex h-[184px] w-[330px] flex-col gap-[6px] overflow-hidden rounded-[18px] border border-[#28313B] bg-[rgba(8,11,15,0.22)] px-[12px] py-[10px] shadow-[0_8px_18px_rgba(0,0,0,0.24)] backdrop-blur-[3.5px]">
        <div className="flex h-[20px] items-center gap-[7px]"><Image src="/moneypilot/dashboard-monthly-status-icon.svg" alt="" width={18} height={18} className="size-[18px]" /><h2 className="text-[12px] font-semibold">Ritmo do orçamento</h2></div>
        <div className="flex h-[34px] justify-between"><Metric value="73,3%" label="orçamento usado" /><Metric value="61%" label="do mês passou" /></div>
        <div className="flex h-[38px] flex-col gap-[3px]"><Progress label="Orçamento" value="73,3%" width="73.3%" color="#3B82F6" /><Progress label="Tempo do mês" value="61%" width="61%" color="#38BDF8" /></div>
        <div className="flex h-[38px] flex-col gap-px rounded-[8px] border border-[#F59E0B]/24 bg-[#F59E0B]/8 px-[8px] py-[5px]"><p className="text-[9.3px] font-semibold leading-[11px]">Previsão de fechamento&nbsp; €1.517,00</p><p className="text-[8.5px] leading-[10px] text-[#F59E0B]">≈ €95 acima do plano se mantiver o ritmo.</p></div>
        <button type="button" className="w-fit text-[8.7px] font-semibold leading-[11px] text-[#3B82F6]">Ver projeção →</button>
      </section>

      <section className="absolute left-0 top-[366px] flex h-[150px] w-[330px] flex-col gap-[6px] overflow-hidden rounded-[18px] border border-[#28313B] bg-[rgba(8,11,15,0.22)] px-[12px] py-[10px] shadow-[0_8px_18px_rgba(0,0,0,0.24)] backdrop-blur-[3.5px]">
        <div className="flex h-[20px] items-center justify-between"><div className="flex items-center gap-[7px]"><Image src={`${iconRoot}/target.svg`} alt="" width={18} height={18} className="size-[18px]" /><h2 className="text-[12px] font-semibold">Impacto na meta</h2></div><span className="flex h-[18px] w-[58px] items-center justify-center rounded-[9px] bg-[#3B82F6]/10 text-[8px] font-semibold text-[#3B82F6]">VIAGEM</span></div>
        <p className="text-[12.5px] font-semibold leading-[16px]">Seu orçamento pode atrasar a meta em ~12 dias.</p>
        <p className="text-[9.2px] leading-[12px] text-[#9CA6B2]">Com o ajuste sugerido, sua contribuição de €250/mês continua protegida.</p>
        <Link href="/goals" className="flex h-[24px] w-[306px] items-center justify-center gap-[6px] rounded-[7px] border border-[#28313B] text-[9.2px] font-semibold text-[#3B82F6]">Ver impacto na meta <Image src={`${iconRoot}/arrow-right.svg`} alt="" width={15} height={15} className="size-[15px]" /></Link>
      </section>
    </aside>
  );
}

function Metric({ value, label }: { value: string; label: string }) { return <div className="flex h-[34px] w-[145px] flex-col gap-px"><strong className="text-[17px] leading-[19px]">{value}</strong><span className="text-[8.5px] leading-[10px] text-[#9CA6B2]">{label}</span></div>; }
function Progress({ label, value, width, color }: { label: string; value: string; width: string; color: string }) { return <div className="contents"><div className="flex h-[12px] items-center justify-between text-[8.5px] leading-[10px]"><span className="font-medium text-[#9CA6B2]">{label}</span><strong style={{ color }}>{value}</strong></div><div className="h-[5px] w-[304px] overflow-hidden rounded-[2.5px] bg-[#19212C]"><div className="h-full rounded-[2.5px]" style={{ width, backgroundColor: color }} /></div></div>; }
