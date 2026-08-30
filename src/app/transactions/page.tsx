"use client";

import { useCurrency } from "@/components/CurrencyProvider";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { IconCircleCheck, IconFileDescription, IconLoader2, IconShieldCheck, IconUpload, IconWallet, IconX } from "@tabler/icons-react";

import { DesktopScaleCanvas } from "@/components/DesktopScaleCanvas";
import { DashboardToast, type DashboardToastState } from "@/components/dashboard/DashboardToast";
import { TransactionDecisionCards } from "@/components/transactions/TransactionDecisionCards";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { TransactionsKpiCards } from "@/components/transactions/TransactionsKpiCards";
import { TransactionsTable } from "@/components/transactions/TransactionsTable";
import { type Transaction, type TransactionType } from "@/components/transactions/transaction-model";
import { parseTransactionCsv, validateImportedDraft, type ImportedTransactionDraft } from "@/components/transactions/csv-import";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";
import { useFinanceData } from "@/components/FinanceDataProvider";

const iconRoot = "/moneypilot/transactions/icons";

type TransactionInput = {
  description: string;
  amount: number;
  category: string;
  type: TransactionType;
};

type TransactionModalState =
  | { mode: "create" }
  | { mode: "edit"; transaction: Transaction; focusCategory: boolean };

