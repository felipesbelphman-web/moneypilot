"use client";

import { useCurrency } from "@/components/CurrencyProvider";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";
import type { BudgetStatus, BudgetWithProgress } from "@/components/budgets/budget-model";
import { BudgetSpendMarkerChart } from "@/components/budgets/BudgetSpendMarkerChart";
import { aggregateMoney } from "@/lib/domain/money-aggregation";

type BudgetTableProps = {
  budgets: BudgetWithProgress[];
  totalBudgets: number;
  hasAnyBudgets: boolean;
  month: string;
  openMenu: string | null;
  onToggleMenu: (budgetId: string) => void;
  onEdit: (budgetId: string) => void;
  onDelete: (budgetId: string) => void;
};

const statusStyle: Record<BudgetStatus, { color: string; background: string }> = {
  "Dentro do limite": { color: "#22C55E", background: "rgba(34,197,94,0.12)" },
  "Risco de ultrapassar": { color: "#F59E0B", background: "rgba(245,158,11,0.13)" },
  "Limite ultrapassado": { color: "#F43F5E", background: "rgba(244,63,94,0.13)" },
};

const columns = "grid-cols-[192px_85px_85px_90px_120px_100px_48px]";
export function BudgetTable({ budgets, totalBudgets, hasAnyBudgets, month, openMenu, onToggleMenu, onEdit, onDelete }: BudgetTableProps) {
  const { language } = useLanguage();
  const t = translations[language].appBudgets;
  const locale = language === "pt" ? "pt-PT" : language === "es" ? "es-ES" : "en-IE";
  const [year, monthNumber] = month.split("-").map(Number);
  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
  const categoryCountCopy = { en: ["category", "categories"], pt: ["categoria", "categorias"], es: ["categoría", "categorías"], de: ["Kategorie", "Kategorien"], fr: ["catégorie", "catégories"], nl: ["categorie", "categorieën"], it: ["categoria", "categorie"] }[language];
  const categoriesLabel = `${totalBudgets} ${categoryCountCopy[totalBudgets === 1 ? 0 : 1]}`;
  const emptyCopy = hasAnyBudgets ? ({ en: "No budgets in this period.", pt: "Nenhum orçamento neste período.", es: "No hay presupuestos en este período.", de: "Keine Budgets in diesem Zeitraum.", fr: "Aucun budget sur cette période.", nl: "Geen budgetten in deze periode.", it: "Nessun budget in questo periodo." })[language] : t.empty;
  const chartMax = Math.max(1, ...budgets.flatMap((budget) => budget.spent === null ? [budget.budget] : [budget.budget, budget.spent]));
  return (
    <section className="relative h-[516px] w-[748px] shrink-0 overflow-hidden rounded-[18px] border border-[#28313B] bg-[rgba(8,11,15,0.22)] shadow-[0_8px_18px_rgba(0,0,0,0.24)] backdrop-blur-[3.5px]">
      <h2 className="absolute left-[13px] top-[13px] text-[15px] font-semibold leading-none">{t.yourBudgets}</h2>
      <span className="absolute right-[13px] top-[15px] text-[9px] capitalize text-[#64707D]">{categoriesLabel} · {monthLabel}</span>
      <div className={`absolute left-[13px] top-[45px] grid h-[30px] w-[720px] ${columns} items-center rounded-[8px] bg-[rgba(25,33,44,0.62)] text-[8.5px] font-semibold text-[#7F8996] [&>span:first-child]:pl-[8px] [&>span:last-child]:pr-[8px]`}>
        {t.columns.map((column) => <span key={column}>{column}</span>)}
      </div>
      <div className="absolute left-[13px] top-[75px] h-[384px] w-[720px] overflow-auto">
        {budgets.map((item) => <BudgetRow key={item.id} chartMax={chartMax} item={item} open={openMenu === item.id} onToggle={() => onToggleMenu(item.id)} onEdit={() => onEdit(item.id)} onDelete={() => onDelete(item.id)} />)}
        {budgets.length === 0 && <div className="flex h-full items-center justify-center text-[10px] text-[#64707D]">{emptyCopy}</div>}
      </div>
      <Link href="/categories" className="absolute bottom-[20px] left-[13px] text-[9.5px] font-semibold text-[#3B82F6]">{t.addCategory}</Link>
    </section>
  );
}

