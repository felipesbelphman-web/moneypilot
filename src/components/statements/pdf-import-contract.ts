import type { LegacyTransactionCreateInput, Transaction } from "../transactions/transaction-model.ts";
import { parseImportedDate } from "../transactions/csv-import.ts";
import type { PdfStatementDraft } from "./pdf-statement-contract.ts";
import { validateMoney } from "../../lib/domain/decimal-guard.ts";

export type EditablePdfStatementDraft = PdfStatementDraft & { category: string };

function normalized(value: string) {
  return value.trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");
}

export function pdfDraftSignature(item: Pick<EditablePdfStatementDraft, "dateISO" | "description" | "type" | "amount">) {
  if (!item.dateISO || !item.description.trim() || !item.type || item.amount === null) return null;
  try { validateMoney(item.amount, "amount", "positive"); } catch { return null; }
  return `${item.dateISO}|${normalized(item.description)}|${item.type}|${item.amount.toFixed(4)}`;
}

export function transactionSignature(item: Pick<Transaction, "dateISO" | "description" | "type" | "amount">) {
  return `${item.dateISO}|${normalized(item.description)}|${item.type}|${item.amount.toFixed(4)}`;
}

export function isPdfDraftReady(draft: EditablePdfStatementDraft) {
  if (!draft.dateISO || parseImportedDate(draft.dateISO) !== draft.dateISO) return false;
  if (!draft.description.trim() || !draft.category.trim()) return false;
  if (draft.type !== "income" && draft.type !== "expense") return false;
  if (draft.amount === null) return false;
  try { validateMoney(draft.amount, "amount", "positive"); return true; } catch { return false; }
}

export function buildConfirmedPdfImport(
  drafts: EditablePdfStatementDraft[],
  selectedIds: ReadonlySet<string>,
  confirmed: boolean,
  createId: () => string = () => crypto.randomUUID(),
): LegacyTransactionCreateInput[] {
  if (!confirmed) throw new Error("pdf_confirmation_required");
  const selected = drafts.filter((draft) => selectedIds.has(draft.id));
  if (selected.length === 0 || selected.some((draft) => !isPdfDraftReady(draft))) throw new Error("pdf_selection_invalid");
  const signatures = selected.map(pdfDraftSignature);
  if (new Set(signatures).size !== signatures.length) throw new Error("pdf_selection_invalid");
  return selected.map((draft) => ({
    id: createId(),
    description: draft.description.trim(),
    category: draft.category.trim(),
    categoryColor: "#64707D",
    payment: "Not specified",
    date: draft.dateISO!,
    dateISO: draft.dateISO!,
    origin: "PDF statement",
    type: draft.type!,
    amount: draft.amount!,
  }));
}
