import Image from "next/image";
import { DesktopScaleCanvas } from "@/components/DesktopScaleCanvas";
import { InsightsSpendingChart } from "@/components/insights/InsightsSpendingChart";

const iconRoot = "/moneypilot/insights/icons";

const summaryMetrics = [
  { label: "Prioridade do mês", value: "Compras", detail: "€34,60 acima do limite", color: "#8B5CF6", icon: "pricetag-outline.svg", labelSize: 12 },
  { label: "Uso da renda", value: "59,7%", detail: "€2.180,50 de €3.650,00", color: "#F43F5E", icon: "receipt-refund.svg", labelSize: 12 },
  { label: "Economia possível", value: "€100/mês", detail: "reduzindo €25/semana", color: "#22C55E", icon: "currency-dollar.svg", labelSize: 10.5 },
  { label: "Impacto na meta", value: "≈ 3 meses", detail: "Viagem pode chegar antes", color: "#3B82F6", icon: "target.svg", labelSize: 10.5 },
];
const aiFacts = ["Seu mês ainda é recuperável sem comprometer suas metas.", "Compras está €34,60 acima do orçamento.", "Supermercado apareceu 5 vezes nos últimos 3 dias.", "Pequenos ajustes podem liberar cerca de €100/mês."];
const monthlyComparisons = [
  { title: "Despesas", detail: "ritmo acima de julho", value: "+8,7%", color: "#F43F5E" },
  { title: "Compras", detail: "maior alta do mês", value: "+22%", color: "#8B5CF6" },
  { title: "Supermercado", detail: "leve melhora", value: "-5%", color: "#22C55E" },
];
const detectedPatterns = [
  { title: "Compras cresceram 22% vs julho", copy: "Principal gasto variável e acima do orçamento.", badge: "Atenção", color: "#F59E0B" },
  { title: "Supermercado apareceu 5× em 3 dias", copy: "Frequência acima do seu padrão recente.", badge: "Padrão", color: "#F59E0B" },
  { title: "€40,98 em assinaturas recorrentes", copy: "Revise serviços pouco utilizados ou duplicados.", badge: "Recorrente", color: "#3B82F6" },
  { title: "Seu ciclo financeiro começa no dia 7", copy: "As projeções seguem o ciclo do próximo salário.", badge: "Ciclo", color: "#64707D" },
];
const recommendedPlan = [
  { title: "Reduza €25/semana em alimentação", badge: "+€100/mês" }, { title: "Recupere €34,60 em Compras", badge: "Prioridade" },
  { title: "Revise €40,98 em assinaturas", badge: "Revisar" }, { title: "Mantenha €250/mês para Viagem", badge: "Meta" },
];
const priorityOpportunities = [
  { title: "Compras está 35% acima do orçamento.", copy: "Reduza ~€9/semana até o fim do mês.", badge: "Ação", color: "#F59E0B", icon: "alert-action.svg" },
  { title: "Café já consumiu 98% do limite mensal.", copy: "Evite novos gastos nesta categoria por alguns dias.", badge: "Atenção", color: "#3B82F6", icon: "alert-attention.svg" },
  { title: "Assinaturas consomem €40,98/mês.", copy: "Revise serviços recorrentes pouco utilizados.", badge: "Revisar", color: "#22C55E", icon: "alert-review.svg" },
  { title: "Os ajustes protegem sua meta Viagem.", copy: "Mantém €250/mês e pode adiantar o objetivo em ~3 meses.", badge: "Impacto", color: "#14B8A6", icon: "alert-impact.svg" },
];

