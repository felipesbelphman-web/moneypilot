import type { Budget, BudgetAdjustment } from "@/components/budgets/budget-model";
import type { GoalContributionPlan } from "@/components/goals/goal-contribution-plan";
import type { Goal } from "@/components/goals/goal-model";
import type { Investment } from "@/components/investments/investment-model";
import type { Transaction, TransactionCategoryWrite, TransactionCreateInput, TransactionUpdateInput } from "@/components/transactions/transaction-model";
import type { AccountBalanceSettings, AccountBalanceSettingsInput } from "@/lib/domain/account-balance-settings";
import { validateAndNormalizeAccountBalanceSettings } from "@/lib/domain/account-balance-settings";
import { validateAndNormalizeBudget, validateAndNormalizeBudgetAdjustment } from "@/lib/domain/budget-validation";
import { parseGoalPriority, validateAndNormalizeGoal, validateGoalContributionPlan } from "@/lib/domain/goal-validation";
import { parseInvestmentAssetType, parseInvestmentPriceMode, validateAndNormalizeInvestment } from "@/lib/domain/investment-validation";
import { parseTransactionType, validateAndNormalizeTransaction, validateAndNormalizeTransactionFields } from "@/lib/domain/transaction-validation";
import { FinanceError } from "@/lib/domain/finance-error";
import { normalizeDerivedMoney } from "@/lib/domain/decimal-guard";
import type { FinanceUserId } from "@/lib/persistence/finance-persistence-model";
import type { Database, Tables, TablesInsert } from "@/lib/supabase/database.types";

export type TransactionRow = Tables<"transactions">;
type AccountBalanceSettingsTable = Database["public"]["Tables"]["account_balance_settings"];
export type AccountBalanceSettingsRow = AccountBalanceSettingsTable["Row"];
export type AccountBalanceSettingsInsert = AccountBalanceSettingsTable["Insert"];
export type AccountBalanceSettingsUpdate = AccountBalanceSettingsTable["Update"];
export type TransactionInsert = TablesInsert<"transactions">;
export type TransactionUpdate = Database["public"]["Tables"]["transactions"]["Update"];
export type BudgetRow = Tables<"budgets">;
export type BudgetInsert = TablesInsert<"budgets">;
export type BudgetAdjustmentRow = Tables<"budget_adjustments">;
export type BudgetAdjustmentInsert = TablesInsert<"budget_adjustments">;
export type GoalRow = Tables<"goals">;
export type GoalInsert = TablesInsert<"goals">;
export type GoalContributionPlanRow = Tables<"goal_contribution_plans">;
export type GoalContributionPlanInsert = TablesInsert<"goal_contribution_plans">;
export type InvestmentRow = Tables<"investments">;
export type InvestmentInsert = TablesInsert<"investments">;

export function accountBalanceSettingsRowToDomain(row: AccountBalanceSettingsRow): AccountBalanceSettings {
  const normalized = validateAndNormalizeAccountBalanceSettings({ openingBalance: row.opening_balance, openingDate: row.opening_date });
  return { ...normalized, userId: row.user_id, createdAt: row.created_at, updatedAt: row.updated_at };
}

export function accountBalanceSettingsToInsert(userId: FinanceUserId, settings: AccountBalanceSettingsInput): AccountBalanceSettingsInsert {
  const normalized = validateAndNormalizeAccountBalanceSettings(settings);
  return { user_id: userId, opening_balance: normalized.openingBalance, opening_date: normalized.openingDate };
}

export function accountBalanceSettingsToUpdate(settings: AccountBalanceSettingsInput): AccountBalanceSettingsUpdate {
  const normalized = validateAndNormalizeAccountBalanceSettings(settings);
  return { opening_balance: normalized.openingBalance, opening_date: normalized.openingDate };
}

