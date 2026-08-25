import Image from "next/image";
import { DesktopScaleCanvas } from "@/components/DesktopScaleCanvas";

const iconRoot = "/moneypilot/goals/icons";
const cardClass = "overflow-hidden rounded-[20px] border border-[#28313B] bg-[#080B0F]/20";

const goalSummaryMetrics = [
  { label: "Meta principal", value: "Viagem para Itália", detail: "Maio 2027 · meta prioritária", icon: "accent-primary.svg" },
  { label: "Aporte necessário", value: "€ 198 / mês", detail: "Para chegar à meta em Maio 2027", icon: "accent-contribution.svg" },
  { label: "Progresso guardado", value: "€ 620,00", detail: "25,8% concluído · faltam €1.780", icon: "accent-progress.svg", progress: true },
  { label: "Economia encontrada", value: "€ 83,80 / mês", detail: "Pode antecipar a meta em ~3 meses", icon: "accent-savings.svg" },
];

const goalDetails = { title: "Itália · Roma + Florença", attributes: ["7 dias", "Hotel", "Viajando sozinho"], progress: "25,8%", saved: "€620 de €2.400", remaining: "Faltam €1.780 · €198/mês", date: "Maio 2027", status: "Em andamento" };

const nextBestActions = [
  { text: "Faltam €20/mês para o ritmo necessário de €198.", icon: "insight-blue.svg" },
  { text: "A IA encontrou €83,80/mês em Compras, Café e Assinaturas.", icon: "insight-green.svg" },
  { text: "Direcione essa economia à meta e antecipe a viagem em ~3 meses.", icon: "insight-teal.svg" },
];

const savingsPlan = [
  { category: "Compras", current: "€134,60", suggested: "€100,00", saving: "€34,60", color: "#F43F5E" },
  { category: "Café", current: "€98,22", suggested: "€70,00", saving: "€28,22", color: "#F59E0B" },
  { category: "Assinaturas", current: "€40,98", suggested: "€30,00", saving: "€10,98", color: "#8B5CF6" },
  { category: "Outros", current: "€20,00", suggested: "€10,00", saving: "€10,00", color: "#9CA6B2" },
];

const goalCosts = [
  { label: "Passagens", value: "€900", width: 381, color: "#3B82F6" },
  { label: "Hospedagem", value: "€840", width: 354.33, color: "#14B8A6" },
  { label: "Alimentação", value: "€280", width: 118.11, color: "#F43F5E" },
  { label: "Transporte", value: "€180", width: 76.2, color: "#F59E0B" },
  { label: "Reserva extra", value: "€200", width: 83.82, color: "#8B5CF6" },
];

const actionPlan = [
  { title: "Aplicar economia sugerida", copy: "Libere €83,80 por mês" },
  { title: "Ativar aporte de €198/mês", copy: "Mantenha o prazo de Maio 2027" },
  { title: "Revisar em 30 dias", copy: "Ajuste com seus gastos reais" },
];

