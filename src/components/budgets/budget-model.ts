import type { Transaction } from "@/components/transactions/transaction-model";

export type BudgetStatus = "Dentro do plano" | "No controle" | "Atenção" | "Perto do limite" | "Estourado";

export type Budget = {
  id: string;
  category: string;
  subtitle: string;
  budget: number;
  month: string;
  color: string;
};

export type BudgetWithProgress = Budget & {
  spent: number;
  status: BudgetStatus;
};

export type BudgetAdjustment = {
  month: string;
  targetRemainingSpend: number;
  baselineProjectedTotal: number;
  adjustmentNeeded: number;
  suggestedWeeklyReduction: number;
};

export function normalizeCategory(category: string) {
  return category.trim().toLocaleLowerCase();
}

export function calculateBudgetSpent(budget: Pick<Budget, "category" | "month">, transactions: Transaction[]) {
  const category = normalizeCategory(budget.category);

  return transactions.reduce((total, transaction) => {
    const matches = transaction.type === "expense"
      && normalizeCategory(transaction.category) === category
      && transaction.dateISO.slice(0, 7) === budget.month;

    return matches ? total + transaction.amount : total;
  }, 0);
}

export function calculateBudgetStatus(budget: number, spent: number): BudgetStatus {
  const usage = spent / budget;
  if (usage > 1) return "Estourado";
  if (usage === 1) return "Dentro do plano";
  if (usage >= 0.9) return "Perto do limite";
  if (usage >= 0.8) return "Atenção";
  return "No controle";
}