export function transactionRowToDomain(row: TransactionRow): Transaction {
  const snapshots = [row.category_name_snapshot, row.category_color_snapshot, row.normalized_category_snapshot];
  const allSnapshotsNull = snapshots.every((value) => value === null);
  const allSnapshotsPresent = snapshots.every((value) => value !== null);
  if (!allSnapshotsNull && !allSnapshotsPresent) throw new FinanceError("validation_error", { field: "classification", reason: "invalid_format" });
  if (row.category_id !== null && !allSnapshotsPresent) throw new FinanceError("validation_error", { field: "classification", reason: "invalid_format" });
  const fields = { id: row.id, description: row.description, payment: row.payment, date: row.date, dateISO: row.date_iso, origin: row.origin, type: parseTransactionType(row.type), amount: row.amount };
  if (allSnapshotsNull) return validateAndNormalizeTransaction({ ...fields, category: null, categoryColor: null, classification: { kind: "uncategorized", categoryId: null, categoryNameSnapshot: null, categoryColorSnapshot: null, normalizedCategorySnapshot: null } });
  const categoryNameSnapshot = requireSnapshot(row.category_name_snapshot);
  const categoryColorSnapshot = requireSnapshot(row.category_color_snapshot);
  const normalizedCategorySnapshot = requireSnapshot(row.normalized_category_snapshot);
  const classification = row.category_id === null
    ? { kind: "legacy" as const, categoryId: null, categoryNameSnapshot, categoryColorSnapshot, normalizedCategorySnapshot }
    : { kind: "linked" as const, categoryId: row.category_id, categoryNameSnapshot, categoryColorSnapshot, normalizedCategorySnapshot };
  return validateAndNormalizeTransaction({ ...fields, classification, category: categoryNameSnapshot, categoryColor: categoryColorSnapshot });
}

function requireSnapshot(value: string | null) {
  if (value === null) throw new FinanceError("validation_error", { field: "classification", reason: "invalid_format" });
  return value;
}

export function transactionToRow(userId: FinanceUserId, transaction: TransactionCreateInput): TransactionInsert {
  const normalized = validateAndNormalizeTransactionFields(transaction);
  const category = categoryWriteToInsert(transaction.categoryWrite);
  return { user_id: userId, id: normalized.id, description: normalized.description, ...category, payment: normalized.payment, date: normalized.date, date_iso: normalized.dateISO, origin: normalized.origin, type: normalized.type, amount: normalized.amount };
}

function categoryWriteToInsert(write: TransactionCategoryWrite): Pick<TransactionInsert, "category" | "category_color" | "category_id"> {
  if (write.kind === "uncategorized") throw new FinanceError("validation_error", { field: "classification", reason: "required" });
  if (write.kind === "linked") return { category_id: requiredCategoryText(write.categoryId, "categoryId"), category: requiredCategoryText(write.legacyName, "category"), category_color: requiredCategoryText(write.legacyColor, "categoryColor") };
  return { category_id: null, category: requiredCategoryText(write.categoryName, "category"), category_color: requiredCategoryText(write.categoryColor, "categoryColor") };
}

export function transactionToUpdate(transaction: TransactionUpdateInput): TransactionUpdate {
  const normalized = validateAndNormalizeTransactionFields(transaction);
  return { description: normalized.description, payment: normalized.payment, date: normalized.date, date_iso: normalized.dateISO, origin: normalized.origin, type: normalized.type, amount: normalized.amount };
}

export function transactionClassificationToUpdate(write: Extract<TransactionCategoryWrite, { kind: "linked" | "uncategorized" }>): TransactionUpdate {
  if (write.kind === "uncategorized") return { category_id: null };
  return { category_id: requiredCategoryText(write.categoryId, "categoryId"), category: requiredCategoryText(write.legacyName, "category"), category_color: requiredCategoryText(write.legacyColor, "categoryColor") };
}

function requiredCategoryText(value: string, field: "category" | "categoryColor" | "categoryId") {
  const normalized = value.trim();
  if (!normalized) throw new FinanceError("validation_error", { field, reason: "required" });
  return normalized;
}

export function budgetRowToDomain(row: BudgetRow): Budget {
  return validateAndNormalizeBudget({ id: row.id, category: row.category, subtitle: row.subtitle, budget: row.budget, month: row.month, color: row.color });
}

export function budgetToRow(userId: FinanceUserId, budget: Budget): BudgetInsert {
  const normalized = validateAndNormalizeBudget(budget);
  return { user_id: userId, id: normalized.id, category: normalized.category, subtitle: normalized.subtitle, budget: normalized.budget, month: normalized.month, color: normalized.color };
}

