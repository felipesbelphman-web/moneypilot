import type { FunctionTool } from "@openai/agents";

import type { MoneyPilotAgentContext } from "@/ai/agent";
import { loadAuthenticatedFinancialData } from "@/ai/services/financial-data";
import { isRecord, optionalString, parseToolInput, requireToolUserId } from "@/ai/tools/tool-utils";
import { calculateDashboardFinancialSummary, getDashboardMonth } from "@/components/dashboard/dashboard-financial-summary";

type FinancialSummaryInput = { month?: string };
export type FinancialSummaryToolResult = {
  month: string;
  income: number | null;
  expenses: number | null;
  balance: number | null;
  netCashFlow: number | null;
  savings: number | null;
  topSpendingCategories: { category: string; amount: number; percentage: number }[];
  transactionCount: number;
  budget: { planned: number | null; spent: number | null; remaining: number | null };
};

function parseInput(value: unknown): FinancialSummaryInput | null {
  if (!isRecord(value)) return null;
  const month = optionalString(value, "month");
  if (month === null || (month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month))) return null;
  return month ? { month } : {};
}

export const getFinancialSummary: FunctionTool<MoneyPilotAgentContext, undefined, FinancialSummaryToolResult> = {
  type: "function",
  name: "get_financial_summary",
  description: "Read the authenticated user's official financial summary for a month.",
  parameters: {
    type: "object",
    properties: { month: { type: "string", description: "Financial month in YYYY-MM format." } },
    required: [],
    additionalProperties: false,
  },
  strict: true,
  needsApproval: async () => false,
  isEnabled: async () => true,
  errorFunction: async () => "Unable to access financial summary.",
  invoke: async (runContext, input) => {
    const userId = requireToolUserId(runContext);
    const { month } = parseToolInput(input, parseInput);
    const data = await loadAuthenticatedFinancialData(userId);
    const summary = calculateDashboardFinancialSummary({
      transactions: data.transactions,
      budgets: data.budgets,
      budgetAdjustments: Object.fromEntries(data.budgetAdjustments.map((item) => [item.month, item])),
      goals: data.goals,
      goalContributionPlans: Object.fromEntries(data.goalContributionPlans.map((item) => [item.goalId, item])),
      month: month ?? getDashboardMonth(),
    });

    return {
      month: summary.month,
      income: summary.aggregationAvailable ? summary.income : null,
      expenses: summary.aggregationAvailable ? summary.expenses : null,
      balance: summary.accountBalance,
      netCashFlow: summary.aggregationAvailable ? summary.netCashFlow : null,
      savings: summary.aggregationAvailable && summary.savingsCapacity.available ? summary.safeSavingsCapacity : null,
      topSpendingCategories: summary.categoryAggregationAvailable ? summary.categorySpending.slice(0, 5) : [],
      transactionCount: summary.transactionCount,
      budget: {
        planned: summary.aggregationAvailable && summary.budgetProjection.available ? summary.plannedBudgetTotal : null,
        spent: summary.aggregationAvailable && summary.budgetProjection.available ? summary.budgetSpentTotal : null,
        remaining: summary.aggregationAvailable && summary.budgetProjection.available ? summary.remainingBudget : null,
      },
    };
  },
};
