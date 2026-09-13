"use client";

import { useCurrency } from "@/components/CurrencyProvider";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState, type FormEvent } from "react";
import { IconFileText, IconX } from "@tabler/icons-react";

import { BudgetDecisionColumn } from "@/components/budgets/BudgetDecisionColumn";
import { BudgetSummaryCards } from "@/components/budgets/BudgetSummaryCards";
import { BudgetTable } from "@/components/budgets/BudgetTable";
import { BudgetProjectionModal, type ProjectionModalView } from "@/components/budgets/BudgetProjectionModal";
import { calculateBudgetSpent, calculateBudgetStatus, normalizeCategory, type Budget, type BudgetWithProgress } from "@/components/budgets/budget-model";
import { calculateBudgetProjection } from "@/components/budgets/budget-projection";
import { DesktopInternalPagePanel, DesktopScaleCanvas } from "@/components/DesktopScaleCanvas";
import { useFinanceData } from "@/components/FinanceDataProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";
import { getDashboardMonth } from "@/components/dashboard/dashboard-financial-summary";
import { parseBudgetLimitText } from "@/lib/domain/financial-input-adapters";

const iconRoot = "/moneypilot/budgets/icons";

function parseBudgetLimit(value: string) {
  return parseBudgetLimitText(value);
}

type BudgetModalState =
  | { mode: "create"; month: string }
  | { mode: "edit"; budgetId: string };

export default function BudgetsPage() {
  return <Suspense fallback={null}><BudgetsPageFromSearchParams /></Suspense>;
}

function resolveSelectedMonth(value: string | null, currentMonth: string) {
  return value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : currentMonth;
}

function BudgetsPageFromSearchParams() {
  const searchParams = useSearchParams();
  const currentMonth = getDashboardMonth();
  const requestedMonth = resolveSelectedMonth(searchParams.get("month"), currentMonth);
  return <BudgetsPageContent key={requestedMonth} initialMonth={requestedMonth} currentMonth={currentMonth} />;
}

