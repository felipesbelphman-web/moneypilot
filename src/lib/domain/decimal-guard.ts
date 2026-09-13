import { FinanceError } from "./finance-error.ts";

const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);
export const MONEY_DECIMAL_SCALE = 4;
export const MAX_SAFE_MONEY_COEFFICIENT = MAX_SAFE;
export type DecimalAnalysis = Readonly<{ negative: boolean; zero: boolean; digits: string; scale: number; integerDigits: number; unscaled: bigint }>;

export function analyzeDecimal(value: number, field = "value"): DecimalAnalysis {
  if (!Number.isFinite(value)) throw new FinanceError("validation_error", { field, reason: "finite" });
  const negative = value < 0 || Object.is(value, -0);
  const match = Math.abs(value).toString().match(/^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i);
  if (!match) throw new FinanceError("validation_error", { field, reason: "invalid_format" });
  const fraction = match[2] ?? "";
  const exponent = Number(match[3] ?? 0);
  let digits = `${match[1]}${fraction}`.replace(/^0+(?=\d)/, "");
  let scale = fraction.length - exponent;
  if (scale < 0) { digits += "0".repeat(-scale); scale = 0; }
  while (scale > 0 && digits.endsWith("0")) { digits = digits.slice(0, -1); scale -= 1; }
  digits = digits.replace(/^0+(?=\d)/, "") || "0";
  return { negative, zero: /^0+$/.test(digits), digits, scale, integerDigits: Math.max(1, digits.length - scale), unscaled: BigInt(digits) };
}

export function validateMoney(value: number, field: string, sign: "positive" | "nonnegative" | "any"): void {
  const decimal = analyzeDecimal(value, field);
  validateSign(decimal, field, sign);
  if (decimal.scale > MONEY_DECIMAL_SCALE || decimal.integerDigits > 14 || decimal.unscaled * BigInt(10) ** BigInt(MONEY_DECIMAL_SCALE - decimal.scale) > MAX_SAFE_MONEY_COEFFICIENT) invalid(field);
}

export function normalizeDerivedMoney(value: number, field: string): number {
  analyzeDecimal(value, field);
  const normalized = Math.round(value * 10_000) / 10_000;
  validateMoney(normalized, field, "nonnegative");
  return normalized;
}

export function validateInvestmentQuantity(value: number, field = "quantity"): void { validateNumeric30(value, field); }
export function validateInvestmentPrice(value: number, field: string): void { validateNumeric30(value, field); }

export function multiplyInvestmentValue(quantity: number, price: number): number {
  validateInvestmentQuantity(quantity); validateInvestmentPrice(price, "price");
  const left = analyzeDecimal(quantity); const right = analyzeDecimal(price);
  let product = left.unscaled * right.unscaled; let scale = left.scale + right.scale;
  while (scale > 0 && product % BigInt(10) === BigInt(0)) { product /= BigInt(10); scale -= 1; }
  if (product > MAX_SAFE) invalid("investmentValue");
  const result = quantity * price;
  if (!Number.isFinite(result)) throw new FinanceError("validation_error", { field: "investmentValue", reason: "finite" });
  return result;
}

function validateNumeric30(value: number, field: string): void {
  const decimal = analyzeDecimal(value, field); validateSign(decimal, field, "positive");
  if (decimal.scale > 12 || decimal.integerDigits > 18 || decimal.unscaled > MAX_SAFE) invalid(field);
}
function validateSign(decimal: DecimalAnalysis, field: string, sign: "positive" | "nonnegative" | "any") {
  if (sign === "positive" && (decimal.negative || decimal.zero)) throw new FinanceError("validation_error", { field, reason: "positive" });
  if (sign === "nonnegative" && decimal.negative && !decimal.zero) throw new FinanceError("validation_error", { field, reason: "nonnegative" });
}
function invalid(field: string): never { throw new FinanceError("validation_error", { field, reason: "allowed_value" }); }
