"use client";

import { useCurrency } from "@/components/CurrencyProvider";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconCircleCheck, IconFileDescription, IconLoader2, IconShieldCheck, IconUpload, IconWallet, IconX } from "@tabler/icons-react";

import { DashboardToast, type DashboardToastState } from "@/components/dashboard/DashboardToast";
import { ThemeControl } from "@/components/navigation/ThemeControl";
import { TransactionDecisionCards } from "@/components/transactions/TransactionDecisionCards";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { TransactionsKpiCards } from "@/components/transactions/TransactionsKpiCards";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { getTransactionCategoryGroupKey, legacyTransactionPaymentValues, transactionPaymentValues, type LegacyTransactionCreateInput, type Transaction, type TransactionPayment, type TransactionType } from "@/components/transactions/transaction-model";
import { getInitialTransactionCategoryId, getSelectableTransactionCategories, hasTransactionFieldChanges, resolveTransactionClassificationAction, retainCompatibleCategoryId } from "@/components/transactions/transaction-category-form";
import { parseTransactionCsv, validateImportedDraft, type ImportedTransactionDraft } from "@/components/transactions/csv-import";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";
import { useFinanceData } from "@/components/FinanceDataProvider";
import { getDashboardMonth } from "@/components/dashboard/dashboard-financial-summary";
import { formatTransactionCivilDate, getTransactionPaymentOptions, localizeTransactionCategory, localizeTransactionOrigin, localizeTransactionPayment, normalizeTransactionPayment } from "@/components/transactions/transaction-presentation";
import { parseCsvEditableAmountText, parseTransactionAmountText } from "@/lib/domain/financial-input-adapters";
import type { Category } from "@/lib/domain/category";
import { FinanceError } from "@/lib/domain/finance-error";

const iconRoot = "/moneypilot/transactions/icons";

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
  return value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : currentMonth;
}

export default function TransactionsPage() {
  return <Suspense fallback={null}><TransactionsPageFromSearchParams /></Suspense>;
}

function TransactionsPageFromSearchParams() {
  const searchParams = useSearchParams();
  const currentMonth = getDashboardMonth();
  const requestedMonth = resolveSelectedMonth(searchParams.get("month"), currentMonth);

  return <TransactionsPageContent key={requestedMonth} initialMonth={requestedMonth} currentMonth={currentMonth} />;
}

