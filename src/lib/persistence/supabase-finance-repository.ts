import { retrieveFinanceCollection, type FinanceCollectionPageRequest, type FinanceCollectionPage } from "./finance-collection-pagination.ts";
import { requireCompleteCollection } from "./finance-collection-completeness.ts";
import { validateTransactionDateRange, type CompletePeriodResult, type TransactionDateRange } from "./finance-query-contracts.ts";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Budget, BudgetAdjustment } from "@/components/budgets/budget-model";
import type { GoalContributionPlan } from "@/components/goals/goal-contribution-plan";
import type { Goal } from "@/components/goals/goal-model";
import type { Investment } from "@/components/investments/investment-model";
import type { Transaction, TransactionClassificationUpdate, TransactionCreateInput, TransactionUpdateInput } from "@/components/transactions/transaction-model";
import type { AccountBalanceSettings, AccountBalanceSettingsInput } from "@/lib/domain/account-balance-settings";
import { FinanceError, mapFinanceRepositoryError } from "@/lib/domain/finance-error";
import { settleFinanceResourceLoaders } from "@/lib/persistence/finance-hydration";
import type { FinanceRepository } from "@/lib/persistence/finance-repository";
import type { FinanceLoadResult, FinanceUserId } from "@/lib/persistence/finance-persistence-model";
import { applyFinanceResourceOrder } from "@/lib/persistence/finance-resource-order";
import { accountBalanceSettingsRowToDomain, accountBalanceSettingsToInsert, accountBalanceSettingsToUpdate, budgetAdjustmentRowToDomain, budgetAdjustmentToRow, budgetRowToDomain, budgetToRow, goalContributionPlanRowToDomain, goalContributionPlanToRow, goalRowToDomain, goalToRow, investmentRowToDomain, investmentToRow, transactionClassificationToUpdate, transactionRowToDomain, transactionToRow, transactionToUpdate } from "@/lib/persistence/supabase-finance-mappers";
import type { Database } from "@/lib/supabase/database.types";

type SupabaseError = { code?: string } | null;

export const transactionProjection = "id,description,category,category_color,category_id,category_name_snapshot,category_color_snapshot,normalized_category_snapshot,payment,date,date_iso,origin,type,amount,user_id,created_at,updated_at";
export const budgetProjection = "id,category,subtitle,budget,month,color,user_id,created_at,updated_at";
export const budgetAdjustmentProjection = "month,target_remaining_spend,baseline_projected_total,adjustment_needed,suggested_weekly_reduction,user_id,created_at,updated_at";
export const goalProjection = "id,name,target_amount,saved_amount,target_date,priority,user_id,created_at,updated_at";
export const goalContributionPlanProjection = "goal_id,monthly_target,baseline_required_monthly_contribution,savings_boost,user_id,created_at,updated_at";
export const investmentProjection = "id,name,symbol,asset_type,quantity,average_purchase_price,price_mode,manual_current_price,market_asset_key,native_currency,user_id,created_at,updated_at";
export const accountBalanceSettingsProjection = "user_id,opening_balance,opening_date,created_at,updated_at";

