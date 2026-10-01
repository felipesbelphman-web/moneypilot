import { FinanceError } from "../domain/finance-error.ts";
import { civilDateToUtcTimestamp } from "../dates/civil-date.ts";

export type TransactionDateRange = Readonly<{
  startISO: string;
  endExclusiveISO: string;
}>;

/** Validate civil dates without converting the strings used in query filters. */
export function validateTransactionDateRange(range: TransactionDateRange): TransactionDateRange {
  if (typeof range !== "object" || range === null) {
    throw new FinanceError("validation_error", { field: "range", reason: "required" });
  }
  const { startISO, endExclusiveISO } = range;
  for (const [field, value] of [["startISO", startISO], ["endExclusiveISO", endExclusiveISO]] as const) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new FinanceError("validation_error", { field, reason: "invalid_format" });
    }
    if (civilDateToUtcTimestamp(value) === null) {
      throw new FinanceError("validation_error", { field, reason: "invalid_date" });
    }
  }
  if (startISO >= endExclusiveISO) {
    throw new FinanceError("validation_error", { field: "range", reason: "invalid_date" });
  }
  return Object.freeze({ startISO, endExclusiveISO });
}

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

/** Observed coverage of [startISO, endExclusiveISO), not an atomic snapshot
 * across HTTP requests or a guarantee of permanent freshness. */
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

export function requireCompletePeriodResult<Item>(result: FinancialQueryResult<Item>, expectedRange: TransactionDateRange): CompletePeriodResult<Item> {
  const expected = validateTransactionDateRange(expectedRange);
  if (result.completeness !== "complete") {
    throw new FinanceError("validation_error", { field: "completeness", reason: "allowed_value" });
  }
  const actual = validateTransactionDateRange(result.range);
  if (actual.startISO !== expected.startISO || actual.endExclusiveISO !== expected.endExclusiveISO) {
    throw new FinanceError("validation_error", { field: "range", reason: "allowed_value" });
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
