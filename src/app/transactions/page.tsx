"use client";

import { useCurrency } from "@/components/CurrencyProvider";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useLayoutEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconUpload, IconWallet, IconX } from "@tabler/icons-react";

import { DashboardToast, type DashboardToastState } from "@/components/dashboard/DashboardToast";
import { AccountAvatar } from "@/components/profile/AccountAvatar";
import { ThemeControl } from "@/components/navigation/ThemeControl";
import { TransactionDecisionCards } from "@/components/transactions/TransactionDecisionCards";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { TransactionsKpiCards } from "@/components/transactions/TransactionsKpiCards";
import { TransactionsMonthSelector } from "@/components/transactions/TransactionsMonthSelector";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { getTransactionCategoryGroupKey, legacyTransactionPaymentValues, transactionPaymentValues, type Transaction, type TransactionPayment, type TransactionType } from "@/components/transactions/transaction-model";
import { getInitialTransactionCategoryId, getSelectableTransactionCategories, hasTransactionFieldChanges, resolveTransactionClassificationAction, retainCompatibleCategoryId } from "@/components/transactions/transaction-category-form";
import { ImportStatementModal } from "@/components/transactions/ImportStatementModal";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";
import { useFinanceData } from "@/components/FinanceDataProvider";
import { getDashboardMonth } from "@/components/dashboard/dashboard-financial-summary";
import { formatTransactionCivilDate, getTransactionPaymentOptions, localizeTransactionCategory, localizeTransactionOrigin, localizeTransactionPayment, normalizeTransactionPayment } from "@/components/transactions/transaction-presentation";
import { parseTransactionAmountText } from "@/lib/domain/financial-input-adapters";
import type { Category } from "@/lib/domain/category";
import { FinanceError } from "@/lib/domain/finance-error";

import { getCategoryPageCopy } from "@/components/categories/category-page-contract";
import { getTransactionPeriodView, transactionMonthRange, getTransactionsAvailability, transactionAvailabilityCopy } from "@/components/transactions/transactions-view-state";
import { areFinanceResourcesReady, type FinanceResourceStatuses, type FinanceResourceStatus } from "@/lib/persistence/finance-resource-status";

import { getPreviousTransactionMonth } from "@/components/transactions/transaction-period-aggregates";

const iconRoot = "/moneypilot/transactions/icons";
const idleTransactionPeriod = { status: "idle" as const };

type TransactionInput = {
  description: string;
  amount: number;
  categoryId: string | null;
  removeLegacyClassification: boolean;
  type: TransactionType;
  dateISO: string;
  payment: string;
};

type TransactionModalState =
  | { mode: "create" }
  | { mode: "edit"; transaction: Transaction; focusCategory: boolean };

function formatTransactionDateISO(dateISO: string, months: readonly string[]) {
  const [year, month, day] = dateISO.split("-").map(Number);
  return `${day} ${months[month - 1]} ${year}`;
}

function getLocalTodayISO() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function isValidCivilDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function resolveSelectedMonth(value: string | null, currentMonth: string) {
  return value && transactionMonthRange(value) ? value : currentMonth;
}

export default function TransactionsPage() {
  return <Suspense fallback={null}><TransactionsPageFromSearchParams /></Suspense>;
}

function TransactionsPageFromSearchParams() {
  const searchParams = useSearchParams();
  const currentMonth = getDashboardMonth();
  const requestedMonth = resolveSelectedMonth(searchParams.get("month"), currentMonth);
  const openStatementImport = searchParams.get("import") === "1" || searchParams.get("import") === "csv";

  return <TransactionsPageContent key={requestedMonth} initialMonth={requestedMonth} currentMonth={currentMonth} openStatementImport={openStatementImport} />;
}

