export type TransactionType = "income" | "expense";

export const transactionPaymentValues = ["Not specified", "Cash", "Debit card", "Credit card", "Bank transfer", "Pix"] as const;
export type TransactionPayment = (typeof transactionPaymentValues)[number];

export const legacyTransactionPaymentValues = ["Card"] as const;
export type LegacyTransactionPayment = (typeof legacyTransactionPaymentValues)[number];

export type TransactionClassification =
  | { kind: "linked"; categoryId: string; categoryNameSnapshot: string; categoryColorSnapshot: string; normalizedCategorySnapshot: string }
  | { kind: "legacy"; categoryId: null; categoryNameSnapshot: string; categoryColorSnapshot: string; normalizedCategorySnapshot: string }
  | { kind: "uncategorized"; categoryId: null; categoryNameSnapshot: null; categoryColorSnapshot: null; normalizedCategorySnapshot: null };

export type TransactionCategoryWrite =
  | { kind: "linked"; categoryId: string; legacyName: string; legacyColor: string }
  | { kind: "legacy"; categoryName: string; categoryColor: string }
  | { kind: "uncategorized" };

export type TransactionFields = {
  id: string;
  description: string;
  payment: string;
  date: string;
  dateISO: string;
  origin: string;
  type: TransactionType;
  amount: number;
};

export type Transaction = TransactionFields & {
  classification: TransactionClassification;
  category: string | null;
  categoryColor: string | null;
};

export type TransactionCreateInput = TransactionFields & { categoryWrite: TransactionCategoryWrite };
export type LegacyTransactionCreateInput = TransactionFields & { category: string; categoryColor: string };
export type TransactionUpdateInput = TransactionFields;
export type TransactionClassificationUpdate = { id: string; categoryWrite: Extract<TransactionCategoryWrite, { kind: "linked" | "uncategorized" }> };

export const uncategorizedTransactionGroupKey = "__moneypilot_transaction_uncategorized__";

export function getTransactionCategoryGroupKey(transaction: Transaction) {
  if (transaction.classification.kind === "linked") return `linked:${transaction.classification.categoryId}`;
  if (transaction.classification.kind === "legacy") return `legacy:${transaction.classification.normalizedCategorySnapshot}`;
  return uncategorizedTransactionGroupKey;
}
