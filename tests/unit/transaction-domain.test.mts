import assert from "node:assert/strict";
import { test } from "node:test";
import type { Transaction } from "../../src/components/transactions/transaction-model.ts";
import { FinanceError, mapFinanceRepositoryError } from "../../src/lib/domain/finance-error.ts";
import { validateAndNormalizeTransaction } from "../../src/lib/domain/transaction-validation.ts";

const legacyClassification = { kind: "legacy", categoryId: null, categoryNameSnapshot: "Alimentação", categoryColorSnapshot: "#64707D", normalizedCategorySnapshot: "alimentação" } as const;

const validTransaction: Transaction = {
  id: "transaction-1",
  description: "Mercado",
  category: "Alimentação",
  categoryColor: "#64707D",
  classification: legacyClassification,
  payment: "Cartão",
  date: "8 Setembro 2026",
  dateISO: "2026-09-08",
  origin: "Manual",
  type: "expense",
  amount: 10,
};

function expectValidationError(change: Partial<Transaction>, field: string, reason: string) {
  assert.throws(
    () => validateAndNormalizeTransaction({ ...validTransaction, ...change }),
    (error) => error instanceof FinanceError
      && error.code === "validation_error"
      && error.details?.field === field
      && error.details.reason === reason,
  );
}

test("accepts a valid transaction", () => {
  assert.deepEqual(validateAndNormalizeTransaction(validTransaction), validTransaction);
});

test("normalizes external whitespace without changing localized content", () => {
  const normalized = validateAndNormalizeTransaction({
    ...validTransaction,
    id: "  transaction-1  ", description: "  Mercado São José  ", classification: { ...legacyClassification, categoryNameSnapshot: "  Alimentação  " },
    payment: "  Cartão  ", origin: "  Importação  ", dateISO: "  2026-09-08  ",
  });
  assert.equal(normalized.id, "transaction-1");
  assert.equal(normalized.description, "Mercado São José");
  assert.equal(normalized.category, "Alimentação");
  assert.equal(normalized.payment, "Cartão");
  assert.equal(normalized.origin, "Importação");
  assert.equal(normalized.dateISO, "2026-09-08");
});

test("rejects an empty description", () => expectValidationError({ description: "   " }, "description", "required"));
test("rejects an empty id", () => expectValidationError({ id: "   " }, "id", "required"));
test("rejects an empty category snapshot", () => expectValidationError({ classification: { ...legacyClassification, categoryNameSnapshot: "   " } }, "categoryNameSnapshot", "required"));
test("rejects an empty payment", () => expectValidationError({ payment: "   " }, "payment", "required"));
test("rejects an empty source", () => expectValidationError({ origin: "   " }, "origin", "required"));
test("rejects a zero amount", () => expectValidationError({ amount: 0 }, "amount", "positive"));
test("rejects a negative amount", () => expectValidationError({ amount: -1 }, "amount", "positive"));
test("rejects an invalid type", () => expectValidationError({ type: "transfer" as Transaction["type"] }, "type", "allowed_value"));
test("rejects an invalid ISO format", () => expectValidationError({ dateISO: "08/09/2026" }, "dateISO", "invalid_format"));
test("rejects an impossible civil date", () => expectValidationError({ dateISO: "2026-02-30" }, "dateISO", "invalid_date"));

test("preserves historical payment labels", () => {
  for (const payment of ["Card", "Cartão", "Tarjeta", "Karte"]) {
    assert.equal(validateAndNormalizeTransaction({ ...validTransaction, payment }).payment, payment);
  }
});

for (const [databaseCode, financeCode] of [["23505", "duplicate_record"], ["23514", "constraint_violation"], ["42501", "ownership_denied"]] as const) {
  test(`maps database code ${databaseCode} safely`, () => {
    assert.equal(mapFinanceRepositoryError({ code: databaseCode, message: "sensitive database detail" }).code, financeCode);
  });
}

test("does not leak an unknown repository message", () => {
  const mapped = mapFinanceRepositoryError(new Error("secret SQL and identifier"));
  assert.equal(mapped.code, "unknown_repository_error");
  assert.equal(mapped.message, "unknown_repository_error");
  assert.equal(mapped.message.includes("secret"), false);
});

test("maps a network failure to repository unavailable", () => {
  assert.equal(mapFinanceRepositoryError(new TypeError("fetch failed with sensitive URL")).code, "repository_unavailable");
});
