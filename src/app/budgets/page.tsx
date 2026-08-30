"use client";

import { useCurrency } from "@/components/CurrencyProvider";

import Image from "next/image";
import { useMemo, useState, type FormEvent } from "react";
import { IconFileText, IconX } from "@tabler/icons-react";

import { BudgetDecisionColumn } from "@/components/budgets/BudgetDecisionColumn";
import { BudgetSummaryCards } from "@/components/budgets/BudgetSummaryCards";
import { BudgetTable } from "@/components/budgets/BudgetTable";
import { BudgetProjectionModal, type ProjectionModalView } from "@/components/budgets/BudgetProjectionModal";
import { calculateBudgetSpent, calculateBudgetStatus, normalizeCategory, type Budget, type BudgetWithProgress } from "@/components/budgets/budget-model";
import { calculateBudgetProjection } from "@/components/budgets/budget-projection";
import { DesktopScaleCanvas } from "@/components/DesktopScaleCanvas";
import { useFinanceData } from "@/components/FinanceDataProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";

const iconRoot = "/moneypilot/budgets/icons";

function parseBudgetLimit(value: string) {
  let compact = value.trim().replace(/(?:R\$|€|£|\$|EUR|GBP|USD|BRL|\s|\u00a0)/gi, "");
  if (!compact) return null;
  const comma = compact.lastIndexOf(",");
  const dot = compact.lastIndexOf(".");
  const decimal = comma > dot ? "," : ".";
  const thousands = decimal === "," ? "." : ",";
  compact = compact.includes(decimal) ? compact.replaceAll(thousands, "").replace(decimal, ".") : compact;
  if (!/^\d+(?:\.\d{1,2})?$/.test(compact)) return null;
  const amount = Number(compact);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

type BudgetModalState =
  | { mode: "create" }
  | { mode: "edit"; budgetId: string };

export default function BudgetsPage() {
  const { language } = useLanguage();
  const { formatMoney: money } = useCurrency();
  const t = translations[language].appBudgets;
  const content = translations[language].appBudgetsContent;
  const { budgets, setBudgets, transactions, budgetAdjustments, setBudgetAdjustment, goals } = useFinanceData();
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState("2026-08");
  const [modalState, setModalState] = useState<BudgetModalState | null>(null);
  const [deleteBudgetId, setDeleteBudgetId] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [projectionModal, setProjectionModal] = useState<ProjectionModalView | null>(null);
  const [adjustmentFeedback, setAdjustmentFeedback] = useState(false);

  const budgetsWithProgress = useMemo(() => budgets.map((budget): BudgetWithProgress => {
    const spent = calculateBudgetSpent(budget, transactions);
    return { ...budget, spent, status: calculateBudgetStatus(budget.budget, spent) };
  }), [budgets, transactions]);
  const projection = useMemo(() => calculateBudgetProjection({ budgets, transactions, month }), [budgets, month, transactions]);
  const monthBudgets = budgetsWithProgress.filter((item) => item.month === month);
  const visibleBudgets = monthBudgets.filter((item) =>
    `${item.category} ${item.subtitle}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return (
    <div className="relative min-h-screen bg-[#080B0F]">
      <div className="relative z-10">
        <DesktopScaleCanvas>
          <main className="relative h-[1024px] w-[1536px] overflow-hidden text-[#F5F7FA]">
            <section className="absolute left-[231px] top-[107px] h-[810px] w-[1164px] overflow-hidden rounded-[38px] border border-[#28313B]/16 bg-[#0D1117]/50 px-[32px] py-[16px] shadow-[0_22px_42px_rgba(0,0,0,0.45)] backdrop-blur-[20px]">
              <div className="relative h-[776px] w-[1090px] overflow-hidden">
                <div className="absolute left-0 top-0 flex h-[38px] w-[1090px] items-center justify-between">
                  <div className="flex items-center gap-[18px]"><div className="h-[37px] w-[37px] overflow-hidden"><Image src="/moneypilot/moneypilot-logo.svg" alt="" width={180} height={40} priority className="h-[37px] w-auto max-w-none" /></div><span className="money-pilot-wordmark font-brand text-[21.44px] font-medium tracking-[0.429px]">MoneyPilot</span></div>
                  <span className="w-[130px] text-right text-[9px] font-semibold text-[#64707D]">{t.eyebrow}</span>
                </div>

                <header className="absolute left-0 top-[50px] h-[56px] w-[1090px] overflow-hidden">
                  <h1 className="absolute left-0 top-[2px] text-[23px] font-semibold leading-none">{t.title}</h1>
                  <p className="absolute left-0 top-[34px] text-[13px] text-[#9CA6B2]">{t.description}</p>
                  <div className="absolute left-[509px] top-[4px] flex w-[581px] items-center justify-end gap-[8px]">
                    <label className="flex h-[36px] w-[267px] items-center gap-[12px] rounded-[19px] border border-[#28313B] bg-[#080B0F]/34 px-[14px] text-[#9CA6B2]"><Image src={`${iconRoot}/search.svg`} alt="" width={20} height={20} className="size-[20px]" /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label={content.search} placeholder={content.search} className="w-full bg-transparent text-[10px] outline-none placeholder:text-[#9CA6B2]" /></label>
                    <label className="relative flex h-[36px] w-[103px] cursor-pointer items-center justify-center gap-[12px] rounded-[19px] border border-[#28313B] bg-[#080B0F]/34 text-[10px] font-medium text-[#9CA6B2]"><Image src={`${iconRoot}/calendar.svg`} alt="" width={20} height={20} className="size-[20px]" /><span>{content.month}</span><input type="month" value={month} onChange={(event) => setMonth(event.target.value)} aria-label={content.selectMonth} className="absolute inset-0 cursor-pointer opacity-0" /></label>
                    <button type="button" onClick={() => setModalState({ mode: "create" })} className="flex h-[36px] w-[139px] items-center justify-center gap-[10px] rounded-[19px] bg-[#3B82F6] text-[10px] font-semibold"><span>{content.newBudget}</span><Image src={`${iconRoot}/new-budget.svg`} alt="" width={19} height={19} className="size-[19px]" /></button>
                    <Image src="/moneypilot/dashboard-avatar.png" alt={content.userAvatar} width={48} height={48} className="size-[48px] rounded-full" />
                  </div>
                </header>

                <BudgetSummaryCards budgets={monthBudgets} projection={projection} />
                <div className="absolute left-0 top-[250px] flex h-[516px] w-[1090px] gap-[12px]">
                  <BudgetTable budgets={visibleBudgets} totalBudgets={monthBudgets.length} month={month} openMenu={openMenu} onToggleMenu={(budgetId) => setOpenMenu(openMenu === budgetId ? null : budgetId)} onEdit={(budgetId) => { setOpenMenu(null); setModalState({ mode: "edit", budgetId }); }} onDelete={(budgetId) => { setOpenMenu(null); setDeleteBudgetId(budgetId); }} />
                  <BudgetDecisionColumn projection={projection} adjustment={budgetAdjustments[month]} hasBudgets={monthBudgets.length > 0} hasGoals={goals.length > 0} onCreateBudget={() => setModalState({ mode: "create" })} onViewProjection={() => setProjectionModal("projection")} onReviewAdjustment={() => setProjectionModal("adjustment")} />
                </div>
              </div>
            </section>

            {modalState && <BudgetModal state={modalState} month={month} budgets={budgets} categories={content.categories} onSubmit={(budget) => { setBudgets((current) => modalState.mode === "create" ? [budget, ...current] : current.map((item) => item.id === budget.id ? budget : item)); setQuery(""); setOpenMenu(null); setModalState(null); }} onClose={() => setModalState(null)} />}
            {deleteBudgetId && (() => { const selected = budgetsWithProgress.find((budget) => budget.id === deleteBudgetId); return selected ? <DeleteBudgetModal budget={selected} onClose={() => setDeleteBudgetId(null)} onConfirm={() => { setBudgets((current) => current.filter((budget) => budget.id !== deleteBudgetId)); setOpenMenu(null); setDeleteBudgetId(null); }} /> : null; })()}
            {projectionModal && <BudgetProjectionModal view={projectionModal} month={month} projection={projection} adjustment={budgetAdjustments[month]} onClose={() => setProjectionModal(null)} onBack={() => setProjectionModal("projection")} onReview={() => setProjectionModal("adjustment")} onApply={(adjustment) => { setBudgetAdjustment(adjustment); setProjectionModal(null); setAdjustmentFeedback(true); }} />}
            {adjustmentFeedback && budgetAdjustments[month] && <div role="status" className="absolute bottom-[56px] left-1/2 z-[75] -translate-x-1/2 rounded-[14px] border border-[#174D32] bg-[var(--surface-green-subtle)] px-[18px] py-[10px] text-[10px] shadow-xl"><strong className="text-[#22C55E]">{language === "pt" ? "Ajuste aplicado" : language === "es" ? "Ajuste aplicado" : "Adjustment applied"}</strong><span className="ml-[8px] text-[var(--text-tertiary)]">{language === "pt" ? "Sua meta restante é" : language === "es" ? "Tu objetivo restante es" : "Your remaining spending target is"} {money(budgetAdjustments[month].targetRemainingSpend)}.</span><button type="button" onClick={() => setAdjustmentFeedback(false)} aria-label={t.close} className="ml-[12px] text-[var(--text-tertiary)]"><IconX size={14} /></button></div>}
          </main>
        </DesktopScaleCanvas>
      </div>
    </div>
  );
}

function BudgetModal({ state, month, budgets, categories, onSubmit, onClose }: { state: BudgetModalState; month: string; budgets: Budget[]; categories: readonly { category: string; subtitle: string }[]; onSubmit: (budget: Budget) => void; onClose: () => void }) {
  const { language } = useLanguage();
  const t = translations[language].appBudgets;
  const editingBudget = state.mode === "edit" ? budgets.find((budget) => budget.id === state.budgetId) : undefined;
  const [category, setCategory] = useState(editingBudget?.category ?? "");
  const [limit, setLimit] = useState(editingBudget ? String(editingBudget.budget) : "");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedCategory = category.trim();
    const parsedLimit = parseBudgetLimit(limit);
    if (!normalizedCategory) {
      setError(language === "pt" ? "Informe uma categoria." : language === "es" ? "Indica una categoría." : language === "de" ? "Gib eine Kategorie ein." : language === "fr" ? "Saisissez une catégorie." : language === "nl" ? "Voer een categorie in." : language === "it" ? "Inserisci una categoria." : "Enter a category.");
      return;
    }
    if (parsedLimit === null) {
      setError(language === "pt" ? "Informe um limite maior que zero." : language === "es" ? "Indica un límite mayor que cero." : language === "de" ? "Gib ein Limit größer als null ein." : language === "fr" ? "Saisissez une limite supérieure à zéro." : language === "nl" ? "Voer een limiet groter dan nul in." : language === "it" ? "Inserisci un limite maggiore di zero." : "Enter a limit greater than zero.");
      return;
    }
    const budgetMonth = editingBudget?.month ?? month;
    if (budgets.some((budget) => budget.id !== editingBudget?.id && budget.month === budgetMonth && normalizeCategory(budget.category) === normalizeCategory(normalizedCategory))) {
      setError(language === "pt" ? "Já existe um orçamento para esta categoria neste mês." : language === "es" ? "Ya existe un presupuesto para esta categoría este mes." : language === "de" ? "Für diese Kategorie gibt es diesen Monat bereits ein Budget." : language === "fr" ? "Un budget existe déjà pour cette catégorie ce mois-ci." : language === "nl" ? "Er bestaat deze maand al een budget voor deze categorie." : language === "it" ? "Esiste già un budget per questa categoria questo mese." : "A budget already exists for this category this month.");
      return;
    }
    const knownCategory = categories.find((item) => normalizeCategory(item.category) === normalizeCategory(normalizedCategory));
    const knownBudget = knownCategory ? budgets.find((budget) => normalizeCategory(budget.category) === normalizeCategory(knownCategory.category)) : undefined;
    onSubmit({ ...editingBudget, id: editingBudget?.id ?? crypto.randomUUID(), category: knownCategory?.category ?? normalizedCategory, subtitle: knownCategory?.subtitle ?? (language === "pt" ? "Categoria personalizada" : language === "es" ? "Categoría personalizada" : "Custom category"), budget: parsedLimit, month: budgetMonth, color: knownBudget?.color ?? "#64707D" });
    setCategory("");
    setLimit("");
    setError("");
  }
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#080B0F]/65 backdrop-blur-sm">
      <div className="relative w-[420px] rounded-[26px] border border-[#28313B] bg-[#0D1117]/95 p-[26px] shadow-2xl">
        <button type="button" onClick={onClose} aria-label={t.close} className="absolute right-[18px] top-[18px] text-[#9CA6B2]"><IconX size={20} /></button>
        <div className="flex items-center gap-[10px]"><div className="flex size-[34px] items-center justify-center rounded-[10px] bg-[#3B82F6]/20 text-[#60A5FA]"><IconFileText size={20} /></div><h2 className="text-[18px] font-semibold">{state.mode === "edit" ? (language === "pt" ? "Editar orçamento" : language === "es" ? "Editar presupuesto" : "Edit budget") : t.newBudget}</h2></div>
        <p className="mt-[10px] text-[11px] text-[#9CA6B2]">{t.modalDescription}</p>
        <form onSubmit={submit} className="mt-[20px] grid gap-[10px]"><input value={category} onChange={(event) => { setCategory(event.target.value); setError(""); }} list="budget-categories" placeholder={t.category} aria-label={t.category} className="h-[42px] rounded-[12px] border border-[#28313B] bg-[#080B0F]/60 px-[14px] text-[11px] outline-none" /><datalist id="budget-categories">{categories.map((item) => <option key={item.category} value={item.category} />)}</datalist><input value={limit} onChange={(event) => { setLimit(event.target.value); setError(""); }} inputMode="decimal" placeholder={t.monthlyLimit} aria-label={t.monthlyLimit} className="h-[42px] rounded-[12px] border border-[#28313B] bg-[#080B0F]/60 px-[14px] text-[11px] outline-none" />{error && <p role="alert" className="px-[2px] text-[9px] text-[#F43F5E]">{error}</p>}<button type="submit" className="mt-[6px] h-[42px] rounded-[21px] bg-[#3B82F6] text-[11px] font-semibold">{state.mode === "edit" ? (language === "pt" ? "Salvar alterações" : language === "es" ? "Guardar cambios" : "Save changes") : t.addBudget}</button></form>
      </div>
    </div>
  );
}

function DeleteBudgetModal({ budget, onClose, onConfirm }: { budget: BudgetWithProgress; onClose: () => void; onConfirm: () => void }) {
  const { language } = useLanguage();
  const { formatMoney: money } = useCurrency();
  const copy = language === "pt"
    ? { title: "Excluir orçamento?", description: "Esta ação removerá este orçamento da sua lista.", category: "Categoria", limit: "Limite mensal", spent: "Gasto atual", cancel: "Cancelar", confirm: "Excluir orçamento" }
    : language === "es"
      ? { title: "¿Eliminar presupuesto?", description: "Esta acción eliminará este presupuesto de tu lista.", category: "Categoría", limit: "Límite mensual", spent: "Gasto actual", cancel: "Cancelar", confirm: "Eliminar presupuesto" }
      : language === "de" ? { title: "Budget löschen?", description: "Diese Aktion entfernt das Budget aus deiner Liste.", category: "Kategorie", limit: "Monatslimit", spent: "Aktuelle Ausgaben", cancel: "Abbrechen", confirm: "Budget löschen" }
      : language === "fr" ? { title: "Supprimer le budget ?", description: "Cette action retirera ce budget de votre liste.", category: "Catégorie", limit: "Limite mensuelle", spent: "Dépenses actuelles", cancel: "Annuler", confirm: "Supprimer le budget" }
      : language === "nl" ? { title: "Budget verwijderen?", description: "Hiermee wordt dit budget uit je lijst verwijderd.", category: "Categorie", limit: "Maandlimiet", spent: "Huidige uitgaven", cancel: "Annuleren", confirm: "Budget verwijderen" }
      : language === "it" ? { title: "Eliminare il budget?", description: "Questa azione rimuoverà il budget dall’elenco.", category: "Categoria", limit: "Limite mensile", spent: "Spesa attuale", cancel: "Annulla", confirm: "Elimina budget" }
      : { title: "Delete budget?", description: "This action will remove this budget from your list.", category: "Category", limit: "Monthly limit", spent: "Current spend", cancel: "Cancel", confirm: "Delete budget" };
  return <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#080B0F]/65 backdrop-blur-sm"><div className="relative w-[420px] rounded-[26px] border border-[#28313B] bg-[#0D1117]/95 p-[26px] shadow-2xl"><button type="button" onClick={onClose} aria-label={copy.cancel} className="absolute right-[18px] top-[18px] text-[#9CA6B2]"><IconX size={20} /></button><h2 className="text-[18px] font-semibold">{copy.title}</h2><p className="mt-[10px] text-[11px] text-[#9CA6B2]">{copy.description}</p><dl className="mt-[20px] grid gap-[8px] rounded-[12px] border border-[#28313B] bg-[#080B0F]/35 p-[14px] text-[10px]"><div className="flex justify-between"><dt className="text-[#9CA6B2]">{copy.category}</dt><dd className="font-semibold">{budget.category}</dd></div><div className="flex justify-between"><dt className="text-[#9CA6B2]">{copy.limit}</dt><dd className="font-semibold">{money(budget.budget)}</dd></div><div className="flex justify-between"><dt className="text-[#9CA6B2]">{copy.spent}</dt><dd className="font-semibold">{money(budget.spent)}</dd></div></dl><div className="mt-[18px] flex gap-[10px]"><button type="button" onClick={onClose} className="h-[42px] flex-1 rounded-[21px] border border-[#28313B] text-[11px] font-semibold">{copy.cancel}</button><button type="button" onClick={onConfirm} className="h-[42px] flex-1 rounded-[21px] bg-[#F43F5E] text-[11px] font-semibold">{copy.confirm}</button></div></div></div>;
}
