"use client";

import Image from "next/image";
import { useState } from "react";
import { DesktopScaleCanvas } from "@/components/DesktopScaleCanvas";
import { InvestmentPerformanceChart, type InvestmentRange } from "@/components/investments/InvestmentPerformanceChart";
import { PortfolioAllocationChart } from "@/components/investments/PortfolioAllocationChart";

const iconRoot = "/moneypilot/investments/icons";
const card = "overflow-hidden rounded-[18px] border border-[#28313B] bg-[#080B0F]/20 shadow-[0_6px_14px_rgba(0,0,0,0.2)]";

const investmentSummary = [
  { label: "Patrimônio investido", value: "€12.840,50", detail: "Ações + cripto + caixa", icon: "wallet-outline", color: "#3B82F6" },
  { label: "Resultado total", value: "+€1.240,50", detail: "+10,7% desde o início", icon: "trending-up-outline", color: "#22C55E" },
  { label: "Caixa disponível", value: "€1.284,05", detail: "10% da carteira · aguardando decisão", icon: "pulse-outline", color: "#22C55E" },
  { label: "Risco da carteira", value: "Moderado", detail: "Tecnologia 46% · Cripto 28%", icon: "shield-checkmark-outline", color: "#F59E0B" },
];

const investmentAssets = [
  { symbol: "NVDA", type: "Ação", value: "€3.140,20", today: "+3,8%", result: "+€540,20", icon: "hardware-chip-outline", color: "#3B82F6" },
  { symbol: "AAPL", type: "Ação", value: "€2.485,80", today: "+1,4%", result: "+€285,80", icon: "apple", color: "#3B82F6" },
  { symbol: "BTC", type: "Cripto", value: "€3.260,10", today: "+2,2%", result: "+€610,10", icon: "bitcoin", color: "#8B5CF6" },
  { symbol: "ETH", type: "Cripto", value: "€2.670,35", today: "-0,7%", result: "-€195,60", icon: "diamond-outline", color: "#8B5CF6" },
];

const preContributionChecks = [
  { badge: "NV", title: "Contas e metas", detail: "Protegidas?", action: "Confirmar", color: "#60A5FA" },
  { badge: "TS", title: "Tecnologia", detail: "46% da carteira", action: "Revisar", color: "#F59E0B" },
  { badge: "AA", title: "Cripto", detail: "28% da carteira", action: "Monitorar", color: "#8B5CF6" },
  { badge: "MS", title: "Caixa", detail: "€1.284,05", action: "Decidir", color: "#22C55E" },
];

const priorityDecisions = [
  { title: "Tecnologia concentra 46% da carteira", copy: "Concentração elevada aumenta exposição a um único setor.", badge: "Revisar", icon: "warning-outline", color: "#F59E0B" },
  { title: "Cripto representa 28% da carteira", copy: "Volatilidade pode pesar em objetivos de prazo mais curto.", badge: "Monitorar", icon: "pulse-outline", color: "#8B5CF6" },
  { title: "Caixa disponível", copy: "Confirme reserva e metas antes de decidir o próximo aporte.", badge: "Decidir", icon: "cash-outline", color: "#22C55E" },
];

function Glyph({ name, size, color }: { name: string; size: number; color: string }) {
  return <span aria-hidden className="block shrink-0" style={{ width: size, height: size, backgroundColor: color, WebkitMask: `url(${iconRoot}/${name}.svg) center/contain no-repeat`, mask: `url(${iconRoot}/${name}.svg) center/contain no-repeat` }} />;
}

