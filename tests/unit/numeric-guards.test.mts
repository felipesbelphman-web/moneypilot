import assert from "node:assert/strict";
import { test } from "node:test";
import { analyzeDecimal, multiplyInvestmentValue, normalizeDerivedMoney, validateInvestmentPrice, validateInvestmentQuantity, validateMoney } from "../../src/lib/domain/decimal-guard.ts";
import { FinanceError } from "../../src/lib/domain/finance-error.ts";
import { validateAndNormalizeAccountBalanceSettings } from "../../src/lib/domain/account-balance-settings.ts";
import { validateAndNormalizeBudgetAdjustment } from "../../src/lib/domain/budget-validation.ts";
import { validateAndNormalizeInvestment } from "../../src/lib/domain/investment-validation.ts";

function rejects(action: () => unknown, field: string) { assert.throws(action, (error) => error instanceof FinanceError && error.code === "validation_error" && error.details?.field === field); }

test("analyzes ordinary decimals, signs, zeros and scientific notation", () => {
  assert.deepEqual(analyzeDecimal(1200), { negative: false, zero: false, digits: "1200", scale: 0, integerDigits: 4, unscaled: BigInt(1200) });
  assert.equal(analyzeDecimal(12.34).scale, 2); assert.equal(analyzeDecimal(1.2).scale, 1);
  assert.equal(analyzeDecimal(-12.5).negative, true); assert.equal(analyzeDecimal(0).zero, true); assert.equal(analyzeDecimal(-0).negative, true);
  assert.equal(analyzeDecimal(1e3).digits, "1000"); assert.equal(analyzeDecimal(1e-12).scale, 12);
});

test("rejects NaN and infinities", () => { for (const value of [Number.NaN, Infinity, -Infinity]) rejects(() => analyzeDecimal(value), "value"); });

test("money accepts four places, zero, allowed negatives and the conservative boundary", () => {
  validateMoney(10.1234, "money", "positive"); validateMoney(0, "money", "nonnegative"); validateMoney(-10.1234, "money", "any"); validateMoney(900719925474.0991, "money", "positive");
  assert.equal(validateAndNormalizeAccountBalanceSettings({ openingBalance: -1.25, openingDate: "2026-01-01" }).openingBalance, -1.25);
});

test("money rejects fifth places and unsafe boundaries without rounding", () => {
  rejects(() => validateMoney(1.23456, "money", "positive"), "money"); rejects(() => validateMoney(900719925474.0992, "money", "positive"), "money"); rejects(() => validateMoney(99999999999999.99, "money", "positive"), "money");
});

test("quantity accepts twelve places, its minimum and high safe integers", () => {
  validateInvestmentQuantity(0.000000000001); validateInvestmentQuantity(1.123456789012); validateInvestmentQuantity(Number.MAX_SAFE_INTEGER); validateInvestmentQuantity(10000);
});

test("quantity rejects thirteen places and unsafe magnitude-scale combinations", () => {
  rejects(() => validateInvestmentQuantity(1.0000000000001), "quantity"); rejects(() => validateInvestmentQuantity(9007199254.740992), "quantity");
});

test("prices above 9007 are accepted by effective scale while unsafe combinations and signs fail", () => {
  validateInvestmentPrice(250000.25, "price"); validateInvestmentPrice(12.123456789012, "price");
  rejects(() => validateInvestmentPrice(9007199254.740992, "price"), "price"); rejects(() => validateInvestmentPrice(0, "price"), "price"); rejects(() => validateInvestmentPrice(-1, "price"), "price");
});

test("investment validator preserves automatic null and applies quantity guards", () => {
  const investment = { id: "i", name: "Fund", symbol: null, assetType: "etf" as const, quantity: 0.000000000001, averagePurchasePrice: 250000.25, priceMode: "automatic" as const, manualCurrentPrice: null, marketAssetKey: "key", nativeCurrency: "EUR" };
  assert.deepEqual(validateAndNormalizeInvestment(investment), investment); rejects(() => validateAndNormalizeInvestment({ ...investment, quantity: 1.0000000000001 }), "quantity");
});

test("investment multiplication preserves safe products and rejects unsafe products or operands", () => {
  assert.equal(multiplyInvestmentValue(2, 10.25), 20.5); assert.equal(multiplyInvestmentValue(0.0001, 250000.25), 25.000025);
  rejects(() => multiplyInvestmentValue(9007199254740.991, 11), "investmentValue"); rejects(() => multiplyInvestmentValue(Infinity, 1), "quantity");
});

test("strict input rejects real excess scale while the derived boundary normalizes an IEEE artifact once", () => {
  rejects(() => validateAndNormalizeBudgetAdjustment({ month: "2026-01", targetRemainingSpend: 0.30000000000000004, baselineProjectedTotal: 1, adjustmentNeeded: 0, suggestedWeeklyReduction: 0 }), "targetRemainingSpend");
  assert.equal(normalizeDerivedMoney(0.1 + 0.2, "targetRemainingSpend"), 0.3); rejects(() => validateMoney(1.23456, "input", "positive"), "input");
});