function TransactionsPageContent({ initialMonth, currentMonth }: { initialMonth: string; currentMonth: string }) {
  const { language } = useLanguage();
  const t = translations[language].appTransactions;
  const months = translations[language].financialFlow.months;
  const { transactions, goals, activeCategories, isHydrating, hydrationError, mutationState, createClassifiedTransaction, importTransactions, updateTransaction, linkTransactionCategory, unlinkTransactionCategory, deleteTransaction } = useFinanceData();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState("all");
  const [selectedOrigin, setSelectedOrigin] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [transactionModal, setTransactionModal] = useState<TransactionModalState | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [importOpen, setImportOpen] = useState(false);
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
  const monthOptions = useMemo(() => Array.from(new Set([currentMonth, selectedMonth, ...transactions.map((item) => item.dateISO.slice(0, 7))])).sort().reverse().map((value) => { const [year, month] = value.split("-"); return { value, label: `${months[Number(month) - 1]} ${year}` }; }), [currentMonth, months, selectedMonth, transactions]);
  const categoryOptions = useMemo(() => [{ value: "all", label: t.filters[1] }, ...Array.from(new Map(transactions.map((item) => [getTransactionCategoryGroupKey(item), { value: getTransactionCategoryGroupKey(item), label: localizeTransactionCategory(item.category, language) }])).values()).sort((left, right) => left.label.localeCompare(right.label, language))], [language, t.filters, transactions]);
  const paymentOptions = useMemo(() => [{ value: "all", label: t.filters[2] }, ...Array.from(new Set([...transactionPaymentValues, ...transactions.map((item) => normalizeTransactionPayment(item.payment))])).map((value) => ({ value, label: localizeTransactionPayment(value, language) }))], [language, t.filters, transactions]);
  const originOptions = useMemo(() => [{ value: "all", label: t.filters[3] }, ...Array.from(new Set(transactions.map((item) => item.origin))).sort().map((value) => ({ value, label: localizeTransactionOrigin(value, language) }))], [language, t.filters, transactions]);
  const secondaryCopy = { en: { oldest: "Oldest", import: "Import statement" }, pt: { oldest: "Mais antigas", import: "Importar extrato" }, es: { oldest: "Más antiguas", import: "Importar extracto" }, de: { oldest: "Älteste", import: "Kontoauszug importieren" }, fr: { oldest: "Plus anciennes", import: "Importer un relevé" }, nl: { oldest: "Oudste", import: "Afschrift importeren" }, it: { oldest: "Meno recenti", import: "Importa estratto conto" } }[language];
  const sortOptions = [{ value: "newest", label: t.filters[4] }, { value: "oldest", label: secondaryCopy.oldest }];
  const filteredTransactions = useMemo(() => transactions
    .filter((item) => `${item.description} ${localizeTransactionCategory(item.category, language)}`.toLocaleLowerCase(language).includes(query.toLocaleLowerCase(language)))
    .filter((item) => item.dateISO.startsWith(selectedMonth))
    .filter((item) => selectedCategory === "all" || getTransactionCategoryGroupKey(item) === selectedCategory)
    .filter((item) => selectedPayment === "all" || normalizeTransactionPayment(item.payment) === selectedPayment)
    .filter((item) => selectedOrigin === "all" || item.origin === selectedOrigin)
    .sort((a, b) => sortOrder === "newest" ? b.dateISO.localeCompare(a.dateISO) : a.dateISO.localeCompare(b.dateISO)), [language, query, selectedCategory, selectedMonth, selectedOrigin, selectedPayment, sortOrder, transactions]);
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function resetPageAnd(action: () => void) {
    action();
    setPage(1);
  }

  async function addTransaction(input: TransactionInput) {
    const category = activeCategories.find((candidate) => candidate.id === input.categoryId && candidate.type === input.type);
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
    const classificationAction = resolveTransactionClassificationAction(transaction, input.categoryId ?? "", activeCategories, input.type, input.removeLegacyClassification);
    if (classificationAction.kind === "invalid") throw new FinanceError("validation_error", { field: "categoryId", reason: "allowed_value" });
    const unlinkBeforeTypeChange = transaction.classification.kind === "linked" && transaction.type !== input.type;
    if (unlinkBeforeTypeChange) await unlinkTransactionCategory(transaction.id);
    if (hasTransactionFieldChanges(transaction, fields)) await updateTransaction(fields);
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
                    <label className="relative flex min-h-11 min-w-0 cursor-pointer items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--background-subtle)] px-3 text-sm text-[var(--text-secondary)]">
                      <Image src={`${iconRoot}/calendar-outline.svg`} alt="" width={18} height={18} /><span className="min-w-0 truncate">{monthOptions.find((option) => option.value === selectedMonth)?.label}</span>
                      <select value={selectedMonth} onChange={(event) => resetPageAnd(() => setSelectedMonth(event.target.value))} aria-label={t.month} className="absolute inset-0 cursor-pointer opacity-0">{monthOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                    </label>
                    <button type="button" onClick={() => setImportOpen(true)} className="flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--background-subtle)] px-3 text-sm font-medium text-[var(--text-secondary)]"><IconUpload size={18} /><span>{secondaryCopy.import}</span></button>
                  </div>
                  <label className="flex min-h-11 min-w-0 items-center gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--background-subtle)] px-3 text-[var(--text-secondary)]">
                    <Image src={`${iconRoot}/search-outline.svg`} alt="" width={18} height={18} />
                    <input value={query} onChange={(event) => resetPageAnd(() => setQuery(event.target.value))} aria-label={t.search} placeholder={t.search} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-secondary)]" />
                  </label>
                </header>

                <div className="mt-5 grid gap-5">
                  <TransactionsKpiCards transactions={transactions} selectedMonth={selectedMonth} mobile />
                  <TransactionFilters mobile values={[selectedMonth, selectedCategory, selectedPayment, selectedOrigin, sortOrder]} options={[monthOptions, categoryOptions, paymentOptions, originOptions, sortOptions]} onChange={(index, value) => resetPageAnd(() => { if (index === 0) setSelectedMonth(value); if (index === 1) setSelectedCategory(value); if (index === 2) setSelectedPayment(value); if (index === 3) setSelectedOrigin(value); if (index === 4) setSortOrder(value); })} />
                  <MobileTransactionCards transactions={paginatedTransactions} selectedMonth={selectedMonth} totalItems={filteredTransactions.length} pageSize={pageSize} page={currentPage} isHydrating={isHydrating} hasLoadError={Boolean(hydrationError)} onPageChange={setPage} onEdit={(transaction) => setTransactionModal({ mode: "edit", transaction, focusCategory: false })} onDelete={setTransactionToDelete} />
                  <TransactionDecisionCards goals={goals} isHydrating={isHydrating} hasLoadError={Boolean(hydrationError)} mobile />
                </div>
              </section>

              <div data-transactions-desktop className="hidden min-[768px]:block">
              <div className="relative flex h-auto min-w-0 max-w-full flex-col gap-[11.815px] overflow-visible py-[32px]">
                <header className="flex h-[83.722px] min-w-0 max-w-full shrink-0 flex-col gap-[12px] overflow-visible py-[1.786px]">
                  <div className="flex h-[36px] w-full items-center gap-[12px]">
                    <h1 className="shrink-0 text-[24px] font-semibold leading-[29px]">{t.title}</h1>
                    <div className="flex min-w-0 flex-1 items-center justify-end gap-[12px]">
                      <button type="button" onClick={() => setImportOpen(true)} className="flex h-[32.15px] items-center justify-center gap-[7.144px] rounded-[16.968px] border border-[var(--border-default)] bg-[var(--background-subtle)] px-[12px] text-[8.931px] font-medium text-[var(--text-secondary)]"><IconUpload size={15} /><span className="whitespace-nowrap">{secondaryCopy.import}</span></button>
                      <label className="relative flex h-[32.15px] w-[101.231px] cursor-pointer items-center justify-center gap-[7.144px] rounded-[16.968px] border border-[var(--border-default)] bg-[var(--background-subtle)] text-[8.931px] font-medium text-[var(--text-secondary)]">
                        <Image src={`${iconRoot}/calendar-outline.svg`} alt="" width={18} height={18} className="size-[17.861px]" /><span>{t.month}</span>
                        <select value={selectedMonth} onChange={(event) => resetPageAnd(() => setSelectedMonth(event.target.value))} aria-label={t.month} className="absolute inset-0 cursor-pointer opacity-0">{monthOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                      </label>
                      <button type="button" onClick={() => setTransactionModal({ mode: "create" })} className="flex h-[32.15px] w-[124.135px] items-center justify-center gap-[8.931px] rounded-[16.968px] bg-[var(--dashboard-brand-primary)] text-[8.931px] font-semibold text-white">
                        <span>{t.newTransaction}</span><Image src={`${iconRoot}/add-circle-outline.svg`} alt="" width={17} height={17} className="size-[16.968px]" />
                      </button>
                    </div>
                    <div data-transactions-theme-control className="h-[36px] w-[91px] shrink-0 overflow-hidden"><ThemeControl orientation="horizontal" /></div>
                  </div>
                  <div className="flex h-[32.15px] w-full items-start justify-between">
                    <p className="text-[14px] font-medium leading-[17px] text-[var(--text-secondary)]">{t.description}</p>
                    <label className="flex h-[32.15px] min-w-[180px] max-w-[413px] flex-[1_1_413px] items-center gap-[10.717px] rounded-[16.968px] border border-[var(--border-default)] bg-[var(--background-subtle)] px-[12.503px] text-[var(--text-secondary)]">
                      <Image src={`${iconRoot}/search-outline.svg`} alt="" width={18} height={18} className="size-[17.861px]" />
                      <input value={query} onChange={(event) => resetPageAnd(() => setQuery(event.target.value))} aria-label={t.search} placeholder={t.search} className="min-w-0 flex-1 bg-transparent text-[8.931px] outline-none placeholder:text-[var(--text-secondary)]" />
                    </label>
                  </div>
                </header>

                <TransactionsKpiCards transactions={transactions} selectedMonth={selectedMonth} />
                <TransactionFilters values={[selectedMonth, selectedCategory, selectedPayment, selectedOrigin, sortOrder]} options={[monthOptions, categoryOptions, paymentOptions, originOptions, sortOptions]} onChange={(index, value) => resetPageAnd(() => { if (index === 0) setSelectedMonth(value); if (index === 1) setSelectedCategory(value); if (index === 2) setSelectedPayment(value); if (index === 3) setSelectedOrigin(value); if (index === 4) setSortOrder(value); })} />
                <TransactionsTable transactions={paginatedTransactions} selectedMonth={selectedMonth} totalItems={filteredTransactions.length} pageSize={pageSize} page={currentPage} onPageChange={setPage} onEdit={(transaction, focusCategory = false) => setTransactionModal({ mode: "edit", transaction, focusCategory })} onDelete={setTransactionToDelete} />
                <TransactionDecisionCards goals={goals} isHydrating={isHydrating} hasLoadError={Boolean(hydrationError)} />
              </div>
              </div>

            {transactionModal && <TransactionModal transaction={transactionModal.mode === "edit" ? transactionModal.transaction : undefined} categories={activeCategories} focusCategory={transactionModal.mode === "edit" && transactionModal.focusCategory} saving={transactionModal.mode === "edit" ? isUpdating : isCreating} onSubmit={(input) => transactionModal.mode === "edit" ? saveTransaction(transactionModal.transaction, input) : addTransaction(input)} onClose={() => setTransactionModal(null)} />}
            {transactionToDelete && <DeleteTransactionModal transaction={transactionToDelete} saving={isDeleting} onCancel={() => setTransactionToDelete(null)} onDelete={() => removeTransaction(transactionToDelete.id)} />}
            {importOpen && <ImportStatementModal existingTransactions={transactions} onImport={importTransactions} onClose={() => setImportOpen(false)} />}
            {toast && <DashboardToast toast={toast} onClose={() => setToast(null)} />}
          </main>
      </div>
    </div>
  );
}

