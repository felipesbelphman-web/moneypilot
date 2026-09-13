import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import test from "node:test";

import type {
  BudgetAdjustmentRow,
  BudgetRow,
  GoalContributionPlanRow,
  GoalRow,
  InvestmentRow,
  TransactionRow,
} from "../../src/lib/persistence/supabase-finance-mappers.ts";

declare module "node:module" {
  export function registerHooks(hooks: {
    resolve(specifier: string, context: unknown, nextResolve: (specifier: string, context: unknown) => unknown): unknown;
  }): void;
}

const projectRoot = pathToFileURL(`${process.cwd()}\\`).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) return nextResolve(new URL(`./src/${specifier.slice(2)}.ts`, projectRoot).href, context);
    return nextResolve(specifier, context);
  },
});

const {
  budgetAdjustmentRowToDomain,
  budgetAdjustmentToRow,
  budgetRowToDomain,
  budgetToRow,
  goalContributionPlanRowToDomain,
  goalContributionPlanToRow,
  goalRowToDomain,
  goalToRow,
  investmentRowToDomain,
  investmentToRow,
  transactionRowToDomain,
  transactionClassificationToUpdate,
  transactionToRow,
  transactionToUpdate,
} = await import("../../src/lib/persistence/supabase-finance-mappers.ts");
const { FinanceError } = await import("../../src/lib/domain/finance-error.ts");
const { createEmptyFinanceData, mergeFinanceLoadResult, settleFinanceResourceLoaders } = await import("../../src/lib/persistence/finance-hydration.ts");

const timestamps = { created_at: "2026-09-01T10:00:00Z", updated_at: "2026-09-02T11:00:00Z" };
const transactionRow: TransactionRow = {
  ...timestamps, user_id: "owner", id: "transaction", description: "Groceries", category: "Food", category_color: "#123456",
  category_id: null, category_name_snapshot: "Food", category_color_snapshot: "#123456", normalized_category_snapshot: "food",
  payment: "Card", date: "1 September 2026", date_iso: "2026-09-01", origin: "Manual", type: "expense", amount: 10.25,
};
const budgetRow: BudgetRow = {
  ...timestamps, user_id: "owner", id: "budget", category: "Food", subtitle: "Monthly food", budget: 500.25, month: "2026-09", color: "#123456",
};
const adjustmentRow: BudgetAdjustmentRow = {
  ...timestamps, user_id: "owner", month: "2026-09", target_remaining_spend: 0, baseline_projected_total: 600.25,
  adjustment_needed: 100, suggested_weekly_reduction: 25,
};
const goalRow: GoalRow = {
  ...timestamps, user_id: "owner", id: "goal", name: "Emergency fund", target_amount: 1000, saved_amount: 0,
  target_date: "2027-12", priority: "primary",
};
const planRow: GoalContributionPlanRow = {
  ...timestamps, user_id: "owner", goal_id: "goal", monthly_target: 0, baseline_required_monthly_contribution: 50, savings_boost: 0,
};
const investmentRow: InvestmentRow = {
  ...timestamps, user_id: "owner", id: "investment", name: "Fund", symbol: null, asset_type: "etf", quantity: 2.5,
  average_purchase_price: 100.125, price_mode: "automatic", manual_current_price: null, market_asset_key: "market-key", native_currency: "EUR",
};

function expectPersistedValidationError(action: () => unknown, field: string) {
  assert.throws(action, (error) => error instanceof FinanceError
    && error.code === "validation_error"
    && error.details?.field === field
    && error.message === "validation_error");
}

test("maps and round-trips a valid Transaction Row", () => {
  const domain = transactionRowToDomain(transactionRow);
  assert.notEqual(domain, transactionRow);
  assert.deepEqual(domain, { id: "transaction", description: "Groceries", category: "Food", categoryColor: "#123456", classification: { kind: "legacy", categoryId: null, categoryNameSnapshot: "Food", categoryColorSnapshot: "#123456", normalizedCategorySnapshot: "food" }, payment: "Card", date: "1 September 2026", dateISO: "2026-09-01", origin: "Manual", type: "expense", amount: 10.25 });
  const insert = transactionToRow("next-owner", { ...domain, categoryWrite: { kind: "legacy", categoryName: "Food", categoryColor: "#123456" } });
  assert.deepEqual({ ...insert, user_id: undefined }, { user_id: undefined, id: transactionRow.id, description: transactionRow.description, category_id: null, category: transactionRow.category, category_color: transactionRow.category_color, payment: transactionRow.payment, date: transactionRow.date, date_iso: transactionRow.date_iso, origin: transactionRow.origin, type: transactionRow.type, amount: transactionRow.amount });
});

