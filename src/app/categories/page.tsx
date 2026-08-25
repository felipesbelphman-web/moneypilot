"use client";

import Image from "next/image";
import { useState } from "react";
import { DesktopScaleCanvas } from "@/components/DesktopScaleCanvas";

const iconRoot = "/moneypilot/icons/categories";

type GlyphProps = { name: string; size?: number; color?: string };

function Glyph({ name, size = 16, color = "#9CA6B2" }: GlyphProps) {
  const mask = `url(${iconRoot}/${name}.svg)`;
  return <span aria-hidden="true" className="block shrink-0" style={{ width: size, height: size, backgroundColor: color, WebkitMaskImage: mask, maskImage: mask, WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }} />;
}

const metrics = [
  { label: "Categorias ativas", value: "9", detail: "Categorias personalizadas e ativas", icon: "tag", color: "#3B82F6" },
  { label: "Regras automáticas", value: "18", detail: "Mapeamentos ativos neste ciclo", icon: "rules", color: "#F59E0B" },
  { label: "Estabelecimentos mapeados", value: "42", detail: "Comerciantes vinculados às categorias", icon: "store", color: "#22C55E" },
  { label: "Classificação automática", value: "92%", detail: "Transações classificadas automaticamente", icon: "automation", color: "#8B5CF6" },
];

const categories = [
  { name: "Habitação", icon: "home", color: "#3B82F6", merchants: "Eir, Electric Ireland, Bord Gáis" },
  { name: "Supermercado", icon: "cart", color: "#22C55E", merchants: "LIDL, Dunnes, Centra" },
  { name: "Delivery", icon: "delivery", color: "#F59E0B", merchants: "Just Eat, Uber Eats, Deliveroo" },
  { name: "Transporte", icon: "transport", color: "#8B5CF6", merchants: "Dublin Bus, Go-Ahead, Uber" },
  { name: "Saúde", icon: "health", color: "#14B8A6", merchants: "Boots, Lloyds Pharmacy" },
  { name: "Lazer", icon: "leisure", color: "#F43F5E", merchants: "Cinema, Concertos, Parques" },
  { name: "Assinaturas", icon: "subscription", color: "#8B5CF6", merchants: "Netflix, Spotify, Amazon Prime" },
  { name: "Compras", icon: "shopping", color: "#F43F5E", merchants: "Zara, H&M, Argos" },
  { name: "Outros", icon: "more", color: "#9CA6B2", merchants: "Diversos estabelecimentos" },
];

const rules = [
  { merchant: "LIDL", icon: "store", category: "Supermercado", color: "#22C55E" },
  { merchant: "Netflix", icon: "video", category: "Assinaturas", color: "#8B5CF6" },
  { merchant: "Just Eat", icon: "delivery", category: "Delivery", color: "#F59E0B" },
  { merchant: "Dunnes", icon: "store", category: "Supermercado", color: "#22C55E" },
  { merchant: "Centra", icon: "store", category: "Supermercado", color: "#22C55E" },
  { merchant: "Spotify", icon: "music", category: "Assinaturas", color: "#8B5CF6" },
  { merchant: "Boots", icon: "health", category: "Saúde", color: "#14B8A6" },
];

const benefits = [
  { title: "Classificação automática", copy: "Transações organizadas sem trabalho manual.", icon: "automation" },
  { title: "Relatórios consistentes", copy: "Categorias comparáveis mês a mês.", icon: "report" },
  { title: "Menos trabalho manual", copy: "Regras inteligentes reduzem ajustes.", icon: "time" },
  { title: "Insights mais precisos", copy: "Dados organizados melhoram recomendações.", icon: "analytics" },
];

const cardClass = "overflow-hidden rounded-[18px] border border-[#28313B] bg-[rgba(8,11,15,0.22)] shadow-[0_8px_18px_rgba(0,0,0,0.24)]";

