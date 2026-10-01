import { FinanceError } from "../domain/finance-error.ts";

/** Call after query-error handling and before mapping collection rows. */
export function requireCompleteCollection<Row>(data: Row[] | null | undefined, count: number | null | undefined): Row[] {
  if (!Array.isArray(data) || typeof count !== "number" || !Number.isSafeInteger(count) || count < 0 || count !== data.length) {
    throw new FinanceError("repository_unavailable", { reason: "incomplete_collection" });
  }
  return data;
}