export class SupabaseFinanceRepository implements FinanceRepository {
  private readonly client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database>) {
    this.client = client;
  }

  async loadFinanceData(userId: FinanceUserId): Promise<FinanceLoadResult> {
    return settleFinanceResourceLoaders({
      accountBalanceSettings: () => this.getAccountBalanceSettings(userId),
      transactions: () => this.loadResource(
        applyFinanceResourceOrder(this.client.from("transactions").select(transactionProjection, { count: "exact" }).eq("user_id", userId), "transactions"),
        transactionRowToDomain,
      ),
      budgets: () => this.loadPagedResource(
        ({ from, to, count }) => applyFinanceResourceOrder(this.client.from("budgets").select(budgetProjection, { count }).eq("user_id", userId), "budgets").range(from, to),
        row => row.id,
        budgetRowToDomain,
      ),
      budgetAdjustments: () => this.loadPagedResource(
        ({ from, to, count }) => applyFinanceResourceOrder(this.client.from("budget_adjustments").select(budgetAdjustmentProjection, { count }).eq("user_id", userId), "budgetAdjustments").range(from, to),
        row => row.month,
        budgetAdjustmentRowToDomain,
      ),
      goals: () => this.loadPagedResource(
        ({ from, to, count }) => applyFinanceResourceOrder(this.client.from("goals").select(goalProjection, { count }).eq("user_id", userId), "goals").range(from, to),
        row => row.id,
        goalRowToDomain,
      ),
      goalContributionPlans: () => this.loadPagedResource(
        ({ from, to, count }) => applyFinanceResourceOrder(this.client.from("goal_contribution_plans").select(goalContributionPlanProjection, { count }).eq("user_id", userId), "goalContributionPlans").range(from, to),
        row => row.goal_id,
        goalContributionPlanRowToDomain,
      ),
      investments: () => this.loadPagedResource(
        ({ from, to, count }) => applyFinanceResourceOrder(this.client.from("investments").select(investmentProjection, { count }).eq("user_id", userId), "investments").range(from, to),
        row => row.id,
        investmentRowToDomain,
      ),
    });
  }

  async listTransactionsForPeriod(userId: FinanceUserId, range: TransactionDateRange): Promise<CompletePeriodResult<Transaction>> {
    // Copy validated strings before the first await; caller mutation cannot shift scope.
    const scope = validateTransactionDateRange(range);
    try {
      const rows = await retrieveFinanceCollection({
        fetchPage: ({ from, to, count }) => applyFinanceResourceOrder(
          this.client.from("transactions").select(transactionProjection, { count })
            .eq("user_id", userId).gte("date_iso", scope.startISO).lt("date_iso", scope.endExclusiveISO),
          "transactions",
        ).range(from, to),
        identity: row => row.id,
      });
      const items = rows.map(transactionRowToDomain);
      if (items.some(item => item.dateISO < scope.startISO || item.dateISO >= scope.endExclusiveISO)) {
        throw new FinanceError("repository_unavailable", { reason: "incomplete_collection" });
      }
      return { completeness: "complete", range: scope, items };
    } catch (error) {
      throw mapFinanceRepositoryError(error);
    }
  }

  async getAccountBalanceSettings(userId: FinanceUserId): Promise<AccountBalanceSettings | null> {
    const result = await this.client.from("account_balance_settings").select(accountBalanceSettingsProjection).eq("user_id", userId).maybeSingle();
    throwIfSupabaseError(result.error, "Failed to load account balance settings");
    return result.data === null ? null : accountBalanceSettingsRowToDomain(result.data);
  }

  async saveAccountBalanceSettings(userId: FinanceUserId, settings: AccountBalanceSettingsInput): Promise<AccountBalanceSettings> {
    const existing = await this.getAccountBalanceSettings(userId);
    const query = existing === null
      ? this.client.from("account_balance_settings").insert(accountBalanceSettingsToInsert(userId, settings))
      : this.client.from("account_balance_settings").update(accountBalanceSettingsToUpdate(settings)).eq("user_id", userId);
    const result = await query.select(accountBalanceSettingsProjection).single();
    throwIfSupabaseError(result.error, "Failed to save account balance settings");
    return accountBalanceSettingsRowToDomain(requireData(result.data, "Failed to save account balance settings"));
  }

  private async loadPagedResource<Row, Domain>(
    fetchPage: (request: FinanceCollectionPageRequest) => PromiseLike<FinanceCollectionPage<Row>>,
    identity: (row: Row) => string,
    mapper: (row: Row) => Domain,
  ): Promise<Domain[]> {
    const rows = await retrieveFinanceCollection({ fetchPage, identity });
    return rows.map(mapper);
  }

  private async loadResource<Row, Domain>(
    query: PromiseLike<{ data: Row[] | null; error: SupabaseError; count: number | null }>,
    mapper: (row: Row) => Domain,
  ): Promise<Domain[]> {
    const result = await query;
    throwIfSupabaseError(result.error, "Failed to load financial resource");
    return requireCompleteCollection(result.data, result.count).map(mapper);
  }

  async createTransaction(userId: FinanceUserId, transaction: TransactionCreateInput): Promise<Transaction> {
    const result = await this.client.from("transactions").insert(transactionToRow(userId, transaction)).select(transactionProjection).single();
    throwIfSupabaseError(result.error, "Failed to create transaction");
    return transactionRowToDomain(requireData(result.data, "Failed to create transaction"));
  }

  async createTransactions(
  userId: FinanceUserId,
  transactions: TransactionCreateInput[],
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
    .select(transactionProjection);

  throwIfSupabaseError(result.error, "Failed to import transactions");

  const data = requireRows(
    result.data,
    transactions.length,
    "Failed to import transactions",
  );

  return data.map(transactionRowToDomain);
}

  async updateTransaction(userId: FinanceUserId, transaction: TransactionUpdateInput): Promise<Transaction> {
    const row = transactionToUpdate(transaction);
    const result = await this.client.from("transactions").update(row).eq("user_id", userId).eq("id", transaction.id).select(transactionProjection).single();
    throwIfSupabaseError(result.error, "Failed to update transaction");
    return transactionRowToDomain(requireData(result.data, "Failed to update transaction"));
  }

  async updateTransactionClassification(userId: FinanceUserId, update: TransactionClassificationUpdate): Promise<Transaction> {
    const row = transactionClassificationToUpdate(update.categoryWrite);
    const result = await this.client.from("transactions").update(row).eq("user_id", userId).eq("id", update.id).select(transactionProjection).single();
    throwIfSupabaseError(result.error, "Failed to update transaction classification");
    return transactionRowToDomain(requireData(result.data, "Failed to update transaction classification"));
  }

  async deleteTransaction(userId: FinanceUserId, transactionId: string): Promise<void> {
    const result = await this.client.from("transactions").delete().eq("user_id", userId).eq("id", transactionId).select("id").single();
    throwIfSupabaseError(result.error, "Failed to delete transaction");
    requireData(result.data, "Failed to delete transaction");
  }

  async upsertBudget(userId: FinanceUserId, budget: Budget): Promise<Budget> {
    const result = await this.client.from("budgets").upsert(budgetToRow(userId, budget), { onConflict: "user_id,id" }).select(budgetProjection).single();
    throwIfSupabaseError(result.error, "Failed to upsert budget");
    return budgetRowToDomain(requireData(result.data, "Failed to upsert budget"));
  }

  async deleteBudget(userId: FinanceUserId, budgetId: string): Promise<void> {
    const result = await this.client.from("budgets").delete().eq("user_id", userId).eq("id", budgetId).select("id").single();
    throwIfSupabaseError(result.error, "Failed to delete budget");
    requireData(result.data, "Failed to delete budget");
  }

  async upsertBudgetAdjustment(userId: FinanceUserId, adjustment: BudgetAdjustment): Promise<BudgetAdjustment> {
    const result = await this.client.from("budget_adjustments").upsert(budgetAdjustmentToRow(userId, adjustment), { onConflict: "user_id,month" }).select(budgetAdjustmentProjection).single();
    throwIfSupabaseError(result.error, "Failed to upsert budget adjustment");
    return budgetAdjustmentRowToDomain(requireData(result.data, "Failed to upsert budget adjustment"));
  }

  async deleteBudgetAdjustment(userId: FinanceUserId, month: string): Promise<void> {
    const result = await this.client.from("budget_adjustments").delete().eq("user_id", userId).eq("month", month).select("month").single();
    throwIfSupabaseError(result.error, "Failed to delete budget adjustment");
    requireData(result.data, "Failed to delete budget adjustment");
  }

  async upsertGoal(userId: FinanceUserId, goal: Goal): Promise<Goal> {
    const result = await this.client.from("goals").upsert(goalToRow(userId, goal), { onConflict: "user_id,id" }).select(goalProjection).single();
    throwIfSupabaseError(result.error, "Failed to upsert goal");
    return goalRowToDomain(requireData(result.data, "Failed to upsert goal"));
  }

  async deleteGoal(userId: FinanceUserId, goalId: string): Promise<void> {
    const result = await this.client.from("goals").delete().eq("user_id", userId).eq("id", goalId).select("id").single();
    throwIfSupabaseError(result.error, "Failed to delete goal");
    requireData(result.data, "Failed to delete goal");
  }

  async upsertGoalContributionPlan(userId: FinanceUserId, plan: GoalContributionPlan): Promise<GoalContributionPlan> {
    const result = await this.client.from("goal_contribution_plans").upsert(goalContributionPlanToRow(userId, plan), { onConflict: "user_id,goal_id" }).select(goalContributionPlanProjection).single();
    throwIfSupabaseError(result.error, "Failed to upsert goal contribution plan");
    return goalContributionPlanRowToDomain(requireData(result.data, "Failed to upsert goal contribution plan"));
  }

  async deleteGoalContributionPlan(userId: FinanceUserId, goalId: string): Promise<void> {
    const result = await this.client.from("goal_contribution_plans").delete().eq("user_id", userId).eq("goal_id", goalId).select("goal_id").single();
    throwIfSupabaseError(result.error, "Failed to delete goal contribution plan");
    requireData(result.data, "Failed to delete goal contribution plan");
  }

  async upsertInvestment(userId: FinanceUserId, investment: Investment): Promise<Investment> {
    const result = await this.client.from("investments").upsert(investmentToRow(userId, investment), { onConflict: "user_id,id" }).select(investmentProjection).single();
    throwIfSupabaseError(result.error, "Failed to upsert investment");
    return investmentRowToDomain(requireData(result.data, "Failed to upsert investment"));
  }

  async deleteInvestment(userId: FinanceUserId, investmentId: string): Promise<void> {
    const result = await this.client.from("investments").delete().eq("user_id", userId).eq("id", investmentId).select("id").single();
    throwIfSupabaseError(result.error, "Failed to delete investment");
    requireData(result.data, "Failed to delete investment");
  }
}

function throwIfSupabaseError(error: SupabaseError, _operation: string): void {
  void _operation;
  if (error) throw mapFinanceRepositoryError(error);
}

function requireData<T>(data: T | null, _operation: string): T {
  void _operation;
  if (data === null) throw new FinanceError("unknown_repository_error");
  return data;
}

function requireRows<T>(data: T[] | null, expectedCount: number, _operation: string): T[] {
  void _operation;
  if (data === null || data.length !== expectedCount) throw new FinanceError("unknown_repository_error");
  return data;
}
