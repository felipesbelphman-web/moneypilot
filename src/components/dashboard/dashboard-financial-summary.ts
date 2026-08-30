import type { Budget, BudgetAdjustment } from "@/components/budgets/budget-model";
import { normalizeCategory } from "@/components/budgets/budget-model";
import type { BudgetProjection } from "@/components/budgets/budget-projection";
import { calculateBudgetProjection } from "@/components/budgets/budget-projection";
import type { GoalCalculation } from "@/components/goals/goal-calculations";
import { calculateGoal } from "@/components/goals/goal-calculations";
import type { GoalContributionPlan } from "@/components/goals/goal-contribution-plan";
import { isGoalContributionPlanStale } from "@/components/goals/goal-contribution-plan";
import type { Goal } from "@/components/goals/goal-model";
import { selectPrimaryGoal } from "@/components/goals/goal-model";
import type { GoalSavingsCapacity } from "@/components/goals/goal-savings-capacity";
import { calculateGoalSavingsCapacity, getCurrentFinancialMonth } from "@/components/goals/goal-savings-capacity";
import type { Transaction } from "@/components/transactions/transaction-model";

export type DashboardCategorySpending = { category: string; amount: number; percentage: number };

export type DashboardGoalSummary = {
  goal: Goal;
  calculation: GoalCalculation;
  contributionPlan: GoalContributionPlan | null;
  isContributionPlanStale: boolean;
};

export type DashboardMonthlyStatus = "within_budget" | "over_budget" | "no_budget";

export type DashboardFinancialSummary = {
  month: string;
  income: number;
  expenses: number;
  netCashFlow: number;
  transactionCount: number;
  incomeTransactionCount: number;
  expenseTransactionCount: number;
  categorySpending: DashboardCategorySpending[];
  topSpendingCategory: DashboardCategorySpending | null;
  plannedBudgetTotal: number;
  budgetSpentTotal: number;
  remainingBudget: number;
  budgetProjection: BudgetProjection;
  savingsCapacity: GoalSavingsCapacity;
  safeSavingsCapacity: number;
  primaryGoal: DashboardGoalSummary | null;
  monthlyStatus: DashboardMonthlyStatus;
  hasTransactions: boolean;
  hasBudgets: boolean;
  hasGoals: boolean;
  hasFinancialData: boolean;
  accountBalance: null;
  availableToSpend: null;
  upcomingBills: [];
};

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

export function calculateDashboardFinancialSummary({ transactions, budgets, budgetAdjustments, goals, goalContributionPlans, month, now = new Date() }: DashboardFinancialSummaryInput): DashboardFinancialSummary {
  const monthTransactions = transactions.filter((transaction) => transaction.dateISO.slice(0, 7) === month);
  const incomeTransactions = monthTransactions.filter((transaction) => transaction.type === "income");
  const expenseTransactions = monthTransactions.filter((transaction) => transaction.type === "expense");
  const income = sumAmounts(incomeTransactions);
  const expenses = sumAmounts(expenseTransactions);
  const categorySpending = calculateCategorySpending(expenseTransactions, expenses);
  const budgetProjection = calculateBudgetProjection({ budgets, transactions, month, now });
  const savingsCapacity = calculateGoalSavingsCapacity({ budgets, transactions, month, adjustment: budgetAdjustments[month], now });
  const primaryGoal = selectPrimaryGoal(goals);
  const goalSummary = primaryGoal ? createGoalSummary(primaryGoal, goalContributionPlans[primaryGoal.id], savingsCapacity.safeMonthlyCapacity, now) : null;
  const hasTransactions = monthTransactions.length > 0;
  const hasBudgets = budgets.some((budget) => budget.month === month);
  const hasGoals = goals.length > 0;

  return {
    month,
    income,
    expenses,
    netCashFlow: income - expenses,
    transactionCount: monthTransactions.length,
    incomeTransactionCount: incomeTransactions.length,
    expenseTransactionCount: expenseTransactions.length,
    categorySpending,
    topSpendingCategory: categorySpending[0] ?? null,
    plannedBudgetTotal: budgetProjection.plannedTotal,
    budgetSpentTotal: budgetProjection.spentTotal,
    remainingBudget: budgetProjection.remainingBudget,
    budgetProjection,
    savingsCapacity,
    safeSavingsCapacity: savingsCapacity.safeMonthlyCapacity,
    primaryGoal: goalSummary,
    monthlyStatus: budgetProjection.plannedTotal <= 0 ? "no_budget" : budgetProjection.projectedOverBudget ? "over_budget" : "within_budget",
    hasTransactions,
    hasBudgets,
    hasGoals,
    hasFinancialData: hasTransactions || hasBudgets || hasGoals,
    accountBalance: null,
    availableToSpend: null,
    upcomingBills: [],
  };
}

function sumAmounts(transactions: Transaction[]) {
  return transactions.reduce((total, transaction) => total + (Number.isFinite(transaction.amount) ? Math.max(0, transaction.amount) : 0), 0);
}

function calculateCategorySpending(transactions: Transaction[], expenses: number) {
  const categories = new Map<string, { category: string; amount: number }>();
  for (const transaction of transactions) {
    const key = normalizeCategory(transaction.category);
    const current = categories.get(key);
    const amount = Number.isFinite(transaction.amount) ? Math.max(0, transaction.amount) : 0;
    categories.set(key, { category: current?.category ?? (transaction.category.trim() || "Uncategorized"), amount: (current?.amount ?? 0) + amount });
  }
  return [...categories.values()]
    .map((item) => ({ ...item, percentage: expenses > 0 ? item.amount / expenses : 0 }))
    .sort((left, right) => right.amount - left.amount);
}

function createGoalSummary(goal: Goal, contributionPlan: GoalContributionPlan | undefined, safeSavingsCapacity: number, now: Date): DashboardGoalSummary {
  const calculation = calculateGoal(goal, now);
  return {
    goal,
    calculation,
    contributionPlan: contributionPlan ?? null,
    isContributionPlanStale: contributionPlan ? isGoalContributionPlanStale(contributionPlan, calculation.requiredMonthlyContribution, safeSavingsCapacity) : false,
  };
}