function TransactionsPageContent({ initialMonth, currentMonth, openStatementImport }: { initialMonth: string; currentMonth: string; openStatementImport: boolean }) {
  const { language } = useLanguage();
  const t = translations[language].appTransactions;
  const months = translations[language].financialFlow.months;
  const { getTransactionPeriodState, ensureTransactionPeriod, transactions, goals, activeCategories, resourceStatuses, mutationState, createClassifiedTransaction, importTransactions, updateTransaction, linkTransactionCategory, unlinkTransactionCategory, deleteTransaction } = useFinanceData();
  const latestCatalogue = useRef({ resourceStatuses, activeCategories });
  useLayoutEffect(() => { latestCatalogue.current = { resourceStatuses, activeCategories }; }, [resourceStatuses, activeCategories]);
  const { transactionsReady } = getTransactionsAvailability(resourceStatuses);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState("all");
  const [selectedOrigin, setSelectedOrigin] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [transactionModal, setTransactionModal] = useState<TransactionModalState | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [importOpen, setImportOpen] = useState(openStatementImport);

  const selectedRange = useMemo(() => transactionMonthRange(selectedMonth), [selectedMonth]);
  const previousRange = useMemo(() => selectedRange ? transactionMonthRange(getPreviousTransactionMonth(selectedMonth)) : null, [selectedMonth, selectedRange]);
  const selectedPeriod = selectedRange ? getTransactionPeriodState(selectedRange) : idleTransactionPeriod;
  const previousPeriod = previousRange ? getTransactionPeriodState(previousRange) : idleTransactionPeriod;
  const requestedSelected = useRef<string | null>(null);
  const requestedPrevious = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedRange) return;
    if (requestedSelected.current !== selectedMonth || selectedPeriod.status === "idle" || selectedPeriod.status === "stale") {
      requestedSelected.current = selectedMonth;
      void ensureTransactionPeriod(selectedRange);
    }
  }, [selectedMonth, selectedRange, selectedPeriod.status, getTransactionPeriodState, ensureTransactionPeriod]);
  useEffect(() => {
    if (!previousRange) return;
    if (requestedPrevious.current !== previousRange.startISO || previousPeriod.status === "idle" || previousPeriod.status === "stale") {
      requestedPrevious.current = previousRange.startISO;
      void ensureTransactionPeriod(previousRange);
    }
  }, [previousRange, previousPeriod.status, getTransactionPeriodState, ensureTransactionPeriod]);
  const periodView = useMemo(() => getTransactionPeriodView(selectedMonth, selectedPeriod, previousPeriod, selectedRange, previousRange), [selectedMonth, selectedPeriod, previousPeriod, selectedRange, previousRange]);
  const selectedTransactions = periodView.rows;

  useEffect(() => {
    if (!openStatementImport) return;
    // Consume the intent without remounting the modal or adding a history entry.
    const url = new URL(window.location.href);
    url.searchParams.delete("import");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  }, [openStatementImport]);

  const [toast, setToast] = useState<DashboardToastState | null>(null);

  const mutationCopy = {
    en: { added: "Transaction added.", updated: "Transaction updated.", deleted: "Transaction deleted." },
    pt: { added: "Transação adicionada.", updated: "Transação atualizada.", deleted: "Transação excluída." },
    es: { added: "Transacción añadida.", updated: "Transacción actualizada.", deleted: "Transacción eliminada." },
    de: { added: "Transaktion hinzugefügt.", updated: "Transaktion aktualisiert.", deleted: "Transaktion gelöscht." },
    fr: { added: "Transaction ajoutée.", updated: "Transaction mise à jour.", deleted: "Transaction supprimée." },
    nl: { added: "Transactie toegevoegd.", updated: "Transactie bijgewerkt.", deleted: "Transactie verwijderd." },
    it: { added: "Transazione aggiunta.", updated: "Transazione aggiornata.", deleted: "Transazione eliminata." },
  }[language];

  const pageSize = 7;
  const monthOptions = useMemo(() => Array.from(new Set([currentMonth, selectedMonth, ...(transactionsReady ? transactions.map((item) => item.dateISO.slice(0, 7)) : [])])).sort().reverse().map((value) => { const [year, month] = value.split("-"); return { value, label: `${months[Number(month) - 1]} ${year}` }; }), [currentMonth, months, selectedMonth, transactions, transactionsReady]);
  const categoryOptions = useMemo(() => [{ value: "all", label: t.filters[1] }, ...(transactionsReady ? Array.from(new Map(transactions.map((item) => [getTransactionCategoryGroupKey(item), { value: getTransactionCategoryGroupKey(item), label: localizeTransactionCategory(item.category, language) }])).values()).sort((left, right) => left.label.localeCompare(right.label, language)) : [])], [language, t.filters, transactions, transactionsReady]);
  const paymentOptions = useMemo(() => [{ value: "all", label: t.filters[2] }, ...Array.from(new Set([...transactionPaymentValues, ...(transactionsReady ? transactions.map((item) => normalizeTransactionPayment(item.payment)) : [])])).map((value) => ({ value, label: localizeTransactionPayment(value, language) }))], [language, t.filters, transactions, transactionsReady]);
  const originOptions = useMemo(() => [{ value: "all", label: t.filters[3] }, ...(transactionsReady ? Array.from(new Set(transactions.map((item) => item.origin))).sort().map((value) => ({ value, label: localizeTransactionOrigin(value, language) })) : [])], [language, t.filters, transactions, transactionsReady]);
  const secondaryCopy = { en: { oldest: "Oldest", import: "Import statement" }, pt: { oldest: "Mais antigas", import: "Importar extrato" }, es: { oldest: "Más antiguas", import: "Importar extracto" }, de: { oldest: "Älteste", import: "Kontoauszug importieren" }, fr: { oldest: "Plus anciennes", import: "Importer un relevé" }, nl: { oldest: "Oudste", import: "Afschrift importeren" }, it: { oldest: "Meno recenti", import: "Importa estratto conto" } }[language];
  const sortOptions = [{ value: "newest", label: t.filters[4] }, { value: "oldest", label: secondaryCopy.oldest }];
  const filteredTransactions = useMemo(() => selectedTransactions ? selectedTransactions
    .filter((item) => `${item.description} ${localizeTransactionCategory(item.category, language)}`.toLocaleLowerCase(language).includes(query.toLocaleLowerCase(language)))
    .filter((item) => item.dateISO.startsWith(selectedMonth))
    .filter((item) => selectedCategory === "all" || getTransactionCategoryGroupKey(item) === selectedCategory)
    .filter((item) => selectedPayment === "all" || normalizeTransactionPayment(item.payment) === selectedPayment)
    .filter((item) => selectedOrigin === "all" || item.origin === selectedOrigin)
    .sort((a, b) => sortOrder === "newest" ? b.dateISO.localeCompare(a.dateISO) : a.dateISO.localeCompare(b.dateISO)) : null, [language, query, selectedCategory, selectedMonth, selectedOrigin, selectedPayment, sortOrder, selectedTransactions]);
  const totalPages = filteredTransactions ? Math.max(1, Math.ceil(filteredTransactions.length / pageSize)) : null;
  const currentPage = totalPages === null ? 1 : Math.min(page, totalPages);
  const paginatedTransactions = filteredTransactions?.slice((currentPage - 1) * pageSize, currentPage * pageSize) ?? null;

  function resetPageAnd(action: () => void) {
    action();
    setPage(1);
  }

  async function addTransaction(input: TransactionInput) {
    if (!areFinanceResourcesReady(latestCatalogue.current.resourceStatuses, ["categories"])) throw new FinanceError("repository_unavailable");
    const category = latestCatalogue.current.activeCategories.find((candidate) => candidate.id === input.categoryId && candidate.type === input.type);
    if (!category) throw new FinanceError("validation_error", { field: "categoryId", reason: "required" });
    await createClassifiedTransaction({
      id: crypto.randomUUID(),
      description: input.description,
      categoryWrite: { kind: "linked", categoryId: category.id, legacyName: category.name, legacyColor: category.colorToken },
      payment: input.payment,
      date: formatTransactionDateISO(input.dateISO, months),
      dateISO: input.dateISO,
      origin: t.labels.manual,
      type: input.type,
      amount: input.amount,
    });
    revealTransaction(input);
    setPage(1);
    setToast({ id: crypto.randomUUID(), tone: "success", title: mutationCopy.added });
  }

  async function saveTransaction(transaction: Transaction, input: TransactionInput) {
    const fields = { id: transaction.id, description: input.description, type: input.type, amount: input.amount, payment: input.payment, dateISO: input.dateISO, date: formatTransactionDateISO(input.dateISO, months), origin: transaction.origin };
    const requiresCatalogue = input.type !== transaction.type || (input.categoryId ?? "") !== getInitialTransactionCategoryId(transaction) || input.removeLegacyClassification;
    const categoriesReady = areFinanceResourcesReady(latestCatalogue.current.resourceStatuses, ["categories"]);
    if (requiresCatalogue && !categoriesReady) throw new FinanceError("repository_unavailable");
    const classificationAction = requiresCatalogue ? resolveTransactionClassificationAction(transaction, input.categoryId ?? "", latestCatalogue.current.activeCategories, input.type, input.removeLegacyClassification) : { kind: "unchanged" as const };
    if (classificationAction.kind === "invalid") throw new FinanceError("validation_error", { field: "categoryId", reason: "allowed_value" });
    const unlinkBeforeTypeChange = transaction.classification.kind === "linked" && transaction.type !== input.type;
    if (unlinkBeforeTypeChange) await unlinkTransactionCategory(transaction.id);
    if (hasTransactionFieldChanges(transaction, fields)) await updateTransaction(fields);
    if (requiresCatalogue && !areFinanceResourcesReady(latestCatalogue.current.resourceStatuses, ["categories"])) throw new FinanceError("repository_unavailable");
    if (classificationAction.kind === "link") await linkTransactionCategory(transaction.id, { kind: "linked", categoryId: classificationAction.category.id, legacyName: classificationAction.category.name, legacyColor: classificationAction.category.colorToken });
    if (classificationAction.kind === "unlink" && !unlinkBeforeTypeChange) await unlinkTransactionCategory(transaction.id);
    revealTransaction(input);
    setPage(1);
    setToast({ id: crypto.randomUUID(), tone: "success", title: mutationCopy.updated });
  }

  function revealTransaction(input: TransactionInput) {
    if (input.dateISO.slice(0, 7) !== selectedMonth) {
      setSelectedMonth(input.dateISO.slice(0, 7));
      setQuery(""); setSelectedCategory("all"); setSelectedPayment("all"); setSelectedOrigin("all");
    }
  }

  async function removeTransaction(id: string) {
    await deleteTransaction(id);
    setPage(1);
    setTransactionToDelete(null);
    setToast({ id: crypto.randomUUID(), tone: "success", title: mutationCopy.deleted });
  }

  const isCreating = mutationState.status === "saving" && mutationState.operation === "createTransaction";
  const isUpdating = mutationState.status === "saving" && (mutationState.operation === "updateTransaction" || mutationState.operation === "updateTransactionClassification");
  const isDeleting = mutationState.status === "saving" && mutationState.operation === "deleteTransaction";
  return (
    <div data-transactions-page className="relative h-auto min-w-0 bg-[var(--background-elevated)]">
      <div className="relative z-10 min-w-0 max-w-full">
          <main className="relative box-border h-auto min-w-0 max-w-full overflow-visible text-[var(--text-primary)]">
              <section data-transactions-mobile className="w-full max-w-full overflow-x-hidden px-4 pb-8 pt-4 min-[768px]:hidden">
                <header className="grid gap-4">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h1 className="break-words text-2xl font-semibold leading-tight">{t.title}</h1>
                      <p className="mt-2 break-words text-sm leading-5 text-[var(--text-secondary)]">{t.description}</p>
                    </div>
                    <div className="h-11 w-[91px] shrink-0 overflow-hidden"><ThemeControl orientation="horizontal" /></div>
                  </div>
                  <button type="button" onClick={() => setTransactionModal({ mode: "create" })} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--dashboard-brand-primary)] px-4 text-sm font-semibold text-white">
                    <span>{t.newTransaction}</span><Image src={`${iconRoot}/add-circle-outline.svg`} alt="" width={20} height={20} />
                  </button>
                  <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                    <TransactionsMonthSelector mobile month={selectedMonth} language={language} label={t.month} onMonthChange={(value) => resetPageAnd(() => setSelectedMonth(value))} />
                    <button type="button" onClick={() => setImportOpen(true)} className="flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--background-subtle)] px-3 text-sm font-medium text-[var(--text-secondary)]"><IconUpload size={18} /><span>{secondaryCopy.import}</span></button>
                  </div>
                  <label className="flex min-h-11 min-w-0 items-center gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--background-subtle)] px-3 text-[var(--text-secondary)]">
                    <Image src={`${iconRoot}/search-outline.svg`} alt="" width={18} height={18} />
                    <input value={query} onChange={(event) => resetPageAnd(() => setQuery(event.target.value))} aria-label={t.search} placeholder={t.search} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-secondary)]" />
                  </label>
                </header>

                <div className="mt-5 grid gap-5">
                  <TransactionsKpiCards aggregates={periodView.aggregates} status={periodView.status} mobile />
                  <TransactionFilters mobile values={[selectedMonth, selectedCategory, selectedPayment, selectedOrigin, sortOrder]} options={[monthOptions, categoryOptions, paymentOptions, originOptions, sortOptions]} onChange={(index, value) => resetPageAnd(() => { if (index === 0) setSelectedMonth(value); if (index === 1) setSelectedCategory(value); if (index === 2) setSelectedPayment(value); if (index === 3) setSelectedOrigin(value); if (index === 4) setSortOrder(value); })} />
                  <MobileTransactionCards transactions={paginatedTransactions} status={periodView.status} selectedMonth={selectedMonth} totalItems={filteredTransactions?.length ?? null} pageSize={pageSize} page={currentPage} onPageChange={setPage} onEdit={(transaction) => setTransactionModal({ mode: "edit", transaction, focusCategory: false })} onDelete={setTransactionToDelete} />
                  <TransactionDecisionCards goals={goals} resourceStatuses={resourceStatuses} transactionStatus={periodView.status} mobile />
                </div>
              </section>

              <div data-transactions-desktop className="hidden min-[768px]:block">
              <div className="relative flex h-auto min-w-0 max-w-full flex-col gap-[11.815px] overflow-visible p-[24px]">
                <div className="transactions-brand-row">
                  <div className="transactions-logo"><Image src="/moneypilot/dashboard/day/logomark.svg" alt="" width={37} height={37} /><span>MoneyPilot</span></div>
                  <div className="transactions-brand-actions"><span>{t.title}</span><button type="button" onClick={() => setImportOpen(true)} className="transactions-import"><IconUpload size={15} />{secondaryCopy.import}</button><div data-transactions-theme-control className="h-[36px] w-[91px] shrink-0 overflow-hidden"><ThemeControl orientation="horizontal" /></div></div>
                </div>
                <header className="transactions-header">
                  <div className="transactions-heading"><h1>{t.title}</h1><p>{t.description}</p></div>
                  <div className="transactions-actions">
                    <label className="transactions-search"><Image src={`${iconRoot}/search-outline.svg`} alt="" width={20} height={20} /><input value={query} onChange={(event) => resetPageAnd(() => setQuery(event.target.value))} aria-label={t.search} placeholder={t.search} /></label>
                    <TransactionsMonthSelector month={selectedMonth} language={language} label={t.month} onMonthChange={(value) => resetPageAnd(() => setSelectedMonth(value))} />
                    <button type="button" className="transactions-new" onClick={() => setTransactionModal({ mode: "create" })}><span>{t.newTransaction}</span><Image src={`${iconRoot}/add-circle-outline.svg`} alt="" width={19} height={19} /></button>
                    <AccountAvatar size={48} />
                  </div>
                </header>

                <TransactionsKpiCards aggregates={periodView.aggregates} status={periodView.status} />
                <TransactionFilters values={[selectedMonth, selectedCategory, selectedPayment, selectedOrigin, sortOrder]} options={[monthOptions, categoryOptions, paymentOptions, originOptions, sortOptions]} onChange={(index, value) => resetPageAnd(() => { if (index === 0) setSelectedMonth(value); if (index === 1) setSelectedCategory(value); if (index === 2) setSelectedPayment(value); if (index === 3) setSelectedOrigin(value); if (index === 4) setSortOrder(value); })} />
                <TransactionsTable transactions={paginatedTransactions} status={periodView.status} key={`${selectedMonth}:${periodView.status.status}`} selectableTransactions={filteredTransactions} selectedMonth={selectedMonth} totalItems={filteredTransactions?.length ?? null} pageSize={pageSize} page={currentPage} onPageChange={setPage} onEdit={(transaction, focusCategory = false) => setTransactionModal({ mode: "edit", transaction, focusCategory })} onDelete={setTransactionToDelete} />
                <TransactionDecisionCards goals={goals} resourceStatuses={resourceStatuses} transactionStatus={periodView.status} />
              </div>
              </div>

            {transactionModal && <TransactionModal transaction={transactionModal.mode === "edit" ? transactionModal.transaction : undefined} categories={activeCategories} resourceStatuses={resourceStatuses} focusCategory={transactionModal.mode === "edit" && transactionModal.focusCategory} saving={transactionModal.mode === "edit" ? isUpdating : isCreating} onSubmit={(input) => transactionModal.mode === "edit" ? saveTransaction(transactionModal.transaction, input) : addTransaction(input)} onClose={() => setTransactionModal(null)} />}
            {transactionToDelete && <DeleteTransactionModal transaction={transactionToDelete} saving={isDeleting} onCancel={() => setTransactionToDelete(null)} onDelete={() => removeTransaction(transactionToDelete.id)} />}
            {importOpen && <ImportStatementModal existingTransactions={transactions} resourceStatuses={resourceStatuses} onImport={importTransactions} onClose={() => setImportOpen(false)} />}
            {toast && <DashboardToast toast={toast} onClose={() => setToast(null)} />}
          </main>
      </div>
    </div>
  );
}

