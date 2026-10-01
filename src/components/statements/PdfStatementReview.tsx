"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { IconAlertTriangle, IconCircleCheck, IconFileTypePdf, IconLoader2, IconUpload } from "@tabler/icons-react";

import { useFinanceData } from "@/components/FinanceDataProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { buildConfirmedPdfImport, isPdfDraftReady, pdfDraftSignature, transactionSignature, type EditablePdfStatementDraft } from "@/components/statements/pdf-import-contract";
import { derivePdfStatementDrafts } from "@/components/statements/pdf-statement-contract";
import { extractPdfText } from "@/components/statements/pdf-text-extractor";
import { parseCsvEditableAmountText } from "@/lib/domain/financial-input-adapters";

import { areFinanceResourcesReady } from "@/lib/persistence/finance-resource-status";
import { transactionAvailabilityCopy } from "@/components/transactions/transactions-view-state";

const text = {
  en: { title: "Review PDF transactions", detail: "Extract locally, edit every candidate and explicitly confirm before saving.", choose: "Select PDF statement", processing: "Reading PDF locally…", candidates: "candidate rows", page: "Page", date: "Date", description: "Description", category: "Category", amount: "Amount", type: "Type", expense: "Expense", income: "Income", review: "Needs review", duplicate: "Possible duplicate", selectValid: "Select valid rows", clear: "Clear selection", confirmation: "I compared the selected rows with the original PDF and confirm they are correct.", import: (count: number) => `Import ${count} confirmed transactions`, saving: "Importing confirmed rows…", imported: (count: number) => `${count} PDF transactions were imported successfully.`, none: "No transaction-like rows were detected. Scanned/image-only PDFs require OCR, which is not enabled yet.", notice: "Detection is only a suggestion. Compare every selected row with the original statement.", uncategorized: "Uncategorized", errors: { empty_pdf: "The PDF is empty.", pdf_too_large: "The PDF exceeds the 10 MB limit.", invalid_pdf: "The selected file is not a valid PDF.", pdf_too_many_pages: "The PDF exceeds the 50-page limit.", pdf_text_too_large: "The extracted text exceeds the safe limit.", password_protected_pdf: "Password-protected PDFs are not supported.", unreadable_pdf: "The PDF could not be read safely.", pdf_confirmation_required: "Confirm the review before importing.", pdf_selection_invalid: "Review every selected field before importing.", import_failed: "The confirmed transactions could not be imported." } },
  pt: { title: "Revisar transações do PDF", detail: "Extraia localmente, edite cada candidato e confirme explicitamente antes de salvar.", choose: "Selecionar extrato PDF", processing: "Lendo PDF localmente…", candidates: "linhas candidatas", page: "Página", date: "Data", description: "Descrição", category: "Categoria", amount: "Valor", type: "Tipo", expense: "Despesa", income: "Receita", review: "Revisar", duplicate: "Possível duplicata", selectValid: "Selecionar linhas válidas", clear: "Limpar seleção", confirmation: "Comparei as linhas selecionadas com o PDF original e confirmo que estão corretas.", import: (count: number) => `Importar ${count} transações confirmadas`, saving: "Importando linhas confirmadas…", imported: (count: number) => `${count} transações do PDF foram importadas com sucesso.`, none: "Nenhuma linha semelhante a transação foi detectada. PDFs digitalizados ou somente com imagem exigem OCR, ainda não habilitado.", notice: "A detecção é apenas uma sugestão. Compare cada linha selecionada com o extrato original.", uncategorized: "Sem categoria", errors: { empty_pdf: "O PDF está vazio.", pdf_too_large: "O PDF excede o limite de 10 MB.", invalid_pdf: "O arquivo selecionado não é um PDF válido.", pdf_too_many_pages: "O PDF excede o limite de 50 páginas.", pdf_text_too_large: "O texto extraído excede o limite seguro.", password_protected_pdf: "PDFs protegidos por senha não são suportados.", unreadable_pdf: "Não foi possível ler o PDF com segurança.", pdf_confirmation_required: "Confirme a revisão antes de importar.", pdf_selection_invalid: "Revise todos os campos selecionados antes de importar.", import_failed: "Não foi possível importar as transações confirmadas." } },
} as const;

