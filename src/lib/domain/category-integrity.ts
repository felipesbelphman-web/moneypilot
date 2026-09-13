export type FinancialCategoryType = "income" | "expense";
export type FinancialClassificationReason = "invalid_transaction_type";
export type CategoryIntegrityReason = "missing_category" | "incompatible_category_type";
export type CategoryIntegrityResult =
  | { available: true; unavailableReason: null; category: string; type: FinancialCategoryType }
  | { available: false; unavailableReason: CategoryIntegrityReason | FinancialClassificationReason; category: null; type: null };

export function isFinancialTransactionType(type: unknown): type is FinancialCategoryType {
  return type === "income" || type === "expense";
}

export function inspectCategoryReference(category: unknown, type: unknown, expectedType?: FinancialCategoryType): CategoryIntegrityResult {
  if (typeof category !== "string" || !category.trim()) return unavailable("missing_category");
  if (!isFinancialTransactionType(type)) return unavailable("invalid_transaction_type");
  if (expectedType !== undefined && type !== expectedType) return unavailable("incompatible_category_type");
  return { available: true, unavailableReason: null, category, type };
}

function unavailable(unavailableReason: CategoryIntegrityReason | FinancialClassificationReason): CategoryIntegrityResult {
  return { available: false, unavailableReason, category: null, type: null };
}
