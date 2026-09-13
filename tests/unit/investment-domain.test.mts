import assert from "node:assert/strict";
import { test } from "node:test";
import type { Investment } from "../../src/components/investments/investment-model.ts";
import { FinanceError } from "../../src/lib/domain/finance-error.ts";
import { calculateInvestmentValuation, calculateInvestmentValues, validateAndNormalizeInvestment } from "../../src/lib/domain/investment-validation.ts";

const validManual: Investment = {
  id: "investment-1",
  name: "Ação internacional",
  symbol: "ACME",
  assetType: "stock",
  quantity: 2.5,
  averagePurchasePrice: 123.45,
  priceMode: "manual",
  manualCurrentPrice: 140.25,
  marketAssetKey: null,
  nativeCurrency: "USD",
};

const validAutomatic: Investment = {
  ...validManual,
  id: "investment-2",
  priceMode: "automatic",
  manualCurrentPrice: null,
  marketAssetKey: "market-asset-key",
};

function expectValidationError(action: () => unknown, field: string, reason: string) {
  assert.throws(action, (error) => error instanceof FinanceError
    && error.code === "validation_error"
    && error.details?.field === field
    && error.details.reason === reason);
}

test("accepts a valid manual investment", () => assert.deepEqual(validateAndNormalizeInvestment(validManual), validManual));
test("accepts a valid automatic investment", () => assert.deepEqual(validateAndNormalizeInvestment(validAutomatic), validAutomatic));

test("normalizes external whitespace and compatible currency casing", () => {
  const normalized = validateAndNormalizeInvestment({
    ...validAutomatic,
    id: "  investment-2  ",
    name: "  Ação internacional  ",
    symbol: "  Acmé  ",
    marketAssetKey: "  market-asset-key  ",
    nativeCurrency: " usd ",
  });
  assert.equal(normalized.id, "investment-2");
  assert.equal(normalized.name, "Ação internacional");
  assert.equal(normalized.symbol, "Acmé");
  assert.equal(normalized.marketAssetKey, "market-asset-key");
  assert.equal(normalized.nativeCurrency, "USD");
});

test("accepts a valid three-letter currency", () => assert.equal(validateAndNormalizeInvestment({ ...validManual, nativeCurrency: "eur" }).nativeCurrency, "EUR"));
test("rejects an invalid currency", () => expectValidationError(() => validateAndNormalizeInvestment({ ...validManual, nativeCurrency: "US" }), "nativeCurrency", "invalid_format"));
test("rejects an empty id", () => expectValidationError(() => validateAndNormalizeInvestment({ ...validManual, id: "   " }), "id", "required"));
test("rejects an empty name", () => expectValidationError(() => validateAndNormalizeInvestment({ ...validManual, name: "   " }), "name", "required"));
test("rejects an invalid asset type", () => expectValidationError(() => validateAndNormalizeInvestment({ ...validManual, assetType: "bond" as Investment["assetType"] }), "assetType", "allowed_value"));
test("rejects an invalid price mode", () => expectValidationError(() => validateAndNormalizeInvestment({ ...validManual, priceMode: "hybrid" as Investment["priceMode"] }), "priceMode", "allowed_value"));

for (const field of ["quantity", "averagePurchasePrice"] as const) {
  for (const [label, value, reason] of [
    ["zero", 0, "positive"],
    ["negative", -1, "positive"],
    ["NaN", Number.NaN, "finite"],
    ["infinity", Number.POSITIVE_INFINITY, "finite"],
  ] as const) {
    test(`rejects ${label} for ${field}`, () => {
      expectValidationError(() => validateAndNormalizeInvestment({ ...validManual, [field]: value }), field, reason);
    });
  }
}

test("rejects manual mode without a current price", () => expectValidationError(() => validateAndNormalizeInvestment({ ...validManual, manualCurrentPrice: null }), "manualCurrentPrice", "required"));
for (const [label, value, reason] of [
  ["zero", 0, "positive"],
  ["negative", -1, "positive"],
  ["NaN", Number.NaN, "finite"],
  ["infinity", Number.POSITIVE_INFINITY, "finite"],
] as const) {
  test(`rejects ${label} manual current price`, () => {
    expectValidationError(() => validateAndNormalizeInvestment({ ...validManual, manualCurrentPrice: value }), "manualCurrentPrice", reason);
  });
}

test("rejects automatic mode without a market asset key", () => expectValidationError(() => validateAndNormalizeInvestment({ ...validAutomatic, marketAssetKey: "   " }), "marketAssetKey", "required"));
test("rejects automatic mode with a manual price", () => expectValidationError(() => validateAndNormalizeInvestment({ ...validAutomatic, manualCurrentPrice: 10 }), "manualCurrentPrice", "allowed_value"));
test("rejects other assets in automatic mode", () => expectValidationError(() => validateAndNormalizeInvestment({ ...validAutomatic, assetType: "other" }), "priceMode", "allowed_value"));
test("accepts other assets in manual mode", () => assert.deepEqual(validateAndNormalizeInvestment({ ...validManual, assetType: "other" }), { ...validManual, assetType: "other" }));

