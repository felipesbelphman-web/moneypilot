import type { Budget, BudgetAdjustment } from "../budgets/budget-model.ts";
import type { BudgetProjection } from "../budgets/budget-projection.ts";
import { calculateBudgetProjection } from "../budgets/budget-projection.ts";
import type { GoalCalculation } from "../goals/goal-calculations.ts";
import { calculateGoal } from "../goals/goal-calculations.ts";
import type { GoalContributionPlan } from "../goals/goal-contribution-plan.ts";
import { isGoalContributionPlanStale } from "../goals/goal-contribution-plan.ts";
import type { Goal } from "../goals/goal-model.ts";
import { selectPrimaryGoal } from "../goals/goal-model.ts";
import type { GoalSavingsCapacity } from "../goals/goal-savings-capacity.ts";
import { calculateGoalSavingsCapacity, getCurrentFinancialMonth } from "../goals/goal-savings-capacity.ts";
import { getTransactionCategoryGroupKey, type Transaction } from "../transactions/transaction-model.ts";
import { aggregateMoney, type MoneyAggregationResult } from "../../lib/domain/money-aggregation.ts";
import { inspectCategoryReference, isFinancialTransactionType, type CategoryIntegrityReason, type FinancialClassificationReason } from "../../lib/domain/category-integrity.ts";

export type DashboardCategorySpending = { category: string; localizationKey?: "other" | "uncategorized"; amount: number; percentage: number };

export type DashboardGoalSummary = {
  goal: Goal;
  calculation: Extract<GoalCalculation, { available: true }>;
  contributionPlan: GoalContributionPlan | null;
  isContributionPlanStale: boolean;
};

export type DashboardMonthlyStatus = "within_budget" | "over_budget" | "no_budget" | "unavailable";

type DashboardFinancialSummaryBase = {
  month: string;
  monthTransactions: Transaction[];
  transactionCount: number;
  incomeTransactionCount: number;
  expenseTransactionCount: number;
  plannedBudgetTotal: number | null;
  budgetSpentTotal: number | null;
  remainingBudget: number | null;
  budgetProjection: BudgetProjection;
  savingsCapacity: GoalSavingsCapacity;
  primaryGoal: DashboardGoalSummary | null;
  monthlyStatus: DashboardMonthlyStatus;
  hasTransactions: boolean;
  hasBudgets: boolean;
  hasGoals: boolean;
  goalsAvailable: boolean;
  hasFinancialData: boolean;
  accountBalance: null;
  availableToSpend: null;
  upcomingBills: [];
};

export type DashboardFinancialSummary = DashboardFinancialSummaryBase & (
  | {
      aggregationAvailable: true;
      aggregationUnavailableReason: null;
      income: number;
      incomeAveragePerDay: number | null;
      largestIncome: number | null;
      expenses: number;
      netCashFlow: number;
      safeSavingsCapacity: number | null;
    } & DashboardCategoryAggregation
  | {
      aggregationAvailable: false;
      aggregationUnavailableReason: "invalid_operand" | "unsafe_aggregate" | FinancialClassificationReason;
      income: null;
      incomeAveragePerDay: null;
      largestIncome: null;
      expenses: null;
      netCashFlow: null;
      categorySpending: [];
      topSpendingCategory: null;
      safeSavingsCapacity: null;
      categoryAggregationAvailable: false;
      categoryAggregationUnavailableReason: "invalid_operand" | "unsafe_aggregate" | FinancialClassificationReason;
    }
);

type DashboardCategoryAggregation =
  | { categoryAggregationAvailable: true; categoryAggregationUnavailableReason: null; categorySpending: DashboardCategorySpending[]; topSpendingCategory: DashboardCategorySpending | null }
  | { categoryAggregationAvailable: false; categoryAggregationUnavailableReason: CategoryIntegrityReason | FinancialClassificationReason | "invalid_operand" | "unsafe_aggregate"; categorySpending: []; topSpendingCategory: null };

type DashboardFinancialSummaryInput = {
  transactions: Transaction[];
  budgets: Budget[];
  budgetAdjustments: Record<string, BudgetAdjustment>;
  goals: Goal[];
  goalContributionPlans: Record<string, GoalContributionPlan>;
  month: string;
  now?: Date;
};

