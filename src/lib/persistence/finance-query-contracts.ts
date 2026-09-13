import { FinanceError } from "../domain/finance-error.ts";

export type TransactionDateRange = Readonly<{
  fromISO: string;
  toISO: string;
}>;

export type OffsetPagination = Readonly<{
  kind: "offset";
  page: number;
  pageSize: number;
}>;

export type CursorPagination = Readonly<{
  kind: "cursor";
  after: string | null;
  pageSize: number;
}>;

export type PaginatedResult<Item> = Readonly<{
  completeness: "partial";
  items: readonly Item[];
  total: number;
  pagination: OffsetPagination | CursorPagination;
}>;

export type CompletePeriodResult<Item> = Readonly<{
  completeness: "complete";
  range: TransactionDateRange;
  items: readonly Item[];
}>;

export type FinancialQueryResult<Item> = PaginatedResult<Item> | CompletePeriodResult<Item>;

export function createOffsetPagination(page: number, pageSize: number): OffsetPagination {
  validatePositiveInteger(page, "page");
  validatePositiveInteger(pageSize, "pageSize");
  return { kind: "offset", page, pageSize };
}

export function createCursorPagination(after: string | null, pageSize: number): CursorPagination {
  validatePositiveInteger(pageSize, "pageSize");
  const normalizedCursor = after?.trim() || null;
  return { kind: "cursor", after: normalizedCursor, pageSize };
}

export function requireCompletePeriodResult<Item>(result: FinancialQueryResult<Item>): CompletePeriodResult<Item> {
  if (result.completeness !== "complete") {
    throw new FinanceError("validation_error", { field: "completeness", reason: "allowed_value" });
  }
  return result;
}

function validatePositiveInteger(value: number, field: string) {
  if (!Number.isFinite(value)) {
    throw new FinanceError("validation_error", { field, reason: "finite" });
  }
  if (!Number.isInteger(value) || value <= 0) {
    throw new FinanceError("validation_error", { field, reason: "positive" });
  }
}
