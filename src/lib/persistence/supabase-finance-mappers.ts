import type { Budget, BudgetAdjustment } from "@/components/budgets/budget-model";
import type { GoalContributionPlan } from "@/components/goals/goal-contribution-plan";
import type { Goal, GoalPriority } from "@/components/goals/goal-model";
import type { Transaction, TransactionType } from "@/components/transactions/transaction-model";
import type { FinanceUserId } from "@/lib/persistence/finance-persistence-model";

type RowMetadata = { user_id: string; created_at: string; updated_at: string };

export type TransactionRow = RowMetadata & { id: string; description: string; category: string; category_color: string; payment: string; date: string; date_iso: string; origin: string; type: TransactionType; amount: number };
export type TransactionInsert = Omit<TransactionRow, "created_at" | "updated_at">;
export type BudgetRow = RowMetadata & { id: string; category: string; subtitle: string; budget: number; month: string; color: string };
export type BudgetInsert = Omit<BudgetRow, "created_at" | "updated_at">;
export type BudgetAdjustmentRow = RowMetadata & { month: string; target_remaining_spend: number; baseline_projected_total: number; adjustment_needed: number; suggested_weekly_reduction: number };
export type BudgetAdjustmentInsert = Omit<BudgetAdjustmentRow, "created_at" | "updated_at">;
export type GoalRow = RowMetadata & { id: string; name: string; target_amount: number; saved_amount: number; target_date: string; priority: GoalPriority };
export type GoalInsert = Omit<GoalRow, "created_at" | "updated_at">;
export type GoalContributionPlanRow = RowMetadata & { goal_id: string; monthly_target: number; baseline_required_monthly_contribution: number; savings_boost: number };
export type GoalContributionPlanInsert = Omit<GoalContributionPlanRow, "updated_at">;

export function transactionRowToDomain(row: TransactionRow): Transaction {
  return { id: row.id, description: row.description, category: row.category, categoryColor: row.category_color, payment: row.payment, date: row.date, dateISO: row.date_iso, origin: row.origin, type: row.type, amount: row.amount };
}

export function transactionToRow(userId: FinanceUserId, transaction: Transaction): TransactionInsert {
  return { user_id: userId, id: transaction.id, description: transaction.description, category: transaction.category, category_color: transaction.categoryColor, payment: transaction.payment, date: transaction.date, date_iso: transaction.dateISO, origin: transaction.origin, type: transaction.type, amount: transaction.amount };
}

export function budgetRowToDomain(row: BudgetRow): Budget {
  return { id: row.id, category: row.category, subtitle: row.subtitle, budget: row.budget, month: row.month, color: row.color };
}

export function budgetToRow(userId: FinanceUserId, budget: Budget): BudgetInsert {
  return { user_id: userId, id: budget.id, category: budget.category, subtitle: budget.subtitle, budget: budget.budget, month: budget.month, color: budget.color };
}

export function budgetAdjustmentRowToDomain(row: BudgetAdjustmentRow): BudgetAdjustment {
  return { month: row.month, targetRemainingSpend: row.target_remaining_spend, baselineProjectedTotal: row.baseline_projected_total, adjustmentNeeded: row.adjustment_needed, suggestedWeeklyReduction: row.suggested_weekly_reduction };
}

export function budgetAdjustmentToRow(userId: FinanceUserId, adjustment: BudgetAdjustment): BudgetAdjustmentInsert {
  return { user_id: userId, month: adjustment.month, target_remaining_spend: adjustment.targetRemainingSpend, baseline_projected_total: adjustment.baselineProjectedTotal, adjustment_needed: adjustment.adjustmentNeeded, suggested_weekly_reduction: adjustment.suggestedWeeklyReduction };
}

export function goalRowToDomain(row: GoalRow): Goal {
  return { id: row.id, name: row.name, targetAmount: row.target_amount, savedAmount: row.saved_amount, targetDate: row.target_date, priority: row.priority };
}

export function goalToRow(userId: FinanceUserId, goal: Goal): GoalInsert {
  return { user_id: userId, id: goal.id, name: goal.name, target_amount: goal.targetAmount, saved_amount: goal.savedAmount, target_date: goal.targetDate, priority: goal.priority };
}

export function goalContributionPlanRowToDomain(row: GoalContributionPlanRow): GoalContributionPlan {
  return { goalId: row.goal_id, monthlyTarget: row.monthly_target, baselineRequiredMonthlyContribution: row.baseline_required_monthly_contribution, savingsBoost: row.savings_boost, createdAt: row.created_at };
}

export function goalContributionPlanToRow(userId: FinanceUserId, plan: GoalContributionPlan): GoalContributionPlanInsert {
  return { user_id: userId, goal_id: plan.goalId, monthly_target: plan.monthlyTarget, baseline_required_monthly_contribution: plan.baselineRequiredMonthlyContribution, savings_boost: plan.savingsBoost, created_at: plan.createdAt };
}

type TableDefinition<Row, Insert> = { Row: Row; Insert: Insert; Update: Partial<Insert>; Relationships: [] };

export type FinanceDatabase = {
  public: {
    Tables: {
      transactions: TableDefinition<TransactionRow, TransactionInsert>;
      budgets: TableDefinition<BudgetRow, BudgetInsert>;
      budget_adjustments: TableDefinition<BudgetAdjustmentRow, BudgetAdjustmentInsert>;
      goals: TableDefinition<GoalRow, GoalInsert>;
      goal_contribution_plans: TableDefinition<GoalContributionPlanRow, GoalContributionPlanInsert>;
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
