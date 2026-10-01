import { shiftMonth, validMonth } from "../../components/dashboard/financial-calendar-model.ts";
import { FinanceError } from "../domain/finance-error.ts";
import { validateTransactionDateRange } from "../persistence/finance-query-contracts.ts";

/** Compose existing civil-month navigation and exact period validation. */
export function financialMonthRange(month: string) {
  if (typeof month !== "string" || !validMonth(month)) throw new FinanceError("validation_error", { field: "month", reason: "invalid_format" });
  return validateTransactionDateRange({ startISO: `${month}-01`, endExclusiveISO: `${shiftMonth(month, 1)}-01` });
}
