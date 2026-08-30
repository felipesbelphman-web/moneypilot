"use client";

import { useCurrency } from "@/components/CurrencyProvider";

import Image from "next/image";
import { useLanguage, type Language } from "@/components/LanguageProvider";
import type { Transaction } from "@/components/transactions/transaction-model";
import { translations } from "@/i18n/translations";

const iconRoot = "/moneypilot/transactions/icons";

type TransactionsKpiCardsProps = {
  transactions: Transaction[];
  selectedMonth: string;
};

export function TransactionsKpiCards({ transactions, selectedMonth }: TransactionsKpiCardsProps) {
  const { language } = useLanguage();
  const { formatMoney: money } = useCurrency();
  const t = translations[language].appTransactions;
  const copy = language === "pt"
    ? { noTransactions: "Ainda não existem transações", recent: (count: number) => `${count} nos últimos 7 dias`, noRecent: "Nenhuma nos últimos 7 dias", incomeRatio: (value: string) => `${value}% da renda`, noIncome: "Ainda não existem dados de renda", previousChange: (value: string) => `${value}% vs mês anterior`, noPrevious: "Sem comparação com o mês anterior", noTrend: "Ainda não existem dados", addForTrends: "Adicione transações para ver tendências", trendDetail: (amount: string, change: string) => `${amount} • +${change}% vs mês anterior`, notCalculated: "Ainda não calculado" }
    : language === "es"
      ? { noTransactions: "Aún no hay transacciones", recent: (count: number) => `${count} en los últimos 7 días`, noRecent: "Ninguna en los últimos 7 días", incomeRatio: (value: string) => `${value}% de los ingresos`, noIncome: "Aún no hay datos de ingresos", previousChange: (value: string) => `${value}% vs mes anterior`, noPrevious: "Sin comparación con el mes anterior", noTrend: "Aún no hay datos", addForTrends: "Añade transacciones para ver tendencias", trendDetail: (amount: string, change: string) => `${amount} • +${change}% vs mes anterior`, notCalculated: "Aún no calculado" }
      : language === "de" ? { noTransactions: "Noch keine Transaktionen", recent: (count: number) => `${count} in den letzten 7 Tagen`, noRecent: "Keine in den letzten 7 Tagen", incomeRatio: (value: string) => `${value}% des Einkommens`, noIncome: "Noch keine Einkommensdaten", previousChange: (value: string) => `${value}% zum Vormonat`, noPrevious: "Kein Vergleich mit dem Vormonat", noTrend: "Noch keine Daten", addForTrends: "Füge Transaktionen hinzu, um Trends zu sehen", trendDetail: (amount: string, change: string) => `${amount} • +${change}% zum Vormonat`, notCalculated: "Noch nicht berechnet" }
      : language === "fr" ? { noTransactions: "Aucune transaction pour le moment", recent: (count: number) => `${count} sur les 7 derniers jours`, noRecent: "Aucune sur les 7 derniers jours", incomeRatio: (value: string) => `${value}% des revenus`, noIncome: "Aucune donnée de revenus", previousChange: (value: string) => `${value}% par rapport au mois précédent`, noPrevious: "Aucune comparaison avec le mois précédent", noTrend: "Aucune donnée", addForTrends: "Ajoutez des transactions pour voir les tendances", trendDetail: (amount: string, change: string) => `${amount} • +${change}% par rapport au mois précédent`, notCalculated: "Pas encore calculé" }
      : language === "nl" ? { noTransactions: "Nog geen transacties", recent: (count: number) => `${count} in de afgelopen 7 dagen`, noRecent: "Geen in de afgelopen 7 dagen", incomeRatio: (value: string) => `${value}% van het inkomen`, noIncome: "Nog geen inkomensgegevens", previousChange: (value: string) => `${value}% t.o.v. vorige maand`, noPrevious: "Geen vergelijking met vorige maand", noTrend: "Nog geen gegevens", addForTrends: "Voeg transacties toe om trends te zien", trendDetail: (amount: string, change: string) => `${amount} • +${change}% t.o.v. vorige maand`, notCalculated: "Nog niet berekend" }
      : language === "it" ? { noTransactions: "Nessuna transazione per ora", recent: (count: number) => `${count} negli ultimi 7 giorni`, noRecent: "Nessuna negli ultimi 7 giorni", incomeRatio: (value: string) => `${value}% delle entrate`, noIncome: "Nessun dato sulle entrate", previousChange: (value: string) => `${value}% rispetto al mese precedente`, noPrevious: "Nessun confronto con il mese precedente", noTrend: "Nessun dato", addForTrends: "Aggiungi transazioni per vedere le tendenze", trendDetail: (amount: string, change: string) => `${amount} • +${change}% rispetto al mese precedente`, notCalculated: "Non ancora calcolato" }
      : { noTransactions: "No transactions yet", recent: (count: number) => `${count} in the last 7 days`, noRecent: "None in the last 7 days", incomeRatio: (value: string) => `${value}% of income`, noIncome: "No income data yet", previousChange: (value: string) => `${value}% vs previous month`, noPrevious: "No previous month comparison", noTrend: "No data yet", addForTrends: "Add transactions to see spending trends", trendDetail: (amount: string, change: string) => `${amount} • +${change}% vs previous month`, notCalculated: "Not calculated yet" };
  const monthTransactions = transactions.filter((transaction) => transaction.dateISO.startsWith(selectedMonth));
  const previousMonth = getPreviousMonth(selectedMonth);
  const previousMonthTransactions = transactions.filter((transaction) => transaction.dateISO.startsWith(previousMonth));
  const expenseTotal = sumByType(monthTransactions, "expense");
  const incomeTotal = sumByType(monthTransactions, "income");
  const previousExpenseTotal = sumByType(previousMonthTransactions, "expense");
  const recentCount = countLastSevenDays(monthTransactions, selectedMonth);
  const incomeDetail = incomeTotal > 0 ? copy.incomeRatio(formatPercentage(expenseTotal / incomeTotal, language)) : copy.noIncome;
  const previousDetail = previousExpenseTotal > 0 ? copy.previousChange(formatSignedPercentage((expenseTotal - previousExpenseTotal) / previousExpenseTotal, language)) : copy.noPrevious;
  const spendDetail = incomeTotal > 0 ? `${incomeDetail} • ${previousDetail}` : incomeDetail;
  const categoryTrend = findRisingCategory(monthTransactions, previousMonthTransactions);
  const cards = [
    { title: t.movements, value: String(monthTransactions.length), detail: monthTransactions.length === 0 ? copy.noTransactions : recentCount > 0 ? copy.recent(recentCount) : copy.noRecent, color: "#3B82F6", icon: `${iconRoot}/receipt-outline.svg` },
    { title: t.monthlySpend, value: money(expenseTotal), detail: spendDetail, color: "#F43F5E", icon: `${iconRoot}/trending-down-outline.svg` },
    { title: t.variableSpendRising, value: categoryTrend?.category ?? copy.noTrend, detail: categoryTrend ? copy.trendDetail(money(categoryTrend.amount), formatPercentage(categoryTrend.growth, language)) : copy.addForTrends, color: "#8B5CF6", icon: `${iconRoot}/pricetag-outline.svg` },
    { title: t.availableToSpend, value: "—", detail: copy.notCalculated, color: "#22C55E", icon: "/moneypilot/dashboard-safe-to-spend-icon.svg" },
  ];
  return (
    <div className="absolute left-0 top-[122px] flex h-[116px] w-[1090px] justify-between">
      {cards.map((card) => (
        <article key={card.title} className="relative h-[116px] w-[263px] overflow-hidden rounded-[18px] border border-[#28313B] bg-[rgba(8,11,15,0.22)] shadow-[0_8px_18px_rgba(0,0,0,0.24)] backdrop-blur-[7px]">
          <div className="absolute left-[13px] top-[13px] flex size-[30px] items-center justify-center rounded-[9px] border" style={{ borderColor: card.color, backgroundColor: `${card.color}24` }}>
            <Image src={card.icon} alt="" width={20} height={20} className="size-[20px]" />
          </div>
          <h2 className="absolute left-[53px] top-[18px] text-[11px] font-semibold text-[#F5F7FA]">{card.title}</h2>
          <strong className="absolute left-[13px] top-[54px] text-[23px] font-semibold leading-none text-[#F5F7FA]">{card.value}</strong>
          <p className="absolute left-[13px] top-[88px] text-[10px] text-[#9CA6B2]">{card.detail}</p>
        </article>
      ))}
    </div>
  );
}

function getPreviousMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 2, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function sumByType(transactions: Transaction[], type: Transaction["type"]) {
  return transactions.reduce((total, transaction) => transaction.type === type ? total + transaction.amount : total, 0);
}

function countLastSevenDays(transactions: Transaction[], selectedMonth: string) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (selectedMonth !== currentMonth) return 0;
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const firstDay = today - 6 * 24 * 60 * 60 * 1000;
  return transactions.filter((transaction) => {
    const transactionTime = Date.parse(`${transaction.dateISO}T00:00:00Z`);
    return transactionTime >= firstDay && transactionTime <= today;
  }).length;
}

function findRisingCategory(current: Transaction[], previous: Transaction[]) {
  const currentTotals = categoryExpenseTotals(current);
  const previousTotals = categoryExpenseTotals(previous);
  return Array.from(currentTotals.entries()).flatMap(([category, amount]) => {
    const previousAmount = previousTotals.get(category) ?? 0;
    if (previousAmount <= 0 || amount <= previousAmount) return [];
    return [{ category, amount, growth: (amount - previousAmount) / previousAmount }];
  }).sort((a, b) => b.growth - a.growth)[0] ?? null;
}

function categoryExpenseTotals(transactions: Transaction[]) {
  const totals = new Map<string, number>();
  for (const transaction of transactions) {
    if (transaction.type !== "expense") continue;
    totals.set(transaction.category, (totals.get(transaction.category) ?? 0) + transaction.amount);
  }
  return totals;
}

function formatPercentage(value: number, language: Language) {
  return new Intl.NumberFormat(language === "pt" ? "pt-PT" : language === "es" ? "es-ES" : "en-IE", { maximumFractionDigits: 1 }).format(value * 100);
}

function formatSignedPercentage(value: number, language: Language) {
  const formatted = formatPercentage(Math.abs(value), language);
  return `${value >= 0 ? "+" : "−"}${formatted}`;
}