export default function InvestmentsPage() {
  const [filter, setFilter] = useState("Todos");
  const [range, setRange] = useState<InvestmentRange>("1M");
  const filteredAssets = filter === "Todos" ? investmentAssets : investmentAssets.filter((asset) => asset.type === (filter === "Ações" ? "Ação" : "Cripto"));

  return (
    <main className="min-h-screen bg-[#080B0F] font-[Inter] text-[#F5F7FA]">
      <DesktopScaleCanvas>
        <div className="relative h-[1024px] w-[1536px] overflow-hidden">
          <Image src="/moneypilot/dashboard-racing-bg.png" alt="" fill priority className="object-cover" />
          <div className="absolute inset-0 bg-[#080B0F]/50 mix-blend-hard-light" />
          <section className="absolute left-[231px] top-[107px] h-[810px] w-[1164px] overflow-hidden rounded-[38px] border border-[#28313B]/16 bg-[#0D1117]/50 px-[32px] py-[16px] shadow-[0_22px_42px_rgba(0,0,0,0.45)] backdrop-blur-[20px]">
            <div className="flex h-[767.623px] w-[1098px] flex-col gap-[12px]">
              <div className="flex h-[36.75px] shrink-0 items-center gap-[18.375px]">
                <span className="h-[36.75px] w-[36.75px] shrink-0 overflow-hidden"><Image src="/moneypilot/moneypilot-logo.svg" alt="" width={180} height={40} priority className="h-[36.75px] w-auto max-w-none" /></span>
                <span className="font-brand text-[21.44px] font-medium leading-[26.031px] tracking-[0.4288px]">MoneyPilot</span>
              </div>

              <header className="flex h-[57.92px] shrink-0 items-center justify-between">
                <div className="flex h-[52px] w-[610px] flex-col justify-center gap-[4px]"><h1 className="text-[23.168px] font-semibold leading-none">Investimentos</h1><p className="text-[13.2px] text-[#9CA6B2]">Entenda o risco, proteja suas metas e decida o próximo aporte com mais contexto.</p></div>
                <div className="flex h-[52px] items-center gap-[16px]">
                  <div className="flex h-[46px] w-[252px] items-center justify-center rounded-[23px] border border-[#28313B] bg-[#080B0F]/34 p-[4px]">{["Todos", "Ações", "Cripto"].map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`h-[38px] w-[80px] rounded-[19px] text-[10.5px] font-medium ${filter === item ? "bg-[#3B82F6] text-[#F5F7FA]" : "text-[#9CA6B2]"}`}>{item}</button>)}</div>
                  <Image src="/moneypilot/dashboard-avatar.png" alt="Avatar do usuário" width={52} height={52} className="h-[52px] w-[52px] rounded-full" />
                </div>
              </header>

              <section aria-label="Resumo dos investimentos" className="flex h-[100px] shrink-0 gap-[12px]">
                {investmentSummary.map((m) => <article key={m.label} className={`${card} flex h-[100px] w-[265.5px] shrink-0 flex-col gap-[6px] px-[12px] py-[10px]`}><div className="flex h-[30px] items-center gap-[8px]"><span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] border" style={{ borderColor: m.color, backgroundColor: `${m.color}24` }}><Glyph name={m.icon} size={18} color={m.color} /></span><h2 className="text-[11px] font-semibold">{m.label}</h2></div><strong className="text-[21px] font-semibold leading-none">{m.value}</strong><p className="text-[9px] text-[#9CA6B2]">{m.detail}</p></article>)}
              </section>

              <section className="flex h-[185px] shrink-0 gap-[12px]">
                <article className={`${card} h-[185px] w-[677px] shrink-0 px-[12px] py-[10px]`}>
                  <div className="flex h-[24px] items-center justify-between"><h2 className="text-[14px] font-semibold">Evolução da carteira</h2><div className="flex gap-[4px]">{(["7D", "1M", "3M", "1A"] as InvestmentRange[]).map((item) => <button key={item} type="button" onClick={() => setRange(item)} className={`h-[24px] rounded-[12px] text-[8px] ${item === "1A" ? "w-[48px]" : "w-[40px]"} ${range === item ? "bg-[#3B82F6]" : "border border-[#28313B] bg-[#080B0F]/24 text-[#9CA6B2]"}`}>{item}</button>)}</div></div>
                  <div className="mt-[3px] flex h-[26px] items-center gap-[8px]"><strong className="text-[21px]">€12.840,50</strong><span className="text-[9px] font-semibold text-[#22C55E]">+€620,40 (+5,08%)</span></div>
                  <InvestmentPerformanceChart range={range} />
                </article>
                <article className={`${card} h-[185px] w-[409px] shrink-0 px-[12px] py-[10px]`}><h2 className="text-[14px] font-semibold">Alocação da carteira</h2><PortfolioAllocationChart /></article>
              </section>

              <section className="flex h-[185px] shrink-0 gap-[12px]">
                <article className={`${card} h-[185px] w-[677px] shrink-0 px-[12px] py-[10px]`}><div className="flex h-[24px] items-center justify-between"><h2 className="text-[14px] font-semibold">Seus ativos</h2><span className="text-[8.5px] text-[#9CA6B2]">{filteredAssets.length} ativos · €11.556,45</span></div><div className="grid h-[22px] grid-cols-[190px_90px_120px_105px_148px] items-center rounded-[7px] bg-[#19212C]/78 px-[8px] text-[7.5px] text-[#64707D]"><span>Ativo</span><span>Tipo</span><span>Valor</span><span>Hoje</span><span>Retorno</span></div>{filteredAssets.map((a) => <div key={a.symbol} className="grid h-[28px] grid-cols-[190px_90px_120px_105px_148px] items-center border-b border-[#28313B]/55 px-[8px] text-[8.8px]"><b className="flex items-center gap-[7px]"><i className="flex h-[20px] w-[20px] items-center justify-center rounded-[6px]" style={{ background: `${a.color}20` }}><Glyph name={a.icon} size={13} color={a.color} /></i>{a.symbol}</b><span className="text-[#9CA6B2]">{a.type}</span><b>{a.value}</b><b style={{ color: a.today.startsWith("-") ? "#F43F5E" : a.color === "#8B5CF6" ? "#8B5CF6" : "#22C55E" }}>{a.today}</b><b style={{ color: a.result.startsWith("-") ? "#F43F5E" : a.color === "#8B5CF6" ? "#8B5CF6" : "#22C55E" }}>{a.result}</b></div>)}</article>
                <article className={`${card} h-[185px] w-[409px] shrink-0 px-[12px] pb-[8px] pt-[10px]`}><div className="flex h-[24px] items-center"><h2 className="text-[14px] font-semibold">Antes do próximo aporte</h2></div>{preContributionChecks.map((item) => <div key={item.title} className="flex h-[27px] items-center justify-between border-b border-[#28313B]/55 text-[8.8px]"><span className="flex w-[150px] items-center gap-[7px] font-semibold"><i className="flex h-[20px] w-[26px] items-center justify-center rounded-[6px] bg-[#3B82F6]/12 text-[7.2px] not-italic text-[#60A5FA]">{item.badge}</i>{item.title}</span><span className="text-[#9CA6B2]">{item.detail}</span><b className="w-[62px] text-right" style={{ color: item.color }}>{item.action}</b></div>)}<button type="button" className="flex h-[18px] w-full items-center justify-end text-[8.5px] font-semibold text-[#60A5FA]">Ver critérios →</button></article>
              </section>

              <section className="flex h-[143px] shrink-0 gap-[12px]">
                <article className={`${card} flex h-[143px] w-[409px] shrink-0 flex-col justify-between px-[12px] py-[10px]`}><div><h2 className="flex h-[24px] items-center gap-[7px] text-[14px] font-semibold"><Glyph name="sparkles-outline" size={22} color="#3B82F6" />Insight da IA</h2><p className="mt-[12px] text-[9.1px] leading-normal text-[#9CA6B2]">Antes de um novo aporte, revise a concentração: 46% em tecnologia e 28% em cripto. Ajuste a diversificação ao seu perfil, prazo e metas antes de decidir.</p></div><button type="button" className="h-[30px] w-[174px] rounded-[15px] bg-[#3B82F6] text-[8.5px] font-semibold">Revisar diversificação</button></article>
                <article className={`${card} h-[143px] w-[677px] shrink-0 px-[12px] pb-[9px] pt-[10px]`}><h2 className="mb-[4px] text-[14px] font-semibold">Decisões prioritárias</h2>{priorityDecisions.map((r) => <div key={r.title} className="mb-[4px] flex h-[29px] items-center rounded-[8px] px-[7px]" style={{ background: `${r.color}0D` }}><i className="flex h-[21px] w-[21px] items-center justify-center rounded-[7px]" style={{ background: `${r.color}26` }}><Glyph name={r.icon} size={13} color={r.color} /></i><div className="ml-[7px]"><b className="block text-[8.8px] leading-[11px]">{r.title}</b><span className="block text-[7.5px] leading-[10px] text-[#9CA6B2]">{r.copy}</span></div><span className="ml-auto flex h-[20px] items-center justify-center rounded-[10px] px-[12px] text-[7.8px] font-semibold" style={{ background: `${r.color}24`, color: r.color }}>{r.badge}</span></div>)}</article>
              </section>
            </div>
          </section>
        </div>
      </DesktopScaleCanvas>
    </main>
  );
}