function formatTransactionDate(date: Date, months: readonly string[]) {
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export default function TransactionsPage() {
  const { language } = useLanguage();
  const t = translations[language].appTransactions;
  const months = translations[language].financialFlow.months;
  const { transactions, mutationState, createTransaction, importTransactions, updateTransaction, deleteTransaction } = useFinanceData();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState("2026-08");
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
  const monthOptions = useMemo(() => Array.from(new Set(transactions.map((item) => item.dateISO.slice(0, 7)))).sort().reverse().map((value) => { const [year, month] = value.split("-"); return { value, label: `${months[Number(month) - 1]} ${year}` }; }), [months, transactions]);
  const categoryOptions = useMemo(() => [{ value: "all", label: t.filters[1] }, ...Array.from(new Set(transactions.map((item) => item.category))).sort().map((value) => ({ value, label: value }))], [t.filters, transactions]);
  const paymentOptions = useMemo(() => [{ value: "all", label: t.filters[2] }, ...Array.from(new Set(transactions.map((item) => item.payment))).sort().map((value) => ({ value, label: value }))], [t.filters, transactions]);
  const originOptions = useMemo(() => [{ value: "all", label: t.filters[3] }, ...Array.from(new Set(transactions.map((item) => item.origin))).sort().map((value) => ({ value, label: value }))], [t.filters, transactions]);
  const secondaryCopy = { en: { oldest: "Oldest", import: "Import statement" }, pt: { oldest: "Mais antigas", import: "Importar extrato" }, es: { oldest: "Más antiguas", import: "Importar extracto" }, de: { oldest: "Älteste", import: "Kontoauszug importieren" }, fr: { oldest: "Plus anciennes", import: "Importer un relevé" }, nl: { oldest: "Oudste", import: "Afschrift importeren" }, it: { oldest: "Meno recenti", import: "Importa estratto conto" } }[language];
  const sortOptions = [{ value: "newest", label: t.filters[4] }, { value: "oldest", label: secondaryCopy.oldest }];
  const filteredTransactions = useMemo(() => transactions
    .filter((item) => `${item.description} ${item.category}`.toLowerCase().includes(query.toLowerCase()))
    .filter((item) => item.dateISO.startsWith(selectedMonth))
    .filter((item) => selectedCategory === "all" || item.category === selectedCategory)
    .filter((item) => selectedPayment === "all" || item.payment === selectedPayment)
    .filter((item) => selectedOrigin === "all" || item.origin === selectedOrigin)
    .sort((a, b) => sortOrder === "newest" ? b.dateISO.localeCompare(a.dateISO) : a.dateISO.localeCompare(b.dateISO)), [query, selectedCategory, selectedMonth, selectedOrigin, selectedPayment, sortOrder, transactions]);
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function resetPageAnd(action: () => void) {
    action();
    setPage(1);
  }

  async function addTransaction(input: TransactionInput) {
    const now = new Date();
    const transaction: Transaction = {
      id: crypto.randomUUID(),
      description: input.description,
      category: input.category,
      categoryColor: "#64707D",
      payment: t.labels.card,
      date: formatTransactionDate(now, months),
      dateISO: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
      origin: t.labels.manual,
      type: input.type,
      amount: input.amount,
    };

    await createTransaction(transaction);
    setPage(1);
    setToast({ id: crypto.randomUUID(), tone: "success", title: mutationCopy.added });
  }

  async function saveTransaction(transaction: Transaction, input: TransactionInput) {
    await updateTransaction({ ...transaction, description: input.description, category: input.category, type: input.type, amount: input.amount });
    setPage(1);
    setToast({ id: crypto.randomUUID(), tone: "success", title: mutationCopy.updated });
  }

  async function removeTransaction(id: string) {
    await deleteTransaction(id);
    setPage(1);
    setTransactionToDelete(null);
    setToast({ id: crypto.randomUUID(), tone: "success", title: mutationCopy.deleted });
  }

  const isCreating = mutationState.status === "saving" && mutationState.operation === "createTransaction";
  const isUpdating = mutationState.status === "saving" && mutationState.operation === "updateTransaction";
  const isDeleting = mutationState.status === "saving" && mutationState.operation === "deleteTransaction";

  return (
    <div className="relative min-h-screen bg-[#080B0F]">
      <div className="relative z-10">
        <DesktopScaleCanvas>
          <main className="relative h-[1024px] w-[1536px] overflow-hidden text-[#F5F7FA]">
            <section className="absolute left-[231px] top-[107px] h-[810px] w-[1164px] overflow-hidden rounded-[38px] border border-[#28313B]/16 bg-[#0D1117]/50 px-[32px] py-[16px] shadow-[0_22px_42px_rgba(0,0,0,0.45)] backdrop-blur-[20px]">
              <div className="relative h-[776px] w-full overflow-hidden">
                <div className="absolute left-0 top-0 flex h-[38px] w-[1090px] items-center justify-between">
                  <div className="flex items-center gap-[18px]">
                    <div className="h-[37px] w-[37px] overflow-hidden"><Image src="/moneypilot/moneypilot-logo.svg" alt="" width={180} height={40} priority className="h-[37px] w-auto max-w-none" /></div>
                    <span className="money-pilot-wordmark font-brand text-[21.44px] font-medium tracking-[0.429px]">MoneyPilot</span>
                  </div>
                  <span className="w-[130px] text-right text-[9px] font-semibold text-[#64707D]">{t.eyebrow}</span>
                </div>

                <header className="absolute left-0 top-[50px] flex h-[56px] w-[1090px] items-center justify-between py-[2px]">
                  <div className="flex flex-col gap-[8px]">
                    <h1 className="text-[23px] font-semibold leading-none">{t.title}</h1>
                    <p className="text-[13px] text-[#9CA6B2]">{t.description}</p>
                  </div>
                  <div className="flex w-[700px] items-center justify-end gap-[8px]">
                    <label className="flex h-[36px] w-[267px] items-center gap-[12px] rounded-[19px] border border-[#28313B] bg-[#080B0F]/35 px-[14px] text-[#9CA6B2]">
                      <Image src={`${iconRoot}/search-outline.svg`} alt="" width={20} height={20} className="size-[20px]" />
                      <input value={query} onChange={(event) => resetPageAnd(() => setQuery(event.target.value))} aria-label={t.search} placeholder={t.search} className="w-full bg-transparent text-[10px] outline-none placeholder:text-[#9CA6B2]" />
                    </label>
                    <label className="relative flex h-[36px] w-[103px] cursor-pointer items-center justify-center gap-[12px] rounded-[19px] border border-[#28313B] bg-[#080B0F]/35 text-[10px] font-medium text-[#9CA6B2]">
                      <Image src={`${iconRoot}/calendar-outline.svg`} alt="" width={20} height={20} className="size-[20px]" /><span>{t.month}</span>
                      <select value={selectedMonth} onChange={(event) => resetPageAnd(() => setSelectedMonth(event.target.value))} aria-label={t.month} className="absolute inset-0 cursor-pointer opacity-0">{monthOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                    </label>
                    <button type="button" onClick={() => setImportOpen(true)} className="flex h-[36px] w-[111px] items-center justify-center gap-[7px] rounded-[19px] border border-[#28313B] bg-[#080B0F]/35 text-[9px] font-medium text-[#9CA6B2]"><IconUpload size={16} /><span>{secondaryCopy.import}</span></button>
                    <button type="button" onClick={() => setTransactionModal({ mode: "create" })} className="flex h-[36px] w-[139px] items-center justify-center gap-[10px] rounded-[19px] bg-[#3B82F6] text-[10px] font-semibold">
                      <span>{t.newTransaction}</span><Image src={`${iconRoot}/add-circle-outline.svg`} alt="" width={19} height={19} className="size-[19px]" />
                    </button>
                    <Image src="/moneypilot/dashboard-avatar.png" alt={t.avatar} width={48} height={48} className="size-[48px] rounded-full" />
                  </div>
                </header>

                <TransactionsKpiCards transactions={transactions} selectedMonth={selectedMonth} />
                <TransactionFilters values={[selectedMonth, selectedCategory, selectedPayment, selectedOrigin, sortOrder]} options={[monthOptions, categoryOptions, paymentOptions, originOptions, sortOptions]} onChange={(index, value) => resetPageAnd(() => { if (index === 0) setSelectedMonth(value); if (index === 1) setSelectedCategory(value); if (index === 2) setSelectedPayment(value); if (index === 3) setSelectedOrigin(value); if (index === 4) setSortOrder(value); })} />
                <TransactionsTable transactions={paginatedTransactions} totalItems={filteredTransactions.length} pageSize={pageSize} page={currentPage} onPageChange={setPage} onEdit={(transaction, focusCategory = false) => setTransactionModal({ mode: "edit", transaction, focusCategory })} onDelete={setTransactionToDelete} />
                <TransactionDecisionCards transactions={transactions} onShowRelated={() => resetPageAnd(() => setQuery(t.labels.supermarket))} />
              </div>
            </section>

            {transactionModal && <TransactionModal transaction={transactionModal.mode === "edit" ? transactionModal.transaction : undefined} focusCategory={transactionModal.mode === "edit" && transactionModal.focusCategory} saving={transactionModal.mode === "edit" ? isUpdating : isCreating} onSubmit={(input) => transactionModal.mode === "edit" ? saveTransaction(transactionModal.transaction, input) : addTransaction(input)} onClose={() => setTransactionModal(null)} />}
            {transactionToDelete && <DeleteTransactionModal transaction={transactionToDelete} saving={isDeleting} onCancel={() => setTransactionToDelete(null)} onDelete={() => removeTransaction(transactionToDelete.id)} />}
            {importOpen && <ImportStatementModal existingTransactions={transactions} onImport={importTransactions} onClose={() => setImportOpen(false)} />}
            {toast && <DashboardToast toast={toast} onClose={() => setToast(null)} />}
          </main>
        </DesktopScaleCanvas>
      </div>
    </div>
  );
}

function parseTransactionAmount(value: string) {
  const compact = value.trim().replace(/(?:R\$|€|£|\$|EUR|GBP|USD|BRL|\s)/gi, "");
  if (!compact) return null;

  const comma = compact.lastIndexOf(",");
  const dot = compact.lastIndexOf(".");
  const decimalSeparator = comma > dot ? "," : ".";
  const thousandsSeparator = decimalSeparator === "," ? "." : ",";
  const normalized = compact.includes(decimalSeparator)
    ? compact.replaceAll(thousandsSeparator, "").replace(decimalSeparator, ".")
    : compact;

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function TransactionModal({ transaction, focusCategory, saving, onSubmit, onClose }: { transaction?: Transaction; focusCategory: boolean; saving: boolean; onSubmit: (input: TransactionInput) => Promise<void>; onClose: () => void }) {
  const { language } = useLanguage();
  const t = translations[language].appTransactions;
  const isEditing = Boolean(transaction);
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : "");
  const [category, setCategory] = useState(transaction?.category ?? "");
  const [type, setType] = useState<TransactionType>(transaction?.type ?? "expense");
  const [error, setError] = useState("");
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

  async function submitTransaction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedDescription = description.trim();
    const trimmedCategory = category.trim();
    const parsedAmount = parseTransactionAmount(amount);

    if (!trimmedDescription || !trimmedCategory || parsedAmount === null) {
      setError(language === "pt" ? "Preencha descrição, valor válido e categoria." : language === "es" ? "Completa descripción, importe válido y categoría." : language === "de" ? "Gib Beschreibung, gültigen Betrag und Kategorie ein." : language === "fr" ? "Saisissez une description, un montant valide et une catégorie." : language === "nl" ? "Voer een beschrijving, geldig bedrag en categorie in." : language === "it" ? "Inserisci descrizione, importo valido e categoria." : "Enter a description, valid amount, and category.");
      return;
    }

    try {
      await onSubmit({ description: trimmedDescription, amount: parsedAmount, category: trimmedCategory, type });
      setError("");
      onClose();
    } catch {
      setError(isEditing ? mutationCopy.updateError : mutationCopy.createError);
    }
  }

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#080B0F]/65 backdrop-blur-sm">
      <div className="relative w-[420px] rounded-[26px] border border-[#28313B] bg-[#0D1117]/95 p-[26px] shadow-2xl">
        <button type="button" onClick={onClose} aria-label={t.close} className="absolute right-[18px] top-[18px] text-[#9CA6B2]"><IconX size={20} /></button>
        <div className="flex items-center gap-[10px]"><div className="flex size-[34px] items-center justify-center rounded-[10px] bg-[#3B82F6]/20 text-[#60A5FA]"><IconWallet size={20} /></div><h2 className="text-[18px] font-semibold">{isEditing ? editCopy.title : t.newTransaction}</h2></div>
        <p className="mt-[10px] text-[11px] text-[#9CA6B2]">{isEditing ? editCopy.description : t.modalDescription}</p>
        <form onSubmit={submitTransaction} className="mt-[20px] grid gap-[10px]">
          <div className="flex h-[36px] w-full items-center rounded-[19px] border border-[#28313B] bg-[#080B0F]/60 p-[3px]">{(["expense", "income"] as const).map((option) => <button key={option} type="button" onClick={() => setType(option)} aria-pressed={type === option} className={`flex h-[28px] flex-1 items-center justify-center rounded-[16px] text-[10px] font-semibold ${type === option ? "bg-[#3B82F6] text-white" : "text-[#9CA6B2]"}`}>{typeCopy[option]}</button>)}</div>
          <input value={description} onChange={(event) => { setDescription(event.target.value); setError(""); }} placeholder={t.descriptionField} className="h-[42px] rounded-[12px] border border-[#28313B] bg-[#080B0F]/60 px-[14px] text-[11px] outline-none" />
          <div className="grid grid-cols-2 gap-[10px]"><input value={amount} onChange={(event) => { setAmount(event.target.value); setError(""); }} inputMode="decimal" placeholder={t.value} className="h-[42px] rounded-[12px] border border-[#28313B] bg-[#080B0F]/60 px-[14px] text-[11px] outline-none" /><input autoFocus={focusCategory} value={category} onChange={(event) => { setCategory(event.target.value); setError(""); }} placeholder={t.category} className="h-[42px] rounded-[12px] border border-[#28313B] bg-[#080B0F]/60 px-[14px] text-[11px] outline-none" /></div>
          {error && <p role="alert" className="text-[9px] text-[#F43F5E]">{error}</p>}
          <button type="submit" disabled={saving} className="mt-[6px] h-[42px] rounded-[21px] bg-[#3B82F6] text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-60">{saving ? isEditing ? mutationCopy.updating : mutationCopy.saving : isEditing ? editCopy.submit : t.addTransaction}</button>
        </form>
      </div>
    </div>
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
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#080B0F]/65 backdrop-blur-sm">
      <div className="relative w-[420px] rounded-[26px] border border-[#28313B] bg-[#0D1117]/95 p-[26px] shadow-2xl">
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

function ImportStatementModal({ existingTransactions, onImport, onClose }: { existingTransactions: Transaction[]; onImport: (transactions: Transaction[]) => Promise<Transaction[]>; onClose: () => void }) {
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
    const imported = selectedDrafts.flatMap((draft): Transaction[] => {
      if (!draft.dateISO || !draft.type || draft.amount === null) return [];
      const category = draft.category.trim() || "Sem categoria";
      const knownCategory = existingTransactions.find((transaction) => normalizeImportedDescription(transaction.category) === normalizeImportedDescription(category));
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
      <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#02060A]/68 backdrop-blur-[2px]">
        <div className="relative h-[600px] w-[560px] rounded-[24px] border border-[#28313B] bg-[#0D1117]/98 p-[23px] shadow-[0_24px_24px_rgba(0,0,0,0.48)]">
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
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#080B0F]/65 backdrop-blur-sm">
      <div className="relative w-[1120px] rounded-[26px] border border-[#28313B] bg-[#0D1117]/95 p-[26px] shadow-2xl">
        <button type="button" onClick={onClose} aria-label={copy.cancel} className="absolute right-[18px] top-[18px] text-[#9CA6B2]"><IconX size={20} /></button>
        <div className="flex items-center gap-[10px]"><div className="flex size-[34px] items-center justify-center rounded-[10px] bg-[#3B82F6]/20 text-[#60A5FA]"><IconFileDescription size={20} /></div><h2 className="text-[18px] font-semibold">{reviewCopy.reviewTitle}</h2></div>
        <p className="mt-[10px] text-[11px] text-[#9CA6B2]">{reviewCopy.reviewDescription}</p>
        <p className="mt-[12px] text-[9px] text-[#7F8996]">Selecionar ✓ &nbsp;•&nbsp; Analisar ✓ &nbsp;•&nbsp; <span className="text-[#60A5FA]">Revisar ●</span> &nbsp;•&nbsp; Importar</p>
        <div className="mt-[14px] grid grid-cols-6 gap-[8px] rounded-[12px] border border-[#28313B] bg-[#080B0F]/40 p-[10px] text-[9px]"><span>{copy.found}: <strong>{drafts.length}</strong></span><span>{copy.statusReady}: <strong>{drafts.length - invalidCount - duplicateIds.size}</strong></span><span>{copy.errors}: <strong>{invalidCount}</strong></span><span>{reviewCopy.duplicate}: <strong>{duplicateIds.size}</strong></span><span>{reviewCopy.selected}: <strong>{selectedDrafts.length}</strong></span><span>{copy.total}: <strong>{money(selectedIncome + selectedExpense)}</strong></span></div>
        <div className="mt-[10px] flex justify-between"><div className="flex gap-[8px]"><button type="button" onClick={() => setSelectedIds(new Set(drafts.filter((draft) => draft.errors.length === 0 && !duplicateIds.has(draft.id)).map((draft) => draft.id)))} className="rounded-[15px] border border-[#28313B] px-[12px] py-[6px] text-[9px] text-[#60A5FA]">{reviewCopy.selectValid}</button><button type="button" onClick={() => setSelectedIds(new Set())} className="rounded-[15px] border border-[#28313B] px-[12px] py-[6px] text-[9px] text-[#9CA6B2]">{reviewCopy.clear}</button></div><div className="text-[9px] text-[#9CA6B2]">{copy.income}: <strong className="text-[#22C55E]">{money(selectedIncome)}</strong> · {copy.expenses}: <strong className="text-[#F43F5E]">{money(selectedExpense)}</strong></div></div>
        <div className="mt-[10px] max-h-[430px] overflow-auto rounded-[12px] border border-[#28313B]"><div className="sticky top-0 z-10 grid h-[30px] grid-cols-[34px_120px_230px_155px_110px_120px_1fr] items-center bg-[#19212C] px-[10px] text-[8px] font-semibold text-[#7F8996]"><span></span><span>{csvText.date}</span><span>{csvText.description}</span><span>{csvText.category}</span><span>{csvText.type}</span><span>{csvText.value}</span><span>{csvText.status}</span></div>{drafts.map((draft) => <div key={draft.id} className="grid min-h-[48px] grid-cols-[34px_120px_230px_155px_110px_120px_1fr] items-center border-t border-[#28313B]/70 px-[10px] text-[8.5px]"><input type="checkbox" checked={selectedIds.has(draft.id)} disabled={draft.errors.length > 0} onChange={(event) => setSelectedIds((current) => { const next = new Set(current); if (event.target.checked) next.add(draft.id); else next.delete(draft.id); return next; })} className="accent-[#3B82F6]" /><input type="date" value={draft.dateISO ?? ""} onChange={(event) => updateDraft(draft.id, { dateISO: event.target.value || null })} className="mr-[8px] rounded bg-[#080B0F] px-[5px] py-[6px] text-[#D7DCE2]" /><input value={draft.description} onChange={(event) => updateDraft(draft.id, { description: event.target.value })} className="mr-[8px] rounded bg-[#080B0F] px-[6px] py-[6px]" /><input value={draft.category} onChange={(event) => updateDraft(draft.id, { category: event.target.value })} className="mr-[8px] rounded bg-[#080B0F] px-[6px] py-[6px]" /><select value={draft.type ?? ""} onChange={(event) => updateDraft(draft.id, { type: event.target.value ? event.target.value as TransactionType : null })} className="mr-[8px] rounded bg-[#080B0F] px-[5px] py-[6px]"><option value="">—</option><option value="expense">{csvText.expense}</option><option value="income">{csvText.income}</option></select><input type="number" min="0.01" step="0.01" value={draft.amount ?? ""} onChange={(event) => updateDraft(draft.id, { amount: event.target.value ? Number(event.target.value) : null })} className="mr-[8px] rounded bg-[#080B0F] px-[6px] py-[6px]" /><span className={draft.errors.length || duplicateIds.has(draft.id) ? "text-[#F59E0B]" : "text-[#22C55E]"}>{draft.errors.length ? `${copy.statusReview}: ${draft.errors.join(", ")}` : duplicateIds.has(draft.id) ? reviewCopy.duplicate : copy.statusReady}</span></div>)}</div>
        <div className="mt-[16px] grid grid-cols-2 gap-[10px]"><button type="button" onClick={onClose} disabled={isImporting} className="h-[42px] rounded-[21px] border border-[#28313B] text-[11px] font-semibold text-[#9CA6B2] disabled:cursor-not-allowed disabled:opacity-40">{copy.cancel}</button><button type="button" disabled={selectedDrafts.length === 0 || isImporting} onClick={() => void finishImport()} className="h-[42px] rounded-[21px] bg-[#3B82F6] text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-40">{isImporting ? (language === "pt" ? "Importando…" : language === "es" ? "Importando…" : language === "de" ? "Wird importiert…" : language === "fr" ? "Importation…" : language === "nl" ? "Wordt geïmporteerd…" : language === "it" ? "Importazione…" : "Importing…") : csvText.importCount(selectedDrafts.length)}</button></div>
      </div>
    </div>
  );

  if (stage === "complete") return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#080B0F]/65 backdrop-blur-sm"><div className="relative w-[620px] rounded-[26px] border border-[#28313B] bg-[#0D1117]/95 p-[26px] shadow-2xl"><h2 className="text-[18px] font-semibold">{reviewCopy.complete}</h2><p className="mt-[12px] text-[9px] text-[#22C55E]">{csvText.steps}</p><p className="mt-[14px] text-[11px] text-[#9CA6B2]">{completed.count} {csvText.added}</p><div className="mt-[20px] grid grid-cols-5 gap-[10px] rounded-[14px] border border-[#28313B] bg-[#080B0F]/40 p-[16px] text-[10px]"><span>{copy.total}: <strong>{completed.count}</strong></span><span>{copy.income}: <strong className="text-[#22C55E]">{money(completed.income)}</strong></span><span>{copy.expenses}: <strong className="text-[#F43F5E]">{money(completed.expense)}</strong></span><span>{reviewCopy.duplicate}: <strong>{completed.duplicates}</strong></span><span>{copy.errors}: <strong>{completed.errors}</strong></span></div><button type="button" onClick={onClose} className="mt-[18px] h-[42px] w-full rounded-[21px] bg-[#3B82F6] text-[11px] font-semibold">{reviewCopy.view}</button></div></div>
  );

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#080B0F]/65 backdrop-blur-sm">
      <div className="relative w-[820px] rounded-[26px] border border-[#28313B] bg-[#0D1117]/95 p-[26px] shadow-2xl">
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
