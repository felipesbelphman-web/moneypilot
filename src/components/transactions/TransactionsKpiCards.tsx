import Image from "next/image";

const iconRoot = "/moneypilot/transactions/icons";

const cards = [
  { title: "Movimentações", value: "45", detail: "7 novas nos últimos 7 dias", color: "#3B82F6", icon: `${iconRoot}/receipt-outline.svg` },
  { title: "Gasto do mês", value: "€2.180,50", detail: "59,7% da renda • +8,7% vs jul", color: "#F43F5E", icon: `${iconRoot}/trending-down-outline.svg` },
  { title: "Gasto variável em alta", value: "Compras", detail: "€134,60 • maior gasto variável", color: "#8B5CF6", icon: `${iconRoot}/pricetag-outline.svg` },
  { title: "Disponível para gastar", value: "€300,00", detail: "Até 31 Ago • contas e metas protegidas", color: "#22C55E", icon: "/moneypilot/dashboard-safe-to-spend-icon.svg" },
];

export function TransactionsKpiCards() {
  return (
    <div className="absolute left-0 top-[122px] flex h-[116px] w-[1090px] justify-between">
      {cards.map((card) => (
        <article key={card.title} className="relative h-[116px] w-[263px] overflow-hidden rounded-[18px] border border-[#28313B] bg-[rgba(8,11,15,0.22)] shadow-[0_8px_18px_rgba(0,0,0,0.24)] backdrop-blur-[7px]">
          <div className="absolute left-[13px] top-[13px] flex size-[30px] items-center justify-center rounded-[9px] border" style={{ borderColor: card.color, backgroundColor: `${card.color}24` }}>
            <Image src={card.icon} alt="" width={20} height={20} className="size-[20px]" />
          </div>
          <h2 className="absolute left-[53px] top-[18px] text-[11px] font-semibold text-[#F5F7FA]">{card.title}</h2>
          <strong className="absolute left-[13px] top-[54px] text-[23px] font-semibold leading-none text-[#F5F7FA]">{card.value}</strong>
          <p className="absolute left-[13px] top-[88px] text-[10px] text-[#9CA6B2]">{card.detail}</p>
        </article>
      ))}
    </div>
  );
}