function PatternRows() {
  return <div className="mt-[4px] flex flex-col gap-[4px]">{detectedPatterns.map((item) => <div key={item.title} className="flex h-[29px] items-center justify-between rounded-[8px] px-[7px]" style={{ backgroundColor: `${item.color}0D` }}><div><strong className="block text-[8.8px] leading-none">{item.title}</strong><span className="mt-[2px] block text-[7.6px] leading-none text-[#9CA6B2]">{item.copy}</span></div><span className="ml-2 shrink-0 rounded-full px-[7px] py-[3px] text-[7.8px] font-semibold" style={{ color: item.color, backgroundColor: `${item.color}24` }}>{item.badge}</span></div>)}</div>;
}
function OpportunityRows() {
  return <div className="mt-[4px] flex flex-col gap-[4px]">{priorityOpportunities.map((item) => <div key={item.title} className="flex h-[29px] items-center justify-between rounded-[8px] px-[7px]" style={{ backgroundColor: `${item.color}0D` }}><div className="flex items-center gap-[7px]"><div className="flex size-[21px] shrink-0 items-center justify-center rounded-[7px]" style={{ backgroundColor: `${item.color}26` }}><Image src={`${iconRoot}/${item.icon}`} alt="" width={16} height={16} /></div><div><strong className="block text-[8.8px] leading-none">{item.title}</strong><span className="mt-[2px] block text-[7.6px] leading-none text-[#9CA6B2]">{item.copy}</span></div></div><span className="ml-2 shrink-0 rounded-full px-[7px] py-[3px] text-[7.8px] font-semibold" style={{ color: item.color, backgroundColor: `${item.color}24` }}>{item.badge}</span></div>)}</div>;
}

const card = "overflow-hidden rounded-[18px] border border-[#28313B] bg-[rgba(8,11,15,0.20)] shadow-[0_6px_14px_rgba(0,0,0,0.20)]";