test("preserves valid fields without calculations", () => {
  const input = { ...validManual, quantity: 1.234567, averagePurchasePrice: 98.76, manualCurrentPrice: 101.23 };
  const output = validateAndNormalizeInvestment(input);
  assert.equal(output.assetType, input.assetType);
  assert.equal(output.priceMode, input.priceMode);
  assert.equal(output.quantity, input.quantity);
  assert.equal(output.averagePurchasePrice, input.averagePurchasePrice);
  assert.equal(output.manualCurrentPrice, input.manualCurrentPrice);
});

test("accepts safe average and manual products without altering operands", () => {
  const input = { ...validManual, quantity: 0.0001, averagePurchasePrice: 250000.25, manualCurrentPrice: 300000.5 };
  assert.deepEqual(validateAndNormalizeInvestment(input), input);
});

test("rejects individually valid operands when the average-price product is unsafe", () => {
  expectValidationError(
    () => validateAndNormalizeInvestment({ ...validAutomatic, quantity: 9007199254740.991, averagePurchasePrice: 11 }),
    "investmentValue",
    "allowed_value",
  );
});

test("rejects individually valid operands when the manual-price product is unsafe", () => {
  expectValidationError(
    () => validateAndNormalizeInvestment({ ...validManual, quantity: 9007199254740.991, averagePurchasePrice: 1, manualCurrentPrice: 11 }),
    "investmentValue",
    "allowed_value",
  );
});

test("automatic pricing preserves null and validates only the available purchase product", () => {
  const input = { ...validAutomatic, quantity: 0.5, averagePurchasePrice: 20000.25, manualCurrentPrice: null };
  assert.deepEqual(validateAndNormalizeInvestment(input), input);
});

test("the real consumer contract calculates invested and manual current values centrally", () => {
  assert.deepEqual(calculateInvestmentValues({ ...validManual, quantity: 2, averagePurchasePrice: 10.25, manualCurrentPrice: 11.5 }), {
    investedValue: 20.5,
    currentValue: 23,
  });
});

test("the real consumer contract preserves unavailable automatic current value", () => {
  assert.deepEqual(calculateInvestmentValues({ ...validAutomatic, quantity: 2, averagePurchasePrice: 10.25 }), {
    investedValue: 20.5,
    currentValue: null,
  });
});

test("safe valuation preserves fractional quantity and decimal multiplication", () => {
  assert.deepEqual(calculateInvestmentValuation({ ...validManual, quantity: 0.1, averagePurchasePrice: 0.2, manualCurrentPrice: 0.3 }), {
    available: true,
    unavailableReason: null,
    investedValue: 0.02,
    currentValue: 0.03,
  });
});

test("safe valuation preserves four-place prices and quantity precision", () => {
  const result = calculateInvestmentValuation({ ...validManual, quantity: 1.23456789, averagePurchasePrice: 10.0001, manualCurrentPrice: 11.0001 });
  assert.equal(result.available, true);
  if (!result.available) return;
  assert.equal(result.investedValue, 12.3458);
  assert.equal(result.currentValue, 13.5804);
});

test("safe valuation keeps automatic current value absent rather than zero", () => {
  assert.deepEqual(calculateInvestmentValuation(validAutomatic), {
    available: true,
    unavailableReason: null,
    investedValue: validAutomatic.quantity * validAutomatic.averagePurchasePrice,
    currentValue: null,
  });
});

test("safe valuation rejects zero quantity without manufacturing zero money", () => {
  assert.deepEqual(calculateInvestmentValuation({ ...validManual, quantity: 0 }), {
    available: false,
    unavailableReason: "invalid_operand",
    investedValue: null,
    currentValue: null,
  });
});

test("safe valuation rejects invalid operands with a sanitized reason", () => {
  const result = calculateInvestmentValuation({ ...validManual, id: "private-id", name: "private-name", quantity: Number.NaN });
  assert.deepEqual(result, { available: false, unavailableReason: "invalid_operand", investedValue: null, currentValue: null });
  assert.equal(JSON.stringify(result).includes("private"), false);
});

test("safe valuation classifies an unsafe multiplication result", () => {
  assert.deepEqual(calculateInvestmentValuation({ ...validManual, quantity: 9007199254740.991, averagePurchasePrice: 1, manualCurrentPrice: 11 }), {
    available: false,
    unavailableReason: "unsafe_aggregate",
    investedValue: null,
    currentValue: null,
  });
});

test("asset list narrows valuation availability before formatting money", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../../src/components/investments/InvestmentAssetsList.tsx", import.meta.url), "utf8");
  assert.match(source, /valuation\.available\s*\?\s*formatMoney\(valuation\.investedValue/);
  assert.match(source, /!valuation\.available \|\| valuation\.currentValue === null/);
  assert.doesNotMatch(source, /calculateInvestmentValues\(investment\)/);
});

test("does not access an external quote source", () => {
  const previousFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = (() => { fetchCalls += 1; throw new Error("unexpected fetch"); }) as typeof fetch;
  try {
    validateAndNormalizeInvestment(validAutomatic);
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = previousFetch;
  }
});
