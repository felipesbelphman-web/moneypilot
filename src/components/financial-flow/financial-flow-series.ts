import type { Transaction } from "../transactions/transaction-model.ts";
import { aggregateMoney, type MoneyAggregationResult } from "../../lib/domain/money-aggregation.ts";
import { isFinancialTransactionType } from "../../lib/domain/category-integrity.ts";

export type FinancialFlowPoint = {
  dateISO: string;
  day: number;
  income: number;
  expense: number;
  net: number;
  cumulativeIncome: number;
  cumulativeExpense: number;
  cumulativeNet: number;
};

export type FinancialFlowTotals = { income: number; expenses: number; netCashFlow: number };
export type FinancialFlowSeriesResult =
  | { available: true; unavailableReason: null; points: FinancialFlowPoint[]; totals: FinancialFlowTotals }
  | { available: false; unavailableReason: "invalid_transaction_type" | "invalid_operand" | "unsafe_aggregate"; points: []; totals: null };

type Input = { month: string; transactions: Transaction[]; expectedTotals?: FinancialFlowTotals };

export function buildFinancialFlowSeries({ month, transactions, expectedTotals }: Input): FinancialFlowSeriesResult {
  const [year, monthNumber] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const buckets = Array.from({ length: daysInMonth }, () => ({ income: [] as number[], expenses: [] as number[] }));
  const periodTransactions = transactions.filter((transaction) => transaction.dateISO.slice(0, 7) === month);
  if (periodTransactions.some((transaction) => !isFinancialTransactionType(transaction.type))) {
    return unavailableFinancialFlowSeries("invalid_transaction_type");
  }

  for (const transaction of periodTransactions) {
    const day = Number(transaction.dateISO.slice(8, 10));
    const bucket = buckets[day - 1];
    if (!bucket) continue;
    (transaction.type === "income" ? bucket.income : bucket.expenses).push(transaction.amount);
  }

  const points: FinancialFlowPoint[] = [];
  let cumulativeIncome = 0;
  let cumulativeExpense = 0;
  let cumulativeNet = 0;
  for (let index = 0; index < buckets.length; index += 1) {
    const income = aggregateMoney(buckets[index].income);
    const expenses = aggregateMoney(buckets[index].expenses);
    if (!income.available || !expenses.available) return unavailable(income, expenses);
    const net = aggregateMoney([income.value, -expenses.value]);
    if (!net.available) return unavailable(net);
    const nextIncome = aggregateMoney([cumulativeIncome, income.value]);
    const nextExpense = aggregateMoney([cumulativeExpense, expenses.value]);
    const nextNet = aggregateMoney([cumulativeNet, net.value]);
    if (!nextIncome.available || !nextExpense.available || !nextNet.available) return unavailable(nextIncome, nextExpense, nextNet);
    cumulativeIncome = nextIncome.value;
    cumulativeExpense = nextExpense.value;
    cumulativeNet = nextNet.value;
    points.push({ dateISO: `${month}-${String(index + 1).padStart(2, "0")}`, day: index + 1, income: income.value, expense: expenses.value, net: net.value, cumulativeIncome, cumulativeExpense, cumulativeNet });
  }

  const incomeTotal = aggregateMoney(periodTransactions.filter((transaction) => transaction.type === "income").map((transaction) => transaction.amount));
  const expenseTotal = aggregateMoney(periodTransactions.filter((transaction) => transaction.type === "expense").map((transaction) => transaction.amount));
  if (!incomeTotal.available || !expenseTotal.available) return unavailable(incomeTotal, expenseTotal);
  const netTotal = aggregateMoney([incomeTotal.value, -expenseTotal.value]);
  if (!netTotal.available) return unavailable(netTotal);
  const totals = { income: incomeTotal.value, expenses: expenseTotal.value, netCashFlow: netTotal.value };
  const last = points.at(-1);
  if (!last || last.cumulativeIncome !== totals.income || last.cumulativeExpense !== totals.expenses || last.cumulativeNet !== totals.netCashFlow) return unavailableUnsafe();
  if (expectedTotals && (expectedTotals.income !== totals.income || expectedTotals.expenses !== totals.expenses || expectedTotals.netCashFlow !== totals.netCashFlow)) return unavailableUnsafe();
  return { available: true, unavailableReason: null, points, totals };
}

export function unavailableFinancialFlowSeries(reason: "invalid_transaction_type" | "invalid_operand" | "unsafe_aggregate"): FinancialFlowSeriesResult {
  return { available: false, unavailableReason: reason, points: [], totals: null };
}

function unavailable(...results: MoneyAggregationResult[]): FinancialFlowSeriesResult {
  const failure = results.find((result) => !result.available);
  return unavailableFinancialFlowSeries(failure && !failure.available ? failure.reason : "unsafe_aggregate");
}

function unavailableUnsafe(): FinancialFlowSeriesResult {
  return unavailableFinancialFlowSeries("unsafe_aggregate");
}