function MobileTransactionCards({ transactions, selectedMonth, totalItems, pageSize, page, isHydrating, hasLoadError, onPageChange, onEdit, onDelete }: { transactions: Transaction[]; selectedMonth: string; totalItems: number; pageSize: number; page: number; isHydrating: boolean; hasLoadError: boolean; onPageChange: (page: number) => void; onEdit: (transaction: Transaction) => void; onDelete: (transaction: Transaction) => void }) {
  const { language } = useLanguage();
  const { formatMoney: money } = useCurrency();
  const t = translations[language].appTransactions;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const [year, monthNumber] = selectedMonth.split("-");
  const periodLabel = `${translations[language].financialFlow.months[Number(monthNumber) - 1]} ${year}`;
  const typeCopy = language === "pt" ? { expense: "Despesa", income: "Receita" } : language === "es" ? { expense: "Gasto", income: "Ingreso" } : language === "de" ? { expense: "Ausgabe", income: "Einnahme" } : language === "fr" ? { expense: "Dépense", income: "Revenu" } : language === "nl" ? { expense: "Uitgave", income: "Inkomen" } : language === "it" ? { expense: "Spesa", income: "Entrata" } : { expense: "Expense", income: "Income" };
  const stateCopy = language === "pt" ? { loading: "Carregando transações…", error: "Não foi possível carregar as transações.", edit: "Editar", type: "Tipo" } : language === "es" ? { loading: "Cargando transacciones…", error: "No se pudieron cargar las transacciones.", edit: "Editar", type: "Tipo" } : language === "de" ? { loading: "Transaktionen werden geladen…", error: "Transaktionen konnten nicht geladen werden.", edit: "Bearbeiten", type: "Typ" } : language === "fr" ? { loading: "Chargement des transactions…", error: "Impossible de charger les transactions.", edit: "Modifier", type: "Type" } : language === "nl" ? { loading: "Transacties worden geladen…", error: "Transacties konden niet worden geladen.", edit: "Bewerken", type: "Type" } : language === "it" ? { loading: "Caricamento delle transazioni…", error: "Impossibile caricare le transazioni.", edit: "Modifica", type: "Tipo" } : { loading: "Loading transactions…", error: "Unable to load transactions.", edit: "Edit", type: "Type" };

  return (
    <section data-mobile-transaction-cards className="min-w-0 rounded-2xl border border-[var(--border-default)] bg-[var(--background-elevated)] p-3 shadow-[0_3.572px_12.503px_rgba(10,10,10,0.07)]">
      <div className="mb-3 flex min-w-0 items-start justify-between gap-3"><h2 className="min-w-0 break-words text-base font-semibold">{t.transactionsInPeriod.replace("{period}", periodLabel)}</h2><span className="shrink-0 text-xs text-[var(--text-tertiary)]">{totalItems}</span></div>
      {isHydrating && <p className="py-8 text-center text-sm text-[var(--text-secondary)]">{stateCopy.loading}</p>}
      {!isHydrating && hasLoadError && <p role="alert" className="py-8 text-center text-sm text-[#F43F5E]">{stateCopy.error}</p>}
      {!isHydrating && !hasLoadError && transactions.length === 0 && <p className="py-8 text-center text-sm text-[var(--text-secondary)]">{t.noTransactionsInPeriod.replace("{period}", periodLabel)}</p>}
      {!isHydrating && !hasLoadError && <div className="grid gap-3">{transactions.map((item) => (
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

function TransactionModal({ transaction, categories, focusCategory, saving, onSubmit, onClose }: { transaction?: Transaction; categories: readonly Category[]; focusCategory: boolean; saving: boolean; onSubmit: (input: TransactionInput) => Promise<void>; onClose: () => void }) {
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
  const selectableCategories = getSelectableTransactionCategories(categories, type);
  const linkedCategoryIsArchived = transaction?.classification.kind === "linked"
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
    <div className="fixed inset-0 z-50 flex overflow-y-auto bg-[#080B0F]/65 px-4 py-4 backdrop-blur-sm sm:items-center sm:justify-center" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} className="relative m-auto w-full max-w-[420px] rounded-[26px] border border-[#28313B] bg-[#0D1117]/95 p-[22px] text-[#F5F7FA] shadow-2xl sm:p-[26px]">
        <button type="button" onClick={onClose} aria-label={t.close} className="absolute right-[18px] top-[18px] text-[#9CA6B2]"><IconX size={20} /></button>
        <div className="flex items-center gap-[10px]"><div className="flex size-[34px] items-center justify-center rounded-[10px] bg-[#3B82F6]/20 text-[#60A5FA]"><IconWallet size={20} /></div><h2 id={titleId} className="text-[18px] font-semibold">{isEditing ? editCopy.title : t.newTransaction}</h2></div>
        <p id={descriptionId} className="mt-[10px] text-[11px] text-[#9CA6B2]">{isEditing ? editCopy.description : t.modalDescription}</p>
        <form onSubmit={submitTransaction} className="mt-[20px] grid gap-[10px]">
          <div className="flex h-[36px] w-full items-center rounded-[19px] border border-[#28313B] bg-[#080B0F]/60 p-[3px]">{(["expense", "income"] as const).map((option) => <button key={option} type="button" onClick={() => { setType(option); setSelectedCategoryId((current) => retainCompatibleCategoryId(current, categories, option)); setRemoveLegacyClassification(false); setError(""); }} aria-pressed={type === option} className={`flex h-[28px] flex-1 items-center justify-center rounded-[16px] text-[10px] font-semibold ${type === option ? "bg-[#3B82F6] text-white" : "text-[#9CA6B2]"}`}>{typeCopy[option]}</button>)}</div>
          <label className="grid gap-1 text-[9px] font-medium text-[#9CA6B2]"><span>{t.descriptionField}</span><input ref={descriptionRef} value={description} onChange={(event) => { setDescription(event.target.value); setError(""); }} className="h-[42px] rounded-[12px] border border-[#28313B] bg-[#080B0F]/60 px-[14px] text-[11px] text-[#F5F7FA] outline-none" /></label>
          <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2"><label className="grid gap-1 text-[9px] font-medium text-[#9CA6B2]"><span>{t.value}</span><input value={amount} onChange={(event) => { setAmount(event.target.value); setError(""); }} inputMode="decimal" className="h-[42px] rounded-[12px] border border-[#28313B] bg-[#080B0F]/60 px-[14px] text-[11px] text-[#F5F7FA] outline-none" /></label><label className="grid gap-1 text-[9px] font-medium text-[#9CA6B2]"><span>{t.category}</span><select ref={categoryRef} value={selectedCategoryId} onChange={(event) => { setSelectedCategoryId(event.target.value); setRemoveLegacyClassification(false); setError(""); }} className="h-[42px] rounded-[12px] border border-[#28313B] bg-[#080B0F]/60 px-[14px] text-[11px] text-[#F5F7FA] outline-none"><option value="">{categoryCopy.select}</option>{linkedCategoryIsArchived && <option value={selectedCategoryId} disabled>{transaction?.category} ({categoryCopy.archived})</option>}{selectableCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label></div>
          {transaction?.classification.kind === "legacy" && <div className="flex items-center justify-between gap-[10px] rounded-[10px] border border-[#28313B] bg-[#080B0F]/40 px-[12px] py-[8px] text-[9px]"><span className="min-w-0 truncate text-[#9CA6B2]">{categoryCopy.historical}: {transaction.category}</span><button type="button" disabled={removeLegacyClassification} onClick={() => { setSelectedCategoryId(""); setRemoveLegacyClassification(true); setError(""); }} className="shrink-0 font-semibold text-[#60A5FA] disabled:text-[#9CA6B2]">{removeLegacyClassification ? categoryCopy.removalSelected : categoryCopy.removeHistorical}</button></div>}
          <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2"><label className="grid gap-1 text-[9px] font-medium text-[#9CA6B2]"><span>{formCopy.date}</span><input type="date" required value={dateISO} onChange={(event) => { setDateISO(event.target.value); setError(""); }} className="h-[42px] rounded-[12px] border border-[#28313B] bg-[#080B0F]/60 px-[14px] text-[11px] text-[#F5F7FA] outline-none [color-scheme:dark]" /></label><label className="grid gap-1 text-[9px] font-medium text-[#9CA6B2]"><span>{formCopy.payment}</span><select required value={payment} onChange={(event) => { setPayment(event.target.value); setError(""); }} className="h-[42px] rounded-[12px] border border-[#28313B] bg-[#080B0F]/60 px-[14px] text-[11px] text-[#F5F7FA] outline-none">{getTransactionPaymentOptions(language).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}{transaction && legacyTransactionPaymentValues.includes(initialPayment as "Card") && <option value="Card">{formCopy.card}</option>}{transaction && initialPayment !== "Card" && !transactionPaymentValues.includes(initialPayment as TransactionPayment) && <option value={initialPayment}>{initialPayment}</option>}</select></label></div>
          {error && <p role="alert" className="text-[9px] text-[#F43F5E]">{error}</p>}
          <button type="submit" disabled={saving} className="mt-[6px] h-[42px] rounded-[21px] bg-[#3B82F6] text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-60">{saving ? isEditing ? mutationCopy.updating : mutationCopy.saving : isEditing ? editCopy.submit : t.addTransaction}</button>
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

const MAX_CSV_SIZE = 5 * 1024 * 1024;

function normalizeImportedDescription(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function importSignature(item: Pick<Transaction, "dateISO" | "description" | "type" | "amount"> | ImportedTransactionDraft) {
  if (!item.dateISO || !item.description.trim() || !item.type || item.amount === null || item.amount <= 0) return null;
  return `${item.dateISO}|${normalizeImportedDescription(item.description)}|${item.type}|${item.amount.toFixed(2)}`;
}

function ImportStatementModal({ existingTransactions, onImport, onClose }: { existingTransactions: Transaction[]; onImport: (transactions: LegacyTransactionCreateInput[]) => Promise<Transaction[]>; onClose: () => void }) {
  const { language } = useLanguage();
  const { formatMoney: money } = useCurrency();
  const months = translations[language].financialFlow.months;
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drafts, setDrafts] = useState<ImportedTransactionDraft[]>([]);
  const [error, setError] = useState("");
  const [stage, setStage] = useState<"select" | "analyzing" | "review" | "complete">("select");
  const [analysisStep, setAnalysisStep] = useState(0);
  const [detectedLines, setDetectedLines] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [completed, setCompleted] = useState({ count: 0, income: 0, expense: 0, duplicates: 0, errors: 0 });
  const [isImporting, setIsImporting] = useState(false);
  const copy = language === "pt" ? {
    title: "Importar extrato", description: "Envie um arquivo CSV para revisar suas transações antes de adicioná-las ao MoneyPilot.", choose: "Selecionar arquivo CSV", privacy: "Seu arquivo é processado localmente e não é enviado para servidores nesta etapa.", found: "Transações encontradas", errors: "Com erro", income: "Receitas detectadas", expenses: "Despesas detectadas", total: "Total de registros", review: "Revisar transações", ready: "Arquivo preparado para a etapa de revisão.", cancel: "Cancelar", statusReady: "Pronta", statusReview: "Revisar",
  } : language === "es" ? {
    title: "Importar extracto", description: "Envía un archivo CSV para revisar tus transacciones antes de añadirlas a MoneyPilot.", choose: "Seleccionar archivo CSV", privacy: "Tu archivo se procesa localmente y no se envía a servidores en esta etapa.", found: "Transacciones encontradas", errors: "Con error", income: "Ingresos detectados", expenses: "Gastos detectados", total: "Total de registros", review: "Revisar transacciones", ready: "Archivo preparado para la etapa de revisión.", cancel: "Cancelar", statusReady: "Lista", statusReview: "Revisar",
  } : language === "de" ? {
    title: "Kontoauszug importieren", description: "Wähle eine CSV-Datei, um die Transaktionen vor dem Hinzufügen zu prüfen.", choose: "CSV-Datei auswählen", privacy: "Deine Datei wird lokal verarbeitet und in diesem Schritt nicht an Server gesendet.", found: "Transaktionen gefunden", errors: "Mit Fehlern", income: "Einnahmen erkannt", expenses: "Ausgaben erkannt", total: "Datensätze gesamt", review: "Transaktionen prüfen", ready: "Datei für die Prüfung vorbereitet.", cancel: "Abbrechen", statusReady: "Bereit", statusReview: "Prüfen",
  } : language === "fr" ? {
    title: "Importer un relevé", description: "Sélectionnez un fichier CSV pour vérifier les transactions avant de les ajouter.", choose: "Sélectionner un fichier CSV", privacy: "Votre fichier est traité localement et n’est pas envoyé à un serveur à cette étape.", found: "Transactions trouvées", errors: "Avec erreurs", income: "Revenus détectés", expenses: "Dépenses détectées", total: "Total des lignes", review: "Vérifier les transactions", ready: "Fichier prêt pour la vérification.", cancel: "Annuler", statusReady: "Prête", statusReview: "Vérifier",
  } : language === "nl" ? {
    title: "Afschrift importeren", description: "Selecteer een CSV-bestand om transacties te controleren voordat je ze toevoegt.", choose: "CSV-bestand selecteren", privacy: "Je bestand wordt lokaal verwerkt en in deze stap niet naar servers gestuurd.", found: "Transacties gevonden", errors: "Met fouten", income: "Inkomen herkend", expenses: "Uitgaven herkend", total: "Totaal aantal regels", review: "Transacties controleren", ready: "Bestand voorbereid voor controle.", cancel: "Annuleren", statusReady: "Gereed", statusReview: "Controleren",
  } : language === "it" ? {
    title: "Importa estratto conto", description: "Seleziona un file CSV per verificare le transazioni prima di aggiungerle.", choose: "Seleziona file CSV", privacy: "Il file viene elaborato localmente e non viene inviato ai server in questa fase.", found: "Transazioni trovate", errors: "Con errori", income: "Entrate rilevate", expenses: "Spese rilevate", total: "Totale righe", review: "Rivedi transazioni", ready: "File pronto per la revisione.", cancel: "Annulla", statusReady: "Pronta", statusReview: "Rivedi",
  } : {
    title: "Import statement", description: "Send a CSV file to review your transactions before adding them to MoneyPilot.", choose: "Select CSV file", privacy: "Your file is processed locally and is not sent to servers at this stage.", found: "Transactions found", errors: "With errors", income: "Income detected", expenses: "Expenses detected", total: "Total records", review: "Review transactions", ready: "File prepared for the review stage.", cancel: "Cancel", statusReady: "Ready", statusReview: "Review",
  };
  const reviewCopy = language === "pt"
    ? { reviewTitle: "Revisar transações", reviewDescription: "Confira os dados detectados antes de adicioná-los ao MoneyPilot.", duplicate: "Possível duplicata", selected: "Selecionadas", selectValid: "Selecionar todas as válidas", clear: "Limpar seleção", complete: "Importação concluída", view: "Ver transações", notSpecified: "Não informado", importedOrigin: "Importado" }
    : language === "es"
      ? { reviewTitle: "Revisa las transacciones", reviewDescription: "Edita los datos y elige qué transacciones importar.", duplicate: "Posible duplicado", selected: "Seleccionadas", selectValid: "Seleccionar válidas", clear: "Limpiar selección", complete: "Importación completada", view: "Ver transacciones", notSpecified: "No especificado", importedOrigin: "Importado" }
      : language === "de" ? { reviewTitle: "Transaktionen prüfen", reviewDescription: "Bearbeite die Daten und wähle die zu importierenden Transaktionen.", duplicate: "Mögliches Duplikat", selected: "Ausgewählt", selectValid: "Gültige auswählen", clear: "Auswahl löschen", complete: "Import abgeschlossen", view: "Transaktionen anzeigen", notSpecified: "Nicht angegeben", importedOrigin: "Importiert" }
      : language === "fr" ? { reviewTitle: "Vérifier les transactions", reviewDescription: "Modifiez les données et choisissez les transactions à importer.", duplicate: "Doublon possible", selected: "Sélectionnées", selectValid: "Sélectionner les valides", clear: "Effacer la sélection", complete: "Importation terminée", view: "Voir les transactions", notSpecified: "Non indiqué", importedOrigin: "Importé" }
      : language === "nl" ? { reviewTitle: "Transacties controleren", reviewDescription: "Bewerk de gegevens en kies welke transacties je importeert.", duplicate: "Mogelijk dubbel", selected: "Geselecteerd", selectValid: "Geldige selecteren", clear: "Selectie wissen", complete: "Import voltooid", view: "Transacties bekijken", notSpecified: "Niet opgegeven", importedOrigin: "Geïmporteerd" }
      : language === "it" ? { reviewTitle: "Rivedi transazioni", reviewDescription: "Modifica i dati e scegli quali transazioni importare.", duplicate: "Possibile duplicato", selected: "Selezionate", selectValid: "Seleziona valide", clear: "Cancella selezione", complete: "Importazione completata", view: "Vedi transazioni", notSpecified: "Non specificato", importedOrigin: "Importato" }
      : { reviewTitle: "Review transactions", reviewDescription: "Edit the data and choose which transactions to import.", duplicate: "Possible duplicate", selected: "Selected", selectValid: "Select valid", clear: "Clear selection", complete: "Import complete", view: "View transactions", notSpecified: "Not specified", importedOrigin: "Imported" };
  const analysisCopy = language === "pt"
    ? { title: "Analisando extrato", subtitle: "Estamos preparando suas transações para revisão.", analyzing: "Analisando", progress: "concluído", localTitle: "Processamento local e privado", localText: "Nenhum dado está sendo enviado para servidores.", retry: "Tentar novamente", other: "Selecionar outro arquivo", lines: "linhas detectadas", steps: ["Lendo arquivo", "Identificando colunas", "Normalizando datas", "Detectando receitas e despesas", "Preparando transações para revisão"], done: "Concluído", processing: "Processando", waiting: "Aguardando" }
    : language === "es"
      ? { title: "Analizando extracto", subtitle: "Estamos preparando tus transacciones para revisión.", analyzing: "Analizando", progress: "completado", localTitle: "Procesamiento local y privado", localText: "No se envían datos a servidores.", retry: "Intentar de nuevo", other: "Seleccionar otro archivo", lines: "líneas detectadas", steps: ["Leyendo archivo", "Identificando columnas", "Normalizando fechas", "Detectando ingresos y gastos", "Preparando transacciones para revisión"], done: "Completado", processing: "Procesando", waiting: "Esperando" }
      : language === "de" ? { title: "Kontoauszug wird analysiert", subtitle: "Wir bereiten deine Transaktionen zur Prüfung vor.", analyzing: "Analysieren", progress: "abgeschlossen", localTitle: "Lokale und private Verarbeitung", localText: "Es werden keine Daten an Server gesendet.", retry: "Erneut versuchen", other: "Andere Datei auswählen", lines: "Zeilen erkannt", steps: ["Datei lesen", "Spalten erkennen", "Daten normalisieren", "Einnahmen und Ausgaben erkennen", "Transaktionen zur Prüfung vorbereiten"], done: "Abgeschlossen", processing: "Wird verarbeitet", waiting: "Wartet" }
      : language === "fr" ? { title: "Analyse du relevé", subtitle: "Nous préparons vos transactions pour la vérification.", analyzing: "Analyse", progress: "terminé", localTitle: "Traitement local et privé", localText: "Aucune donnée n’est envoyée à un serveur.", retry: "Réessayer", other: "Choisir un autre fichier", lines: "lignes détectées", steps: ["Lecture du fichier", "Identification des colonnes", "Normalisation des dates", "Détection des revenus et dépenses", "Préparation des transactions"], done: "Terminé", processing: "Traitement", waiting: "En attente" }
      : language === "nl" ? { title: "Afschrift analyseren", subtitle: "We bereiden je transacties voor op controle.", analyzing: "Analyseren", progress: "voltooid", localTitle: "Lokale en privéverwerking", localText: "Er worden geen gegevens naar servers gestuurd.", retry: "Opnieuw proberen", other: "Ander bestand selecteren", lines: "regels herkend", steps: ["Bestand lezen", "Kolommen herkennen", "Datums normaliseren", "Inkomen en uitgaven herkennen", "Transacties voorbereiden"], done: "Voltooid", processing: "Verwerken", waiting: "Wachten" }
      : language === "it" ? { title: "Analisi estratto conto", subtitle: "Stiamo preparando le transazioni per la revisione.", analyzing: "Analisi", progress: "completato", localTitle: "Elaborazione locale e privata", localText: "Nessun dato viene inviato ai server.", retry: "Riprova", other: "Seleziona un altro file", lines: "righe rilevate", steps: ["Lettura file", "Identificazione colonne", "Normalizzazione date", "Rilevamento entrate e spese", "Preparazione transazioni"], done: "Completato", processing: "Elaborazione", waiting: "In attesa" }
      : { title: "Analyzing statement", subtitle: "We are preparing your transactions for review.", analyzing: "Analyzing", progress: "complete", localTitle: "Local and private processing", localText: "No data is being sent to servers.", retry: "Try again", other: "Select another file", lines: "lines detected", steps: ["Reading file", "Identifying columns", "Normalizing dates", "Detecting income and expenses", "Preparing transactions for review"], done: "Complete", processing: "Processing", waiting: "Waiting" };
  const duplicateIds = useMemo(() => {
    const known = new Set(existingTransactions.map(importSignature).filter((signature): signature is string => Boolean(signature)));
    const duplicates = new Set<string>();
    drafts.forEach((draft) => {
      const signature = importSignature(draft);
      if (!signature) return;
      if (known.has(signature)) duplicates.add(draft.id);
      else known.add(signature);
    });
    return duplicates;
  }, [drafts, existingTransactions]);
  const invalidCount = drafts.filter((draft) => draft.errors.length > 0).length;
  const incomeTotal = drafts.filter((draft) => draft.type === "income" && draft.amount !== null).reduce((total, draft) => total + (draft.amount ?? 0), 0);
  const expenseTotal = drafts.filter((draft) => draft.type === "expense" && draft.amount !== null).reduce((total, draft) => total + (draft.amount ?? 0), 0);
  const selectedDrafts = drafts.filter((draft) => selectedIds.has(draft.id) && draft.errors.length === 0);
  const selectedIncome = selectedDrafts.filter((draft) => draft.type === "income").reduce((total, draft) => total + (draft.amount ?? 0), 0);
  const selectedExpense = selectedDrafts.filter((draft) => draft.type === "expense").reduce((total, draft) => total + (draft.amount ?? 0), 0);
  const csvText = {
    en: { invalid: "Select a valid CSV file.", empty: "The selected file is empty.", large: "The file exceeds the 5 MB limit.", date: "Date", description: "Description", category: "Category", type: "Type", value: "Value", status: "Status", expense: "Expense", income: "Income", added: "transactions were added to MoneyPilot.", steps: "Select ✓ · Analyze ✓ · Review ✓ · Import ✓", importCount: (count: number) => `Import ${count} transactions` }, pt: { invalid: "Selecione um arquivo CSV válido.", empty: "O arquivo selecionado está vazio.", large: "O arquivo excede o limite de 5 MB.", date: "Data", description: "Descrição", category: "Categoria", type: "Tipo", value: "Valor", status: "Status", expense: "Despesa", income: "Receita", added: "transações foram adicionadas ao MoneyPilot.", steps: "Selecionar ✓ · Analisar ✓ · Revisar ✓ · Importar ✓", importCount: (count: number) => `Importar ${count} transações` }, es: { invalid: "Selecciona un archivo CSV válido.", empty: "El archivo seleccionado está vacío.", large: "El archivo supera el límite de 5 MB.", date: "Fecha", description: "Descripción", category: "Categoría", type: "Tipo", value: "Valor", status: "Estado", expense: "Gasto", income: "Ingreso", added: "transacciones fueron añadidas a MoneyPilot.", steps: "Seleccionar ✓ · Analizar ✓ · Revisar ✓ · Importar ✓", importCount: (count: number) => `Importar ${count} transacciones` },
    de: { invalid: "Wähle eine gültige CSV-Datei aus.", empty: "Die ausgewählte Datei ist leer.", large: "Die Datei überschreitet das Limit von 5 MB.", date: "Datum", description: "Beschreibung", category: "Kategorie", type: "Typ", value: "Betrag", status: "Status", expense: "Ausgabe", income: "Einnahme", added: "Transaktionen wurden zu MoneyPilot hinzugefügt.", steps: "Auswählen ✓ · Analysieren ✓ · Prüfen ✓ · Importieren ✓", importCount: (count: number) => `${count} Transaktionen importieren` }, fr: { invalid: "Sélectionnez un fichier CSV valide.", empty: "Le fichier sélectionné est vide.", large: "Le fichier dépasse la limite de 5 Mo.", date: "Date", description: "Description", category: "Catégorie", type: "Type", value: "Montant", status: "État", expense: "Dépense", income: "Revenu", added: "transactions ont été ajoutées à MoneyPilot.", steps: "Sélectionner ✓ · Analyser ✓ · Vérifier ✓ · Importer ✓", importCount: (count: number) => `Importer ${count} transactions` }, nl: { invalid: "Selecteer een geldig CSV-bestand.", empty: "Het geselecteerde bestand is leeg.", large: "Het bestand overschrijdt de limiet van 5 MB.", date: "Datum", description: "Beschrijving", category: "Categorie", type: "Type", value: "Bedrag", status: "Status", expense: "Uitgave", income: "Inkomen", added: "transacties zijn aan MoneyPilot toegevoegd.", steps: "Selecteren ✓ · Analyseren ✓ · Controleren ✓ · Importeren ✓", importCount: (count: number) => `${count} transacties importeren` }, it: { invalid: "Seleziona un file CSV valido.", empty: "Il file selezionato è vuoto.", large: "Il file supera il limite di 5 MB.", date: "Data", description: "Descrizione", category: "Categoria", type: "Tipo", value: "Importo", status: "Stato", expense: "Spesa", income: "Entrata", added: "transazioni sono state aggiunte a MoneyPilot.", steps: "Seleziona ✓ · Analizza ✓ · Rivedi ✓ · Importa ✓", importCount: (count: number) => `Importa ${count} transazioni` },
  }[language];

  async function selectFile(selected: File | undefined) {
    setError("");
    setStage("select");
    setAnalysisStep(0);
    setDetectedLines(null);
    setSelectedIds(new Set());
    setFile(null);
    setDrafts([]);
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".csv") || (selected.type && selected.type !== "text/csv" && selected.type !== "application/vnd.ms-excel")) {
      setError(csvText.invalid);
      return;
    }
    if (selected.size === 0) {
      setError(csvText.empty);
      return;
    }
    if (selected.size > MAX_CSV_SIZE) {
      setError(csvText.large);
      return;
    }
    setFile(selected);
    setStage("analyzing");
    setAnalysisStep(1);
    try {
      const text = await selected.text();
      setDetectedLines(Math.max(0, text.split(/\r?\n/).filter((line) => line.trim()).length - 1));
      setAnalysisStep(2);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      setAnalysisStep(3);
      const parsed = parseTransactionCsv(text);
      setAnalysisStep(5);
      setDrafts(parsed);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const known = new Set(existingTransactions.map(importSignature).filter((signature): signature is string => Boolean(signature)));
      const initiallySelected = new Set<string>();
      parsed.forEach((draft) => {
        const signature = importSignature(draft);
        if (draft.errors.length === 0 && signature && !known.has(signature)) initiallySelected.add(draft.id);
        if (signature) known.add(signature);
      });
      setSelectedIds(initiallySelected);
      setStage("review");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível analisar o CSV.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function updateDraft(id: string, changes: Partial<ImportedTransactionDraft>) {
    const currentDraft = drafts.find((draft) => draft.id === id);
    if (!currentDraft) return;
    const edited = { ...currentDraft, ...changes };
    const editedErrors = validateImportedDraft(edited);
    setDrafts((current) => current.map((draft) => {
      if (draft.id !== id) return draft;
      return { ...edited, errors: editedErrors };
    }));
    const known = new Set(existingTransactions.map(importSignature).filter((signature): signature is string => Boolean(signature)));
    let editedIsDuplicate = false;
    drafts.map((draft) => draft.id === id ? edited : draft).forEach((draft) => {
      const signature = importSignature(draft);
      if (!signature) return;
      if (known.has(signature) && draft.id === id) editedIsDuplicate = true;
      else known.add(signature);
    });
    const shouldSelect = editedErrors.length === 0 && !editedIsDuplicate;
    setSelectedIds((current) => { const next = new Set(current); if (shouldSelect) next.add(id); else next.delete(id); return next; });
  }

  async function finishImport() {
    const imported = selectedDrafts.flatMap((draft): LegacyTransactionCreateInput[] => {
      if (!draft.dateISO || !draft.type || draft.amount === null) return [];
      const category = draft.category.trim() || "Sem categoria";
      const knownCategory = existingTransactions.find((transaction) => transaction.category !== null && normalizeImportedDescription(transaction.category) === normalizeImportedDescription(category));
      const [year, month, day] = draft.dateISO.split("-").map(Number);
      return [{ id: crypto.randomUUID(), description: draft.description.trim(), category, categoryColor: knownCategory?.categoryColor ?? "#64707D", payment: reviewCopy.notSpecified, date: `${day} ${months[month - 1]} ${year}`, dateISO: draft.dateISO, origin: reviewCopy.importedOrigin, type: draft.type, amount: draft.amount }];
    });

    setIsImporting(true);
    setError("");

    try {
      await onImport(imported);
      setCompleted({ count: imported.length, income: imported.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0), expense: imported.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0), duplicates: duplicateIds.size, errors: invalidCount });
      setStage("complete");
    } catch (caught: unknown) {
      const importError = caught instanceof Error ? caught.message : "Unable to import transactions.";
      setError(importError);
    } finally {
      setIsImporting(false);
    }
  }

  if (stage === "analyzing") {
    const progress = Math.round((analysisStep / analysisCopy.steps.length) * 100);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#02060A]/68 p-4 backdrop-blur-[2px]">
        <div className="relative my-auto max-h-[calc(100dvh-32px)] w-full max-w-[560px] overflow-y-auto rounded-[24px] border border-[#28313B] bg-[#0D1117]/98 p-5 shadow-[0_24px_24px_rgba(0,0,0,0.48)] min-[768px]:h-[600px] min-[768px]:p-[23px]">
          <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={(event) => void selectFile(event.target.files?.[0])} className="hidden" />
          <div className="flex h-[58px] items-center gap-[14px]"><div className="flex size-[44px] items-center justify-center rounded-[14px] border border-[#3B82F6]/90 bg-[#60A5FA]/14 text-[#60A5FA]"><IconUpload size={24} /></div><div><h2 className="text-[19px] font-semibold">{analysisCopy.title}</h2><p className="mt-[3px] text-[10px] text-[#9CA6B2]">{analysisCopy.subtitle}</p></div><span className="ml-auto rounded-[13px] border border-[#28313B] bg-[#10161D]/95 px-[18px] py-[7px] text-[10px] font-semibold text-[#60A5FA]">2 de 4</span></div>
          <div className="mt-[20px] grid grid-cols-4 text-[10px]"><span className="text-[#9CA6B2]">● Selecionar ✓</span><span className="font-semibold text-[#F5F7FA]">● Analisar</span><span className="text-[#64707D]">○ Revisar</span><span className="text-[#64707D]">○ Importar</span></div>
          <div className="mt-[22px] flex h-[70px] items-center rounded-[14px] border border-[#28313B] bg-[#10161D]/90 px-[15px]"><IconFileDescription size={32} className="text-[#60A5FA]" /><div className="ml-[12px]"><strong className="block max-w-[280px] truncate text-[12px]">{file?.name}</strong><span className="mt-[4px] block text-[10px] text-[#9CA6B2]">CSV · {file ? `${(file.size / 1024).toFixed(1)} KB` : "—"}{detectedLines !== null ? ` · ${detectedLines} ${analysisCopy.lines}` : ""}</span></div><span className="ml-auto rounded-[13px] border border-[#3B82F6]/45 bg-[#3B82F6]/12 px-[20px] py-[7px] text-[9px] font-semibold text-[#60A5FA]">{error ? copy.statusReview : analysisCopy.analyzing}</span></div>
          {!error && <><p className="mt-[18px] text-[10px] font-semibold text-[#9CA6B2]">{progress}% {analysisCopy.progress}</p><div className="mt-[7px] h-[8px] overflow-hidden rounded-[4px] bg-[#10161D]"><div className="h-full rounded-[4px] bg-[#3B82F6] transition-[width]" style={{ width: `${progress}%` }} /></div></>}
          <div className="mt-[18px] rounded-[16px] border border-[#28313B] bg-[#080B0F]/45 px-[13px] py-[10px]">{analysisCopy.steps.map((label, index) => { const step = index + 1; const done = analysisStep > step; const active = analysisStep === step; return <div key={label} className="flex h-[34px] items-center text-[10px]"><span className={`flex size-[16px] items-center justify-center rounded-full ${done ? "bg-[#22C55E] text-white" : active ? "text-[#3B82F6]" : "border border-[#28313B] text-[#64707D]"}`}>{done ? <IconCircleCheck size={16} /> : active ? <IconLoader2 size={16} className="animate-spin" /> : null}</span><span className={`ml-[10px] ${done || active ? "text-[#F5F7FA]" : "text-[#9CA6B2]"}`}>{label}</span><span className={`ml-auto text-[9px] ${done ? "text-[#22C55E]" : active ? "text-[#60A5FA]" : "text-[#64707D]"}`}>{done ? analysisCopy.done : active ? analysisCopy.processing : analysisCopy.waiting}</span></div>; })}</div>
          <div className="mt-[16px] flex h-[50px] items-center rounded-[14px] border border-[#1E427A]/80 bg-[#0B1323]/72 px-[13px]"><IconShieldCheck size={22} className="text-[#60A5FA]" /><div className="ml-[10px]"><strong className="block text-[10px]">{analysisCopy.localTitle}</strong><span className="text-[9px] text-[#9CA6B2]">{analysisCopy.localText}</span></div></div>
          {error ? <div className="mt-[10px]"><p role="alert" className="text-[9px] text-[#F43F5E]">{error}</p><div className="mt-[8px] flex justify-end gap-[8px]"><button type="button" onClick={() => file && void selectFile(file)} className="h-[34px] rounded-[17px] border border-[#28313B] px-[16px] text-[10px] text-[#9CA6B2]">{analysisCopy.retry}</button><button type="button" onClick={() => inputRef.current?.click()} className="h-[34px] rounded-[17px] bg-[#3B82F6] px-[16px] text-[10px] font-semibold">{analysisCopy.other}</button></div></div> : <button type="button" onClick={onClose} className="absolute bottom-[7px] right-[23px] h-[38px] w-[112px] rounded-[19px] border border-[#28313B] bg-[#10161D]/92 text-[11px] font-semibold text-[#9CA6B2]">{copy.cancel}</button>}
        </div>
      </div>
    );
  }

  if (stage === "review") return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#080B0F]/65 p-4 backdrop-blur-sm">
      <div className="relative my-auto max-h-[calc(100dvh-32px)] w-full max-w-[1120px] overflow-y-auto rounded-[26px] border border-[#28313B] bg-[#0D1117]/95 p-5 shadow-2xl min-[768px]:p-[26px]">
        <button type="button" onClick={onClose} aria-label={copy.cancel} className="absolute right-[18px] top-[18px] text-[#9CA6B2]"><IconX size={20} /></button>
        <div className="flex items-center gap-[10px]"><div className="flex size-[34px] items-center justify-center rounded-[10px] bg-[#3B82F6]/20 text-[#60A5FA]"><IconFileDescription size={20} /></div><h2 className="text-[18px] font-semibold">{reviewCopy.reviewTitle}</h2></div>
        <p className="mt-[10px] text-[11px] text-[#9CA6B2]">{reviewCopy.reviewDescription}</p>
        <p className="mt-[12px] text-[9px] text-[#7F8996]">Selecionar ✓ &nbsp;•&nbsp; Analisar ✓ &nbsp;•&nbsp; <span className="text-[#60A5FA]">Revisar ●</span> &nbsp;•&nbsp; Importar</p>
        <div className="mt-[14px] grid grid-cols-6 gap-[8px] rounded-[12px] border border-[#28313B] bg-[#080B0F]/40 p-[10px] text-[9px]"><span>{copy.found}: <strong>{drafts.length}</strong></span><span>{copy.statusReady}: <strong>{drafts.length - invalidCount - duplicateIds.size}</strong></span><span>{copy.errors}: <strong>{invalidCount}</strong></span><span>{reviewCopy.duplicate}: <strong>{duplicateIds.size}</strong></span><span>{reviewCopy.selected}: <strong>{selectedDrafts.length}</strong></span><span>{copy.total}: <strong>{money(selectedIncome + selectedExpense)}</strong></span></div>
        <div className="mt-[10px] flex justify-between"><div className="flex gap-[8px]"><button type="button" onClick={() => setSelectedIds(new Set(drafts.filter((draft) => draft.errors.length === 0 && !duplicateIds.has(draft.id)).map((draft) => draft.id)))} className="rounded-[15px] border border-[#28313B] px-[12px] py-[6px] text-[9px] text-[#60A5FA]">{reviewCopy.selectValid}</button><button type="button" onClick={() => setSelectedIds(new Set())} className="rounded-[15px] border border-[#28313B] px-[12px] py-[6px] text-[9px] text-[#9CA6B2]">{reviewCopy.clear}</button></div><div className="text-[9px] text-[#9CA6B2]">{copy.income}: <strong className="text-[#22C55E]">{money(selectedIncome)}</strong> · {copy.expenses}: <strong className="text-[#F43F5E]">{money(selectedExpense)}</strong></div></div>
        <div className="mt-[10px] max-h-[430px] overflow-auto rounded-[12px] border border-[#28313B]"><div className="sticky top-0 z-10 grid h-[30px] grid-cols-[34px_120px_230px_155px_110px_120px_1fr] items-center bg-[#19212C] px-[10px] text-[8px] font-semibold text-[#7F8996]"><span></span><span>{csvText.date}</span><span>{csvText.description}</span><span>{csvText.category}</span><span>{csvText.type}</span><span>{csvText.value}</span><span>{csvText.status}</span></div>{drafts.map((draft) => <div key={draft.id} className="grid min-h-[48px] grid-cols-[34px_120px_230px_155px_110px_120px_1fr] items-center border-t border-[#28313B]/70 px-[10px] text-[8.5px]"><input type="checkbox" checked={selectedIds.has(draft.id)} disabled={draft.errors.length > 0} onChange={(event) => setSelectedIds((current) => { const next = new Set(current); if (event.target.checked) next.add(draft.id); else next.delete(draft.id); return next; })} className="accent-[#3B82F6]" /><input type="date" value={draft.dateISO ?? ""} onChange={(event) => updateDraft(draft.id, { dateISO: event.target.value || null })} className="mr-[8px] rounded bg-[#080B0F] px-[5px] py-[6px] text-[#D7DCE2]" /><input value={draft.description} onChange={(event) => updateDraft(draft.id, { description: event.target.value })} className="mr-[8px] rounded bg-[#080B0F] px-[6px] py-[6px]" /><input value={draft.category} onChange={(event) => updateDraft(draft.id, { category: event.target.value })} className="mr-[8px] rounded bg-[#080B0F] px-[6px] py-[6px]" /><select value={draft.type ?? ""} onChange={(event) => updateDraft(draft.id, { type: event.target.value ? event.target.value as TransactionType : null })} className="mr-[8px] rounded bg-[#080B0F] px-[5px] py-[6px]"><option value="">—</option><option value="expense">{csvText.expense}</option><option value="income">{csvText.income}</option></select><input type="number" min="0.01" step="0.01" value={draft.amount ?? ""} onChange={(event) => updateDraft(draft.id, { amount: parseCsvEditableAmountText(event.target.value) })} className="mr-[8px] rounded bg-[#080B0F] px-[6px] py-[6px]" /><span className={draft.errors.length || duplicateIds.has(draft.id) ? "text-[#F59E0B]" : "text-[#22C55E]"}>{draft.errors.length ? `${copy.statusReview}: ${draft.errors.join(", ")}` : duplicateIds.has(draft.id) ? reviewCopy.duplicate : copy.statusReady}</span></div>)}</div>
        <div className="mt-[16px] grid grid-cols-2 gap-[10px]"><button type="button" onClick={onClose} disabled={isImporting} className="h-[42px] rounded-[21px] border border-[#28313B] text-[11px] font-semibold text-[#9CA6B2] disabled:cursor-not-allowed disabled:opacity-40">{copy.cancel}</button><button type="button" disabled={selectedDrafts.length === 0 || isImporting} onClick={() => void finishImport()} className="h-[42px] rounded-[21px] bg-[#3B82F6] text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-40">{isImporting ? (language === "pt" ? "Importando…" : language === "es" ? "Importando…" : language === "de" ? "Wird importiert…" : language === "fr" ? "Importation…" : language === "nl" ? "Wordt geïmporteerd…" : language === "it" ? "Importazione…" : "Importing…") : csvText.importCount(selectedDrafts.length)}</button></div>
      </div>
    </div>
  );

  if (stage === "complete") return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#080B0F]/65 backdrop-blur-sm"><div className="relative w-[620px] rounded-[26px] border border-[#28313B] bg-[#0D1117]/95 p-[26px] shadow-2xl"><h2 className="text-[18px] font-semibold">{reviewCopy.complete}</h2><p className="mt-[12px] text-[9px] text-[#22C55E]">{csvText.steps}</p><p className="mt-[14px] text-[11px] text-[#9CA6B2]">{completed.count} {csvText.added}</p><div className="mt-[20px] grid grid-cols-5 gap-[10px] rounded-[14px] border border-[#28313B] bg-[#080B0F]/40 p-[16px] text-[10px]"><span>{copy.total}: <strong>{completed.count}</strong></span><span>{copy.income}: <strong className="text-[#22C55E]">{money(completed.income)}</strong></span><span>{copy.expenses}: <strong className="text-[#F43F5E]">{money(completed.expense)}</strong></span><span>{reviewCopy.duplicate}: <strong>{completed.duplicates}</strong></span><span>{copy.errors}: <strong>{completed.errors}</strong></span></div><button type="button" onClick={onClose} className="mt-[18px] h-[42px] w-full rounded-[21px] bg-[#3B82F6] text-[11px] font-semibold">{reviewCopy.view}</button></div></div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#080B0F]/65 p-4 backdrop-blur-sm">
      <div className="relative my-auto max-h-[calc(100dvh-32px)] w-full max-w-[820px] overflow-y-auto rounded-[26px] border border-[#28313B] bg-[#0D1117]/95 p-5 shadow-2xl min-[768px]:p-[26px]">
        <button type="button" onClick={onClose} aria-label={copy.cancel} className="absolute right-[18px] top-[18px] text-[#9CA6B2]"><IconX size={20} /></button>
        <div className="flex items-center gap-[10px]"><div className="flex size-[34px] items-center justify-center rounded-[10px] bg-[#3B82F6]/20 text-[#60A5FA]"><IconFileDescription size={20} /></div><h2 className="text-[18px] font-semibold">{copy.title}</h2></div>
        <p className="mt-[10px] text-[11px] text-[#9CA6B2]">{copy.description}</p>
        <div className="mt-[14px] grid grid-cols-4 text-[9px]"><span className="font-semibold text-[#60A5FA]">● Selecionar</span><span className="text-[#64707D]">○ Analisar</span><span className="text-[#64707D]">○ Revisar</span><span className="text-[#64707D]">○ Importar</span></div>
        <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={(event) => void selectFile(event.target.files?.[0])} className="hidden" />
        <button type="button" onClick={() => inputRef.current?.click()} className="mt-[18px] flex h-[42px] w-full items-center justify-center gap-[8px] rounded-[21px] border border-[#28313B] bg-[#080B0F]/60 text-[11px] font-semibold text-[#60A5FA]"><IconUpload size={17} />{copy.choose}</button>
        <p className="mt-[8px] text-[8.5px] text-[#64707D]">{copy.privacy}</p>
        {error && <p role="alert" className="mt-[10px] text-[10px] text-[#F43F5E]">{error}</p>}
        {file && <div className="mt-[14px]"><div className="flex items-center justify-between text-[10px]"><strong>{file.name}</strong><span className="text-[#9CA6B2]">{(file.size / 1024).toFixed(1)} KB</span></div><div className="mt-[10px] grid grid-cols-5 gap-[8px] rounded-[12px] border border-[#28313B] bg-[#080B0F]/40 p-[10px] text-[9px]"><span>{copy.found}: <strong>{drafts.length}</strong></span><span>{copy.errors}: <strong>{invalidCount}</strong></span><span>{copy.income}: <strong>{money(incomeTotal)}</strong></span><span>{copy.expenses}: <strong>{money(expenseTotal)}</strong></span><span>{copy.total}: <strong>{drafts.length}</strong></span></div>
          <div className="mt-[10px] overflow-hidden rounded-[12px] border border-[#28313B]"><div className="grid h-[28px] grid-cols-[92px_180px_130px_82px_110px_126px] items-center bg-[#19212C]/70 px-[10px] text-[8px] font-semibold text-[#7F8996]"><span>{csvText.date}</span><span>{csvText.description}</span><span>{csvText.category}</span><span>{csvText.type}</span><span>{csvText.value}</span><span>{csvText.status}</span></div>{drafts.slice(0, 5).map((draft) => <div key={draft.id} className="grid h-[32px] grid-cols-[92px_180px_130px_82px_110px_126px] items-center border-t border-[#28313B]/70 px-[10px] text-[8.5px]"><span className="text-[#9CA6B2]">{draft.dateISO ?? draft.rawDate}</span><strong className="truncate pr-[8px]">{draft.description || "—"}</strong><span className="truncate pr-[8px] text-[#9CA6B2]">{draft.category}</span><span>{draft.type ?? "—"}</span><span>{draft.amount === null ? "—" : money(draft.amount)}</span><span className={draft.errors.length ? "text-[#F59E0B]" : "text-[#22C55E]"}>{draft.errors.length ? `${copy.statusReview}: ${draft.errors.join(", ")}` : copy.statusReady}</span></div>)}</div>
          <div className="mt-[16px] grid grid-cols-2 gap-[10px]"><button type="button" onClick={onClose} className="h-[42px] rounded-[21px] border border-[#28313B] text-[11px] font-semibold text-[#9CA6B2]">{copy.cancel}</button><button type="button" onClick={() => setStage("review")} className="h-[42px] rounded-[21px] bg-[#3B82F6] text-[11px] font-semibold">{copy.review}</button></div></div>}
      </div>
    </div>
  );
}
