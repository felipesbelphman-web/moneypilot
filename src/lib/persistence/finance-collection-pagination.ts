import { FinanceError, mapFinanceRepositoryError } from "../domain/finance-error.ts";
import { requireCompleteCollection } from "./finance-collection-completeness.ts";

export type FinanceCollectionPageRequest = Readonly<{
  from: number;
  to: number;
  count: "exact";
  signal?: AbortSignal;
}>;

export type FinanceCollectionPage<Row> = Readonly<{
  data: Row[] | null;
  count: number | null;
  error: unknown | null;
}>;

export const financeCollectionPaginationDefaults = {
  pageSize: 200,
  maxPages: 500,
  maxRows: 100_000,
  maxRestarts: 1,
} as const;

type Options<Row> = {
  /** Build a fresh query; preserve scope, projection, filters and deterministic
   * ordering on EVERY call. Apply count, inclusive range and signal as supplied.
   * This generic primitive cannot inspect or enforce the caller's query scope. */
  fetchPage: (request: FinanceCollectionPageRequest) => PromiseLike<FinanceCollectionPage<Row>>;
  identity: (row: Row) => string;
  pageSize?: number;
  maxPages?: number;
  maxRows?: number;
  maxRestarts?: 0 | 1;
  signal?: AbortSignal;
};

/**
 * Exhaustive retrieval verifies observed coverage for this retrieval attempt.
 * Multiple HTTP requests do not constitute one atomic database snapshot.
 * Same-count membership replacement and edits to values can remain undetected.
 * Rows remain private until an entire attempt succeeds; caller owns row mapping.
 * maxPages bounds the whole operation, including discarded restart attempts.
 * Defaults protect the application; they do not describe any server row cap.
 */
export async function retrieveFinanceCollection<Row>(options: Options<Row>): Promise<Row[]> {
  const { fetchPage, identity, signal } = options;
  const pageSize = options.pageSize ?? financeCollectionPaginationDefaults.pageSize;
  const maxPages = options.maxPages ?? financeCollectionPaginationDefaults.maxPages;
  const maxRows = options.maxRows ?? financeCollectionPaginationDefaults.maxRows;
  const maxRestarts = options.maxRestarts ?? financeCollectionPaginationDefaults.maxRestarts;
  if (![pageSize, maxPages, maxRows].every(value => Number.isSafeInteger(value) && value > 0)
    || (maxRestarts !== 0 && maxRestarts !== 1)) throw incomplete();

  let pages = 0;
  let restarts = 0;
  try {
    for (;;) {
      const rows: Row[] = [];
      const identities = new Set<string>();
      let expected: number | undefined;
      for (;;) {
        checkAborted(signal);
        if (pages >= maxPages) throw incomplete();
        const from = rows.length;
        const to = from + pageSize - 1;
        if (!Number.isSafeInteger(to)) throw incomplete();
        pages++;
        const page = await abortable(() => fetchPage({ from, to, count: "exact", signal }), signal);
        checkAborted(signal);
        if (page.error) throw mapFinanceRepositoryError(page.error);
        if (!Array.isArray(page.data) || typeof page.count !== "number"
          || !Number.isSafeInteger(page.count) || page.count < 0 || page.count > maxRows
          || page.data.length > pageSize) throw incomplete();
        if (expected !== undefined && page.count !== expected) {
          if (restarts >= maxRestarts) throw incomplete();
          restarts++;
          break; // Discard all rows and identities; restart at offset zero.
        }
        expected = page.count;
        if (rows.length + page.data.length > expected || rows.length + page.data.length > maxRows) throw incomplete();
        if (page.data.length === 0 && rows.length < expected) throw incomplete();
        for (const row of page.data) {
          const key = identity(row);
          if (typeof key !== "string" || key.trim().length === 0 || identities.has(key)) throw incomplete();
          identities.add(key);
          rows.push(row);
        }
        checkAborted(signal);
        if (rows.length === expected) return requireCompleteCollection(rows, expected);
        // A short page may reflect a lower server cap. Continue by actual length.
      }
    }
  } catch (error) {
    throw mapFinanceRepositoryError(error);
  }
}

function incomplete() {
  return new FinanceError("repository_unavailable", { reason: "incomplete_collection" });
}

function checkAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new FinanceError("repository_unavailable");
}

// Reject promptly even if a caller ignores the signal. No late result is exposed.
function abortable<Value>(run: () => PromiseLike<Value>, signal?: AbortSignal): Promise<Value> {
  if (!signal) return Promise.resolve().then(run);
  return new Promise((resolve, reject) => {
    const onAbort = () => { cleanup(); reject(new FinanceError("repository_unavailable")); };
    const cleanup = () => signal.removeEventListener("abort", onAbort);
    signal.addEventListener("abort", onAbort, { once: true });
    if (signal.aborted) { onAbort(); return; }
    Promise.resolve().then(() => { checkAborted(signal); return run(); }).then(
      value => { cleanup(); resolve(value); },
      error => { cleanup(); reject(error); },
    );
  });
}