export function getDashboardMonth(now: Date = new Date()) {
  return getCurrentFinancialMonth(now);
}

export function getDashboardMonthTransactions(transactions: Transaction[], month: string) {
  return transactions.filter((transaction) => transaction.dateISO.slice(0, 7) === month);
}

export function getDashboardTransactionAmount(transaction: Transaction) {
  return transaction.amount;
}

export function calculateDashboardFinancialSummary({ transactions, budgets, budgetAdjustments, goals, goalContributionPlans, month, now = new Date() }: DashboardFinancialSummaryInput): DashboardFinancialSummary {
  const monthTransactions = getDashboardMonthTransactions(transactions, month);
  const hasInvalidTransactionType = monthTransactions.some((transaction) => !isFinancialTransactionType(transaction.type));
  const incomeTransactions = monthTransactions.filter((transaction) => transaction.type === "income");
  const expenseTransactions = monthTransactions.filter((transaction) => transaction.type === "expense");
  const incomeResult = aggregateTransactionAmounts(incomeTransactions);
  const expenseResult = aggregateTransactionAmounts(expenseTransactions);
  const netResult = incomeResult.available && expenseResult.available
    ? aggregateMoney([incomeResult.value, -expenseResult.value])
    : unavailableFrom(incomeResult, expenseResult);
  const budgetProjection = calculateBudgetProjection({ budgets, transactions, month, now });
  const savingsCapacity = calculateGoalSavingsCapacity({ budgets, transactions, month, adjustment: budgetAdjustments[month], now });
  const primaryGoal = selectPrimaryGoal(goals);
  const primaryGoalSummary = primaryGoal ? createGoalSummary(primaryGoal, goalContributionPlans[primaryGoal.id], savingsCapacity.available ? savingsCapacity.safeMonthlyCapacity : null, now) : null;
  const hasTransactions = monthTransactions.length > 0;
  const hasBudgets = budgets.some((budget) => budget.month === month);
  const hasGoals = goals.length > 0;
  const common = {
    month,
    monthTransactions,
    transactionCount: monthTransactions.length,
    incomeTransactionCount: incomeTransactions.length,
    expenseTransactionCount: expenseTransactions.length,
    plannedBudgetTotal: budgetProjection.available ? budgetProjection.plannedTotal : null,
    budgetSpentTotal: budgetProjection.available ? budgetProjection.spentTotal : null,
    remainingBudget: budgetProjection.available ? budgetProjection.remainingBudget : null,
    budgetProjection,
    savingsCapacity,
    hasTransactions,
    hasBudgets,
    hasGoals,
    goalsAvailable: !primaryGoal || primaryGoalSummary !== null,
    hasFinancialData:
    transactions.length > 0 || budgets.length > 0 || goals.length > 0,
    accountBalance: null,
    availableToSpend: null,
    upcomingBills: [] as [],
  };

  if (hasInvalidTransactionType || !incomeResult.available || !expenseResult.available || !netResult.available) {
    const failure = !incomeResult.available ? incomeResult : !expenseResult.available ? expenseResult : netResult;
    const reason = hasInvalidTransactionType ? "invalid_transaction_type" : failure.available ? "unsafe_aggregate" : failure.reason;
    return {
      ...common,
      aggregationAvailable: false,
      aggregationUnavailableReason: reason,
      income: null,
      incomeAveragePerDay: null,
      largestIncome: null,
      expenses: null,
      netCashFlow: null,
      categorySpending: [],
      topSpendingCategory: null,
      categoryAggregationAvailable: false,
      categoryAggregationUnavailableReason: reason,
      safeSavingsCapacity: null,
      primaryGoal: primaryGoalSummary,
      monthlyStatus: "unavailable",
    };
  }

  const incomeAveragePerDay = calculateIncomeAveragePerDay(incomeTransactions, month, now);
  const largestIncome = incomeResult.value > 0
    ? incomeTransactions.reduce((largest, transaction) => Math.max(largest, transaction.amount), 0)
    : null;
  const taxonomyFailure = monthTransactions
    .filter((transaction) => transaction.classification.kind !== "uncategorized")
    .map((transaction) => inspectCategoryReference(transaction.category, transaction.type))
    .find((result) => !result.available);
  const categoryResult = taxonomyFailure ? null : calculateCategorySpending(expenseTransactions, expenseResult.value);
  const categoryAggregation: DashboardCategoryAggregation = taxonomyFailure && !taxonomyFailure.available
    ? { categoryAggregationAvailable: false, categoryAggregationUnavailableReason: taxonomyFailure.unavailableReason, categorySpending: [] as [], topSpendingCategory: null }
    : categoryResult && !categoryResult.available
      ? { categoryAggregationAvailable: false, categoryAggregationUnavailableReason: categoryResult.reason, categorySpending: [] as [], topSpendingCategory: null }
      : { categoryAggregationAvailable: true, categoryAggregationUnavailableReason: null, categorySpending: categoryResult?.value ?? [], topSpendingCategory: categoryResult?.value[0] ?? null };
  return {
    ...common,
    aggregationAvailable: true,
    aggregationUnavailableReason: null,
    income: incomeResult.value,
    incomeAveragePerDay,
    largestIncome,
    expenses: expenseResult.value,
    netCashFlow: netResult.value,
    ...categoryAggregation,
    safeSavingsCapacity: savingsCapacity.available ? savingsCapacity.safeMonthlyCapacity : null,
    primaryGoal: primaryGoalSummary,
    monthlyStatus: !budgetProjection.available ? "unavailable" : budgetProjection.plannedTotal <= 0 ? "no_budget" : budgetProjection.projectedOverBudget ? "over_budget" : "within_budget",
  };
}