test("maps linked and uncategorized rows from persisted classification only", () => {
  const linked = transactionRowToDomain({ ...transactionRow, category: "Divergent legacy", category_color: "#ffffff", category_id: "category-1", category_name_snapshot: "Snapshot", category_color_snapshot: "#010203", normalized_category_snapshot: "snapshot" });
  assert.equal(linked.classification.kind, "linked");
  assert.equal(linked.category, "Snapshot");
  assert.equal(linked.categoryColor, "#010203");
  const uncategorized = transactionRowToDomain({ ...transactionRow, category: "Must not leak", category_color: "#ffffff", category_id: null, category_name_snapshot: null, category_color_snapshot: null, normalized_category_snapshot: null });
  assert.equal(uncategorized.classification.kind, "uncategorized");
  assert.equal(uncategorized.category, null);
  assert.equal(uncategorized.categoryColor, null);
});

test("rejects partial snapshots and links without snapshots", () => {
  expectPersistedValidationError(() => transactionRowToDomain({ ...transactionRow, category_color_snapshot: null }), "classification");
  expectPersistedValidationError(() => transactionRowToDomain({ ...transactionRow, category_id: "category-1", category_name_snapshot: null, category_color_snapshot: null, normalized_category_snapshot: null }), "classification");
});

test("transaction write mappers omit snapshots and keep unrelated updates minimal", () => {
  const fields = { id: "transaction", description: "Groceries", payment: "Card", date: "1 September 2026", dateISO: "2026-09-01", origin: "Manual", type: "expense" as const, amount: 10.25 };
  const linked = transactionToRow("owner", { ...fields, categoryWrite: { kind: "linked", categoryId: "category-1", legacyName: "Food", legacyColor: "#123456" } });
  assert.deepEqual([linked.category_id, linked.category, linked.category_color], ["category-1", "Food", "#123456"]);
  assert.equal("category_name_snapshot" in linked, false);
  assert.equal("normalized_category_snapshot" in linked, false);
  assert.throws(() => transactionToRow("owner", { ...fields, categoryWrite: { kind: "uncategorized" } }), FinanceError);
  assert.deepEqual(transactionClassificationToUpdate({ kind: "uncategorized" }), { category_id: null });
  assert.deepEqual(transactionClassificationToUpdate({ kind: "linked", categoryId: "category-1", legacyName: "Food", legacyColor: "#123456" }), { category_id: "category-1", category: "Food", category_color: "#123456" });
  const unrelated = transactionToUpdate(fields);
  for (const key of ["user_id", "category_id", "category", "category_color", "category_name_snapshot", "category_color_snapshot", "normalized_category_snapshot", "created_at", "updated_at"]) assert.equal(key in unrelated, false);
});

test("maps and round-trips a valid Budget Row", () => {
  const domain = budgetRowToDomain(budgetRow);
  assert.notEqual(domain, budgetRow);
  assert.deepEqual(domain, { id: "budget", category: "Food", subtitle: "Monthly food", budget: 500.25, month: "2026-09", color: "#123456" });
  const insert = budgetToRow("next-owner", domain);
  assert.deepEqual([insert.id, insert.category, insert.subtitle, insert.budget, insert.month, insert.color], [budgetRow.id, budgetRow.category, budgetRow.subtitle, budgetRow.budget, budgetRow.month, budgetRow.color]);
});

test("maps and round-trips a valid zero-valued Budget adjustment Row", () => {
  const domain = budgetAdjustmentRowToDomain(adjustmentRow);
  assert.notEqual(domain, adjustmentRow);
  assert.equal(domain.targetRemainingSpend, 0);
  const insert = budgetAdjustmentToRow("next-owner", domain);
  assert.deepEqual([insert.month, insert.target_remaining_spend, insert.baseline_projected_total, insert.adjustment_needed, insert.suggested_weekly_reduction], [adjustmentRow.month, adjustmentRow.target_remaining_spend, adjustmentRow.baseline_projected_total, adjustmentRow.adjustment_needed, adjustmentRow.suggested_weekly_reduction]);
});

