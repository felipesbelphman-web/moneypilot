import assert from "node:assert/strict";
import { test } from "node:test";
import type { Transaction } from "../../src/components/transactions/transaction-model.ts";
import { calculateCompleteCurrentBalance, calculateCurrentBalance, validateAndNormalizeAccountBalanceSettings } from "../../src/lib/domain/account-balance-settings.ts";
import { FinanceError } from "../../src/lib/domain/finance-error.ts";
import { accountBalanceSettingsAfterUserChange, mergeAccountBalanceSettings, settleAccountBalanceSettings } from "../../src/lib/persistence/account-balance-settings-hydration.ts";
import { isCurrentFinanceHydration } from "../../src/lib/persistence/finance-hydration.ts";

const settings = { openingBalance: 100, openingDate: "2026-09-01" };

function transaction(overrides: Partial<Transaction>): Transaction {
  return {
    id: "transaction",
    description: "Test",
    category: "Test",
    categoryColor: "#000000",
    classification: { kind: "legacy", categoryId: null, categoryNameSnapshot: "Test", categoryColorSnapshot: "#000000", normalizedCategorySnapshot: "test" },
    payment: "Card",
    date: "legacy value that must not be parsed",
    dateISO: "2026-09-01",
    origin: "Manual",
    type: "income",
    amount: 10,
    ...overrides,
  };
}

test("accepts positive, zero and negative opening balances", () => {
  for (const openingBalance of [100, 0, -100]) {
    assert.deepEqual(validateAndNormalizeAccountBalanceSettings({ ...settings, openingBalance }), { ...settings, openingBalance });
  }
});

test("rejects non-finite opening balances", () => {
  for (const openingBalance of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    assert.throws(() => validateAndNormalizeAccountBalanceSettings({ ...settings, openingBalance }), (error) => error instanceof FinanceError
      && error.details?.field === "openingBalance" && error.details.reason === "finite");
  }
});

test("normalizes opening date whitespace", () => {
  assert.equal(validateAndNormalizeAccountBalanceSettings({ ...settings, openingDate: "  2026-09-01  " }).openingDate, "2026-09-01");
});

test("rejects an invalid opening date format", () => {
  assert.throws(() => validateAndNormalizeAccountBalanceSettings({ ...settings, openingDate: "01/09/2026" }), (error) => error instanceof FinanceError
    && error.details?.reason === "invalid_format");
});

test("rejects an impossible opening date", () => {
  assert.throws(() => validateAndNormalizeAccountBalanceSettings({ ...settings, openingDate: "2026-02-30" }), (error) => error instanceof FinanceError
    && error.details?.reason === "invalid_date");
});

test("returns the opening balance when there are no transactions", () => {
  assert.equal(calculateCurrentBalance(settings, []), 100);
});

test("adds only income", () => {
  assert.equal(calculateCurrentBalance(settings, [transaction({ amount: 25 }), transaction({ id: "two", amount: 5 })]), 130);
});

test("subtracts only expenses", () => {
  assert.equal(calculateCurrentBalance(settings, [transaction({ type: "expense", amount: 25 })]), 75);
});

test("normalizes the final income and expense result to four decimal places", () => {
  assert.equal(calculateCurrentBalance(settings, [transaction({ amount: 10.1234 }), transaction({ id: "expense", type: "expense", amount: 4.1111 })]), 106.0123);
});

test("normalizes positive, negative and zero monetary results", () => {
  assert.equal(calculateCurrentBalance({ ...settings, openingBalance: 0 }, [transaction({ amount: 0.1 }), transaction({ id: "two", amount: 0.2 })]), 0.3);
  assert.equal(calculateCurrentBalance({ ...settings, openingBalance: 0 }, [transaction({ type: "expense", amount: 0.1 }), transaction({ id: "two", type: "expense", amount: 0.2 })]), -0.3);
  assert.equal(calculateCurrentBalance({ ...settings, openingBalance: 0 }, [transaction({ amount: 0.1 }), transaction({ id: "expense", type: "expense", amount: 0.1 })]), 0);
});

test("preserves four decimals and rounds only the final accumulated value", () => {
  const transactions = Array.from({ length: 10 }, (_, index) => transaction({ id: String(index), amount: 0.00006 }));
  assert.equal(calculateCurrentBalance({ ...settings, openingBalance: 0.1234 }, transactions), 0.124);
});

test("ignores transactions before the opening date", () => {
  assert.equal(calculateCurrentBalance(settings, [transaction({ dateISO: "2026-08-31", amount: 1000 })]), 100);
});

test("includes transactions on the opening date", () => {
  assert.equal(calculateCurrentBalance(settings, [transaction({ dateISO: "2026-09-01", amount: 10 })]), 110);
});

test("allows a negative calculated balance", () => {
  assert.equal(calculateCurrentBalance(settings, [transaction({ type: "expense", amount: 150 })]), -50);
});

test("uses dateISO and never the legacy localized date", () => {
  assert.equal(calculateCurrentBalance(settings, [transaction({ date: "2099-12-31", dateISO: "2026-08-31", amount: 1000 })]), 100);
});

test("absence of configuration is a successful null result", async () => {
  const result = await settleAccountBalanceSettings(async () => null);
  assert.deepEqual(result, { resource: "accountBalanceSettings", status: "success", data: null });
  assert.equal(mergeAccountBalanceSettings(settings, result), null);
});

test("resource failure preserves its previous value and is safe", async () => {
  const result = await settleAccountBalanceSettings(async () => { throw new Error("private database detail"); });
  assert.equal(mergeAccountBalanceSettings(settings, result), settings);
  assert.equal(result.status, "failure");
  if (result.status === "failure") {
    assert.ok(result.error instanceof FinanceError);
    assert.equal(result.error.code, "unknown_repository_error");
    assert.equal(result.error.message.includes("private database detail"), false);
  }
});

test("account balance failure does not alter successful financial collections", async () => {
  const transactions = [transaction({})];
  const result = await settleAccountBalanceSettings(async () => { throw new TypeError("network failed"); });
  assert.equal(mergeAccountBalanceSettings(settings, result), settings);
  assert.equal(transactions.length, 1);
});

test("user change and logout clear account balance settings", () => {
  assert.equal(accountBalanceSettingsAfterUserChange("user-a", "user-b", settings), null);
  assert.equal(accountBalanceSettingsAfterUserChange("user-a", null, settings), null);
  assert.equal(accountBalanceSettingsAfterUserChange("user-a", "user-a", settings), settings);
});

test("late account balance response cannot cross user generations", () => {
  assert.equal(isCurrentFinanceHydration(true, 2, "user-b", 1, "user-a"), false);
});

test("a partial transaction dataset never produces an account balance", () => {
  assert.equal(calculateCompleteCurrentBalance(settings, [transaction({ amount: 25 })], false), null);
  assert.equal(calculateCompleteCurrentBalance(settings, [transaction({ amount: 25 })], true), 125);
});