function BudgetsPageContent({ initialMonth, currentMonth }: { initialMonth: string; currentMonth: string }) {
  const { language } = useLanguage();
  const { formatMoney: money } = useCurrency();
  const t = translations[language].appBudgets;
  const content = translations[language].appBudgetsContent;
  const monthNames = translations[language].financialFlow.months;
  const adjustmentFeedbackCopy = {
    en: { title: "Remaining spending target saved", detail: "Your remaining spending target is" },
    pt: { title: "Meta de gasto restante salva", detail: "Sua meta de gasto restante é" },
    es: { title: "Objetivo de gasto restante guardado", detail: "Tu objetivo de gasto restante es" },
    de: { title: "Restliches Ausgabenziel gespeichert", detail: "Dein restliches Ausgabenziel ist" },
    fr: { title: "Objectif de dépense restante enregistré", detail: "Votre objectif de dépense restante est de" },
    nl: { title: "Resterend uitgavendoel opgeslagen", detail: "Je resterende uitgavendoel is" },
    it: { title: "Obiettivo di spesa restante salvato", detail: "Il tuo obiettivo di spesa restante è" },
  }[language];
  const { budgets, transactions, budgetAdjustments, goals, upsertBudget, deleteBudget, upsertBudgetAdjustment } = useFinanceData();
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState(initialMonth);
  const [modalState, setModalState] = useState<BudgetModalState | null>(null);
  const [deleteBudgetId, setDeleteBudgetId] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [projectionModal, setProjectionModal] = useState<ProjectionModalView | null>(null);
  const [adjustmentFeedback, setAdjustmentFeedback] = useState(false);
  const monthOptions = useMemo(() => Array.from(new Set([currentMonth, month, ...budgets.map((budget) => budget.month), ...transactions.map((transaction) => transaction.dateISO.slice(0, 7)), ...Object.keys(budgetAdjustments)])).sort().reverse().map((value) => { const [year, monthNumber] = value.split("-"); return { value, label: `${monthNames[Number(monthNumber) - 1]} ${year}` }; }), [budgetAdjustments, budgets, currentMonth, month, monthNames, transactions]);

  const projection = useMemo(() => calculateBudgetProjection({ budgets, transactions, month }), [budgets, month, transactions]);
  const budgetsWithProgress = useMemo(() => budgets.map((budget): BudgetWithProgress => {
    const spentResult = calculateBudgetSpent(budget, transactions);
    const spent = spentResult.available ? spentResult.value : null;
    const budgetProjection = budget.month === month ? projection : calculateBudgetProjection({ budgets: [budget], transactions, month: budget.month });
    return { ...budget, spent, status: calculateBudgetStatus(budget.budget, spent, budgetProjection.canProject, budgetProjection.monthElapsedRatio) };
  }), [budgets, month, projection, transactions]);
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
            <DesktopInternalPagePanel>
              <div className="relative h-[776px] w-[1090px] overflow-hidden">
                <header className="absolute left-0 top-0 h-[56px] w-[1090px] overflow-hidden">
                  <span className="absolute left-0 top-0 text-[9px] font-semibold text-[#64707D]">{t.eyebrow}</span>
                  <h1 className="absolute left-0 top-[14px] text-[23px] font-semibold leading-none">{t.title}</h1>
                  <p className="absolute left-0 top-[42px] text-[13px] text-[#9CA6B2]">{t.description}</p>
                  <div className="absolute left-[509px] top-[4px] flex w-[581px] items-center justify-end gap-[8px]">
                    <label className="flex h-[36px] w-[267px] items-center gap-[12px] rounded-[19px] border border-[#28313B] bg-[#080B0F]/34 px-[14px] text-[#9CA6B2]"><Image src={`${iconRoot}/search.svg`} alt="" width={20} height={20} className="size-[20px]" /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label={content.search} placeholder={content.search} className="w-full bg-transparent text-[10px] outline-none placeholder:text-[#9CA6B2]" /></label>
                    <label className="relative flex h-[36px] w-[103px] cursor-pointer items-center justify-center gap-[12px] rounded-[19px] border border-[#28313B] bg-[#080B0F]/34 text-[10px] font-medium text-[#9CA6B2]"><Image src={`${iconRoot}/calendar.svg`} alt="" width={20} height={20} className="size-[20px]" /><span>{content.month}</span><select value={month} onChange={(event) => setMonth(event.target.value)} aria-label={content.selectMonth} className="absolute inset-0 cursor-pointer opacity-0">{monthOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                    <button type="button" onClick={() => setModalState({ mode: "create", month })} className="flex h-[36px] w-[139px] items-center justify-center gap-[10px] rounded-[19px] bg-[#3B82F6] text-[10px] font-semibold"><span>{content.newBudget}</span><Image src={`${iconRoot}/new-budget.svg`} alt="" width={19} height={19} className="size-[19px]" /></button>
                  </div>
                </header>

                <BudgetSummaryCards budgets={monthBudgets} projection={projection} month={month} currentMonth={currentMonth} hasAnyBudgets={budgets.length > 0} />
                <div className="absolute left-0 top-[200px] flex h-[516px] w-[1090px] gap-[12px]">
                  <BudgetTable budgets={visibleBudgets} totalBudgets={monthBudgets.length} hasAnyBudgets={budgets.length > 0} month={month} openMenu={openMenu} onToggleMenu={(budgetId) => setOpenMenu(openMenu === budgetId ? null : budgetId)} onEdit={(budgetId) => { setOpenMenu(null); setModalState({ mode: "edit", budgetId }); }} onDelete={(budgetId) => { setOpenMenu(null); setDeleteBudgetId(budgetId); }} />
                  <BudgetDecisionColumn projection={projection} adjustment={budgetAdjustments[month]} month={month} currentMonth={currentMonth} hasBudgets={monthBudgets.length > 0} hasAnyBudgets={budgets.length > 0} hasGoals={goals.length > 0} onCreateBudget={() => setModalState({ mode: "create", month })} onViewProjection={() => setProjectionModal("projection")} onReviewAdjustment={() => setProjectionModal("adjustment")} />
                </div>
              </div>
            </DesktopInternalPagePanel>

            {modalState && <BudgetModal state={modalState} budgets={budgets} categories={content.categories} onSubmit={async (budget) => {
              try {
                await upsertBudget(budget);
                setQuery("");
                setOpenMenu(null);
                setModalState(null);
              } catch (error) {
                console.error("Failed to save budget:", error);
              }
            }} onClose={() => setModalState(null)} />}
            {deleteBudgetId && (() => { const selected = budgetsWithProgress.find((budget) => budget.id === deleteBudgetId); return selected ? <DeleteBudgetModal budget={selected} onClose={() => setDeleteBudgetId(null)} onConfirm={async () => {
              try {
                await deleteBudget(deleteBudgetId);
                setOpenMenu(null);
                setDeleteBudgetId(null);
              } catch (error) {
                console.error("Failed to delete budget:", error);
              }
            }} /> : null; })()}
            {projectionModal && projection.available && <BudgetProjectionModal view={projectionModal} month={month} projection={projection} adjustment={budgetAdjustments[month]} onClose={() => setProjectionModal(null)} onBack={() => setProjectionModal("projection")} onReview={() => setProjectionModal("adjustment")} onApply={async (adjustment) => {
              try {
                await upsertBudgetAdjustment(adjustment);
                setProjectionModal(null);
                setAdjustmentFeedback(true);
              } catch (error) {
                console.error("Failed to save budget adjustment:", error);
              }
            }} />}
            {adjustmentFeedback && budgetAdjustments[month] && <div role="status" className="absolute bottom-[56px] left-1/2 z-[75] -translate-x-1/2 rounded-[14px] border border-[#174D32] bg-[var(--surface-green-subtle)] px-[18px] py-[10px] text-[10px] shadow-xl"><strong className="text-[#22C55E]">{adjustmentFeedbackCopy.title}</strong><span className="ml-[8px] text-[var(--text-tertiary)]">{adjustmentFeedbackCopy.detail} {money(budgetAdjustments[month].targetRemainingSpend)}.</span><button type="button" onClick={() => setAdjustmentFeedback(false)} aria-label={t.close} className="ml-[12px] text-[var(--text-tertiary)]"><IconX size={14} /></button></div>}
          </main>
        </DesktopScaleCanvas>
      </div>
    </div>
  );
}

