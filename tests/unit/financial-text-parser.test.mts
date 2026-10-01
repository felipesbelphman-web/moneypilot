import test from "node:test";
import assert from "node:assert/strict";
import { parseInvestmentPriceText, parseInvestmentQuantityText, parseMoneyText, tryParseMoneyText, tryParseInvestmentQuantityText, tryParseInvestmentPriceText } from "../../src/lib/domain/financial-text-parser.ts";
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

const parserPairs = [
  { name: "money", parse: (value: string) => parseMoneyText(value, "amount", "positive"), tryParse: (value: string) => tryParseMoneyText(value, "amount", "positive"), field: "amount" },
  { name: "quantity", parse: (value: string) => parseInvestmentQuantityText(value), tryParse: (value: string) => tryParseInvestmentQuantityText(value), field: "quantity" },
  { name: "price", parse: (value: string) => parseInvestmentPriceText(value, "price"), tryParse: (value: string) => tryParseInvestmentPriceText(value, "price"), field: "price" },
];

for (const { name, parse, tryParse, field } of parserPairs) {
  test(`${name} rejects original excess precision and underflow through both public APIs`, () => {
    for (const value of ["1.00000000000000001", "1,00000000000000001", `0.${"0".repeat(400)}1`]) {
      assert.throws(() => parse(value), (error: unknown) => error instanceof FinanceError
        && error.code === "validation_error" && error.details?.field === field && !error.message.includes(value));
      assert.equal(tryParse(value), null);
    }
  });

  test(`${name} preserves separators, whitespace, leading and trailing zeros through both public APIs`, () => {
    for (const value of ["1.23000", "  +0001.23000  ", "\t0001,23000\n"]) {
      assert.equal(parse(value), 1.23);
      assert.equal(tryParse(value), 1.23);
    }
    for (const value of ["0", "-0.00000", "-1.23000", "1e2", "1,234.56", "NaN", "Infinity"]) {
      assert.throws(() => parse(value), FinanceError);
      assert.equal(tryParse(value), null);
    }
  });
}

test("money checks exact scale and coefficient boundaries before conversion", () => {
  for (const [text, value] of [["0.0001", 0.0001], ["1.1234", 1.1234], ["900719925474.0991", 900719925474.0991], ["000900719925474,0991000", 900719925474.0991]] as const) {
    assert.equal(parseMoneyText(text, "amount", "positive"), value);
    assert.equal(tryParseMoneyText(text, "amount", "positive"), value);
  }
  for (const text of ["0.00001", "900719925474.0992", "900719925474.09911", "900719925474.099100001"]) {
    assert.throws(() => parseMoneyText(text, "amount", "positive"), FinanceError);
    assert.equal(tryParseMoneyText(text, "amount", "positive"), null);
    assert.equal(tryParseMoneyText(`-${text}`, "amount", "any"), null);
  }
});

test("investment parsers share exact twelve-place and coefficient boundaries", () => {
  for (const { parse, tryParse } of parserPairs.slice(1)) {
    for (const [text, value] of [["0.000000000001", 1e-12], ["1.123456789012000", 1.123456789012], ["9007199254740991", Number.MAX_SAFE_INTEGER], ["9007199254740991.000", Number.MAX_SAFE_INTEGER], ["9007.19925474099", 9007.19925474099]] as const) {
      assert.equal(parse(text), value);
      assert.equal(tryParse(text), value);
    }
    for (const text of ["0.0000000000001", "9007199254740992", "9007199254740991.1", "9007.199254740992", "9007.199254740991"]) {
      assert.throws(() => parse(text), FinanceError);
      assert.equal(tryParse(text), null);
    }
  }
});

test("conversion cannot change a significant digit even within the exact coefficient limit", () => {
  const text = "900719925474.0904";
  assert.equal(Number(text), 900719925474.0905);
  for (const { parse, tryParse } of parserPairs) {
    assert.throws(() => parse(text), FinanceError);
    assert.equal(tryParse(text), null);
  }
});

test("money preserves signed zero and sign policies without accepting underflow as zero", () => {
  for (const sign of ["nonnegative", "any"] as const) {
    for (const text of ["0.00000", "-0000,00000", "+000.00000"]) {
      assert.equal(parseMoneyText(text, "amount", sign), 0);
      assert.equal(tryParseMoneyText(text, "amount", sign), 0);
      assert.equal(Object.is(parseMoneyText(text, "amount", sign), -0), false);
    }
    assert.equal(tryParseMoneyText(`0.${"0".repeat(400)}1`, "amount", sign), null);
    assert.equal(tryParseMoneyText(`-0.${"0".repeat(400)}1`, "amount", sign), null);
  }
  assert.equal(parseMoneyText(" -0001,23000 ", "amount", "any"), -1.23);
  assert.equal(tryParseMoneyText(" -0001,23000 ", "amount", "any"), -1.23);
  assert.equal(tryParseMoneyText("-1.23000", "amount", "nonnegative"), null);
});
