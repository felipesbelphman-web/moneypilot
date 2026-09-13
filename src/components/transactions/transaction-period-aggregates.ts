import { getTransactionCategoryGroupKey, type Transaction } from "./transaction-model.ts";
import { aggregateMoney, type MoneyAggregationResult } from "../../lib/domain/money-aggregation.ts";
import { inspectCategoryReference, isFinancialTransactionType, type CategoryIntegrityReason, type FinancialClassificationReason } from "../../lib/domain/category-integrity.ts";

type FinancialAggregateUnavailableReason = "invalid_operand" | "unsafe_aggregate" | FinancialClassificationReason;
type CategoryAggregateUnavailableReason = FinancialAggregateUnavailableReason | CategoryIntegrityReason;

export type DerivedRatio =
  | { available: true; value: number }
  | { available: false; reason: "invalid_operand" | "zero_denominator" };

export type TransactionCategoryTotal = { categoryKey: string; category: string | null; amount: number };
export type RisingTransactionCategory = TransactionCategoryTotal & { growth: number };

type TransactionKpiCommon = {
  month: string;
  previousMonth: string;
  monthTransactions: Transaction[];
};

type AvailableCategoryAggregates = {
  categoryAggregationAvailable: true;
  categoryAggregationUnavailableReason: null;
  categoryTotals: TransactionCategoryTotal[];
  previousCategoryTotals: TransactionCategoryTotal[];
  risingCategory: RisingTransactionCategory | null;
};

type UnavailableCategoryAggregates = {
  categoryAggregationAvailable: false;
  categoryAggregationUnavailableReason: CategoryAggregateUnavailableReason;
  categoryTotals: [];
  previousCategoryTotals: [];
  risingCategory: null;
};

export type TransactionKpiAggregates = TransactionKpiCommon & (
  | {
      available: true;
      unavailableReason: null;
      income: number;
      expenses: number;
      netCashFlow: number;
      previousExpenses: number;
      incomeUsage: DerivedRatio;
      expenseVariation: DerivedRatio;
      largestIncome: number | null;
    } & (AvailableCategoryAggregates | UnavailableCategoryAggregates)
  | {
      available: false;
      unavailableReason: FinancialAggregateUnavailableReason;
      income: null;
      expenses: null;
      netCashFlow: null;
      previousExpenses: null;
      incomeUsage: null;
      expenseVariation: null;
      categoryTotals: [];
      previousCategoryTotals: [];
      risingCategory: null;
      largestIncome: null;
      categoryAggregationAvailable: false;
      categoryAggregationUnavailableReason: CategoryAggregateUnavailableReason;
    }
);

export function calculateTransactionKpiAggregates(transactions: Transaction[], month: string): TransactionKpiAggregates {
  const previousMonth = getPreviousTransactionMonth(month);
  const monthTransactions = transactions.filter((transaction) => transaction.dateISO.slice(0, 7) === month);
  const previousTransactions = transactions.filter((transaction) => transaction.dateISO.slice(0, 7) === previousMonth);
  const periodTransactions = [...monthTransactions, ...previousTransactions];
  if (periodTransactions.some((transaction) => !isFinancialTransactionType(transaction.type))) {
    return unavailable(month, previousMonth, monthTransactions, "invalid_transaction_type");
  }
  const incomeTransactions = monthTransactions.filter((transaction) => transaction.type === "income");
  const expenseTransactions = monthTransactions.filter((transaction) => transaction.type === "expense");
  const previousExpenseTransactions = previousTransactions.filter((transaction) => transaction.type === "expense");
  const income = aggregateMoney(incomeTransactions.map((transaction) => transaction.amount));
  const expenses = aggregateMoney(expenseTransactions.map((transaction) => transaction.amount));
  const previousExpenses = aggregateMoney(previousExpenseTransactions.map((transaction) => transaction.amount));
  if (!income.available || !expenses.available || !previousExpenses.available) {
    return unavailable(month, previousMonth, monthTransactions, firstFailure(income, expenses, previousExpenses));
  }
  const netCashFlow = aggregateMoney([income.value, -expenses.value]);
  const expenseDifference = aggregateMoney([expenses.value, -previousExpenses.value]);
  if (!netCashFlow.available || !expenseDifference.available) return unavailable(month, previousMonth, monthTransactions, firstFailure(netCashFlow, expenseDifference));
  const incomeUsage = calculateSafeRatio(expenses.value, income.value);
  const expenseVariation = calculateSafeRatio(expenseDifference.value, previousExpenses.value);
  const largestIncome = incomeTransactions.length === 0 ? null : incomeTransactions.reduce((largest, transaction) => transaction.amount > largest ? transaction.amount : largest, incomeTransactions[0].amount);
  const financial = { available: true, unavailableReason: null, month, previousMonth, monthTransactions, income: income.value, expenses: expenses.value, netCashFlow: netCashFlow.value, previousExpenses: previousExpenses.value, incomeUsage, expenseVariation, largestIncome } as const;
  const taxonomyFailure = periodTransactions
    .filter((transaction) => transaction.classification.kind !== "uncategorized")
    .map((transaction) => inspectCategoryReference(transaction.category, transaction.type))
    .find((result) => !result.available);
  if (taxonomyFailure && !taxonomyFailure.available) {
    return { ...financial, categoryAggregationAvailable: false, categoryAggregationUnavailableReason: taxonomyFailure.unavailableReason, categoryTotals: [], previousCategoryTotals: [], risingCategory: null };
  }
  const categoryTotals = aggregateCategoryExpenses(expenseTransactions);
  const previousCategoryTotals = aggregateCategoryExpenses(previousExpenseTransactions);
  if (!categoryTotals.available || !previousCategoryTotals.available) {
    const reason = firstFailure(categoryTotals, previousCategoryTotals);
    return { ...financial, categoryAggregationAvailable: false, categoryAggregationUnavailableReason: reason, categoryTotals: [], previousCategoryTotals: [], risingCategory: null };
  }
  const risingCategory = findRisingCategory(categoryTotals.value, previousCategoryTotals.value);
  if (!risingCategory.available) {
    return { ...financial, categoryAggregationAvailable: false, categoryAggregationUnavailableReason: risingCategory.reason === "unsafe_aggregate" ? "unsafe_aggregate" : "invalid_operand", categoryTotals: [], previousCategoryTotals: [], risingCategory: null };
  }
  return { ...financial, categoryAggregationAvailable: true, categoryAggregationUnavailableReason: null, categoryTotals: categoryTotals.value, previousCategoryTotals: previousCategoryTotals.value, risingCategory: risingCategory.value };
}

