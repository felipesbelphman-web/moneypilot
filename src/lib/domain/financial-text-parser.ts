import { validateInvestmentPrice, validateInvestmentQuantity, validateMoney } from "./decimal-guard.ts";
import { FinanceError } from "./finance-error.ts";

type MoneySign = "positive" | "nonnegative" | "any";

function parseDecimalText(value: string, field: string): number {
  const text = value.trim();
  if (!text || !/^[+-]?\d+(?:[.,]\d+)?$/.test(text)) return invalid(field);
  const parsed = Number(text.replace(",", "."));
  if (!Number.isFinite(parsed)) return invalid(field);
  return Object.is(parsed, -0) ? 0 : parsed;
}

export function parseMoneyText(value: string, field: string, sign: MoneySign): number {
  const parsed = parseDecimalText(value, field);
  validateMoney(parsed, field, sign);
  return parsed;
}

export function parseInvestmentQuantityText(value: string, field = "quantity"): number {
  const parsed = parseDecimalText(value, field); validateInvestmentQuantity(parsed, field); return parsed;
}
export function parseInvestmentPriceText(value: string, field: string): number {
  const parsed = parseDecimalText(value, field); validateInvestmentPrice(parsed, field); return parsed;
}
export function tryParseMoneyText(value: string, field: string, sign: MoneySign): number | null {
  try { return parseMoneyText(value, field, sign); } catch (error) { if (error instanceof FinanceError) return null; throw error; }
}
export function tryParseInvestmentQuantityText(value: string, field = "quantity"): number | null {
  try { return parseInvestmentQuantityText(value, field); } catch (error) { if (error instanceof FinanceError) return null; throw error; }
}
export function tryParseInvestmentPriceText(value: string, field: string): number | null {
  try { return parseInvestmentPriceText(value, field); } catch (error) { if (error instanceof FinanceError) return null; throw error; }
}
function invalid(field: string): never { throw new FinanceError("validation_error", { field, reason: "invalid_format" }); }
