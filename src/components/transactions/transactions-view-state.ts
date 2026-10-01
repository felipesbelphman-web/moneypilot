import { areFinanceResourcesReady, type FinanceResourceStatus, type FinanceResourceStatuses } from "../../lib/persistence/finance-resource-status.ts";
import { FinanceError } from "../../lib/domain/finance-error.ts";
import { financialMonthRange } from "../../lib/dates/financial-month-range.ts";
import { requireCompletePeriodResult, type TransactionDateRange } from "../../lib/persistence/finance-query-contracts.ts";
import type { TransactionPeriodState } from "../../lib/persistence/transaction-period-state.ts";
import { calculateCurrentTransactionAggregates, calculateTransactionKpiAggregates } from "./transaction-period-aggregates.ts";
import type { Language } from "../../i18n/config.ts";

export function getTransactionsAvailability(statuses: FinanceResourceStatuses) {
  return {
    transactionsReady: areFinanceResourcesReady(statuses, ["transactions"]),
    goalsReady: areFinanceResourcesReady(statuses, ["goals"]),
  };
}

// Invalid route/picker boundaries cannot issue a period request.
export function transactionMonthRange(month: string): TransactionDateRange | null {
  try { return financialMonthRange(month); } catch { return null; }
}

function verifiedPeriod(state: TransactionPeriodState, range: TransactionDateRange | null) {
  if (!range || state.status !== "ready") return null;
  try { return requireCompletePeriodResult(state.result, range); } catch { return null; }
}

export function getTransactionPeriodView(
  month: string,
  selected: TransactionPeriodState,
  previous: TransactionPeriodState,
  selectedRange: TransactionDateRange | null,
  previousRange: TransactionDateRange | null,
) {
  const current = verifiedPeriod(selected, selectedRange);
  const prior = verifiedPeriod(previous, previousRange);
  const rows = current ? [...current.items] : null;
  // Adapt period state only for existing presentation props; never replace global statuses.
  const status: FinanceResourceStatus = current
    ? { status: "ready", hasSnapshot: true, error: null }
    : !selectedRange || selected.status === "ready" || selected.status === "error"
      ? { status: "error", hasSnapshot: false, error: selected.status === "error" ? selected.error : new FinanceError("repository_unavailable") }
      : { status: "loading", hasSnapshot: false, error: null };
  const aggregates = rows === null ? null : prior
    ? calculateTransactionKpiAggregates([...rows, ...prior.items], month)
    : calculateCurrentTransactionAggregates(rows, month);
  return { rows, status, aggregates };
}

// Shared presentation copy for resource and verified-period availability.
export const transactionAvailabilityCopy: Record<Language, { loading: string; error: string }> = {
  en: { loading: "Loading transactions…", error: "Unable to load transactions." },
  pt: { loading: "Carregando transações…", error: "Não foi possível carregar as transações." },
  es: { loading: "Cargando transacciones…", error: "No se pudieron cargar las transacciones." },
  de: { loading: "Transaktionen werden geladen…", error: "Transaktionen konnten nicht geladen werden." },
  fr: { loading: "Chargement des transactions…", error: "Impossible de charger les transactions." },
  nl: { loading: "Transacties worden geladen…", error: "Transacties konden niet worden geladen." },
  it: { loading: "Caricamento delle transazioni…", error: "Impossibile caricare le transazioni." },
};
