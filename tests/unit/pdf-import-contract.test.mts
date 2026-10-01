import assert from "node:assert/strict";
import { test } from "node:test";

const { buildConfirmedPdfImport, isPdfDraftReady, pdfDraftSignature } = await import("../../src/components/statements/pdf-import-contract.ts");

const validDraft = {
  id: "pdf-1-0",
  pageNumber: 1,
  sourceText: "13/09/2026 Grocery 45.90 DR",
  dateISO: "2026-09-13",
  description: " Grocery ",
  category: " Food ",
  amount: 45.9,
  type: "expense" as const,
  status: "needs_review" as const,
  reviewReasons: [],
};

test("PDF drafts cannot be converted without explicit confirmation", () => {
  assert.throws(() => buildConfirmedPdfImport([validDraft], new Set([validDraft.id]), false), /pdf_confirmation_required/);
});

test("only selected, valid drafts are converted after confirmation", () => {
  const ignored = { ...validDraft, id: "pdf-1-1", description: "Ignored" };
  const imported = buildConfirmedPdfImport([validDraft, ignored], new Set([validDraft.id]), true, () => "tx-pdf-1");
  assert.deepEqual(imported, [{
    id: "tx-pdf-1",
    description: "Grocery",
    category: "Food",
    categoryColor: "#64707D",
    payment: "Not specified",
    date: "2026-09-13",
    dateISO: "2026-09-13",
    origin: "PDF statement",
    type: "expense",
    amount: 45.9,
  }]);
});

test("invalid and repeated selected rows fail closed", () => {
  assert.equal(isPdfDraftReady({ ...validDraft, dateISO: "13/09/2026" }), false);
  assert.throws(() => buildConfirmedPdfImport([{ ...validDraft, amount: null }], new Set([validDraft.id]), true), /pdf_selection_invalid/);
  assert.throws(() => buildConfirmedPdfImport([validDraft, { ...validDraft, id: "pdf-1-1" }], new Set(["pdf-1-0", "pdf-1-1"]), true), /pdf_selection_invalid/);
});

test("draft signatures normalize description casing and whitespace", () => {
  assert.equal(pdfDraftSignature(validDraft), "2026-09-13|grocery|expense|45.9000");
});
