import type { Investment, InvestmentAssetType, InvestmentPriceMode } from "@/components/investments/investment-model";
import { FinanceError } from "./finance-error.ts";
import { multiplyInvestmentValue, validateInvestmentPrice, validateInvestmentQuantity } from "./decimal-guard.ts";
import { normalizeDerivedMoneyResult } from "./money-aggregation.ts";

export function validateAndNormalizeInvestment(investment: Investment): Investment {
  const normalized = {
    ...investment,
    id: requiredText(investment.id, "id"),
    name: requiredText(investment.name, "name"),
    symbol: nullableText(investment.symbol, "symbol"),
    marketAssetKey: nullableText(investment.marketAssetKey, "marketAssetKey"),
    nativeCurrency: requiredText(investment.nativeCurrency, "nativeCurrency").toUpperCase(),
  };

  const assetType = parseInvestmentAssetType(normalized.assetType);
  const priceMode = parseInvestmentPriceMode(normalized.priceMode);

  validateInvestmentQuantity(normalized.quantity);
  validateInvestmentPrice(normalized.averagePurchasePrice, "averagePurchasePrice");
  multiplyInvestmentValue(normalized.quantity, normalized.averagePurchasePrice);

  if (!/^[A-Z]{3}$/.test(normalized.nativeCurrency)) {
    throw new FinanceError("validation_error", { field: "nativeCurrency", reason: "invalid_format" });
  }

  if (priceMode === "manual") {
    if (normalized.manualCurrentPrice === null) {
      throw new FinanceError("validation_error", { field: "manualCurrentPrice", reason: "required" });
    }
    validateInvestmentPrice(normalized.manualCurrentPrice, "manualCurrentPrice");
    multiplyInvestmentValue(normalized.quantity, normalized.manualCurrentPrice);
  } else {
    if (normalized.marketAssetKey === null) {
      throw new FinanceError("validation_error", { field: "marketAssetKey", reason: "required" });
    }
    if (normalized.manualCurrentPrice !== null) {
      throw new FinanceError("validation_error", { field: "manualCurrentPrice", reason: "allowed_value" });
    }
  }

  if (assetType === "other" && priceMode !== "manual") {
    throw new FinanceError("validation_error", { field: "priceMode", reason: "allowed_value" });
  }

  return { ...normalized, assetType, priceMode };
}

export function calculateInvestmentValues(investment: Investment) {
  const validated = validateAndNormalizeInvestment(investment);
  return {
    investedValue: multiplyInvestmentValue(validated.quantity, validated.averagePurchasePrice),
    currentValue: validated.priceMode === "manual" && validated.manualCurrentPrice !== null
      ? multiplyInvestmentValue(validated.quantity, validated.manualCurrentPrice)
      : null,
  };
}

export type InvestmentValuation =
  | { available: true; unavailableReason: null; investedValue: number; currentValue: number | null }
  | { available: false; unavailableReason: "invalid_operand" | "unsafe_aggregate"; investedValue: null; currentValue: null };

export function calculateInvestmentValuation(investment: Investment): InvestmentValuation {
  try {
    const values = calculateInvestmentValues(investment);
    const investedValue = normalizeDerivedMoneyResult(values.investedValue);
    const currentValue = values.currentValue === null ? null : normalizeDerivedMoneyResult(values.currentValue);
    if (!investedValue.available || (currentValue !== null && !currentValue.available)) {
      return { available: false, unavailableReason: !investedValue.available ? investedValue.reason : currentValue && !currentValue.available ? currentValue.reason : "unsafe_aggregate", investedValue: null, currentValue: null };
    }
    return { available: true, unavailableReason: null, investedValue: investedValue.value, currentValue: currentValue?.value ?? null };
  } catch (error) {
    if (error instanceof FinanceError) {
      return {
        available: false,
        unavailableReason: error.details?.field === "investmentValue" ? "unsafe_aggregate" : "invalid_operand",
        investedValue: null,
        currentValue: null,
      };
    }
    throw error;
  }
}

function requiredText(value: string, field: string) {
  if (typeof value !== "string") throw new FinanceError("validation_error", { field, reason: "required" });
  const normalized = value.trim();
  if (!normalized) throw new FinanceError("validation_error", { field, reason: "required" });
  return normalized;
}

function nullableText(value: string | null, field: string) {
  if (value === null) return null;
  if (typeof value !== "string") throw new FinanceError("validation_error", { field, reason: "allowed_value" });
  const normalized = value.trim();
  return normalized || null;
}

export function parseInvestmentAssetType(value: unknown): InvestmentAssetType {
  if (value === "stock" || value === "etf" || value === "crypto" || value === "other") return value;
  throw new FinanceError("validation_error", { field: "assetType", reason: "allowed_value" });
}

export function parseInvestmentPriceMode(value: unknown): InvestmentPriceMode {
  if (value === "automatic" || value === "manual") return value;
  throw new FinanceError("validation_error", { field: "priceMode", reason: "allowed_value" });
}