export function budgetAdjustmentRowToDomain(row: BudgetAdjustmentRow): BudgetAdjustment {
  return validateAndNormalizeBudgetAdjustment({ month: row.month, targetRemainingSpend: row.target_remaining_spend, baselineProjectedTotal: row.baseline_projected_total, adjustmentNeeded: row.adjustment_needed, suggestedWeeklyReduction: row.suggested_weekly_reduction });
}

export function budgetAdjustmentToRow(userId: FinanceUserId, adjustment: BudgetAdjustment): BudgetAdjustmentInsert {
  const normalized = validateAndNormalizeBudgetAdjustment({ ...adjustment, targetRemainingSpend: normalizeDerivedMoney(adjustment.targetRemainingSpend, "targetRemainingSpend"), baselineProjectedTotal: normalizeDerivedMoney(adjustment.baselineProjectedTotal, "baselineProjectedTotal"), adjustmentNeeded: normalizeDerivedMoney(adjustment.adjustmentNeeded, "adjustmentNeeded"), suggestedWeeklyReduction: normalizeDerivedMoney(adjustment.suggestedWeeklyReduction, "suggestedWeeklyReduction") });
  return { user_id: userId, month: normalized.month, target_remaining_spend: normalized.targetRemainingSpend, baseline_projected_total: normalized.baselineProjectedTotal, adjustment_needed: normalized.adjustmentNeeded, suggested_weekly_reduction: normalized.suggestedWeeklyReduction };
}

export function goalRowToDomain(row: GoalRow): Goal {
  return validateAndNormalizeGoal({ id: row.id, name: row.name, targetAmount: row.target_amount, savedAmount: row.saved_amount, targetDate: row.target_date, priority: parseGoalPriority(row.priority) });
}

export function goalToRow(userId: FinanceUserId, goal: Goal): GoalInsert {
  const normalized = validateAndNormalizeGoal(goal);
  return { user_id: userId, id: normalized.id, name: normalized.name, target_amount: normalized.targetAmount, saved_amount: normalized.savedAmount, target_date: normalized.targetDate, priority: normalized.priority };
}

export function goalContributionPlanRowToDomain(row: GoalContributionPlanRow): GoalContributionPlan {
  return validateGoalContributionPlan({ goalId: row.goal_id, monthlyTarget: row.monthly_target, baselineRequiredMonthlyContribution: row.baseline_required_monthly_contribution, savingsBoost: row.savings_boost, createdAt: row.created_at });
}

export function goalContributionPlanToRow(userId: FinanceUserId, plan: GoalContributionPlan): GoalContributionPlanInsert {
  const validated = validateGoalContributionPlan({ ...plan, monthlyTarget: normalizeDerivedMoney(plan.monthlyTarget, "monthlyTarget"), baselineRequiredMonthlyContribution: normalizeDerivedMoney(plan.baselineRequiredMonthlyContribution, "baselineRequiredMonthlyContribution"), savingsBoost: normalizeDerivedMoney(plan.savingsBoost, "savingsBoost") });
  return { user_id: userId, goal_id: validated.goalId, monthly_target: validated.monthlyTarget, baseline_required_monthly_contribution: validated.baselineRequiredMonthlyContribution, savings_boost: validated.savingsBoost };
}

export function investmentRowToDomain(row: InvestmentRow): Investment {
  return validateAndNormalizeInvestment({ id: row.id, name: row.name, symbol: row.symbol, assetType: parseInvestmentAssetType(row.asset_type), quantity: row.quantity, averagePurchasePrice: row.average_purchase_price, priceMode: parseInvestmentPriceMode(row.price_mode), manualCurrentPrice: row.manual_current_price, marketAssetKey: row.market_asset_key, nativeCurrency: row.native_currency });
}

export function investmentToRow(userId: FinanceUserId, investment: Investment): InvestmentInsert {
  const normalized = validateAndNormalizeInvestment(investment);
  return { user_id: userId, id: normalized.id, name: normalized.name, symbol: normalized.symbol, asset_type: normalized.assetType, quantity: normalized.quantity, average_purchase_price: normalized.averagePurchasePrice, price_mode: normalized.priceMode, manual_current_price: normalized.manualCurrentPrice, market_asset_key: normalized.marketAssetKey, native_currency: normalized.nativeCurrency };
}