export default function InsightsPage() {
  return <div className="relative min-h-screen bg-[#080B0F]">
    <div className="pointer-events-none absolute inset-0 z-0 isolate overflow-hidden"><Image src="/moneypilot/dashboard-racing-bg.png" alt="" fill priority className="object-cover" /><div className="absolute inset-0 bg-[#080B0F]/50 mix-blend-hard-light" /></div>
    <div className="relative z-10"><DesktopScaleCanvas><main className="relative h-[1024px] w-[1536px] overflow-hidden text-[#F5F7FA]">
      <section className="absolute left-[231px] top-[107px] h-[810px] w-[1164px] overflow-hidden rounded-[38px] border border-[#28313B]/16 bg-[#0D1117]/50 px-[32px] py-[16px] shadow-[0_22px_42px_rgba(0,0,0,0.45)] backdrop-blur-[20px]">
        <div className="flex h-[767.67px] w-[1098px] flex-col gap-[12px] overflow-hidden">
          <div className="flex h-[36.75px] shrink-0 items-center"><div className="flex items-center gap-[18.375px]"><div className="h-[36.75px] w-[36.75px] overflow-hidden"><Image src="/moneypilot/moneypilot-logo.svg" alt="" width={180} height={40} priority className="h-[36.75px] w-auto max-w-none" /></div><span className="font-brand text-[21.44px] font-medium tracking-[0.43px]">MoneyPilot</span></div></div>
          <header className="flex h-[57.92px] shrink-0 items-center justify-between"><div className="flex h-[52px] w-[520px] flex-col justify-center gap-[4px]"><h1 className="text-[23.168px] font-semibold leading-none">Insights IA</h1><p className="text-[13.2px] text-[#9CA6B2]">Entenda o que mudou, o que fazer agora e como isso afeta suas metas.</p></div><div className="flex h-[52px] w-[220px] items-center justify-end gap-[16px]"><div className="flex h-[38px] w-[146px] items-center justify-center gap-[7px] rounded-[19px] border border-[#28313B] bg-[rgba(8,11,15,0.34)] text-[11px] font-medium text-[#9CA6B2]"><Image src="/moneypilot/budgets/icons/calendar.svg" alt="" width={18.25} height={18.25} className="size-[18.25px] shrink-0" />Agosto 2026</div><Image src="/moneypilot/dashboard-avatar.png" alt="Avatar de Felipe" width={52} height={52} className="size-[52px] rounded-full" /></div></header>
          <div className="flex h-[100px] shrink-0 gap-[12px]">{summaryMetrics.map((item) => <article key={item.label} className={`${card} flex h-[100px] w-[265.5px] shrink-0 flex-col gap-[6px] px-[12px] py-[10px]`}><div className="flex items-center gap-[8px]"><div className="flex size-[30px] items-center justify-center rounded-[9px] border" style={{ borderColor: item.color, backgroundColor: `${item.color}24` }}><Image src={`${iconRoot}/${item.icon}`} alt="" width={20} height={20} /></div><h2 className="font-semibold" style={{ fontSize: item.labelSize }}>{item.label}</h2></div><strong className="text-[21px] font-semibold leading-none">{item.value}</strong><p className="text-[9px] leading-none text-[#9CA6B2]">{item.detail}</p></article>)}</div>
          <div className="flex h-[177px] shrink-0 gap-[12px]">
            <section className={`${card} flex h-[177px] w-[677px] shrink-0 flex-col gap-[5px] px-[12px] pb-[10px] pt-[11px]`}><div className="flex items-center gap-[7px]"><span className="flex size-[25px] items-center justify-center rounded-[8px] border border-[#3B82F6]/50 bg-[#60A5FA]/15 text-[9px] font-bold text-[#60A5FA]">AI</span><h2 className="text-[14px] font-semibold">Leitura da IA</h2></div><div className="flex h-[112px] gap-[5px]"><div className="flex w-[333px] flex-col gap-[5px]">{aiFacts.map((fact) => <p key={fact} className="flex h-[20px] items-center text-[9.2px] text-[#9CA6B2]">{fact}</p>)}</div><div className="flex h-[112px] w-[306px] items-start rounded-[8px] border border-[#3B82F6]/45 bg-[#3B82F6]/10 px-[10px] py-[12px]"><p className="text-[8.8px] font-semibold text-[#60A5FA]">Próxima ação: reduza €25/semana em alimentação para liberar ~€100/mês.</p></div></div></section>
            <section className={`${card} h-[177px] w-[409px] shrink-0 px-[12px] pb-[10px] pt-[11px]`}><h2 className="text-[14px] font-semibold">Comparação com julho</h2><div className="mt-[7px] flex flex-col gap-[5px]">{monthlyComparisons.map((item) => <div key={item.title} className="flex h-[35px] items-center justify-between rounded-[8px] bg-[#111821]/65 px-[9px]"><div><strong className="block text-[8.8px] leading-none">{item.title}</strong><span className="mt-[3px] block text-[7.6px] leading-none text-[#9CA6B2]">{item.detail}</span></div><span className="text-[8px] font-semibold" style={{ color: item.color }}>{item.value}</span></div>)}</div></section>
          </div>
          <div className="flex h-[175px] shrink-0 gap-[12px]"><section className={`${card} h-[175px] w-[409px] shrink-0 px-[12px] py-[10px]`}><h2 className="text-[14px] font-semibold">Onde seu dinheiro mais pesa</h2><InsightsSpendingChart /></section><section className={`${card} h-[175px] w-[677px] shrink-0 px-[12px] py-[10px]`}><h2 className="text-[14px] font-semibold">Padrões detectados</h2><PatternRows /></section></div>
          <div className="flex h-[170px] shrink-0 gap-[12px]"><section className={`${card} h-[170px] w-[409px] shrink-0 px-[12px] pb-[9px] pt-[10px]`}><h2 className="text-[14px] font-semibold">Plano recomendado</h2><div className="mt-[4px]">{recommendedPlan.map((item) => <div key={item.title} className="flex h-[24px] w-[385px] items-center border-b border-[#28313B]/65 px-[6px]"><span className="mr-[7px] flex size-[20px] items-center justify-center rounded-[7px] bg-[#60A5FA]/10 text-[8px] font-semibold text-[#60A5FA]">↗</span><span className="text-[8.1px] font-medium">{item.title}</span><span className="ml-auto rounded-full bg-[#60A5FA]/14 px-[7px] py-[3px] text-[7.8px] font-semibold text-[#60A5FA]">{item.badge}</span></div>)}<div className="mt-[4px] flex h-[24px] w-[385px] items-center rounded-[8px] border border-[#3B82F6]/35 bg-[#3B82F6]/8 px-[9px] text-[8px] font-semibold text-[#60A5FA]">Impacto estimado: mantendo o plano, Viagem pode chegar ~3 meses antes.</div></div></section><section className={`${card} h-[170px] w-[677px] shrink-0 px-[12px] pb-[9px] pt-[10px]`}><h2 className="text-[14px] font-semibold">Oportunidades prioritárias</h2><OpportunityRows /></section></div>
        </div>
      </section>
    </main></DesktopScaleCanvas></div>
  </div>;
}