export default function CategoriesPage() {
  const [isDefault, setIsDefault] = useState(true);

  return (
    <main className="min-h-screen overflow-hidden bg-[#080B0F] font-[Inter] text-[#F5F7FA]">
      <DesktopScaleCanvas>
        <div className="relative h-[1024px] w-[1536px] overflow-hidden">
          <Image src="/moneypilot/dashboard-racing-bg.png" alt="" fill priority className="object-cover" />
          <div className="absolute inset-0 bg-[#080B0F]/50 mix-blend-hard-light" />

          <section className="absolute left-[231px] top-[111px] h-[800px] w-[1164px] overflow-hidden rounded-[38px] border border-[#28313B]/16 bg-[#0D1117]/50 px-[32px] py-[16px] shadow-[0_22px_42px_rgba(0,0,0,0.45)] backdrop-blur-[20px]">
            <div className="flex h-[767.67px] w-[1098px] flex-col gap-[12px]">
              <div className="flex h-[36.75px] shrink-0 items-center gap-[18.375px]">
                <span className="h-[36.75px] w-[36.75px] shrink-0 overflow-hidden"><Image src="/moneypilot/moneypilot-logo-white.svg" alt="" width={178} height={37} className="h-[36.75px] w-[177.625px] max-w-none" /></span>
                <span className="font-[Poppins] text-[21.44px] font-medium leading-[26.031px] tracking-[0.4288px]">MoneyPilot</span>
              </div>

              <header className="flex h-[57.92px] shrink-0 items-center justify-between">
                <div className="flex h-[52px] w-[520px] flex-col justify-center gap-[4px]"><h1 className="text-[23.168px] font-semibold leading-none">Categorias</h1><p className="text-[13.2px] text-[#9CA6B2]">Gerencie categorias, cores e regras automáticas para seus gastos.</p></div>
                <div className="flex h-[52px] w-[220px] items-center justify-end gap-[16px]"><button type="button" className="h-[38px] w-[146px] rounded-[19px] bg-[#3B82F6] text-[10px] font-semibold">+ Nova categoria</button><Image src="/moneypilot/dashboard-avatar.png" alt="Avatar do usuário" width={52} height={52} className="h-[52.128px] w-[52.128px] rounded-full" /></div>
              </header>

              <section aria-label="Resumo das categorias" className="flex h-[100px] shrink-0 gap-[12px]">
                {metrics.map((metric) => <article key={metric.label} className={`${cardClass} relative h-[100px] w-[265.5px] shrink-0`}><span className="absolute left-[11px] top-[11px] flex h-[30px] w-[30px] items-center justify-center rounded-[9px] border" style={{ borderColor: metric.color, backgroundColor: `${metric.color}24` }}><Glyph name={metric.icon} size={16} color={metric.color} /></span><h2 className="absolute left-[51px] top-[16px] text-[11px] font-semibold">{metric.label}</h2><strong className="absolute left-[11px] top-[45px] text-[23px] font-semibold">{metric.value}</strong><p className="absolute left-[11px] top-[77px] text-[9.2px] text-[#9CA6B2]">{metric.detail}</p></article>)}
              </section>

              <section className="flex h-[260px] shrink-0 gap-[12px]">
                <article className={`${cardClass} relative h-[260px] w-[677px] shrink-0`}>
                  <h2 className="absolute left-[11px] top-[9px] text-[15px] font-semibold">Lista de categorias</h2><button type="button" className="absolute left-[552px] top-[7px] h-[24px] w-[112px] rounded-[12px] bg-[#3B82F6] text-[8.5px] font-semibold">+ Nova categoria</button>
                  <div className="absolute left-[11px] top-[39px] grid h-[22px] w-[653px] grid-cols-[228px_46px_321px_58px] items-center rounded-[7px] bg-[rgba(25,33,44,0.78)] px-[8px] text-[8.2px] font-semibold text-[#7F8996]"><span>Categoria</span><span>Cor</span><span>Estabelecimentos</span><span>Ações</span></div>
                  <div className="absolute left-[11px] top-[61px] w-[653px]">{categories.map((category, index) => <div key={category.name} className={`grid h-[21px] grid-cols-[228px_46px_321px_58px] items-center border-b border-[#28313B]/70 px-[6px] text-[8px] ${index === 1 ? "bg-[#3B82F6]/6" : ""}`}><span className="flex items-center gap-[7px] text-[8.8px] font-semibold"><i className="flex h-[18px] w-[18px] items-center justify-center rounded-[6px]" style={{ backgroundColor: `${category.color}24` }}><Glyph name={category.icon} size={12} color={category.color} /></i>{category.name}</span><i className="h-[7px] w-[7px] rounded-full" style={{ backgroundColor: category.color }} /><span className="text-[#9CA6B2]">{category.merchants}</span><span className="flex items-center justify-end gap-[8px]"><button type="button" aria-label={`Editar ${category.name}`}><Glyph name="edit" size={11} color="#64707D" /></button><button type="button" aria-label={`Mais opções para ${category.name}`}><Glyph name="more" size={12} color="#64707D" /></button></span></div>)}</div>
                </article>

                <article className={`${cardClass} relative h-[260px] w-[409px] shrink-0`}>
                  <h2 className="absolute left-[10px] top-[9px] text-[15px] font-semibold">Regras automáticas</h2><button type="button" className="absolute right-[10px] top-[7px] h-[24px] w-[58px] rounded-[12px] bg-[#3B82F6] text-[8px] font-semibold">+ Nova regra</button>
                  <div className="absolute left-[10px] top-[39px] grid h-[22px] w-[389px] grid-cols-[98px_18px_205px_68px] items-center rounded-[7px] bg-[rgba(25,33,44,0.78)] px-[7px] text-[7.8px] font-semibold text-[#7F8996]"><span>Estabelecimento</span><span /><span>Mapeamento</span><span>Ações</span></div>
                  <div className="absolute left-[10px] top-[61px] w-[389px]">{rules.map((rule) => <div key={rule.merchant} className="grid h-[26px] grid-cols-[98px_18px_205px_68px] items-center border-b border-[#28313B]/70 px-[7px] text-[8px]"><span className="flex items-center gap-[6px] font-semibold"><i className="flex h-[17px] w-[17px] items-center justify-center rounded-[5px] bg-[#3B82F6]/15"><Glyph name={rule.icon} size={11} color="#60A5FA" /></i>{rule.merchant}</span><Glyph name="arrow-right" size={10} color="#64707D" /><span><i className="inline-flex h-[16px] items-center rounded-[8px] px-[9px] not-italic" style={{ color: rule.color, backgroundColor: `${rule.color}18` }}>{rule.category}</i></span><span className="flex justify-end gap-[8px]"><button type="button" aria-label={`Editar regra ${rule.merchant}`}><Glyph name="edit" size={11} color="#64707D" /></button><button type="button" aria-label={`Mais opções para ${rule.merchant}`}><Glyph name="more" size={12} color="#64707D" /></button></span></div>)}</div>
                </article>
              </section>

              <section className={`${cardClass} flex h-[78px] shrink-0 items-center px-[10px]`}>
                <h2 className="w-[170px] shrink-0 text-[13px] font-semibold">Como isso ajuda</h2>{benefits.map((benefit) => <div key={benefit.title} className="flex h-[48px] w-[227px] items-center gap-[8px] border-l border-[#28313B] px-[10px]"><i className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[7px] bg-[#3B82F6]/12"><Glyph name={benefit.icon} size={13} color="#60A5FA" /></i><div><strong className="block text-[8.4px]">{benefit.title}</strong><span className="mt-[3px] block text-[7.8px] text-[#9CA6B2]">{benefit.copy}</span></div></div>)}
              </section>

              <section className={`${cardClass} relative h-[163px] shrink-0`}>
                <h2 className="absolute left-[11px] top-[9px] text-[13px] font-semibold">Editar categoria</h2>
                {[{ label: "Nome da categoria", value: "Supermercado", left: 11, width: 170 }, { label: "Cor", value: "#22C55E", left: 331, width: 140 }, { label: "Descrição", value: "Gastos com supermercados, mercearias e lojas de alimentos.", left: 481, width: 330 }].map((field) => <label key={field.label} className="absolute top-[34px] text-[7.8px] font-semibold text-[#7F8996]" style={{ left: field.left, width: field.width }}>{field.label}<span className="mt-[4px] flex h-[34px] items-center rounded-[9px] border border-[#28313B] bg-[#080B0F]/34 px-[9px] text-[9px] font-normal text-[#F5F7FA]">{field.label === "Cor" && <i className="mr-[7px] h-[10px] w-[10px] rounded-full bg-[#22C55E]" />}{field.value}</span></label>)}
                <label className="absolute left-[191px] top-[34px] w-[130px] text-[7.8px] font-semibold text-[#7F8996]">Ícone<span className="mt-[4px] flex h-[34px] items-center gap-[7px] rounded-[9px] border border-[#28313B] bg-[#080B0F]/34 px-[9px] text-[9px] font-normal text-[#F5F7FA]"><Glyph name="cart" size={14} color="#22C55E" />Carrinho</span></label>
                <div className="absolute left-[821px] top-[34px] h-[49px] w-[264px]"><strong className="text-[8px]">Categoria padrão</strong><div className="mt-[8px] flex items-center gap-[10px]"><button type="button" role="switch" aria-checked={isDefault} onClick={() => setIsDefault((value) => !value)} className={`relative h-[20px] w-[34px] rounded-[10px] ${isDefault ? "bg-[#22C55E]" : "bg-[#28313B]"}`}><span className={`absolute top-[3px] h-[14px] w-[14px] rounded-full bg-white transition-[left] ${isDefault ? "left-[17px]" : "left-[3px]"}`} /></button><span className="text-[7.7px] text-[#9CA6B2]">Usar como padrão para novos estabelecimentos.</span></div></div>
                <div className="absolute left-[11px] top-[93px] h-px w-[1074px] bg-[#28313B]/70" /><h3 className="absolute left-[11px] top-[103px] text-[8.6px] font-semibold">Estabelecimentos vinculados</h3>
                <div className="absolute left-[11px] top-[123px] flex gap-[8px]">{["LIDL", "Dunnes", "Centra"].map((merchant) => <span key={merchant} className="flex h-[24px] items-center gap-[6px] rounded-[12px] bg-[#22C55E]/9 px-[7px] text-[7.8px] font-semibold text-[#B7BEC8]"><Glyph name="store" size={12} color="#22C55E" />{merchant}<button type="button" aria-label={`Remover ${merchant}`}><Glyph name="close" size={10} color="#64707D" /></button></span>)}<button type="button" className="flex h-[24px] items-center rounded-[9px] border border-[#28313B] bg-[#080B0F]/28 px-[11px] text-[7.6px] font-semibold text-[#60A5FA]">+ Adicionar estabelecimento</button></div>
                <div className="absolute right-[13px] top-[119px] flex gap-[10px]"><button type="button" className="h-[28px] w-[74px] rounded-[14px] border border-[#28313B] bg-[#080B0F]/28 text-[8.4px] font-semibold text-[#9CA6B2]">Cancelar</button><button type="button" className="h-[28px] w-[92px] rounded-[14px] bg-[#3B82F6] text-[8.4px] font-semibold">Salvar alterações</button></div>
              </section>
            </div>
          </section>
        </div>
      </DesktopScaleCanvas>
    </main>
  );
}
