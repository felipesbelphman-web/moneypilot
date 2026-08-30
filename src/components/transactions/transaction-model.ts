export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  description: string;
  category: string;
  categoryColor: string;
  payment: string;
  date: string;
  dateISO: string;
  origin: string;
  type: TransactionType;
  amount: number;
};
