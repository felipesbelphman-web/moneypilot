import type { Transaction, TransactionFields, TransactionType } from "./transaction-model.ts";
import type { Category } from "../../lib/domain/category.ts";

export type TransactionClassificationAction =
  | { kind: "unchanged" }
  | { kind: "link"; category: Category }
  | { kind: "unlink" }
  | { kind: "invalid" };

export function getSelectableTransactionCategories(categories: readonly Category[], type: TransactionType) {
  return categories.filter((category) => category.archivedAt === null && category.type === type);
}

export function getInitialTransactionCategoryId(transaction?: Transaction) {
  return transaction?.classification.kind === "linked" ? transaction.classification.categoryId : "";
}

export function retainCompatibleCategoryId(categoryId: string, categories: readonly Category[], type: TransactionType) {
  return getSelectableTransactionCategories(categories, type).some((category) => category.id === categoryId) ? categoryId : "";
}

export function resolveTransactionClassificationAction(transaction: Transaction, categoryId: string, categories: readonly Category[], type: TransactionType, removeLegacy: boolean): TransactionClassificationAction {
  if (!categoryId) {
    if (transaction.classification.kind === "linked" || (transaction.classification.kind === "legacy" && removeLegacy)) return { kind: "unlink" };
    return { kind: "unchanged" };
  }
  if (transaction.classification.kind === "linked" && transaction.classification.categoryId === categoryId) return { kind: "unchanged" };
  const category = categories.find((candidate) => candidate.id === categoryId && candidate.archivedAt === null && candidate.type === type);
  return category ? { kind: "link", category } : { kind: "invalid" };
}

export function hasTransactionFieldChanges(transaction: Transaction, fields: TransactionFields) {
  return transaction.description !== fields.description
    || transaction.payment !== fields.payment
    || transaction.date !== fields.date
    || transaction.dateISO !== fields.dateISO
    || transaction.origin !== fields.origin
    || transaction.type !== fields.type
    || transaction.amount !== fields.amount;
}
