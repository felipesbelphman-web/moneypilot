import { analyzeDecimal, analyzeDecimalText, validateInvestmentDecimal, validateMoneyDecimal, type DecimalAnalysis } from "./decimal-guard.ts";
import { FinanceError } from "./finance-error.ts";

type MoneySign = "positive" | "nonnegative" | "any";

function parseDecimalText(value: string, field: string, validate: (decimal: DecimalAnalysis) => void): number {
  const text = value.trim();
  const decimal = analyzeDecimalText(text, field);
  validate(decimal);
  const parsed = Number(text.replace(",", "."));
  if (!Number.isFinite(parsed)) return invalid(field);
  // A valid coefficient can still lose a significant decimal digit in Number().
  const converted = analyzeDecimal(parsed, field);
  if (converted.unscaled !== decimal.unscaled || converted.scale !== decimal.scale
    || (!decimal.zero && converted.negative !== decimal.negative)) return invalid(field);
  return Object.is(parsed, -0) ? 0 : parsed;
}

export function parseMoneyText(value: string, field: string, sign: MoneySign): number {
  return parseDecimalText(value, field, (decimal) => validateMoneyDecimal(decimal, field, sign));
}

export function parseInvestmentQuantityText(value: string, field = "quantity"): number {
  return parseDecimalText(value, field, (decimal) => validateInvestmentDecimal(decimal, field));
}
export function parseInvestmentPriceText(value: string, field: string): number {
  return parseDecimalText(value, field, (decimal) => validateInvestmentDecimal(decimal, field));
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
