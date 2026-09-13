import type { FunctionTool } from "@openai/agents";

import type { MoneyPilotAgentContext } from "@/ai/agent";
import { loadAuthenticatedFinancialData } from "@/ai/services/financial-data";
import { isRecord, optionalInteger, optionalString, parseToolInput, requireToolUserId } from "@/ai/tools/tool-utils";
import type { Transaction, TransactionType } from "@/components/transactions/transaction-model";

type TransactionsInput = {
  from?: string;
  to?: string;
  limit?: number;
  category?: string;
  type?: TransactionType;
  order?: "asc" | "desc";
};

function parseInput(value: unknown): TransactionsInput | null {
  if (!isRecord(value)) return null;
  const from = optionalString(value, "from");
  const to = optionalString(value, "to");
  const category = optionalString(value, "category");
  const limit = optionalInteger(value, "limit", 1, 100);
  const type = optionalString(value, "type");
  const order = optionalString(value, "order");
  if (from === null || to === null || category === null || limit === null || type === null || order === null) return null;
  if (type && type !== "income" && type !== "expense") return null;
  if (order && order !== "asc" && order !== "desc") return null;
  if (from && !/^\d{4}-\d{2}-\d{2}$/.test(from)) return null;
  if (to && !/^\d{4}-\d{2}-\d{2}$/.test(to)) return null;
  return { from: from ?? undefined, to: to ?? undefined, category: category ?? undefined, limit: limit ?? undefined, type: type as TransactionType | undefined, order: order as "asc" | "desc" | undefined };
}

function transactionMatches(transaction: Transaction, input: TransactionsInput) {
  return (!input.from || transaction.dateISO >= input.from)
    && (!input.to || transaction.dateISO <= input.to)
    && (!input.category || (transaction.category !== null && transaction.category.toLocaleLowerCase() === input.category.toLocaleLowerCase()))
    && (!input.type || transaction.type === input.type);
}

export const getTransactions: FunctionTool<MoneyPilotAgentContext, undefined, Transaction[]> = {
  type: "function",
  name: "get_transactions",
  description: "Read the authenticated user's official transactions with optional filters.",
  parameters: {
    type: "object",
    properties: {
      from: { type: "string", description: "Inclusive date in YYYY-MM-DD format." },
      to: { type: "string", description: "Inclusive date in YYYY-MM-DD format." },
      limit: { type: "integer", minimum: 1, maximum: 100 },
      category: { type: "string" },
      type: { type: "string", enum: ["income", "expense"] },
      order: { type: "string", enum: ["asc", "desc"] },
    },
    required: [],
    additionalProperties: false,
  },
  strict: true,
  needsApproval: async () => false,
  isEnabled: async () => true,
  errorFunction: async () => "Unable to access transactions.",
  invoke: async (runContext, input) => {
    const userId = requireToolUserId(runContext);
    const filters = parseToolInput(input, parseInput);
    const data = await loadAuthenticatedFinancialData(userId);
    return data.transactions
      .filter((transaction) => transactionMatches(transaction, filters))
      .sort((left, right) => filters.order === "asc" ? left.dateISO.localeCompare(right.dateISO) : right.dateISO.localeCompare(left.dateISO))
      .slice(0, filters.limit ?? 50);
  },
};