function MobileTransactionCards({ transactions, selectedMonth, totalItems, pageSize, page, status, onPageChange, onEdit, onDelete }: { transactions: Transaction[] | null; selectedMonth: string; totalItems: number | null; pageSize: number; page: number; status: FinanceResourceStatus; onPageChange: (page: number) => void; onEdit: (transaction: Transaction) => void; onDelete: (transaction: Transaction) => void }) {
  const { language } = useLanguage();
  const { formatMoney: money } = useCurrency();
  const t = translations[language].appTransactions;
  const totalPages = totalItems === null ? 0 : Math.max(1, Math.ceil(totalItems / pageSize));
  const [year, monthNumber] = selectedMonth.split("-");
  const periodLabel = `${translations[language].financialFlow.months[Number(monthNumber) - 1]} ${year}`;
  const typeCopy = language === "pt" ? { expense: "Despesa", income: "Receita" } : language === "es" ? { expense: "Gasto", income: "Ingreso" } : language === "de" ? { expense: "Ausgabe", income: "Einnahme" } : language === "fr" ? { expense: "Dépense", income: "Revenu" } : language === "nl" ? { expense: "Uitgave", income: "Inkomen" } : language === "it" ? { expense: "Spesa", income: "Entrata" } : { expense: "Expense", income: "Income" };
  const stateCopy = language === "pt" ? { loading: "Carregando transações…", error: "Não foi possível carregar as transações.", edit: "Editar", type: "Tipo" } : language === "es" ? { loading: "Cargando transacciones…", error: "No se pudieron cargar las transacciones.", edit: "Editar", type: "Tipo" } : language === "de" ? { loading: "Transaktionen werden geladen…", error: "Transaktionen konnten nicht geladen werden.", edit: "Bearbeiten", type: "Typ" } : language === "fr" ? { loading: "Chargement des transactions…", error: "Impossible de charger les transactions.", edit: "Modifier", type: "Type" } : language === "nl" ? { loading: "Transacties worden geladen…", error: "Transacties konden niet worden geladen.", edit: "Bewerken", type: "Type" } : language === "it" ? { loading: "Caricamento delle transazioni…", error: "Impossibile caricare le transazioni.", edit: "Modifica", type: "Tipo" } : { loading: "Loading transactions…", error: "Unable to load transactions.", edit: "Edit", type: "Type" };

  if (status.status !== "ready" || transactions === null || totalItems === null) return (
    <section data-mobile-transaction-cards className="min-w-0 rounded-2xl border border-[var(--border-default)] bg-[var(--background-elevated)] p-3 shadow-[0_3.572px_12.503px_rgba(10,10,10,0.07)]">
      <div className="mb-3 flex min-w-0 items-start justify-between gap-3"><h2 className="min-w-0 break-words text-base font-semibold">{t.transactionsInPeriod.replace("{period}", periodLabel)}</h2></div>
      <p role={status.status === "loading" ? "status" : "alert"} className="py-8 text-center text-sm text-[var(--text-secondary)]">{status.status === "loading" ? transactionAvailabilityCopy[language].loading : transactionAvailabilityCopy[language].error}</p>
    </section>
  );

  return (
    <section data-mobile-transaction-cards className="min-w-0 rounded-2xl border border-[var(--border-default)] bg-[var(--background-elevated)] p-3 shadow-[0_3.572px_12.503px_rgba(10,10,10,0.07)]">
      <div className="mb-3 flex min-w-0 items-start justify-between gap-3"><h2 className="min-w-0 break-words text-base font-semibold">{t.transactionsInPeriod.replace("{period}", periodLabel)}</h2><span className="shrink-0 text-xs text-[var(--text-tertiary)]">{totalItems}</span></div>
      {transactions.length === 0 && <p className="py-8 text-center text-sm text-[var(--text-secondary)]">{t.noTransactionsInPeriod.replace("{period}", periodLabel)}</p>}
      {<div className="grid gap-3">{transactions.map((item) => (
        <article key={item.id} className="min-w-0 rounded-xl border border-[var(--border-default)] bg-[var(--background-subtle)] p-4">
          <div className="flex min-w-0 items-start justify-between gap-3"><strong className="min-w-0 break-words text-sm">{item.description}</strong><strong className="shrink-0 text-sm">{money(item.amount)}</strong></div>
          <dl className="mt-3 grid min-w-0 grid-cols-2 gap-x-3 gap-y-2 text-xs">
            <div className="min-w-0"><dt className="text-[var(--text-tertiary)]">{t.columns[1]}</dt><dd className="break-words text-[var(--text-secondary)]">{localizeTransactionCategory(item.category, language)}</dd></div>
            <div className="min-w-0"><dt className="text-[var(--text-tertiary)]">{stateCopy.type}</dt><dd className="break-words text-[var(--text-secondary)]">{typeCopy[item.type]}</dd></div>
            <div className="min-w-0"><dt className="text-[var(--text-tertiary)]">{t.columns[2]}</dt><dd className="break-words text-[var(--text-secondary)]">{localizeTransactionPayment(item.payment, language)}</dd></div>
            <div className="min-w-0"><dt className="text-[var(--text-tertiary)]">{t.columns[3]}</dt><dd className="break-words text-[var(--text-secondary)]">{formatTransactionCivilDate(item.dateISO, language, item.date)}</dd></div>
            <div className="col-span-2 min-w-0"><dt className="text-[var(--text-tertiary)]">{t.columns[4]}</dt><dd className="break-words text-[var(--text-secondary)]">{localizeTransactionOrigin(item.origin, language)}</dd></div>
          </dl>
          <div className="mt-4 grid grid-cols-2 gap-3"><button type="button" onClick={() => onEdit(item)} className="min-h-11 rounded-full border border-[var(--border-default)] text-sm font-semibold">{stateCopy.edit}</button><button type="button" onClick={() => onDelete(item)} className="min-h-11 rounded-full border border-[#F43F5E] text-sm font-semibold text-[#F43F5E]">{t.delete}</button></div>
        </article>
      ))}</div>}
      {totalPages > 1 && <nav aria-label="Pagination" className="mt-4 flex flex-wrap justify-center gap-2">{Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => <button key={number} type="button" onClick={() => onPageChange(number)} className={`min-h-11 min-w-11 rounded-xl text-sm font-semibold ${page === number ? "bg-[var(--dashboard-brand-primary)] text-white" : "border border-[var(--border-default)]"}`}>{number}</button>)}</nav>}
    </section>
  );
}