export function PdfStatementReview() {
  const { language } = useLanguage();
  const { transactions, resourceStatuses, importTransactions } = useFinanceData();
  const copy = language === "pt" ? text.pt : text.en;
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<EditablePdfStatementDraft[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmed, setConfirmed] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [reviewPage, setReviewPage] = useState(0);
  const [status, setStatus] = useState<"idle" | "processing" | "ready" | "importing" | "complete">("idle");
  const [error, setError] = useState<string | null>(null);
  const historyReady = areFinanceResourcesReady(resourceStatuses, ["transactions"]);
  const historyStatus = resourceStatuses.transactions;
  const latestHistory = useRef({ status: historyStatus, transactions });
  useLayoutEffect(() => { latestHistory.current = { status: historyStatus, transactions }; }, [historyStatus, transactions]);
  // Recovery requires a new selection and explicit confirmation for the new snapshot.
  const [selectionBasis, setSelectionBasis] = useState({ status: historyStatus, transactions });
  const selectionCurrent = selectionBasis.status === historyStatus && selectionBasis.transactions === transactions;
  if (!selectionCurrent) {
    setSelectionBasis({ status: historyStatus, transactions });
    setSelectedIds(new Set());
    setConfirmed(false);
  }
  function hasCurrentHistory() {
    return historyReady && latestHistory.current.status === historyStatus && latestHistory.current.transactions === transactions;
  }
  function selectRows(value: Set<string> | ((current: Set<string>) => Set<string>)) {
    if (!hasCurrentHistory()) return;
    setSelectedIds(value);
    setConfirmed(false);
  }
  const historyMessage = historyStatus.status === "loading" ? transactionAvailabilityCopy[language].loading : transactionAvailabilityCopy[language].error;
  const knownSignatures = useMemo(() => historyReady ? new Set(transactions.map(transactionSignature)) : null, [transactions, historyReady]);
  const duplicateIds = useMemo(() => {
    if (knownSignatures === null) return null;
    const seen = new Set(knownSignatures);
    const duplicates = new Set<string>();
    for (const draft of drafts) {
      const signature = pdfDraftSignature(draft);
      if (!signature) continue;
      if (seen.has(signature)) duplicates.add(draft.id);
      else seen.add(signature);
    }
    return duplicates;
  }, [drafts, knownSignatures]);
  const pageSize = 100;
  const pageCount = Math.max(1, Math.ceil(drafts.length / pageSize));
  const visibleDrafts = drafts.slice(reviewPage * pageSize, (reviewPage + 1) * pageSize);
  const selectedCount = historyReady && selectionCurrent ? selectedIds.size : 0;

  async function selectFile(file?: File) {
    if (!file) return;
    setFileName(file.name); setDrafts([]); setSelectedIds(new Set()); setConfirmed(false); setCompletedCount(0); setReviewPage(0); setError(null); setStatus("processing");
    try {
      const pages = await extractPdfText(file);
      setDrafts(derivePdfStatementDrafts(pages).map((draft) => ({ ...draft, category: copy.uncategorized })));
      setStatus("ready");
    } catch (caught) {
      const code = caught instanceof Error ? caught.message as keyof typeof copy.errors : "unreadable_pdf";
      setError(copy.errors[code] ?? copy.errors.unreadable_pdf); setStatus("idle");
    } finally { if (inputRef.current) inputRef.current.value = ""; }
  }

  function updateDraft(id: string, changes: Partial<EditablePdfStatementDraft>) {
    setDrafts((current) => current.map((draft) => draft.id === id ? { ...draft, ...changes } : draft));
    setSelectedIds((current) => { const next = new Set(current); next.delete(id); return next; });
    setConfirmed(false);
  }

  async function importConfirmed() {
    if (!hasCurrentHistory() || !selectionCurrent || duplicateIds === null || status === "importing") return;
    if (drafts.some((draft) => selectedIds.has(draft.id) && duplicateIds.has(draft.id))) { setError(copy.errors.pdf_selection_invalid); return; }
    setError(null);
    try {
      const payload = buildConfirmedPdfImport(drafts, selectedIds, confirmed);
      setStatus("importing");
      await importTransactions(payload);
      setCompletedCount(payload.length); setStatus("complete"); setSelectedIds(new Set()); setConfirmed(false);
    } catch (caught) {
      const code = caught instanceof Error ? caught.message as keyof typeof copy.errors : "import_failed";
      setError(copy.errors[code] ?? copy.errors.import_failed); setStatus("ready");
    }
  }

  const selectableIds = duplicateIds === null ? [] : drafts.filter((draft) => isPdfDraftReady(draft) && !duplicateIds.has(draft.id)).map((draft) => draft.id);

  return <section className="pdf-review-panel" aria-labelledby="pdf-review-title">
    <div><h2 id="pdf-review-title">{copy.title}</h2><p>{copy.detail}</p></div>
    <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={(event) => void selectFile(event.target.files?.[0])} />
    <button type="button" className="pdf-review-select" disabled={status === "processing" || status === "importing"} onClick={() => inputRef.current?.click()}>{status === "processing" ? <IconLoader2 className="animate-spin" /> : <IconUpload />}{status === "processing" ? copy.processing : copy.choose}</button>
    {fileName && <p className="pdf-review-file"><IconFileTypePdf />{fileName}</p>}
    {!historyReady && status !== "complete" && <p className="flow-error" role={historyStatus.status === "loading" ? "status" : "alert"}>{historyMessage}</p>}
    {error && <p className="flow-error" role="alert"><IconAlertTriangle />{error}</p>}
    {status === "complete" && <p className="pdf-review-success" role="status"><IconCircleCheck />{copy.imported(completedCount)}</p>}
    {(status === "ready" || status === "importing") && <>
      <div className="pdf-review-actions"><p className="pdf-review-count">{drafts.length} {copy.candidates}</p><button type="button" disabled={!historyReady || status === "importing"} onClick={() => selectRows(new Set(selectableIds))}>{copy.selectValid}</button><button type="button" onClick={() => { setSelectedIds(new Set()); setConfirmed(false); }}>{copy.clear}</button></div>
      {drafts.length === 0 ? <p className="pdf-review-empty">{copy.none}</p> : <div className="pdf-review-table" role="region" aria-label={copy.title}>
        <div className="pdf-review-row pdf-review-heading"><span></span><span>{copy.page}</span><span>{copy.date}</span><span>{copy.description}</span><span>{copy.category}</span><span>{copy.amount}</span><span>{copy.type}</span><span>{copy.review}</span></div>
        {visibleDrafts.map((draft) => { const ready = isPdfDraftReady(draft); const duplicate = duplicateIds?.has(draft.id); return <div className="pdf-review-row" key={draft.id}>
          <input aria-label={`${copy.page} ${draft.pageNumber}`} type="checkbox" checked={historyReady && selectionCurrent && selectedIds.has(draft.id)} disabled={!historyReady || !ready || duplicate || status === "importing"} onChange={(event) => selectRows((current) => { const next = new Set(current); if (event.target.checked) next.add(draft.id); else next.delete(draft.id); return next; })} />
          <span>{draft.pageNumber}</span>
          <input type="date" value={draft.dateISO ?? ""} onChange={(event) => updateDraft(draft.id, { dateISO: event.target.value || null })} />
          <input value={draft.description} title={draft.sourceText} onChange={(event) => updateDraft(draft.id, { description: event.target.value })} />
          <input value={draft.category} onChange={(event) => updateDraft(draft.id, { category: event.target.value })} />
          <input type="number" min="0.0001" step="0.0001" value={draft.amount ?? ""} onChange={(event) => updateDraft(draft.id, { amount: parseCsvEditableAmountText(event.target.value) })} />
          <select value={draft.type ?? ""} onChange={(event) => updateDraft(draft.id, { type: event.target.value === "income" || event.target.value === "expense" ? event.target.value : null })}><option value="">—</option><option value="expense">{copy.expense}</option><option value="income">{copy.income}</option></select>
          <strong>{duplicate ? copy.duplicate : historyReady && ready ? (selectedIds.has(draft.id) ? "✓" : copy.review) : copy.review}</strong>
        </div>; })}
      </div>}
      {drafts.length > pageSize && <div className="pdf-review-actions" aria-label="PDF review pages"><button type="button" disabled={reviewPage === 0} onClick={() => setReviewPage((page) => Math.max(0, page - 1))}>←</button><span>{reviewPage + 1} / {pageCount}</span><button type="button" disabled={reviewPage + 1 >= pageCount} onClick={() => setReviewPage((page) => Math.min(pageCount - 1, page + 1))}>→</button></div>}
      {selectedCount > 0 && <label className="pdf-review-confirm"><input type="checkbox" checked={historyReady && selectionCurrent && confirmed} disabled={!historyReady || status === "importing"} onChange={(event) => { if (hasCurrentHistory()) setConfirmed(event.target.checked); }} /><span>{copy.confirmation}</span></label>}
      <p className="pdf-review-warning"><IconAlertTriangle />{copy.notice}</p>
      <button type="button" className="pdf-review-import" disabled={!historyReady || !confirmed || selectedCount === 0 || status === "importing"} onClick={() => void importConfirmed()}>{status === "importing" ? <><IconLoader2 className="animate-spin" />{copy.saving}</> : copy.import(selectedCount)}</button>
    </>}
  </section>;
}
