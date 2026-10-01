import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const review = await readFile(new URL("../../src/components/statements/PdfStatementReview.tsx", import.meta.url), "utf8");
const extractor = await readFile(new URL("../../src/components/statements/pdf-text-extractor.ts", import.meta.url), "utf8");

test("PDF extraction remains local and persistence is isolated behind confirmation", () => {
  assert.match(review, /extractPdfText\(file\)/);
  assert.match(review, /buildConfirmedPdfImport\(drafts, selectedIds, confirmed\)/);
  assert.match(review, /await importTransactions\(payload\)/);
  assert.doesNotMatch(extractor, /fetch\(|\/api\//);
});

test("PDF bytes, page count and extracted text are bounded before review", () => {
  assert.match(extractor, /maxFileBytes/);
  assert.match(extractor, /maxPages/);
  assert.match(extractor, /maxTextCharacters/);
  assert.match(extractor, /%PDF-/);
});

test("the UI starts unselected and requires an explicit confirmation", () => {
  assert.match(review, /useState<Set<string>>\(new Set\(\)\)/);
  assert.match(review, /checked=\{historyReady && selectionCurrent && confirmed\}/);
  assert.match(review, /disabled=\{!historyReady \|\| !confirmed \|\| selectedCount === 0/);
  assert.match(review, /updateDraft[\s\S]*setConfirmed\(false\)/);
  assert.match(review, /Math\.ceil\(drafts\.length \/ pageSize\)/);
  assert.match(review, /selectableIds = duplicateIds === null \? \[\] : drafts\.filter/);
});
