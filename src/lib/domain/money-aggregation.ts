import { analyzeDecimal, MAX_SAFE_MONEY_COEFFICIENT, MONEY_DECIMAL_SCALE, normalizeDerivedMoney, validateMoney } from "./decimal-guard.ts";
import { FinanceError } from "./finance-error.ts";

export type MoneyAggregationResult =
  | { available: true; value: number }
  | { available: false; reason: "invalid_operand" | "unsafe_aggregate" };

const SCALE_FACTOR = BigInt(10) ** BigInt(MONEY_DECIMAL_SCALE);

export function aggregateMoney(values: readonly number[]): MoneyAggregationResult {
  let aggregate = BigInt(0);

  for (const value of values) {
    try {
      validateMoney(value, "operand", "any");
      const decimal = analyzeDecimal(value, "operand");
      const coefficient = decimal.unscaled * BigInt(10) ** BigInt(MONEY_DECIMAL_SCALE - decimal.scale);
      aggregate += decimal.negative && !decimal.zero ? -coefficient : coefficient;
    } catch (error) {
      if (error instanceof FinanceError) return { available: false, reason: "invalid_operand" };
      throw error;
    }
  }

  if (absolute(aggregate) > MAX_SAFE_MONEY_COEFFICIENT) return { available: false, reason: "unsafe_aggregate" };
  const value = Number(aggregate) / Number(SCALE_FACTOR);
  if (!Number.isFinite(value)) return { available: false, reason: "unsafe_aggregate" };
  return { available: true, value: Object.is(value, -0) ? 0 : value };
}

export function normalizeDerivedMoneyResult(value: number): MoneyAggregationResult {
  if (!Number.isFinite(value)) return { available: false, reason: "invalid_operand" };
  try {
    return { available: true, value: normalizeDerivedMoney(value, "derivedMoney") };
  } catch (error) {
    if (error instanceof FinanceError) return { available: false, reason: "unsafe_aggregate" };
    throw error;
  }
}

function absolute(value: bigint) {
  return value < BigInt(0) ? -value : value;
}
