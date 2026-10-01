import { parseImportedAmount, parseImportedDate } from "../transactions/csv-import.ts";

export const PDF_STATEMENT_LIMITS = {
  maxFileBytes: 10 * 1024 * 1024,
  maxPages: 50,
  maxTextCharacters: 250_000,
} as const;

export type PdfTextPage = { pageNumber: number; lines: string[] };

export type PdfStatementDraft = {
  id: string;
  pageNumber: number;
  sourceText: string;
  dateISO: string | null;
  description: string;
  amount: number | null;
  type: "income" | "expense" | null;
  reviewReasons: Array<"date_requires_review" | "description_requires_review" | "amount_requires_review" | "type_requires_review">;
  status: "needs_review";
};

const datePattern = /\b(\d{4}-\d{2}-\d{2}|\d{2}[/-]\d{2}[/-]\d{4})\b/;
const trailingAmountPattern = /(?:R\$|EUR|GBP|USD|€|£|\$)?\s*(\(?-?\d[\d.,\s]*\)?)(?:\s+(CR|DR|C|D))?\s*$/i;
const textDatePattern = /\b(\d{1,2}) (January|February|March|April|May|June|July|August|September|October|November|December) (\d{4})\b/i;
const amountAndBalancePattern = /\s(-?\d[\d,.]*)\s+(-?\d[\d,.]*)\s*$/;
const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

function normalizeSpace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function parsePdfAmount(raw: string) {
  const trimmed = raw.trim();
  const parenthesized = trimmed.startsWith("(") && trimmed.endsWith(")");
  const compact = trimmed.replace(/[()\s]/g, "");
  const numeric = /^[+-]?\d{1,3}(?:,\d{3})+\.\d{1,4}$/.test(compact)
    ? compact.replace(/,/g, "")
    : /^[+-]?\d{1,3}(?:\.\d{3})+,\d{1,4}$/.test(compact)
      ? compact.replace(/\./g, "").replace(",", ".")
      : compact;
  const parsed = parseImportedAmount(numeric);
  if (parsed === null || parsed === 0) return null;
  return parenthesized ? -Math.abs(parsed) : parsed;
}

function parsePdfDate(value: string) {
  const numeric = value.match(datePattern);
  if (numeric) return { dateISO: parseImportedDate(numeric[1]), raw: numeric[0] };
  const text = value.match(textDatePattern);
  if (!text) return { dateISO: null, raw: null };
  const month = months.indexOf(text[2].toLowerCase()) + 1;
  const dateISO = `${text[3]}-${String(month).padStart(2, "0")}-${String(Number(text[1])).padStart(2, "0")}`;
  return { dateISO: parseImportedDate(dateISO), raw: text[0] };
}

export function derivePdfStatementDrafts(pages: PdfTextPage[]): PdfStatementDraft[] {
  const drafts: PdfStatementDraft[] = [];

  for (const page of pages) {
    const consumed = new Set<number>();
    for (let metadataIndex = 0; metadataIndex < page.lines.length; metadataIndex += 1) {
      const metadata = normalizeSpace(page.lines[metadataIndex]);
      const parsedDate = parsePdfDate(metadata);
      if (!parsedDate.dateISO || !parsedDate.raw) continue;
      for (let rowIndex = metadataIndex - 1; rowIndex >= Math.max(0, metadataIndex - 2); rowIndex -= 1) {
        const row = normalizeSpace(page.lines[rowIndex]);
        const amounts = row.match(amountAndBalancePattern);
        if (!amounts) continue;
        const signedAmount = parsePdfAmount(amounts[1]);
        const description = normalizeSpace(row.slice(0, amounts.index));
        if (signedAmount === null || !description) continue;
        drafts.push({ id: `pdf-${page.pageNumber}-${rowIndex}`, pageNumber: page.pageNumber, sourceText: `${row} ${metadata}`, dateISO: parsedDate.dateISO, description, amount: Math.abs(signedAmount), type: signedAmount < 0 ? "expense" : "income", reviewReasons: [], status: "needs_review" });
        consumed.add(rowIndex);
        consumed.add(metadataIndex);
        break;
      }
    }

    for (let lineIndex = 0; lineIndex < page.lines.length; lineIndex += 1) {
      if (consumed.has(lineIndex)) continue;
      const sourceText = normalizeSpace(page.lines[lineIndex]);
      if (!sourceText) continue;
      const parsedDate = parsePdfDate(sourceText);
      const sourceWithoutDate = normalizeSpace(sourceText.replace(parsedDate.raw ?? "", ""));
      const amountMatch = sourceWithoutDate.match(trailingAmountPattern);
      if (!parsedDate.dateISO || !amountMatch) continue;

      const dateISO = parsedDate.dateISO;
      const signedAmount = amountMatch ? parsePdfAmount(amountMatch[1]) : null;
      const direction = amountMatch?.[2]?.toUpperCase() ?? null;
      const description = normalizeSpace(sourceWithoutDate
        .replace(amountMatch?.[0] ?? "", ""));
      const type = direction === "DR" || direction === "D" || (signedAmount !== null && signedAmount < 0)
        ? "expense"
        : direction === "CR" || direction === "C"
          ? "income"
          : null;
      const reviewReasons: PdfStatementDraft["reviewReasons"] = [];
      if (!dateISO) reviewReasons.push("date_requires_review");
      if (!description) reviewReasons.push("description_requires_review");
      if (signedAmount === null) reviewReasons.push("amount_requires_review");
      if (!type) reviewReasons.push("type_requires_review");

      drafts.push({
        id: `pdf-${page.pageNumber}-${lineIndex}`,
        pageNumber: page.pageNumber,
        sourceText,
        dateISO,
        description,
        amount: signedAmount === null ? null : Math.abs(signedAmount),
        type,
        reviewReasons,
        status: "needs_review",
      });
    }
  }

  return drafts;
}
