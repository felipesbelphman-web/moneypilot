import test from "node:test";
import assert from "node:assert/strict";
import { parseInvestmentPriceText, parseInvestmentQuantityText, parseMoneyText, tryParseMoneyText } from "../../src/lib/domain/financial-text-parser.ts";
import { FinanceError } from "../../src/lib/domain/finance-error.ts";

test("money accepts supported decimal text", () => {
  assert.equal(parseMoneyText(" 12.34 ", "amount", "positive"), 12.34);
  assert.equal(parseMoneyText("12,34", "amount", "positive"), 12.34);
  assert.equal(parseMoneyText("0,1234", "amount", "nonnegative"), 0.1234);
  assert.equal(parseMoneyText("1.234", "amount", "positive"), 1.234);
  assert.equal(parseMoneyText("1,234", "amount", "positive"), 1.234);
});
test("money rejects unsafe textual forms", () => {
  for (const value of ["", " ", "+", ".", "R$ 12,00", "1 2", "1,2,3", "1.2.3", "1,.2", "1.,2", "1,234.56", "1.234,56", "1e2", "Infinity", "NaN", "1.23456"])
    assert.equal(tryParseMoneyText(value, "amount", "positive"), null, value);
});
test("money enforces sign policies", () => {
  assert.equal(tryParseMoneyText("0", "amount", "positive"), null);
  assert.equal(tryParseMoneyText("-1", "amount", "nonnegative"), null);
  assert.equal(parseMoneyText("-1,25", "amount", "any"), -1.25);
  assert.equal(parseMoneyText("-0", "amount", "nonnegative"), 0);
});
test("money enforces safe magnitude", () => {
  assert.equal(parseMoneyText("900719925474.0991", "amount", "positive"), 900719925474.0991);
  assert.equal(tryParseMoneyText("900719925474.0992", "amount", "positive"), null);
  assert.equal(tryParseMoneyText("100000000000000", "amount", "positive"), null);
});
test("investment inputs use their wider precision contract", () => {
  assert.equal(parseInvestmentQuantityText("0,00000001"), 0.00000001);
  assert.equal(parseInvestmentPriceText("1234.56789012", "price"), 1234.56789012);
});
test("investment inputs reject invalid text", () => {
  for (const value of ["", "0", "-1", "1e-8", "$2"]) {
    assert.throws(() => parseInvestmentQuantityText(value), FinanceError);
    assert.throws(() => parseInvestmentPriceText(value, "price"), FinanceError);
  }
});
test("errors do not echo input and failed parsing cannot trigger writes", () => {
  const secret = "R$ private-123"; let writes = 0;
  assert.throws(() => parseMoneyText(secret, "amount", "positive"), (error: unknown) => error instanceof FinanceError && error.code === "validation_error" && !error.message.includes(secret));
  const parsed = tryParseMoneyText("1e3", "amount", "positive"); if (parsed !== null) writes += 1;
  assert.equal(writes, 0);
});
