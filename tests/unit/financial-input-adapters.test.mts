import test from "node:test";
import assert from "node:assert/strict";
import { parseBudgetLimitText, parseCsvEditableAmountText, parseGoalSavedAmountText, parseGoalTargetAmountText, parseInvestmentAveragePriceInput, parseInvestmentManualPriceInput, parseInvestmentQuantityInput, parseTransactionAmountText } from "../../src/lib/domain/financial-input-adapters.ts";
import { parseImportedAmount, parseTransactionCsv, validateImportedDraft } from "../../src/components/transactions/csv-import.ts";

test("real money form adapters preserve valid inputs and reject invalid writes", () => {
  for (const parse of [parseTransactionAmountText, parseBudgetLimitText, parseGoalTargetAmountText]) {
    assert.equal(parse("12,50"), 12.5); assert.equal(parse(""), null); assert.equal(parse("12x"), null);
    assert.equal(parse("1.23456"), null); assert.equal(parse("-1"), null);
  }
  assert.equal(parseGoalSavedAmountText("0"), 0); assert.equal(parseGoalSavedAmountText("-1"), null);
});
test("real investment adapters enforce quantity and price contracts", () => {
  assert.equal(parseInvestmentQuantityInput("0.000000000001"), 0.000000000001);
  assert.equal(parseInvestmentQuantityInput("0.0000000000001"), null);
  assert.equal(parseInvestmentAveragePriceInput("100000.25"), 100000.25);
  assert.equal(parseInvestmentManualPriceInput("12x"), null); assert.equal(parseInvestmentManualPriceInput(""), null);
});
test("CSV amount adapter applies the explicit separator grammar", () => {
  for (const [text, expected] of [["1", 1], ["12.50", 12.5], ["12,50", 12.5], ["1.234", 1.234], ["1,234", 1.234]] as const) assert.equal(parseImportedAmount(text), expected);
  for (const text of ["1.234,56", "1,234.56", "12x", "", "1e2", "1.23456"]) assert.equal(parseImportedAmount(text), null, text);
});
test("CSV editor adapter never converts invalid or empty input to zero", () => {
  assert.equal(parseCsvEditableAmountText("25,50"), 25.5); assert.equal(parseCsvEditableAmountText(""), null);
  assert.equal(parseCsvEditableAmountText("0"), null); assert.equal(parseCsvEditableAmountText("2x"), null);
});
test("valid CSV rows become validated transaction drafts", () => {
  const [draft] = parseTransactionCsv("date,description,amount,type\n2026-09-10,Coffee,12.50,expense");
  assert.equal(draft.amount, 12.5); assert.deepEqual(validateImportedDraft(draft), []);
});
test("invalid CSV rows cannot become persistible or leak their contents", () => {
  let writes = 0;
  for (const amount of ["", "1.234,56", "1,234.56", "12x", "1e2", "1.23456"]) {
    const [draft] = parseTransactionCsv(`date;description;amount;type\n2026-09-10;Private description;${amount};expense`);
    const errors = validateImportedDraft(draft); if (errors.length === 0) writes += 1;
    assert.ok(errors.includes("Valor inválido")); if (amount) assert.equal(errors.join(" ").includes(amount), false);
    assert.equal(errors.join(" ").includes("Private description"), false);
  }
  assert.equal(writes, 0);
});
test("signed CSV values preserve inferred type without rounding", () => {
  const [draft] = parseTransactionCsv("date;description;amount\n2026-09-10;Refund;-12,50");
  assert.equal(draft.type, "expense"); assert.equal(draft.amount, 12.5);
});