export default function GoalsPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#080B0F] text-[#F5F7FA]">
      <DesktopScaleCanvas>
        <div className="relative h-[1024px] w-[1536px] overflow-hidden">
          <Image src="/moneypilot/dashboard-racing-bg.png" alt="" fill priority className="object-cover" />
          <div className="absolute inset-0 bg-[#080B0F]/50 mix-blend-hard-light" />
          <section className="absolute left-[231px] top-[107px] flex h-[810px] w-[1164px] items-center justify-center overflow-hidden rounded-[38px] border border-[#28313B]/16 bg-[#0D1117]/50 px-[32px] py-[16px] shadow-[0_22px_42px_rgba(0,0,0,0.45)] backdrop-blur-[20px]">
            <div className="flex h-[779.67px] w-[1098px] shrink-0 flex-col gap-[12px]">
              <div className="flex h-[36.75px] shrink-0 items-center gap-[18.375px]"><span className="h-[36.75px] w-[36.75px] shrink-0 overflow-hidden"><Image src="/moneypilot/moneypilot-logo.svg" alt="" width={180} height={40} priority className="h-[36.75px] w-auto max-w-none" /></span><span className="font-brand text-[21.44px] font-medium leading-[26.031px] tracking-[0.4288px]">MoneyPilot</span></div>

              <header className="flex h-[57.92px] shrink-0 items-center justify-between"><div className="flex h-[52px] w-[520px] flex-col justify-center gap-[4px]"><h1 className="text-[23.168px] font-semibold leading-none">Objetivos</h1><p className="text-[13.2px] text-[#9CA6B2]">Veja se sua meta está no ritmo certo e qual ação tomar para chegar mais rápido.</p></div><div className="flex h-[52px] w-[220px] items-center justify-end gap-[16px]"><button type="button" className="h-[38px] w-[132px] rounded-[19px] bg-[#3B82F6] text-[12.5px] font-semibold">+&nbsp;&nbsp;Nova meta</button><Image src="/moneypilot/dashboard-avatar.png" alt="Avatar do usuário" width={52} height={52} className="size-[52.128px] rounded-full" /></div></header>

              <section aria-label="Resumo dos objetivos" className="flex h-[115px] shrink-0 gap-[12px]">{goalSummaryMetrics.map((metric) => <article key={metric.label} className={`${cardClass} flex h-[115px] w-[265.5px] shrink-0 flex-col gap-[6px] p-[12px]`}><div className="flex h-[24px] items-center gap-[8px] text-[11.5px] font-medium text-[#9CA6B2]"><Image src={`${iconRoot}/${metric.icon}`} alt="" width={24} height={24} className="size-[24px]" />{metric.label}</div><strong className="text-[20px] font-semibold leading-none">{metric.value}</strong><span className="text-[10.5px] text-[#9CA6B2]">{metric.detail}</span>{metric.progress && <div className="h-[5px] w-[241.5px] rounded-[2.5px] bg-[#28313B]/90"><div className="h-[5px] w-[62.307px] rounded-[2.5px] bg-[#22C55E]" /></div>}</article>)}</section>

              <section className="flex h-[210px] shrink-0 gap-[12px]">
                <article className={`${cardClass} flex h-[210px] w-[677px] shrink-0 flex-col items-center justify-between p-[14px]`}><div className="flex h-[28px] w-[649px] items-center justify-between"><h2 className="text-[16px] font-semibold">Sua meta</h2><button type="button" className="flex h-[26px] w-[116px] items-center justify-center gap-[5px] rounded-[14px] border border-[#28313B] bg-[#1A2129]/78 text-[10.5px] font-medium text-[#9CA6B2]">Editar meta<Image src={`${iconRoot}/pencil-alt.svg`} alt="" width={19.33} height={19.33} className="size-[19.33px]" /></button></div><div className="flex h-[126px] w-[649px] items-center gap-[14px]"><Image src="/moneypilot/goal-italy-rome.png" alt="Destino da viagem para a Itália" width={140} height={112} className="h-[112px] w-[140px] rounded-[14px] object-cover" /><div className="flex h-[126px] w-[495px] flex-col justify-center gap-[7px]"><h3 className="text-[16px] font-semibold">{goalDetails.title}</h3><div className="flex h-[26px] gap-[8px]">{goalDetails.attributes.map((item, index) => <span key={item} className="flex h-[26px] items-center justify-center rounded-[14px] border border-[#28313B] bg-[#1A2129]/78 px-[16px] text-[10.5px] font-medium text-[#9CA6B2]" style={{ width: [72, 68, 130][index] }}>{item}</span>)}</div><div className="flex h-[16px] w-[440px] items-center justify-between text-[10.5px] font-medium text-[#9CA6B2]"><span>Progresso da meta</span><strong className="text-[#22C55E]">{goalDetails.progress}</strong></div><div className="h-[8px] w-[440px] rounded-[4px] bg-[#28313B]/90"><div className="h-[8px] w-[113.52px] rounded-[4px] bg-[#3B82F6]" /></div><div className="flex h-[18px] w-[440px] items-center justify-between text-[11px]"><strong>{goalDetails.saved}</strong><span className="text-[#9CA6B2]">{goalDetails.remaining}</span></div></div></div><div className="flex h-[30px] w-[649px] items-center justify-between"><div className="flex h-[28px] w-[170px] items-start gap-[7px]"><Image src={`${iconRoot}/next-action.svg`} alt="" width={8} height={28} className="h-[28px] w-[8px] shrink-0" /><div className="flex flex-col gap-[2px]"><span className="text-[9.5px] leading-none text-[#9CA6B2]">Data da meta</span><strong className="text-[11px] leading-none">{goalDetails.date}</strong></div></div><span className="flex h-[24px] w-[104px] items-center justify-center rounded-[14px] bg-[#3B82F6] text-[10.5px] font-semibold">{goalDetails.status}</span></div></article>

                <article className={`${cardClass} flex h-[210px] w-[409px] shrink-0 flex-col gap-[7px] p-[14px]`}><h2 className="flex h-[24px] items-center gap-[8px] text-[15.5px] font-semibold"><Image src={`${iconRoot}/action-cta.svg`} alt="" width={23} height={24} className="h-[24px] w-[23px]" />Próxima melhor ação</h2>{nextBestActions.map((item) => <div key={item.text} className="flex h-[34px] w-[381px] items-center gap-[9px]"><Image src={`${iconRoot}/${item.icon}`} alt="" width={24} height={24} className="size-[24px]" /><p className="text-[10.2px] leading-[14px] text-[#9CA6B2]">{item.text}</p></div>)}<button type="button" className="flex h-[30px] w-[381px] items-center justify-center gap-[6px] rounded-[10px] bg-[#3B82F6] text-[10.5px] font-semibold"><span className="size-[5px] rounded-full bg-white" />Aplicar plano de €83,80/mês →</button></article>
              </section>

              <section className="flex h-[222px] shrink-0 gap-[12px]">
                <article className={`${cardClass} flex h-[222px] w-[677px] shrink-0 flex-col gap-[5px] p-[14px]`}><h2 className="h-[20px] text-[15.5px] font-semibold">Plano para liberar €83,80/mês</h2><div className="grid h-[17px] w-[649px] grid-cols-[240px_125px_125px_159px] text-[9.5px] font-medium text-[#9CA6B2]"><span>Categoria</span><span>Atual / mês</span><span>Sugerido</span><span>Economia</span></div>{savingsPlan.map((row) => <div key={row.category} className="grid h-[28px] w-[649px] grid-cols-[240px_125px_125px_159px] items-center border-b border-[#28313B]/55 text-[10.2px]"><span className="flex items-center gap-[8px] font-medium"><i className="size-[7px] rounded-full" style={{ backgroundColor: row.color }} />{row.category}</span><span className="font-semibold text-[#9CA6B2]">{row.current}</span><span className="font-semibold">{row.suggested}</span><strong className="text-[#22C55E]">{row.saving}</strong></div>)}<div className="flex h-[26px] w-[649px] items-center justify-center gap-[8px] rounded-[9px] border border-[#3B82F6]/35 bg-[#3B82F6]/10 text-[10.5px] font-semibold text-[#60A5FA]"><span className="size-[7px] rounded-full bg-[#3B82F6]" />Total que pode ser liberado: €83,80 / mês</div></article>

                <article className={`${cardClass} flex h-[222px] w-[409px] shrink-0 flex-col gap-[6px] p-[14px]`}><h2 className="h-[20px] text-[15px] font-semibold">Custo estimado da meta</h2>{goalCosts.map((cost) => <div key={cost.label} className="flex h-[25px] w-[381px] flex-col gap-[3px]"><div className="flex h-[12px] items-center justify-between text-[9.5px]"><span className="font-medium text-[#9CA6B2]">{cost.label}</span><strong>{cost.value}</strong></div><div className="h-[5px] w-[381px] rounded-[2.5px] bg-[#28313B]/90"><div className="h-[5px] rounded-[2.5px]" style={{ width: cost.width, backgroundColor: cost.color }} /></div></div>)}<div className="flex h-[20px] w-[381px] items-center justify-between text-[10.5px] font-semibold"><span>Total estimado</span><strong className="text-[11px]">€ 2.400,00</strong></div></article>
              </section>

              <section className={`${cardClass} flex h-[78px] w-[1098px] shrink-0 items-center gap-[12px] p-[12px]`}><div className="flex h-[54px] w-[160px] shrink-0 flex-col justify-center gap-[4px]"><h2 className="text-[14.5px] font-semibold">Plano de ação</h2><p className="text-[9.5px] text-[#9CA6B2]">3 passos recomendados</p></div>{actionPlan.map((step, index) => <div key={step.title} className={`flex h-[54px] w-[290px] shrink-0 items-center gap-[9px] rounded-[12px] border px-[10px] ${index === 0 ? "border-[#3B82F6]/50 bg-[#3B82F6]/18" : "border-[#28313B] bg-[#1A2129]/78"}`}><span className={`flex size-[28px] shrink-0 items-center justify-center rounded-full text-[10.5px] font-bold ${index === 0 ? "bg-[#3B82F6]" : "bg-[#28313B]"}`}>{index + 1}</span><div className="flex h-[38px] w-[225px] flex-col justify-center gap-[2px]"><strong className="text-[10.3px]">{step.title}</strong><span className="text-[8.8px] text-[#9CA6B2]">{step.copy}</span></div></div>)}</section>
            </div>
          </section>
        </div>
      </DesktopScaleCanvas>
    </main>
  );
}
