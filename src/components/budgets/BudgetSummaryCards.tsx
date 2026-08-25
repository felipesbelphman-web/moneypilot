import Image from "next/image";

const iconRoot = "/moneypilot/budgets/icons";

const cards = [
  { title: "Orçamento planejado", value: "€1.422,00", detail: "Agosto · 11 categorias planejadas", color: "#3B82F6", icon: `${iconRoot}/document.svg`, detailColor: "#9CA6B2" },
  { title: "Gasto até agora", value: "€1.065,70", detail: "73,3% usado · 61% do mês passou", color: "#F43F5E", icon: `${iconRoot}/spent-badge.svg`, detailColor: "#9CA6B2" },
  { title: "Previsão de fechamento", value: "€1.517,00", detail: "≈ €95 acima do planejado no ritmo atual", color: "#22C55E", icon: `${iconRoot}/forecast.svg`, detailColor: "#22C55E" },
  { title: "Precisa de ação", value: "3", detail: "Compras · Café · Assinaturas", color: "#F59E0B", icon: `${iconRoot}/warning.svg`, detailColor: "#9CA6B2" },
];

export function BudgetSummaryCards() {
  return (
    <div className="absolute left-0 top-[122px] flex h-[116px] w-[1090px] gap-[14px] overflow-hidden">
      {cards.map((card) => (
        <article key={card.title} className="relative h-[116px] w-[262px] shrink-0 overflow-hidden rounded-[18px] border border-[#28313B] bg-[rgba(8,11,15,0.22)] shadow-[0_8px_18px_rgba(0,0,0,0.24)] backdrop-blur-[3.5px]">
          <div className="absolute left-[12px] top-[12px] flex size-[30px] items-center justify-center rounded-[9px] border" style={{ borderColor: card.color, backgroundColor: `${card.color}24` }}>
            <Image src={card.icon} alt="" width={20} height={20} className="size-[20px]" />
          </div>
          <h2 className="absolute left-[52px] top-[17px] text-[11px] font-semibold text-[#F5F7FA]">{card.title}</h2>
          <strong className="absolute left-[12px] top-[53px] text-[23px] font-semibold leading-none text-[#F5F7FA]">{card.value}</strong>
          <p className="absolute left-[12px] top-[88px] text-[9.5px]" style={{ color: card.detailColor }}>{card.detail}</p>
        </article>
      ))}
    </div>
  );
}
