import type { Transaction } from "../../components/transactions/transaction-model.ts";
import { FinanceError, mapFinanceRepositoryError } from "../domain/finance-error.ts";
import { requireCompletePeriodResult, validateTransactionDateRange, type CompletePeriodResult, type TransactionDateRange } from "./finance-query-contracts.ts";

type Result = CompletePeriodResult<Transaction>;
export type TransactionPeriodState =
  | { status: "idle" | "loading" }
  | { status: "ready"; result: Result }
  | { status: "refreshing" | "stale"; retainedResult?: Result }
  | { status: "error"; error: FinanceError; retainedResult?: Result };
export type TransactionPeriodKey = string & { readonly __transactionPeriodKey: unique symbol };
export function transactionPeriodKey(userId: string, range: TransactionDateRange): TransactionPeriodKey {
  const copied = validateTransactionDateRange(range);
  if (typeof userId !== "string" || !userId.trim()) throw new FinanceError("authentication_required");
  return JSON.stringify([userId, copied.startISO, copied.endExclusiveISO]) as TransactionPeriodKey;
}
export function readyTransactionPeriod(state: TransactionPeriodState): Result | null {
  return state.status === "ready" ? state.result : null;
}
function retained(state: TransactionPeriodState): Result | undefined {
  return state.status === "ready" ? state.result : "retainedResult" in state ? state.retainedResult : undefined;
}
type Entry = { range: TransactionDateRange; generation: number; state: TransactionPeriodState; pending?: Promise<void> };

/** Session-only observed coverage. Generations prevent publication, not external writes. */
export class TransactionPeriodCache {
  private entries = new Map<TransactionPeriodKey, Entry>();
  private owner: string | null = null;
  private accountGeneration = 0;
  private readonly changed: () => void;
  constructor(changed: () => void) { this.changed = changed; }
  synchronizeOwner(owner: string | null, generation: number) {
    if (owner === this.owner && generation === this.accountGeneration) return;
    this.owner = owner;
    this.accountGeneration = generation;
    this.entries.clear();
    this.changed();
  }
  get(range: TransactionDateRange): TransactionPeriodState {
    const copied = validateTransactionDateRange(range);
    return this.owner ? this.entries.get(transactionPeriodKey(this.owner, copied))?.state ?? { status: "idle" } : { status: "idle" };
  }
  request(range: TransactionDateRange, refresh: boolean, fetch: (owner: string, range: TransactionDateRange) => Promise<Result>): Promise<void> {
    const copied = validateTransactionDateRange(range);
    const owner = this.owner;
    if (!owner) return Promise.resolve();
    const accountGeneration = this.accountGeneration;
    const key = transactionPeriodKey(owner, copied);
    let entry = this.entries.get(key);
    if (!refresh && entry?.pending) return entry.pending;
    if (!refresh && entry?.state.status === "ready") return Promise.resolve();
    if (!entry) {
      entry = { range: copied, generation: 0, state: { status: "idle" } };
      this.entries.set(key, entry);
    }
    const target = entry;
    const generation = ++target.generation;
    const previous = retained(target.state);
    target.state = previous ? { status: "refreshing", retainedResult: previous } : { status: "loading" };
    const current = () => this.owner === owner && this.accountGeneration === accountGeneration
      && this.entries.get(key) === target && target.generation === generation;
    // Defer invocation until the pending promise is installed, including synchronous throws.
    const pending = Promise.resolve().then(() => fetch(owner, copied)).then(result => {
      if (!current()) return;
      target.state = { status: "ready", result: requireCompletePeriodResult(result, copied) };
    }).catch(error => {
      if (current()) target.state = { status: "error", error: mapFinanceRepositoryError(error), ...(previous ? { retainedResult: previous } : {}) };
    }).finally(() => {
      if (!current()) return;
      target.pending = undefined;
      this.changed();
    });
    target.pending = pending;
    this.changed();
    return pending;
  }
  invalidate(dates: readonly string[] | null) {
    let changed = false;
    for (const entry of this.entries.values()) {
      if (dates !== null && !dates.some(date => entry.range.startISO <= date && date < entry.range.endExclusiveISO)) continue;
      const previous = retained(entry.state);
      entry.generation++;
      entry.pending = undefined;
      entry.state = { status: "stale", ...(previous ? { retainedResult: previous } : {}) };
      changed = true;
    }
    if (changed) this.changed();
  }
  datesForTransaction(id: string): string[] {
    return [...new Set([...this.entries.values()].flatMap(entry =>
      retained(entry.state)?.items.filter(item => item.id === id).map(item => item.dateISO) ?? []))];
  }
}