function aggregateTransactionAmounts(transactions: Transaction[]) {
  return aggregateMoney(transactions.map((transaction) => transaction.amount));
}

function calculateIncomeAveragePerDay(incomeTransactions: Transaction[], month: string, now: Date) {
  const currentMonth = getDashboardMonth(now);
  if (month > currentMonth) return null;

  const [year, monthNumber] = month.split("-").map(Number);
  const elapsedDays = month === currentMonth
    ? now.getDate()
    : new Date(year, monthNumber, 0).getDate();
  const includedTransactions = month === currentMonth
    ? incomeTransactions.filter((transaction) => Number(transaction.dateISO.slice(8, 10)) <= elapsedDays)
    : incomeTransactions;

  const total = aggregateTransactionAmounts(includedTransactions);
  return total.available ? total.value / elapsedDays : null;
}

function calculateCategorySpending(transactions: Transaction[], expenses: number) {
  const categories = new Map<string, { category: string; localizationKey?: "other" | "uncategorized"; amounts: number[] }>();
  for (const transaction of transactions) {
    const key = getTransactionCategoryGroupKey(transaction);
    const current = categories.get(key);
    const category = transaction.category ?? "";
    categories.set(key, { category: current?.category ?? category, localizationKey: current?.localizationKey ?? (transaction.classification.kind === "uncategorized" ? "uncategorized" : undefined), amounts: [...(current?.amounts ?? []), transaction.amount] });
  }
  const spending: DashboardCategorySpending[] = [];
  for (const item of categories.values()) {
    const total = aggregateMoney(item.amounts);
    if (!total.available) return total;
    spending.push({ category: item.category, localizationKey: item.localizationKey, amount: total.value, percentage: expenses > 0 ? total.value / expenses : 0 });
  }
  spending.sort((left, right) => right.amount - left.amount);
  return { available: true, value: spending } as const;
}

function unavailableFrom(...results: MoneyAggregationResult[]): MoneyAggregationResult {
  const failure = results.find((result) => !result.available);
  return { available: false, reason: failure && !failure.available ? failure.reason : "unsafe_aggregate" };
}

function createGoalSummary(goal: Goal, contributionPlan: GoalContributionPlan | undefined, safeSavingsCapacity: number | null, now: Date): DashboardGoalSummary | null {
  const calculation = calculateGoal(goal, now);
  if (!calculation.available) return null;
  return {
    goal,
    calculation,
    contributionPlan: contributionPlan ?? null,
    isContributionPlanStale: contributionPlan && safeSavingsCapacity !== null ? isGoalContributionPlanStale(contributionPlan, calculation.requiredMonthlyContribution, safeSavingsCapacity) : false,
  };
}
