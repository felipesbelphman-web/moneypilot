import type { SupabaseClient } from "@supabase/supabase-js";
import type { Budget, BudgetAdjustment } from "@/components/budgets/budget-model";
import type { GoalContributionPlan } from "@/components/goals/goal-contribution-plan";
import type { Goal } from "@/components/goals/goal-model";
import type { Transaction } from "@/components/transactions/transaction-model";
import type { FinanceRepository } from "@/lib/persistence/finance-repository";
import type { FinanceUserId, PersistedFinanceData } from "@/lib/persistence/finance-persistence-model";
import { budgetAdjustmentRowToDomain, budgetAdjustmentToRow, budgetRowToDomain, budgetToRow, goalContributionPlanRowToDomain, goalContributionPlanToRow, goalRowToDomain, goalToRow, transactionRowToDomain, transactionToRow, type FinanceDatabase } from "@/lib/persistence/supabase-finance-mappers";

type SupabaseError = { code?: string } | null;

export class SupabaseFinanceRepository implements FinanceRepository {
  private readonly client: SupabaseClient<FinanceDatabase>;

  constructor(client: SupabaseClient<FinanceDatabase>) {
    this.client = client;
  }

  async loadFinanceData(userId: FinanceUserId): Promise<PersistedFinanceData> {
    const [transactions, budgets, adjustments, goals, plans] = await Promise.all([
      this.client.from("transactions").select("*").eq("user_id", userId),
      this.client.from("budgets").select("*").eq("user_id", userId),
      this.client.from("budget_adjustments").select("*").eq("user_id", userId),
      this.client.from("goals").select("*").eq("user_id", userId),
      this.client.from("goal_contribution_plans").select("*").eq("user_id", userId),
    ]);
    throwIfSupabaseError(transactions.error, "Failed to load transactions");
    throwIfSupabaseError(budgets.error, "Failed to load budgets");
    throwIfSupabaseError(adjustments.error, "Failed to load budget adjustments");
    throwIfSupabaseError(goals.error, "Failed to load goals");
    throwIfSupabaseError(plans.error, "Failed to load goal contribution plans");
    return {
      transactions: (transactions.data ?? []).map(transactionRowToDomain),
      budgets: (budgets.data ?? []).map(budgetRowToDomain),
      budgetAdjustments: (adjustments.data ?? []).map(budgetAdjustmentRowToDomain),
      goals: (goals.data ?? []).map(goalRowToDomain),
      goalContributionPlans: (plans.data ?? []).map(goalContributionPlanRowToDomain),
    };
  }

  async createTransaction(userId: FinanceUserId, transaction: Transaction): Promise<Transaction> {
    const result = await this.client.from("transactions").insert(transactionToRow(userId, transaction)).select("*").single();
    throwIfSupabaseError(result.error, "Failed to create transaction");
    return transactionRowToDomain(requireData(result.data, "Failed to create transaction"));
  }

  async createTransactions(
  userId: FinanceUserId,
  transactions: Transaction[],
): Promise<Transaction[]> {
  if (transactions.length === 0) {
    return [];
  }

  const rows = transactions.map((transaction) =>
    transactionToRow(userId, transaction),
  );

  const result = await this.client
    .from("transactions")
    .insert(rows)
    .select("*");

  throwIfSupabaseError(result.error, "Failed to import transactions");

  const data = requireData(
    result.data,
    "Failed to import transactions",
  );

  return data.map(transactionRowToDomain);
}

  async updateTransaction(userId: FinanceUserId, transaction: Transaction): Promise<Transaction> {
    const result = await this.client.from("transactions").update(transactionToRow(userId, transaction)).eq("user_id", userId).eq("id", transaction.id).select("*").single();
    throwIfSupabaseError(result.error, "Failed to update transaction");
    return transactionRowToDomain(requireData(result.data, "Failed to update transaction"));
  }

  async deleteTransaction(userId: FinanceUserId, transactionId: string): Promise<void> {
    const result = await this.client.from("transactions").delete().eq("user_id", userId).eq("id", transactionId).select("id").single();
    throwIfSupabaseError(result.error, "Failed to delete transaction");
    requireData(result.data, "Failed to delete transaction");
  }

  async upsertBudget(userId: FinanceUserId, budget: Budget): Promise<Budget> {
    const result = await this.client.from("budgets").upsert(budgetToRow(userId, budget), { onConflict: "user_id,id" }).select("*").single();
    throwIfSupabaseError(result.error, "Failed to upsert budget");
    return budgetRowToDomain(requireData(result.data, "Failed to upsert budget"));
  }

  async deleteBudget(userId: FinanceUserId, budgetId: string): Promise<void> {
    const result = await this.client.from("budgets").delete().eq("user_id", userId).eq("id", budgetId).select("id").single();
    throwIfSupabaseError(result.error, "Failed to delete budget");
    requireData(result.data, "Failed to delete budget");
  }

  async upsertBudgetAdjustment(userId: FinanceUserId, adjustment: BudgetAdjustment): Promise<BudgetAdjustment> {
    const result = await this.client.from("budget_adjustments").upsert(budgetAdjustmentToRow(userId, adjustment), { onConflict: "user_id,month" }).select("*").single();
    throwIfSupabaseError(result.error, "Failed to upsert budget adjustment");
    return budgetAdjustmentRowToDomain(requireData(result.data, "Failed to upsert budget adjustment"));
  }

  async deleteBudgetAdjustment(userId: FinanceUserId, month: string): Promise<void> {
    const result = await this.client.from("budget_adjustments").delete().eq("user_id", userId).eq("month", month).select("month").single();
    throwIfSupabaseError(result.error, "Failed to delete budget adjustment");
    requireData(result.data, "Failed to delete budget adjustment");
  }

  async upsertGoal(userId: FinanceUserId, goal: Goal): Promise<Goal> {
    const result = await this.client.from("goals").upsert(goalToRow(userId, goal), { onConflict: "user_id,id" }).select("*").single();
    throwIfSupabaseError(result.error, "Failed to upsert goal");
    return goalRowToDomain(requireData(result.data, "Failed to upsert goal"));
  }

  async deleteGoal(userId: FinanceUserId, goalId: string): Promise<void> {
    const result = await this.client.from("goals").delete().eq("user_id", userId).eq("id", goalId).select("id").single();
    throwIfSupabaseError(result.error, "Failed to delete goal");
    requireData(result.data, "Failed to delete goal");
  }

  async upsertGoalContributionPlan(userId: FinanceUserId, plan: GoalContributionPlan): Promise<GoalContributionPlan> {
    const result = await this.client.from("goal_contribution_plans").upsert(goalContributionPlanToRow(userId, plan), { onConflict: "user_id,goal_id" }).select("*").single();
    throwIfSupabaseError(result.error, "Failed to upsert goal contribution plan");
    return goalContributionPlanRowToDomain(requireData(result.data, "Failed to upsert goal contribution plan"));
  }

  async deleteGoalContributionPlan(userId: FinanceUserId, goalId: string): Promise<void> {
    const result = await this.client.from("goal_contribution_plans").delete().eq("user_id", userId).eq("goal_id", goalId).select("goal_id").single();
    throwIfSupabaseError(result.error, "Failed to delete goal contribution plan");
    requireData(result.data, "Failed to delete goal contribution plan");
  }
}

function throwIfSupabaseError(error: SupabaseError, operation: string): void {
  if (error) throw new Error(error.code ? `${operation} (${error.code})` : operation);
}

function requireData<T>(data: T | null, operation: string): T {
  if (data === null) throw new Error(`${operation}: no row returned`);
  return data;
}
