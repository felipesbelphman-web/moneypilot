import assert from "node:assert/strict";
import { test } from "node:test";

const { derivePdfStatementDrafts, PDF_STATEMENT_LIMITS } = await import("../../src/components/statements/pdf-statement-contract.ts");

test("PDF limits bound untrusted document work", () => {
  assert.deepEqual(PDF_STATEMENT_LIMITS, { maxFileBytes: 10 * 1024 * 1024, maxPages: 50, maxTextCharacters: 250_000 });
});

test("known debit and credit markers produce review-only candidates", () => {
  const drafts = derivePdfStatementDrafts([{ pageNumber: 2, lines: ["13/09/2026 Grocery Store 45,90 DR", "2026-09-14 Salary 2,000.00 CR"] }]);
  assert.deepEqual(drafts.map(({ pageNumber, dateISO, description, amount, type, status }) => ({ pageNumber, dateISO, description, amount, type, status })), [
    { pageNumber: 2, dateISO: "2026-09-13", description: "Grocery Store", amount: 45.9, type: "expense", status: "needs_review" },
    { pageNumber: 2, dateISO: "2026-09-14", description: "Salary", amount: 2000, type: "income", status: "needs_review" },
  ]);
});

test("ambiguous positive amounts never invent a transaction type", () => {
  const [draft] = derivePdfStatementDrafts([{ pageNumber: 1, lines: ["12/09/2026 Merchant 19.99"] }]);
  assert.equal(draft.type, null);
  assert.equal(draft.status, "needs_review");
  assert.ok(draft.reviewReasons.includes("type_requires_review"));
});

test("noise without a date or trailing amount is ignored", () => {
  assert.deepEqual(derivePdfStatementDrafts([{ pageNumber: 1, lines: ["Account holder", "Opening balance"] }]), []);
});

test("two-line amount and balance statements use the transaction amount and metadata date", () => {
  const drafts = derivePdfStatementDrafts([{ pageNumber: 7, lines: [
    "Card payment description -10.30 19.20",
    "12 September 2026 | Card ending in 0016 | Reference: private",
    "Cash transfer received 1,200.00 1,219.20",
    "11 September 2026 | Reference: private",
  ] }]);
  assert.deepEqual(drafts.map(({ dateISO, description, amount, type }) => ({ dateISO, description, amount, type })), [
    { dateISO: "2026-09-12", description: "Card payment description", amount: 10.3, type: "expense" },
    { dateISO: "2026-09-11", description: "Cash transfer received", amount: 1200, type: "income" },
  ]);
});

test("standalone balances and dated metadata never become candidates", () => {
  assert.deepEqual(derivePdfStatementDrafts([{ pageNumber: 1, lines: [
    "Generated on: 13 September 2026",
    "Balance on 13 September 2026 19.20 EUR",
    "13 September 2026 | Reference: private",
    "19.20",
  ] }]), []);
});

test("draft identifiers are deterministic and contain no account data", () => {
  const [draft] = derivePdfStatementDrafts([{ pageNumber: 3, lines: ["2026-09-01 Private merchant 10.00 DR"] }]);
  assert.equal(draft.id, "pdf-3-0");
  assert.equal(draft.id.includes("Private"), false);
});