test("maps and round-trips a valid Goal Row", () => {
  const domain = goalRowToDomain(goalRow);
  assert.notEqual(domain, goalRow);
  assert.deepEqual(domain, { id: "goal", name: "Emergency fund", targetAmount: 1000, savedAmount: 0, targetDate: "2027-12", priority: "primary" });
  const insert = goalToRow("next-owner", domain);
  assert.deepEqual([insert.id, insert.name, insert.target_amount, insert.saved_amount, insert.target_date, insert.priority], [goalRow.id, goalRow.name, goalRow.target_amount, goalRow.saved_amount, goalRow.target_date, goalRow.priority]);
});

test("maps and round-trips a valid zero-valued Goal contribution plan Row", () => {
  const domain = goalContributionPlanRowToDomain(planRow);
  assert.notEqual(domain, planRow);
  assert.equal(domain.monthlyTarget, 0);
  assert.equal(domain.savingsBoost, 0);
  assert.equal(domain.createdAt, timestamps.created_at);
  const insert = goalContributionPlanToRow("next-owner", domain);
  assert.equal("created_at" in insert, false);
  assert.deepEqual([insert.goal_id, insert.monthly_target, insert.baseline_required_monthly_contribution, insert.savings_boost], [planRow.goal_id, planRow.monthly_target, planRow.baseline_required_monthly_contribution, planRow.savings_boost]);
});

test("maps and round-trips a valid Investment Row while preserving null", () => {
  const domain = investmentRowToDomain(investmentRow);
  assert.notEqual(domain, investmentRow);
  assert.equal(domain.symbol, null);
  assert.equal(domain.manualCurrentPrice, null);
  const insert = investmentToRow("next-owner", domain);
  assert.deepEqual([insert.id, insert.name, insert.symbol, insert.asset_type, insert.quantity, insert.average_purchase_price, insert.price_mode, insert.manual_current_price, insert.market_asset_key, insert.native_currency], [investmentRow.id, investmentRow.name, investmentRow.symbol, investmentRow.asset_type, investmentRow.quantity, investmentRow.average_purchase_price, investmentRow.price_mode, investmentRow.manual_current_price, investmentRow.market_asset_key, investmentRow.native_currency]);
});

for (const [label, change, field] of [
  ["unknown enum", { type: "transfer" }, "type"],
  ["invalid civil date", { date_iso: "2026-02-30" }, "dateISO"],
  ["non-finite amount", { amount: Number.NaN }, "amount"],
  ["non-positive amount", { amount: 0 }, "amount"],
  ["blank required text", { description: "   " }, "description"],
  ["null required text", { payment: null }, "payment"],
] as const) {
  test(`rejects a Transaction Row with ${label}`, () => expectPersistedValidationError(
    () => Reflect.apply(transactionRowToDomain, null, [{ ...transactionRow, ...change }]), field,
  ));
}

test("rejects an Investment Row whose individually valid operands have an unsafe product", () => {
  expectPersistedValidationError(
    () => investmentRowToDomain({ ...investmentRow, quantity: 9007199254740.991, average_purchase_price: 11 }),
    "investmentValue",
  );
});

test("isolates an unsafe Investment product and preserves previous Investments", async () => {
  const previous = createEmptyFinanceData();
  previous.investments = [investmentRowToDomain(investmentRow)];
  const result = await settleFinanceResourceLoaders({
    accountBalanceSettings: async () => null,
    transactions: async () => [transactionRowToDomain(transactionRow)],
    budgets: async () => [budgetRowToDomain(budgetRow)],
    budgetAdjustments: async () => [budgetAdjustmentRowToDomain(adjustmentRow)],
    goals: async () => [goalRowToDomain(goalRow)],
    goalContributionPlans: async () => [goalContributionPlanRowToDomain(planRow)],
    investments: async () => [investmentRowToDomain({ ...investmentRow, name: "private unsafe investment", quantity: 9007199254740.991, average_purchase_price: 11 })],
  });
  const merged = mergeFinanceLoadResult(previous, result);
  assert.equal(result.investments.status, "failure");
  assert.deepEqual(merged.data.investments, previous.investments);
  assert.equal(result.transactions.status, "success");
  assert.equal(merged.errors.investments?.code, "validation_error");
  assert.equal(merged.errors.investments?.message, "validation_error");
  assert.equal(merged.errors.investments?.message.includes("private"), false);
});

for (const [label, change, field] of [
  ["invalid month", { month: "2026-13" }, "month"],
  ["non-finite amount", { budget: Number.POSITIVE_INFINITY }, "budget"],
  ["non-positive amount", { budget: 0 }, "budget"],
  ["blank category", { category: "" }, "category"],
] as const) {
  test(`rejects a Budget Row with ${label}`, () => expectPersistedValidationError(
    () => Reflect.apply(budgetRowToDomain, null, [{ ...budgetRow, ...change }]), field,
  ));
}