function parseTransactionAmount(value: string) {
  return parseTransactionAmountText(value);
}

function TransactionModal({ transaction, categories, resourceStatuses, focusCategory, saving, onSubmit, onClose }: { transaction?: Transaction; categories: readonly Category[]; resourceStatuses: FinanceResourceStatuses; focusCategory: boolean; saving: boolean; onSubmit: (input: TransactionInput) => Promise<void>; onClose: () => void }) {
  const { language } = useLanguage();
  const t = translations[language].appTransactions;
  const isEditing = Boolean(transaction);
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : "");
  const [selectedCategoryId, setSelectedCategoryId] = useState(() => getInitialTransactionCategoryId(transaction));
  const [removeLegacyClassification, setRemoveLegacyClassification] = useState(false);
  const [type, setType] = useState<TransactionType>(transaction?.type ?? "expense");
  const [dateISO, setDateISO] = useState(transaction?.dateISO ?? getLocalTodayISO);
  const initialPayment = transaction ? normalizeTransactionPayment(transaction.payment) : "Not specified";
  const [payment, setPayment] = useState(initialPayment);
  const [error, setError] = useState("");
  const descriptionRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);
  const titleId = useId();
  const descriptionId = useId();
  const typeCopy = language === "pt"
    ? { expense: "Despesa", income: "Receita" }
    : language === "es"
      ? { expense: "Gasto", income: "Ingreso" }
      : language === "de" ? { expense: "Ausgabe", income: "Einnahme" }
      : language === "fr" ? { expense: "Dépense", income: "Revenu" }
      : language === "nl" ? { expense: "Uitgave", income: "Inkomen" }
      : language === "it" ? { expense: "Spesa", income: "Entrata" }
      : { expense: "Expense", income: "Income" };
  const editCopy = language === "pt"
    ? { title: "Editar transação", description: "Atualize os dados desta transação.", submit: "Salvar alterações" }
    : language === "es"
      ? { title: "Editar transacción", description: "Actualiza los datos de esta transacción.", submit: "Guardar cambios" }
      : language === "de" ? { title: "Transaktion bearbeiten", description: "Aktualisiere die Daten dieser Transaktion.", submit: "Änderungen speichern" }
      : language === "fr" ? { title: "Modifier la transaction", description: "Actualisez les informations de cette transaction.", submit: "Enregistrer" }
      : language === "nl" ? { title: "Transactie bewerken", description: "Werk de gegevens van deze transactie bij.", submit: "Wijzigingen opslaan" }
      : language === "it" ? { title: "Modifica transazione", description: "Aggiorna i dati di questa transazione.", submit: "Salva modifiche" }
      : { title: "Edit transaction", description: "Update this transaction's details.", submit: "Save changes" };
  const mutationCopy = {
    en: { saving: "Saving…", updating: "Updating…", createError: "Unable to save transaction.", updateError: "Unable to update transaction." },
    pt: { saving: "Salvando…", updating: "Atualizando…", createError: "Não foi possível salvar a transação.", updateError: "Não foi possível atualizar a transação." },
    es: { saving: "Guardando…", updating: "Actualizando…", createError: "No se pudo guardar la transacción.", updateError: "No se pudo actualizar la transacción." },
    de: { saving: "Speichern…", updating: "Aktualisieren…", createError: "Die Transaktion konnte nicht gespeichert werden.", updateError: "Die Transaktion konnte nicht aktualisiert werden." },
    fr: { saving: "Enregistrement…", updating: "Mise à jour…", createError: "Impossible d’enregistrer la transaction.", updateError: "Impossible de mettre à jour la transaction." },
    nl: { saving: "Opslaan…", updating: "Bijwerken…", createError: "De transactie kon niet worden opgeslagen.", updateError: "De transactie kon niet worden bijgewerkt." },
    it: { saving: "Salvataggio…", updating: "Aggiornamento…", createError: "Impossibile salvare la transazione.", updateError: "Impossibile aggiornare la transazione." },
  }[language];
  const formCopy = {
    en: { date: "Transaction date", payment: "Payment method", invalid: "Enter a description, valid amount, category, date, and payment method.", card: "Card", notSpecified: "Not specified" },
    pt: { date: "Data da transação", payment: "Forma de pagamento", invalid: "Preencha descrição, valor válido, categoria, data e forma de pagamento.", card: "Cartão", notSpecified: "Não informado" },
    es: { date: "Fecha de la transacción", payment: "Forma de pago", invalid: "Completa descripción, importe válido, categoría, fecha y forma de pago.", card: "Tarjeta", notSpecified: "No especificado" },
    de: { date: "Transaktionsdatum", payment: "Zahlungsart", invalid: "Gib Beschreibung, gültigen Betrag, Kategorie, Datum und Zahlungsart ein.", card: "Karte", notSpecified: "Nicht angegeben" },
    fr: { date: "Date de la transaction", payment: "Mode de paiement", invalid: "Saisissez une description, un montant valide, une catégorie, une date et un mode de paiement.", card: "Carte", notSpecified: "Non indiqué" },
    nl: { date: "Transactiedatum", payment: "Betaalmethode", invalid: "Voer een beschrijving, geldig bedrag, categorie, datum en betaalmethode in.", card: "Kaart", notSpecified: "Niet opgegeven" },
    it: { date: "Data della transazione", payment: "Metodo di pagamento", invalid: "Inserisci descrizione, importo valido, categoria, data e metodo di pagamento.", card: "Carta", notSpecified: "Non specificato" },
  }[language];
  const categoryCopy = {
    en: { select: "Select a category", historical: "Historical category", removeHistorical: "Remove historical category", removalSelected: "Category will be removed", archived: "archived" },
    pt: { select: "Selecione uma categoria", historical: "Categoria histórica", removeHistorical: "Remover categoria histórica", removalSelected: "A categoria será removida", archived: "arquivada" },
    es: { select: "Selecciona una categoría", historical: "Categoría histórica", removeHistorical: "Eliminar categoría histórica", removalSelected: "Se eliminará la categoría", archived: "archivada" },
    de: { select: "Kategorie auswählen", historical: "Historische Kategorie", removeHistorical: "Historische Kategorie entfernen", removalSelected: "Kategorie wird entfernt", archived: "archiviert" },
    fr: { select: "Sélectionner une catégorie", historical: "Catégorie historique", removeHistorical: "Retirer la catégorie historique", removalSelected: "La catégorie sera retirée", archived: "archivée" },
    nl: { select: "Selecteer een categorie", historical: "Historische categorie", removeHistorical: "Historische categorie verwijderen", removalSelected: "Categorie wordt verwijderd", archived: "gearchiveerd" },
    it: { select: "Seleziona una categoria", historical: "Categoria storica", removeHistorical: "Rimuovi categoria storica", removalSelected: "La categoria verrà rimossa", archived: "archiviata" },
  }[language];
  const categoriesReady = areFinanceResourcesReady(resourceStatuses, ["categories"]);
  const categoryAvailabilityCopy = getCategoryPageCopy(language);
  const latestStatuses = useRef(resourceStatuses);
  useLayoutEffect(() => { latestStatuses.current = resourceStatuses; }, [resourceStatuses]);
  const requiresCatalogue = !transaction || type !== transaction.type || selectedCategoryId !== getInitialTransactionCategoryId(transaction) || removeLegacyClassification;
  const selectableCategories = categoriesReady ? getSelectableTransactionCategories(categories, type) : [];
  const linkedCategoryIsArchived = categoriesReady && transaction?.classification.kind === "linked"
    && transaction.classification.categoryId === selectedCategoryId
    && !selectableCategories.some((category) => category.id === selectedCategoryId);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select:not([disabled])") ?? []);
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKeyDown);
    requestAnimationFrame(() => (focusCategory ? categoryRef : descriptionRef).current?.focus());
    return () => { document.removeEventListener("keydown", handleKeyDown); previouslyFocused?.focus(); };
  }, [focusCategory, onClose, saving]);

  async function submitTransaction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    if (requiresCatalogue && !areFinanceResourcesReady(latestStatuses.current, ["categories"])) { setError(categoryAvailabilityCopy.unavailableError); return; }
    const trimmedDescription = description.trim();
    const parsedAmount = parseTransactionAmount(amount);

    const usesKnownPayment = transactionPaymentValues.includes(payment as TransactionPayment);
    const preservesExistingPayment = Boolean(transaction && payment === normalizeTransactionPayment(transaction.payment));
    if (!trimmedDescription || (!isEditing && !selectedCategoryId) || parsedAmount === null || !isValidCivilDate(dateISO) || (!usesKnownPayment && !preservesExistingPayment)) {
      setError(formCopy.invalid);
      return;
    }

    try {
      submittingRef.current = true;
      const persistedPayment = transaction && payment === initialPayment ? transaction.payment : payment;
      await onSubmit({ description: trimmedDescription, amount: parsedAmount, categoryId: selectedCategoryId || null, removeLegacyClassification, type, dateISO, payment: persistedPayment });
      setError("");
      onClose();
    } catch {
      setError(isEditing ? mutationCopy.updateError : mutationCopy.createError);
    } finally {
      submittingRef.current = false;
    }
  }

  if (typeof document === "undefined") return null;
  return createPortal(
    <div data-transactions-modal className="fixed inset-0 z-50 flex overflow-y-auto bg-[#080B0F]/65 px-4 py-4 backdrop-blur-sm sm:items-center sm:justify-center" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} className="relative m-auto w-full max-w-[420px] rounded-[26px] border border-[#28313B] bg-[#0D1117]/95 p-[22px] text-[#F5F7FA] shadow-2xl sm:p-[26px]">
        <button type="button" onClick={onClose} aria-label={t.close} className="absolute right-[18px] top-[18px] text-[#9CA6B2]"><IconX size={20} /></button>
        <div className="flex items-center gap-[10px]"><div className="flex size-[34px] items-center justify-center rounded-[10px] bg-[#3B82F6]/20 text-[#60A5FA]"><IconWallet size={20} /></div><h2 id={titleId} className="text-[18px] font-semibold">{isEditing ? editCopy.title : t.newTransaction}</h2></div>
        <p id={descriptionId} className="mt-[10px] text-[11px] text-[#9CA6B2]">{isEditing ? editCopy.description : t.modalDescription}</p>
        <form onSubmit={submitTransaction} className="mt-[20px] grid gap-[10px]">
          <div className="flex h-[36px] w-full items-center rounded-[19px] border border-[#28313B] bg-[#080B0F]/60 p-[3px]">{(["expense", "income"] as const).map((option) => <button key={option} type="button" disabled={!categoriesReady} onClick={() => { if (!areFinanceResourcesReady(latestStatuses.current, ["categories"])) return; setType(option); setSelectedCategoryId((current) => retainCompatibleCategoryId(current, categories, option)); setRemoveLegacyClassification(false); setError(""); }} aria-pressed={type === option} className={`flex h-[28px] flex-1 items-center justify-center rounded-[16px] text-[10px] font-semibold ${type === option ? "bg-[#3B82F6] text-white" : "text-[#9CA6B2]"}`}>{typeCopy[option]}</button>)}</div>
          <label className="grid gap-1 text-[9px] font-medium text-[#9CA6B2]"><span>{t.descriptionField}</span><input ref={descriptionRef} value={description} onChange={(event) => { setDescription(event.target.value); setError(""); }} className="h-[42px] rounded-[12px] border border-[#28313B] bg-[#080B0F]/60 px-[14px] text-[11px] text-[#F5F7FA] outline-none" /></label>
          <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2"><label className="grid gap-1 text-[9px] font-medium text-[#9CA6B2]"><span>{t.value}</span><input value={amount} onChange={(event) => { setAmount(event.target.value); setError(""); }} inputMode="decimal" className="h-[42px] rounded-[12px] border border-[#28313B] bg-[#080B0F]/60 px-[14px] text-[11px] text-[#F5F7FA] outline-none" /></label><label className="grid gap-1 text-[9px] font-medium text-[#9CA6B2]"><span>{t.category}</span><select ref={categoryRef} disabled={!categoriesReady} value={selectedCategoryId} onChange={(event) => { if (!areFinanceResourcesReady(latestStatuses.current, ["categories"])) return; setSelectedCategoryId(event.target.value); setRemoveLegacyClassification(false); setError(""); }} className="h-[42px] rounded-[12px] border border-[#28313B] bg-[#080B0F]/60 px-[14px] text-[11px] text-[#F5F7FA] outline-none"><option value="">{categoryCopy.select}</option>{!categoriesReady && selectedCategoryId && <option value={selectedCategoryId}>{transaction?.category}</option>}{linkedCategoryIsArchived && <option value={selectedCategoryId} disabled>{transaction?.category} ({categoryCopy.archived})</option>}{selectableCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label></div>
          {!categoriesReady && <p role={resourceStatuses.categories.status === "loading" ? "status" : "alert"} className="text-[9px] text-[#9CA6B2]">{resourceStatuses.categories.status === "loading" ? categoryAvailabilityCopy.loading : categoryAvailabilityCopy.loadError}</p>}
          {transaction?.classification.kind === "legacy" && <div className="flex items-center justify-between gap-[10px] rounded-[10px] border border-[#28313B] bg-[#080B0F]/40 px-[12px] py-[8px] text-[9px]"><span className="min-w-0 truncate text-[#9CA6B2]">{categoryCopy.historical}: {transaction.category}</span><button type="button" disabled={removeLegacyClassification || !categoriesReady} onClick={() => { if (!areFinanceResourcesReady(latestStatuses.current, ["categories"])) return; setSelectedCategoryId(""); setRemoveLegacyClassification(true); setError(""); }} className="shrink-0 font-semibold text-[#60A5FA] disabled:text-[#9CA6B2]">{removeLegacyClassification ? categoryCopy.removalSelected : categoryCopy.removeHistorical}</button></div>}
          <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2"><label className="grid gap-1 text-[9px] font-medium text-[#9CA6B2]"><span>{formCopy.date}</span><input type="date" required value={dateISO} onChange={(event) => { setDateISO(event.target.value); setError(""); }} className="h-[42px] rounded-[12px] border border-[#28313B] bg-[#080B0F]/60 px-[14px] text-[11px] text-[#F5F7FA] outline-none [color-scheme:dark]" /></label><label className="grid gap-1 text-[9px] font-medium text-[#9CA6B2]"><span>{formCopy.payment}</span><select required value={payment} onChange={(event) => { setPayment(event.target.value); setError(""); }} className="h-[42px] rounded-[12px] border border-[#28313B] bg-[#080B0F]/60 px-[14px] text-[11px] text-[#F5F7FA] outline-none">{getTransactionPaymentOptions(language).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}{transaction && legacyTransactionPaymentValues.includes(initialPayment as "Card") && <option value="Card">{formCopy.card}</option>}{transaction && initialPayment !== "Card" && !transactionPaymentValues.includes(initialPayment as TransactionPayment) && <option value={initialPayment}>{initialPayment}</option>}</select></label></div>
          {error && <p role="alert" className="text-[9px] text-[#F43F5E]">{error}</p>}
          <button type="submit" disabled={saving || (requiresCatalogue && !categoriesReady)} className="mt-[6px] h-[42px] rounded-[21px] bg-[#3B82F6] text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-60">{saving ? isEditing ? mutationCopy.updating : mutationCopy.saving : isEditing ? editCopy.submit : t.addTransaction}</button>
        </form>
      </div>
    </div>, document.body
  );
}

