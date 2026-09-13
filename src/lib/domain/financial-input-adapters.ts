import {
  tryParseInvestmentPriceText,
  tryParseInvestmentQuantityText,
  tryParseMoneyText,
} from "./financial-text-parser.ts";

export const parseTransactionAmountText = (value: string) => tryParseMoneyText(value, "amount", "positive");
export const parseBudgetLimitText = (value: string) => tryParseMoneyText(value, "limit", "positive");
export const parseGoalTargetAmountText = (value: string) => tryParseMoneyText(value, "targetAmount", "positive");
export const parseGoalSavedAmountText = (value: string) => tryParseMoneyText(value, "savedAmount", "nonnegative");
export const parseInvestmentQuantityInput = (value: string) => tryParseInvestmentQuantityText(value, "quantity");
export const parseInvestmentAveragePriceInput = (value: string) => tryParseInvestmentPriceText(value, "averagePurchasePrice");
export const parseInvestmentManualPriceInput = (value: string) => tryParseInvestmentPriceText(value, "manualCurrentPrice");
export const parseCsvAmountText = (value: string) => tryParseMoneyText(value, "amount", "any");
export const parseCsvEditableAmountText = (value: string) => tryParseMoneyText(value, "amount", "positive");