for (const [label, change, field] of [
  ["invalid month", { month: "09/2026" }, "month"],
  ["non-finite value", { adjustment_needed: Number.NEGATIVE_INFINITY }, "adjustmentNeeded"],
  ["negative value", { suggested_weekly_reduction: -1 }, "suggestedWeeklyReduction"],
  ["null required value", { target_remaining_spend: null }, "targetRemainingSpend"],
] as const) {
  test(`rejects a Budget adjustment Row with ${label}`, () => expectPersistedValidationError(
    () => Reflect.apply(budgetAdjustmentRowToDomain, null, [{ ...adjustmentRow, ...change }]), field,
  ));
}

for (const [label, change, field] of [
  ["unknown priority", { priority: "urgent" }, "priority"],
  ["invalid target month", { target_date: "2027-00" }, "targetDate"],
  ["non-finite target", { target_amount: Number.NaN }, "targetAmount"],
  ["negative saved amount", { saved_amount: -1 }, "savedAmount"],
  ["saved amount above target", { saved_amount: 1001 }, "savedAmount"],
  ["null required name", { name: null }, "name"],
] as const) {
  test(`rejects a Goal Row with ${label}`, () => expectPersistedValidationError(
    () => Reflect.apply(goalRowToDomain, null, [{ ...goalRow, ...change }]), field,
  ));
}

for (const [label, change, field] of [
  ["blank relationship", { goal_id: "" }, "goalId"],
  ["negative amount", { monthly_target: -1 }, "monthlyTarget"],
  ["non-finite amount", { savings_boost: Number.NaN }, "savingsBoost"],
  ["invalid timestamp", { created_at: "not-a-timestamp" }, "createdAt"],
  ["null required relationship", { goal_id: null }, "goalId"],
] as const) {
  test(`rejects a Goal contribution plan Row with ${label}`, () => expectPersistedValidationError(
    () => Reflect.apply(goalContributionPlanRowToDomain, null, [{ ...planRow, ...change }]), field,
  ));
}

for (const [label, change, field] of [
  ["unknown asset type", { asset_type: "bond" }, "assetType"],
  ["unknown price mode", { price_mode: "hybrid" }, "priceMode"],
  ["non-finite quantity", { quantity: Number.NaN }, "quantity"],
  ["zero price", { average_purchase_price: 0 }, "averagePurchasePrice"],
  ["manual mode without a price", { price_mode: "manual", manual_current_price: null, market_asset_key: null }, "manualCurrentPrice"],
  ["automatic mode with a manual price", { manual_current_price: 1 }, "manualCurrentPrice"],
  ["null required name", { name: null }, "name"],
  ["invalid nullable symbol", { symbol: 42 }, "symbol"],
] as const) {
  test(`rejects an Investment Row with ${label}`, () => expectPersistedValidationError(
    () => Reflect.apply(investmentRowToDomain, null, [{ ...investmentRow, ...change }]), field,
  ));
}

test("isolates an invalid persisted Row during hydration and preserves prior data", async () => {
  const previous = createEmptyFinanceData();
  previous.transactions = [transactionRowToDomain(transactionRow)];
  const result = await settleFinanceResourceLoaders({
    accountBalanceSettings: async () => null,
    transactions: async () => [Reflect.apply(transactionRowToDomain, null, [{ ...transactionRow, description: "private invalid value", type: "private-invalid-enum" }])],
    budgets: async () => [budgetRowToDomain(budgetRow)],
    budgetAdjustments: async () => [budgetAdjustmentRowToDomain(adjustmentRow)],
    goals: async () => [goalRowToDomain(goalRow)],
    goalContributionPlans: async () => [goalContributionPlanRowToDomain(planRow)],
    investments: async () => [investmentRowToDomain(investmentRow)],
  });
  const merged = mergeFinanceLoadResult(previous, result);
  assert.equal(result.transactions.status, "failure");
  assert.deepEqual(merged.data.transactions, previous.transactions);
  assert.equal(result.budgets.status, "success");
  assert.equal(merged.errors.transactions instanceof FinanceError, true);
  assert.equal(merged.errors.transactions?.code, "validation_error");
  assert.equal(merged.errors.transactions?.message, "validation_error");
  assert.equal(merged.errors.transactions?.message.includes("private"), false);
});