function DeleteTransactionModal({ transaction, saving, onCancel, onDelete }: { transaction: Transaction; saving: boolean; onCancel: () => void; onDelete: () => Promise<void> }) {
  const { language } = useLanguage();
  const { formatMoney: money } = useCurrency();
  const [error, setError] = useState("");
  const copy = language === "pt"
    ? { title: "Excluir transação?", description: "Esta ação removerá a transação da sua lista.", cancel: "Cancelar", delete: "Excluir transação" }
    : language === "es"
      ? { title: "¿Eliminar transacción?", description: "Esta acción eliminará la transacción de tu lista.", cancel: "Cancelar", delete: "Eliminar transacción" }
      : language === "de" ? { title: "Transaktion löschen?", description: "Diese Aktion entfernt die Transaktion aus deiner Liste.", cancel: "Abbrechen", delete: "Transaktion löschen" }
      : language === "fr" ? { title: "Supprimer la transaction ?", description: "Cette action retirera la transaction de votre liste.", cancel: "Annuler", delete: "Supprimer" }
      : language === "nl" ? { title: "Transactie verwijderen?", description: "Hiermee wordt de transactie uit je lijst verwijderd.", cancel: "Annuleren", delete: "Transactie verwijderen" }
      : language === "it" ? { title: "Eliminare la transazione?", description: "Questa azione rimuoverà la transazione dall’elenco.", cancel: "Annulla", delete: "Elimina transazione" }
      : { title: "Delete transaction?", description: "This action will remove the transaction from your list.", cancel: "Cancel", delete: "Delete transaction" };
  const mutationCopy = {
    en: { deleting: "Deleting…", error: "Unable to delete transaction." }, pt: { deleting: "Excluindo…", error: "Não foi possível excluir a transação." }, es: { deleting: "Eliminando…", error: "No se pudo eliminar la transacción." }, de: { deleting: "Löschen…", error: "Die Transaktion konnte nicht gelöscht werden." }, fr: { deleting: "Suppression…", error: "Impossible de supprimer la transaction." }, nl: { deleting: "Verwijderen…", error: "De transactie kon niet worden verwijderd." }, it: { deleting: "Eliminazione…", error: "Impossibile eliminare la transazione." },
  }[language];

  async function confirmDelete() {
    try {
      setError("");
      await onDelete();
    } catch {
      setError(mutationCopy.error);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#080B0F]/65 p-4 backdrop-blur-sm">
      <div className="relative my-auto max-h-[calc(100dvh-32px)] w-full max-w-[420px] overflow-y-auto rounded-[26px] border border-[#28313B] bg-[#0D1117]/95 p-5 shadow-2xl min-[768px]:p-[26px]">
        <button type="button" onClick={onCancel} aria-label={copy.cancel} className="absolute right-[18px] top-[18px] text-[#9CA6B2]"><IconX size={20} /></button>
        <h2 className="text-[18px] font-semibold">{copy.title}</h2>
        <p className="mt-[10px] text-[11px] text-[#9CA6B2]">{copy.description}</p>
        <div className="mt-[18px] rounded-[12px] border border-[#28313B] bg-[#080B0F]/60 px-[14px] py-[12px]"><strong className="block text-[11px]">{transaction.description}</strong><span className="mt-[4px] block text-[10px] text-[#9CA6B2]">{money(transaction.amount)}</span></div>
        {error && <p role="alert" className="mt-[10px] text-[9px] text-[#F43F5E]">{error}</p>}
        <div className="mt-[20px] grid grid-cols-2 gap-[10px]"><button type="button" onClick={onCancel} className="h-[42px] rounded-[21px] border border-[#28313B] text-[11px] font-semibold text-[#9CA6B2]">{copy.cancel}</button><button type="button" disabled={saving} onClick={() => void confirmDelete()} className="h-[42px] rounded-[21px] bg-[#F43F5E] text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{saving ? mutationCopy.deleting : copy.delete}</button></div>
      </div>
    </div>
  );
}
