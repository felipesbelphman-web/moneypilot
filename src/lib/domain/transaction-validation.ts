import type { Transaction, TransactionFields, TransactionType } from "@/components/transactions/transaction-model";
import { FinanceError } from "./finance-error.ts";
import { validateMoney } from "./decimal-guard.ts";

type TransactionTextField = "id" | "description" | "category" | "categoryColor" | "categoryId" | "categoryNameSnapshot" | "categoryColorSnapshot" | "normalizedCategorySnapshot" | "payment" | "date" | "origin";

export function validateAndNormalizeTransaction(transaction: Transaction): Transaction {
  const fields = validateAndNormalizeTransactionFields(transaction);
  const classification = transaction.classification;
  if (classification.kind === "uncategorized") return { ...fields, classification, category: null, categoryColor: null };
  const common = { categoryNameSnapshot: requiredText(classification.categoryNameSnapshot, "categoryNameSnapshot"), categoryColorSnapshot: requiredText(classification.categoryColorSnapshot, "categoryColorSnapshot"), normalizedCategorySnapshot: requiredText(classification.normalizedCategorySnapshot, "normalizedCategorySnapshot") };
  const normalizedClassification = classification.kind === "linked"
    ? { kind: "linked" as const, categoryId: requiredText(classification.categoryId, "categoryId"), ...common }
    : { kind: "legacy" as const, categoryId: null, ...common };
  return { ...fields, classification: normalizedClassification, category: normalizedClassification.categoryNameSnapshot, categoryColor: normalizedClassification.categoryColorSnapshot };
}

export function validateAndNormalizeTransactionFields(transaction: TransactionFields): TransactionFields {
  const normalized = {
    ...transaction,
    id: requiredText(transaction.id, "id"),
    description: requiredText(transaction.description, "description"),
    payment: requiredText(transaction.payment, "payment"),
    date: requiredText(transaction.date, "date"),
    origin: requiredText(transaction.origin, "origin"),
    dateISO: transaction.dateISO.trim(),
  };

  validateMoney(normalized.amount, "amount", "positive");
  const type = parseTransactionType(normalized.type);
  validateCivilDate(normalized.dateISO);
  return { ...normalized, type };
}

function requiredText(value: string, field: TransactionTextField) {
  if (typeof value !== "string") throw new FinanceError("validation_error", { field, reason: "required" });
  const normalized = value.trim();
  if (!normalized) throw new FinanceError("validation_error", { field, reason: "required" });
  return normalized;
}

export function parseTransactionType(value: unknown): TransactionType {
  if (value === "income" || value === "expense") return value;
  throw new FinanceError("validation_error", { field: "type", reason: "allowed_value" });
}

function validateCivilDate(value: string) {
  if (typeof value !== "string") {
    throw new FinanceError("validation_error", { field: "dateISO", reason: "invalid_format" });
  }
  if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value)) {
    throw new FinanceError("validation_error", { field: "dateISO", reason: "invalid_format" });
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new FinanceError("validation_error", { field: "dateISO", reason: "invalid_date" });
  }
}
