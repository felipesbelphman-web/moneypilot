export type BudgetStatus = "Dentro do plano" | "No controle" | "Atenção" | "Perto do limite" | "Estourado";

export type Budget = {
  category: string;
  subtitle: string;
  budget: number;
  spent: number;
  color: string;
  status: BudgetStatus;
};

type BudgetTableProps = {
  budgets: Budget[];
  openMenu: string | null;
  onToggleMenu: (category: string) => void;
};

const statusStyle: Record<BudgetStatus, { color: string; background: string }> = {
  "Dentro do plano": { color: "#22C55E", background: "rgba(34,197,94,0.12)" },
  "No controle": { color: "#22C55E", background: "rgba(34,197,94,0.12)" },
  "Atenção": { color: "#F59E0B", background: "rgba(245,158,11,0.13)" },
  "Perto do limite": { color: "#F97316", background: "rgba(249,115,22,0.13)" },
  "Estourado": { color: "#F43F5E", background: "rgba(244,63,94,0.13)" },
};

const columns = "grid-cols-[192px_85px_85px_90px_120px_100px_48px]";
const money = (value: number) => `${value < 0 ? "-" : ""}€${Math.abs(value).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}`;

export function BudgetTable({ budgets, openMenu, onToggleMenu }: BudgetTableProps) {
  return (
    <section className="relative h-[516px] w-[748px] shrink-0 overflow-hidden rounded-[18px] border border-[#28313B] bg-[rgba(8,11,15,0.22)] shadow-[0_8px_18px_rgba(0,0,0,0.24)] backdrop-blur-[3.5px]">
      <h2 className="absolute left-[13px] top-[13px] text-[15px] font-semibold leading-none">Seus orçamentos</h2>
      <span className="absolute right-[13px] top-[15px] text-[9px] text-[#64707D]">11 categorias · Agosto 2026</span>
      <div className={`absolute left-[13px] top-[45px] grid h-[30px] w-[720px] ${columns} items-center rounded-[8px] bg-[rgba(25,33,44,0.62)] px-[8px] text-[8.5px] font-semibold text-[#7F8996]`}>
        <span>Categoria</span><span>Orçamento</span><span>Gasto</span><span>Restante</span><span>Progresso</span><span>Status</span><span>Ações</span>
      </div>
      <div className="absolute left-[13px] top-[75px] h-[384px] w-[720px] overflow-hidden">
        {budgets.map((item) => <BudgetRow key={item.category} item={item} open={openMenu === item.category} onToggle={() => onToggleMenu(item.category)} />)}
        {budgets.length === 0 && <div className="flex h-full items-center justify-center text-[10px] text-[#64707D]">Nenhum orçamento encontrado.</div>}
      </div>
      <button type="button" className="absolute bottom-[20px] left-[13px] text-[9.5px] font-semibold text-[#3B82F6]">+ Adicionar categoria</button>
    </section>
  );
}

function BudgetRow({ item, open, onToggle }: { item: Budget; open: boolean; onToggle: () => void }) {
  const percentage = Math.round((item.spent / item.budget) * 100);
  const remaining = item.budget - item.spent;
  const style = statusStyle[item.status];

  return (
    <div className={`grid h-[48px] ${columns} items-center border-b border-[rgba(40,49,59,0.72)] px-[8px] text-[9px]`}>
      <div className="flex items-center gap-[8px]"><div className="flex size-[26px] items-center justify-center rounded-[8px] text-[9px] font-semibold" style={{ color: item.color, backgroundColor: `${item.color}21` }}>{item.category[0]}</div><div><strong className="text-[9.5px] font-semibold">{item.category}</strong><p className="mt-[2px] text-[7.5px] text-[#7F8996]">{item.subtitle}</p></div></div>
      <strong>{money(item.budget)}</strong><strong>{money(item.spent)}</strong><strong className={remaining < 0 ? "text-[#F43F5E]" : ""}>{money(remaining)}</strong>
      <div className="flex items-center gap-[5px]"><div className="h-[6px] w-[88px] overflow-hidden rounded-[3px] bg-[#19212C]"><div className="h-full rounded-[3px]" style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: style.color }} /></div><strong className="text-[8.5px]">{percentage}%</strong></div>
      <span className="flex h-[20px] w-fit items-center rounded-[10px] px-[8px] text-[7.5px] font-semibold" style={{ color: style.color, backgroundColor: style.background }}>{item.status}</span>
      <div className="relative"><button type="button" onClick={onToggle} aria-label={`Ações de ${item.category}`} className="w-full text-center text-[11px] font-semibold tracking-[2px] text-[#64707D]">•••</button>{open && <div className="absolute right-0 top-[20px] z-10 w-[88px] rounded-[8px] border border-[#28313B] bg-[#10151B] p-[4px] text-[8px] shadow-xl"><button type="button" className="h-[24px] w-full rounded-[5px] px-[6px] text-left hover:bg-[#19212C]">Editar limite</button></div>}</div>
    </div>
  );
}