export function calculateSafeRatio(numerator: number, denominator: number): DerivedRatio {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) return { available: false, reason: "invalid_operand" };
  if (denominator === 0) return { available: false, reason: "zero_denominator" };
  const value = numerator / denominator;
  return Number.isFinite(value) ? { available: true, value } : { available: false, reason: "invalid_operand" };
}

export function getPreviousTransactionMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 2, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function aggregateCategoryExpenses(transactions: Transaction[]) {
  const groups = new Map<string, { category: string | null; amounts: number[] }>();
  for (const transaction of transactions) {
    const key = getTransactionCategoryGroupKey(transaction);
    const current = groups.get(key);
    groups.set(key, { category: current ? current.category : transaction.category, amounts: [...(current?.amounts ?? []), transaction.amount] });
  }
  const totals: TransactionCategoryTotal[] = [];
  for (const [categoryKey, group] of groups) {
    const total = aggregateMoney(group.amounts);
    if (!total.available) return total;
    totals.push({ categoryKey, category: group.category, amount: total.value });
  }
  return { available: true, value: totals } as const;
}

function findRisingCategory(current: TransactionCategoryTotal[], previous: TransactionCategoryTotal[]) {
  const previousByCategory = new Map(previous.map((item) => [item.categoryKey, item.amount]));
  const candidates: RisingTransactionCategory[] = [];
  for (const item of current) {
    const previousAmount = previousByCategory.get(item.categoryKey);
    if (previousAmount === undefined || previousAmount <= 0 || item.amount <= previousAmount) continue;
    const difference = aggregateMoney([item.amount, -previousAmount]);
    if (!difference.available) return difference;
    const growth = calculateSafeRatio(difference.value, previousAmount);
    if (!growth.available) return { available: false, reason: growth.reason } as const;
    candidates.push({ categoryKey: item.categoryKey, category: item.category, amount: item.amount, growth: growth.value });
  }
  candidates.sort((left, right) => right.growth - left.growth);
  return { available: true, value: candidates[0] ?? null } as const;
}

function firstFailure(...results: Array<MoneyAggregationResult | { available: true; value: TransactionCategoryTotal[] }>) {
  const failure = results.find((result) => !result.available);
  return failure && !failure.available ? failure.reason : "unsafe_aggregate";
}

function unavailable(month: string, previousMonth: string, monthTransactions: Transaction[], reason: FinancialAggregateUnavailableReason): TransactionKpiAggregates {
  return { available: false, unavailableReason: reason, month, previousMonth, monthTransactions, income: null, expenses: null, netCashFlow: null, previousExpenses: null, incomeUsage: null, expenseVariation: null, categoryTotals: [], previousCategoryTotals: [], risingCategory: null, largestIncome: null, categoryAggregationAvailable: false, categoryAggregationUnavailableReason: reason };
}
