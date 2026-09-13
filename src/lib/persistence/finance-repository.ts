import type { Budget, BudgetAdjustment } from "@/components/budgets/budget-model";
import type { GoalContributionPlan } from "@/components/goals/goal-contribution-plan";
import type { Goal } from "@/components/goals/goal-model";
import type { Investment } from "@/components/investments/investment-model";
import type { Transaction, TransactionClassificationUpdate, TransactionCreateInput, TransactionUpdateInput } from "@/components/transactions/transaction-model";
import type { AccountBalanceSettings, AccountBalanceSettingsInput } from "@/lib/domain/account-balance-settings";
import type { FinanceLoadResult, FinanceUserId } from "@/lib/persistence/finance-persistence-model";

/**
 * User-scoped persistence boundary for financial source records.
 *
 * Implementations must enforce at most one BudgetAdjustment per user/month
 * and one GoalContributionPlan per user/goalId. Database ownership metadata
 * such as user_id, created_at and updated_at belongs in adapters, not in the
 * domain models imported here.
 */
export interface FinanceRepository {
  loadFinanceData(userId: FinanceUserId): Promise<FinanceLoadResult>;
  getAccountBalanceSettings(userId: FinanceUserId): Promise<AccountBalanceSettings | null>;
  saveAccountBalanceSettings(userId: FinanceUserId, settings: AccountBalanceSettingsInput): Promise<AccountBalanceSettings>;

  createTransaction(userId: FinanceUserId, transaction: TransactionCreateInput): Promise<Transaction>;
  createTransactions(userId: FinanceUserId, transactions: TransactionCreateInput[]): Promise<Transaction[]>;
  updateTransaction(userId: FinanceUserId, transaction: TransactionUpdateInput): Promise<Transaction>;
  updateTransactionClassification(userId: FinanceUserId, update: TransactionClassificationUpdate): Promise<Transaction>;
  deleteTransaction(userId: FinanceUserId, transactionId: string): Promise<void>;

  upsertBudget(userId: FinanceUserId, budget: Budget): Promise<Budget>;
  deleteBudget(userId: FinanceUserId, budgetId: string): Promise<void>;

  upsertBudgetAdjustment(userId: FinanceUserId, adjustment: BudgetAdjustment): Promise<BudgetAdjustment>;
  deleteBudgetAdjustment(userId: FinanceUserId, month: string): Promise<void>;

  upsertGoal(userId: FinanceUserId, goal: Goal): Promise<Goal>;
  deleteGoal(userId: FinanceUserId, goalId: string): Promise<void>;

  upsertGoalContributionPlan(userId: FinanceUserId, plan: GoalContributionPlan): Promise<GoalContributionPlan>;
  deleteGoalContributionPlan(userId: FinanceUserId, goalId: string): Promise<void>;

  upsertInvestment(userId: FinanceUserId, investment: Investment): Promise<Investment>;
  deleteInvestment(userId: FinanceUserId, investmentId: string): Promise<void>;
}