function BudgetModal({ state, budgets, categories, onSubmit, onClose }: { state: BudgetModalState; budgets: Budget[]; categories: readonly { category: string; subtitle: string }[]; onSubmit: (budget: Budget) => void; onClose: () => void }) {
  const { language } = useLanguage();
  const t = translations[language].appBudgets;
  const editingBudget = state.mode === "edit" ? budgets.find((budget) => budget.id === state.budgetId) : undefined;
  const budgetMonth = editingBudget?.month ?? (state.mode === "create" ? state.month : getDashboardMonth());
  const [year, monthNumber] = budgetMonth.split("-").map(Number);
  const locale = { en: "en-GB", pt: "pt-PT", es: "es-ES", de: "de-DE", fr: "fr-FR", nl: "nl-NL", it: "it-IT" }[language];
  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
  const periodCopy = { en: "Budget month", pt: "Mês do orçamento", es: "Mes del presupuesto", de: "Budgetmonat", fr: "Mois du budget", nl: "Budgetmaand", it: "Mese del budget" }[language];
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
        <p className="mt-[10px] text-[11px] text-[#9CA6B2]">{t.modalDescription}</p><p className="mt-[6px] text-[10px] capitalize text-[#60A5FA]">{periodCopy}: {monthLabel}</p>
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
  return <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#080B0F]/65 backdrop-blur-sm"><div className="relative w-[420px] rounded-[26px] border border-[#28313B] bg-[#0D1117]/95 p-[26px] shadow-2xl"><button type="button" onClick={onClose} aria-label={copy.cancel} className="absolute right-[18px] top-[18px] text-[#9CA6B2]"><IconX size={20} /></button><h2 className="text-[18px] font-semibold">{copy.title}</h2><p className="mt-[10px] text-[11px] text-[#9CA6B2]">{copy.description}</p><dl className="mt-[20px] grid gap-[8px] rounded-[12px] border border-[#28313B] bg-[#080B0F]/35 p-[14px] text-[10px]"><div className="flex justify-between"><dt className="text-[#9CA6B2]">{copy.category}</dt><dd className="font-semibold">{budget.category}</dd></div><div className="flex justify-between"><dt className="text-[#9CA6B2]">{copy.limit}</dt><dd className="font-semibold">{money(budget.budget)}</dd></div><div className="flex justify-between"><dt className="text-[#9CA6B2]">{copy.spent}</dt><dd className="font-semibold">{budget.spent === null ? "—" : money(budget.spent)}</dd></div></dl><div className="mt-[18px] flex gap-[10px]"><button type="button" onClick={onClose} className="h-[42px] flex-1 rounded-[21px] border border-[#28313B] text-[11px] font-semibold">{copy.cancel}</button><button type="button" onClick={onConfirm} className="h-[42px] flex-1 rounded-[21px] bg-[#F43F5E] text-[11px] font-semibold">{copy.confirm}</button></div></div></div>;
}
