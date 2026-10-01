"use client";
import { useEffect, useLayoutEffect, useId, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { IconCircleCheck, IconLoader2, IconX } from "@tabler/icons-react";
import { useCurrency } from "@/components/CurrencyProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";
import { getCsvImportCopy, csvImportLabels } from "@/i18n/csv-import-copy";
import { validateImportedDraft, type ImportedTransactionDraft } from "./csv-import";
import type { Transaction, TransactionType, LegacyTransactionCreateInput } from "./transaction-model";
import { parseCsvEditableAmountText } from "@/lib/domain/financial-input-adapters";
import { analyseCsvFile } from "./csv-analysis";
import styles from "./ImportStatementModal.module.css";

import { areFinanceResourcesReady, type FinanceResourceStatuses } from "@/lib/persistence/finance-resource-status";
import { transactionAvailabilityCopy } from "./transactions-view-state";

const MAX_CSV_SIZE = 5 * 1024 * 1024;

function normalizeImportedDescription(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function importSignature(item: Pick<Transaction, "dateISO" | "description" | "type" | "amount"> | ImportedTransactionDraft) {
  if (!item.dateISO || !item.description.trim() || !item.type || item.amount === null || item.amount <= 0) return null;
  return `${item.dateISO}|${normalizeImportedDescription(item.description)}|${item.type}|${item.amount.toFixed(2)}`;
}

export function ImportStatementModal({ existingTransactions, resourceStatuses, onImport, onClose }: { existingTransactions: Transaction[]; resourceStatuses: FinanceResourceStatuses; onImport: (transactions: LegacyTransactionCreateInput[]) => Promise<Transaction[]>; onClose: () => void }) {
  const { language } = useLanguage();
  const { formatMoney: money } = useCurrency();
  const labels = csvImportLabels[language];
  const dialogRef = useRef<HTMLDialogElement>(null);
  const analysisRef = useRef<AbortController | null>(null);
  const savingRef = useRef(false);
  const titleId = useId();
  useEffect(() => {
    const dialog = dialogRef.current!;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      analysisRef.current?.abort();
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);
  function close() {
    if (savingRef.current) return;
    analysisRef.current?.abort();
    onClose();
  }
  function back() {
    if (savingRef.current) return;
    analysisRef.current?.abort();
    setStage("select");
    setError("");
  }
  const months = translations[language].financialFlow.months;
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drafts, setDrafts] = useState<ImportedTransactionDraft[]>([]);
  const [error, setError] = useState("");
  const [stage, setStage] = useState<"select" | "analysing" | "review" | "success">("select");
  const [analysisStep, setAnalysisStep] = useState(0);
  const [detectedLines, setDetectedLines] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [completed, setCompleted] = useState({ count: 0, income: 0, expense: 0, duplicates: 0, errors: 0 });
  const [isImporting, setIsImporting] = useState(false);
  const [reviewPage, setReviewPage] = useState(0);
  const historyReady = areFinanceResourcesReady(resourceStatuses, ["transactions"]);
  const historyStatus = resourceStatuses.transactions;
  const latestHistory = useRef({ status: historyStatus, transactions: existingTransactions });
  useLayoutEffect(() => { latestHistory.current = { status: historyStatus, transactions: existingTransactions }; }, [historyStatus, existingTransactions]);
  // Approval belongs to the exact successfully hydrated comparison snapshot.
  const [selectionBasis, setSelectionBasis] = useState({ status: historyStatus, transactions: existingTransactions });
  const selectionCurrent = selectionBasis.status === historyStatus && selectionBasis.transactions === existingTransactions;
  if (!selectionCurrent) {
    setSelectionBasis({ status: historyStatus, transactions: existingTransactions });
    setSelectedIds(new Set());
  }
  function hasCurrentHistory() {
    return historyReady && latestHistory.current.status === historyStatus && latestHistory.current.transactions === existingTransactions;
  }
  function selectRows(value: Set<string> | ((current: Set<string>) => Set<string>)) {
    if (hasCurrentHistory()) setSelectedIds(value);
  }
  const historyMessage = historyStatus.status === "loading" ? transactionAvailabilityCopy[language].loading : transactionAvailabilityCopy[language].error;
  const pageCount = Math.max(1, Math.ceil(drafts.length / 50));
  const { copy, reviewCopy, analysisCopy, csvText } = getCsvImportCopy(language);
  const duplicateIds = useMemo(() => {
    if (!areFinanceResourcesReady(resourceStatuses, ["transactions"])) return null;
    const known = new Set(existingTransactions.map(importSignature).filter((signature): signature is string => Boolean(signature)));
    const duplicates = new Set<string>();
    drafts.forEach((draft) => {
      const signature = importSignature(draft);
      if (!signature) return;
      if (known.has(signature)) duplicates.add(draft.id);
      else known.add(signature);
    });
    return duplicates;
  }, [drafts, existingTransactions, resourceStatuses]);
  const invalidCount = drafts.filter((draft) => draft.errors.length > 0).length;
  const selectedDrafts = historyReady && selectionCurrent ? drafts.filter((draft) => selectedIds.has(draft.id) && draft.errors.length === 0) : [];
  const selectableDrafts = historyReady ? drafts.filter((draft) => draft.errors.length === 0) : [];
  const allSelected = selectableDrafts.length > 0 && selectedDrafts.length === selectableDrafts.length;
  const partiallySelected = selectedDrafts.length > 0 && !allSelected;
  const selectedIncome = selectedDrafts.filter((draft) => draft.type === "income").reduce((total, draft) => total + (draft.amount ?? 0), 0);
  const selectedExpense = selectedDrafts.filter((draft) => draft.type === "expense").reduce((total, draft) => total + (draft.amount ?? 0), 0);
  async function selectFile(selected: File | undefined) {
    analysisRef.current?.abort();
    if (inputRef.current) inputRef.current.value = "";
    setError("");
    setStage("select");
    setAnalysisStep(0);
    setDetectedLines(null);
    setSelectedIds(new Set());
    setFile(null);
    setDrafts([]);
    setReviewPage(0);
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
    setStage("analysing");
    setAnalysisStep(0);
    const controller = new AbortController();
    analysisRef.current?.abort();
    analysisRef.current = controller;
    try {
      const parsed = await analyseCsvFile(selected, controller.signal, setAnalysisStep);
      if (controller.signal.aborted) return;
      setDetectedLines(parsed.length);
      setDrafts(parsed);
      if (!hasCurrentHistory()) { setSelectedIds(new Set()); setStage("review"); return; }
      const known = new Set(existingTransactions.map(importSignature).filter((signature): signature is string => Boolean(signature)));
      const initiallySelected = new Set<string>();
      parsed.forEach((draft) => {
        const signature = importSignature(draft);
        if (draft.errors.length === 0 && signature && !known.has(signature)) initiallySelected.add(draft.id);
        if (signature) known.add(signature);
      });
      setSelectedIds(initiallySelected);
      setStage("review");
    } catch {
      if (controller.signal.aborted) return;
      setError(labels.analysisError);
      setStage("select");
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
    if (!hasCurrentHistory()) { setSelectedIds(new Set()); return; }
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
    if (savingRef.current || !hasCurrentHistory() || !selectionCurrent || duplicateIds === null || selectedDrafts.length === 0) return;
    savingRef.current = true;
    setIsImporting(true);
    setError("");
    try {
      const imported = selectedDrafts.flatMap((draft): LegacyTransactionCreateInput[] => {
        if (!draft.dateISO || !draft.type || draft.amount === null) return [];
        const category = draft.category.trim() || "Sem categoria";
        const knownCategory = existingTransactions.find((transaction) => transaction.category !== null && normalizeImportedDescription(transaction.category) === normalizeImportedDescription(category));
        const [year, month, day] = draft.dateISO.split("-").map(Number);
        return [{ id: crypto.randomUUID(), description: draft.description.trim(), category, categoryColor: knownCategory?.categoryColor ?? "#64707D", payment: reviewCopy.notSpecified, date: `${day} ${months[month - 1]} ${year}`, dateISO: draft.dateISO, origin: reviewCopy.importedOrigin, type: draft.type, amount: draft.amount }];
      });

      const saved = await onImport(imported);
      setCompleted({ count: saved.length, income: saved.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0), expense: saved.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0), duplicates: [...duplicateIds].filter((id) => !selectedIds.has(id)).length, errors: invalidCount });
      setStage("success");
    } catch {
      setError(labels.importError);
    } finally {
      savingRef.current = false;
      setIsImporting(false);
    }
  }

  const stepIndex = { select: 0, analysing: 1, review: 2, success: 3 }[stage];
  const title = stage === "success" ? reviewCopy.complete : stage === "review" ? reviewCopy.reviewTitle : stage === "analysing" ? analysisCopy.title : copy.title;
  const fieldErrors = (draft: ImportedTransactionDraft) => draft.errors.map((message) => ({ "Data inválida": labels.dateError, "Descrição ausente": labels.descriptionError, "Valor inválido": labels.amountError, "Tipo não reconhecido": labels.typeError }[message] ?? copy.statusReview)).join(" · ");
  const stats = stage === "success"
    ? [[copy.total, completed.count], [labels.ignored, completed.duplicates], [copy.errors, completed.errors]]
    : [[copy.found, drafts.length], [copy.statusReady, duplicateIds === null ? "\u2014" : drafts.filter((draft) => !draft.errors.length && !duplicateIds.has(draft.id)).length], [copy.statusReview, invalidCount], [reviewCopy.duplicate, duplicateIds?.size ?? "\u2014"], [reviewCopy.selected, selectedDrafts.length]];
  return <dialog ref={dialogRef} aria-labelledby={titleId} aria-busy={isImporting} onCancel={(event) => { event.preventDefault(); close(); }} className={`${styles.modal} ${stage === "review" ? styles.wide : ""}`}>
    <header className={`${styles.header} ${stage === "success" ? styles.successHeader : ""}`}>
      <span className={stage === "success" ? styles.successIcon : styles.icon}>{stage === "success" ? <Image src="/moneypilot/transactions/import/success.svg" width={36} height={36} alt="" /> : stage === "review" ? <Image src="/moneypilot/transactions/import/document.svg" width={30} height={30} alt="" /> : <Image src="/moneypilot/transactions/import/upload.svg" width={24} height={24} alt="" />}</span>
      <div><h2 id={titleId}>{title}</h2><p>{stage === "success" ? `${completed.count} ${csvText.added}` : stage === "review" ? reviewCopy.reviewDescription : stage === "analysing" ? analysisCopy.subtitle : copy.description}</p></div>
      <span className={styles.stepBadge}>{stepIndex + 1} / 4</span>
      {stage !== "success" && <button className={styles.close} disabled={isImporting} onClick={close} aria-label={copy.cancel}><IconX size={18} /></button>}
    </header>
    <ol className={styles.stepper}>{labels.steps.map((label, index) => <li key={label} aria-current={index === stepIndex ? "step" : undefined}><span data-active={index <= stepIndex}>{index < stepIndex || stage === "success" ? "✓" : ""}</span>{label}</li>)}</ol>
    <div className={styles.content}>
      {!historyReady && stage !== "success" && <p role={historyStatus.status === "loading" ? "status" : "alert"} className={styles.notice}>{historyMessage}</p>}
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {stage === "select" && <>
        <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={(event) => void selectFile(event.target.files?.[0])} hidden />
        <button type="button" className={styles.drop} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; }} onDrop={(event) => { event.preventDefault(); void selectFile(event.dataTransfer.files[0]); }} onClick={() => inputRef.current?.click()}><Image src="/moneypilot/transactions/import/document.svg" width={32} height={32} alt="" /><strong>{labels.drop}</strong><span>{labels.browse}</span><small>{labels.limit}</small></button>
        <div className={styles.notice}><Image src="/moneypilot/transactions/import/shield.svg" width={22} height={22} alt="" /><div><strong>{analysisCopy.localTitle}</strong><p>{copy.privacy}</p></div></div>
      </>}
      {stage === "analysing" && <>
        <div className={styles.file}><Image src="/moneypilot/transactions/import/document.svg" width={30} height={30} alt="" /><div><strong>{file?.name}</strong><p>CSV · {file ? (file.size / 1024).toFixed(1) : 0} KB{detectedLines !== null && ` · ${detectedLines} ${analysisCopy.lines}`}</p></div><span>{analysisCopy.analyzing}</span></div>
        <p role="status">{Math.round(analysisStep / 5 * 100)}% {analysisCopy.progress}</p><progress aria-label={analysisCopy.title} max={5} value={analysisStep} />
        <ol className={styles.analysis}>{analysisCopy.steps.map((label, index) => <li key={label}>{index < analysisStep ? <IconCircleCheck size={16} className={styles.income} /> : index === analysisStep ? <IconLoader2 size={16} className={styles.spinner} /> : <span className={styles.waiting} />}<span>{label}</span><small>{index < analysisStep ? analysisCopy.done : index === analysisStep ? analysisCopy.processing : analysisCopy.waiting}</small></li>)}</ol>
        <div className={styles.notice}><Image src="/moneypilot/transactions/import/shield.svg" width={22} height={22} alt="" /><div><strong>{analysisCopy.localTitle}</strong><p>{analysisCopy.localText}</p></div></div>
      </>}
      {(stage === "review" || stage === "success") && <>
        {stage === "success" && <section className={styles.summary}><h3>{labels.summary}</h3><div><p>{csvText.income}<strong className={styles.income}>{money(completed.income)}</strong></p><p>{csvText.expense}<strong className={styles.expense}>{money(completed.expense)}</strong></p></div></section>}
        <div className={styles.stats}>{stats.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      </>}
      {stage === "review" && <>
        <div className={styles.selection}>
          <button type="button" disabled={isImporting || selectableDrafts.length === 0} aria-pressed={partiallySelected ? "mixed" : allSelected} onClick={() => selectRows(allSelected ? new Set() : new Set(selectableDrafts.map((draft) => draft.id)))}>
            <span aria-hidden="true">{partiallySelected ? "−" : allSelected ? "✓" : "□"}</span>{" "}{allSelected ? labels.deselectAll : labels.selectAll}
          </button>
          <p role="status">{selectedDrafts.length} {reviewCopy.selected}{allSelected ? ` · ${labels.allSelected}` : partiallySelected ? ` · ${labels.partialSelection}` : ""}</p>
        </div>
        <fieldset disabled={isImporting} className={styles.rows}>
          <div className={styles.tableHeader}><span /><span>{csvText.date}</span><span>{csvText.description}</span><span>{csvText.category}</span><span>{csvText.type}</span><span>{csvText.value}</span><span>{csvText.status}</span></div>
          {drafts.slice(reviewPage * 50, (reviewPage + 1) * 50).map((draft, index) => <div key={draft.id} className={styles.row}>
            <input aria-label={`${reviewCopy.selected}: ${draft.description || index + 1}`} type="checkbox" checked={historyReady && selectionCurrent && selectedIds.has(draft.id)} disabled={!historyReady || !!draft.errors.length} onChange={(event) => selectRows((current) => { const next = new Set(current); if (event.target.checked) next.add(draft.id); else next.delete(draft.id); return next; })} />
            <label><span>{csvText.date}</span><input aria-invalid={!draft.dateISO} aria-describedby={!draft.dateISO ? `csv-error-${draft.id}` : undefined} type="date" value={draft.dateISO ?? ""} onChange={(event) => updateDraft(draft.id, { dateISO: event.target.value || null })} />{!draft.dateISO && <small className={styles.error}>{draft.rawDate || "—"}</small>}</label>
            <label><span>{csvText.description}</span><input value={draft.description} onChange={(event) => updateDraft(draft.id, { description: event.target.value })} /></label>
            <label><span>{csvText.category}</span><input value={draft.category} onChange={(event) => updateDraft(draft.id, { category: event.target.value })} /></label>
            <label><span>{csvText.type}</span><select value={draft.type ?? ""} onChange={(event) => updateDraft(draft.id, { type: event.target.value ? event.target.value as TransactionType : null })}><option value="">—</option><option value="expense">{csvText.expense}</option><option value="income">{csvText.income}</option></select></label>
            <label><span>{csvText.value}</span><input type="number" min="0.0001" step="0.0001" value={draft.amount ?? ""} onChange={(event) => updateDraft(draft.id, { amount: parseCsvEditableAmountText(event.target.value) })} /><small className={draft.type === "income" ? styles.income : ""}>{draft.amount === null ? "—" : money(draft.amount)}</small></label>
            <span id={`csv-error-${draft.id}`} className={`${styles.status} ${draft.errors.length ? styles.invalid : duplicateIds?.has(draft.id) ? styles.duplicate : historyReady ? styles.ready : styles.invalid}`}>{draft.errors.length ? fieldErrors(draft) : duplicateIds?.has(draft.id) ? reviewCopy.duplicate : historyReady ? copy.statusReady : copy.statusReview}</span>
          </div>)}
        </fieldset>
        {pageCount > 1 && <nav aria-label={reviewCopy.reviewTitle} className={styles.pagination}><button disabled={reviewPage === 0 || isImporting} onClick={() => setReviewPage((page) => page - 1)} aria-label={labels.previous}>←</button><span>{reviewPage + 1} / {pageCount}</span><button disabled={reviewPage + 1 === pageCount || isImporting} onClick={() => setReviewPage((page) => page + 1)} aria-label={labels.next}>→</button></nav>}
        <div className={styles.selection}><div><button disabled={isImporting || !historyReady} onClick={() => selectRows(new Set(drafts.filter((draft) => !draft.errors.length && duplicateIds !== null && !duplicateIds.has(draft.id)).map((draft) => draft.id)))}>{reviewCopy.selectValid}</button><button disabled={isImporting} onClick={() => setSelectedIds(new Set())}>{reviewCopy.clear}</button></div><p>{selectedDrafts.length} {reviewCopy.selected} · {csvText.income}: {money(selectedIncome)} · {csvText.expense}: {money(selectedExpense)}</p></div>
        {duplicateIds !== null && duplicateIds.size > 0 && <p className={`${styles.notice} ${styles.duplicate}`}>{labels.duplicates}</p>}
      </>}
      {stage === "success" && <p className={styles.notice}>{labels.note}</p>}
    </div>
    <footer className={styles.footer}>
      {stage === "success" ? <button className={styles.primary} onClick={close}>{reviewCopy.view}</button> : <>
        <button onClick={stage === "review" ? back : close} disabled={isImporting}>{stage === "review" ? labels.back : copy.cancel}</button>
        {stage === "select" && <button className={styles.primary} onClick={() => inputRef.current?.click()}>{copy.choose}</button>}
        {stage === "review" && <button className={styles.primary} disabled={!selectedDrafts.length || isImporting} onClick={() => void finishImport()}>{isImporting ? labels.importing : csvText.importCount(selectedDrafts.length)}</button>}
      </>}
    </footer>
  </dialog>;
}