function BudgetRow({ chartMax, item, open, onToggle, onEdit, onDelete }: { chartMax: number; item: BudgetWithProgress; open: boolean; onToggle: () => void; onEdit: () => void; onDelete: () => void }) {
  const { language } = useLanguage();
  const { formatMoney: money } = useCurrency();
  const t = translations[language].appBudgets;
  const content = translations[language].appBudgetsContent;
  const deleteLabel = { en: "Delete", pt: "Excluir", es: "Eliminar", de: "Löschen", fr: "Supprimer", nl: "Verwijderen", it: "Elimina" }[language];
  const percentage = item.spent === null ? null : Math.round((item.spent / item.budget) * 100);
  const remainingResult = item.spent === null ? null : aggregateMoney([item.budget, -item.spent]);
  const remaining = remainingResult?.available ? remainingResult.value : null;
  const style = item.status === null ? null : statusStyle[item.status];
  const statusLabels: Record<BudgetStatus, string> = {
    "Dentro do limite": ({ en: "Within limit", pt: "Dentro do limite", es: "Dentro del límite", de: "Im Limit", fr: "Dans la limite", nl: "Binnen limiet", it: "Entro il limite" })[language],
    "Risco de ultrapassar": ({ en: "Risk of exceeding", pt: "Risco de ultrapassar", es: "Riesgo de superar", de: "Risiko der Überschreitung", fr: "Risque de dépassement", nl: "Risico op overschrijding", it: "Rischio di superamento" })[language],
    "Limite ultrapassado": ({ en: "Limit exceeded", pt: "Limite ultrapassado", es: "Límite superado", de: "Limit überschritten", fr: "Limite dépassée", nl: "Limiet overschreden", it: "Limite superato" })[language],
  };

  return (
    <div className={`grid h-[48px] min-w-[720px] ${columns} items-center border-b border-[rgba(40,49,59,0.72)] text-[9px]`}>
      <div className="flex items-center gap-[8px] pl-[8px]"><div className="flex size-[26px] items-center justify-center rounded-[8px] text-[9px] font-semibold" style={{ color: item.color, backgroundColor: `${item.color}21` }}>{item.category[0]}</div><div><strong className="text-[9.5px] font-semibold">{item.category}</strong><p className="mt-[2px] text-[7.5px] text-[#7F8996]">{item.subtitle}</p></div></div>
      <strong>{money(item.budget)}</strong><strong>{item.spent === null ? "—" : money(item.spent)}</strong><strong className={remaining !== null && remaining < 0 ? "text-[#F43F5E]" : ""}>{remaining === null ? "—" : money(remaining)}</strong>
      <div className="flex items-center gap-[3px]">{item.spent !== null && style && <BudgetSpendMarkerChart color={style.color} label={t.spent} limit={item.budget} max={chartMax} spent={item.spent} />}<strong className="text-[8px]">{percentage === null ? "—" : `${percentage}%`}</strong></div>
      <span className="flex h-[20px] w-fit items-center rounded-[10px] px-[8px] text-[7.5px] font-semibold" style={style ? { color: style.color, backgroundColor: style.background } : undefined}>{item.status === null ? "—" : statusLabels[item.status]}</span>
      <div className="relative"><button type="button" onClick={onToggle} aria-label={`${content.actionsFor} ${item.category}`} className="w-full text-center text-[11px] font-semibold tracking-[2px] text-[#64707D]">•••</button>{open && <div className="absolute right-0 top-[20px] z-10 w-[96px] rounded-[8px] border border-[#28313B] bg-[#10151B] p-[4px] text-[8px] shadow-xl"><button type="button" onClick={onEdit} className="h-[24px] w-full rounded-[5px] px-[6px] text-left hover:bg-[#19212C]">{content.editLimit}</button><button type="button" onClick={onDelete} className="h-[24px] w-full rounded-[5px] px-[6px] text-left text-[#F43F5E] hover:bg-[#19212C]">{deleteLabel}</button></div>}</div>
    </div>
  );
}
