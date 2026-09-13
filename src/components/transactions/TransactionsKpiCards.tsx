"use client";

import { useCurrency } from "@/components/CurrencyProvider";

import Image from "next/image";
import { useLanguage, type Language } from "@/components/LanguageProvider";
import type { Transaction } from "@/components/transactions/transaction-model";
import { translations } from "@/i18n/translations";
import { getLocalCivilDateISO, isCivilDateInRange, subtractCivilDays } from "@/lib/dates/civil-date";
import { calculateTransactionKpiAggregates } from "@/components/transactions/transaction-period-aggregates";
import { localizeTransactionCategory } from "@/components/transactions/transaction-presentation";

const iconRoot = "/moneypilot/transactions/icons";

type TransactionsKpiCardsProps = {
  transactions: Transaction[];
  selectedMonth: string;
  mobile?: boolean;
};

export function TransactionsKpiCards({ transactions, selectedMonth, mobile = false }: TransactionsKpiCardsProps) {
  const { language } = useLanguage();
  const { formatMoney: money } = useCurrency();
  const t = translations[language].appTransactions;
  const copy = language === "pt"
    ? { noTransactions: "Ainda não existem transações", recentZero: "Nenhuma deste período nos últimos 7 dias", recentOne: "1 deste período nos últimos 7 dias", recentMany: (count: number) => `${count} deste período nos últimos 7 dias`, incomeRatio: (value: string) => `${value}% da renda`, noIncome: "Ainda não existem dados de renda", previousChange: (value: string) => `${value}% vs mês anterior`, noPrevious: "Sem comparação com o mês anterior", noTrend: "Ainda não existem dados", addForTrends: "Adicione transações para ver tendências", trendDetail: (amount: string, change: string) => `${amount} • +${change}% vs mês anterior`, notCalculated: "Ainda não calculado" }
    : language === "es"
      ? { noTransactions: "Aún no hay transacciones", recentZero: "Ninguna de este período en los últimos 7 días", recentOne: "1 de este período en los últimos 7 días", recentMany: (count: number) => `${count} de este período en los últimos 7 días`, incomeRatio: (value: string) => `${value}% de los ingresos`, noIncome: "Aún no hay datos de ingresos", previousChange: (value: string) => `${value}% vs mes anterior`, noPrevious: "Sin comparación con el mes anterior", noTrend: "Aún no hay datos", addForTrends: "Añade transacciones para ver tendencias", trendDetail: (amount: string, change: string) => `${amount} • +${change}% vs mes anterior`, notCalculated: "Aún no calculado" }
      : language === "de" ? { noTransactions: "Noch keine Transaktionen", recentZero: "Keine aus diesem Zeitraum in den letzten 7 Tagen", recentOne: "1 aus diesem Zeitraum in den letzten 7 Tagen", recentMany: (count: number) => `${count} aus diesem Zeitraum in den letzten 7 Tagen`, incomeRatio: (value: string) => `${value}% des Einkommens`, noIncome: "Noch keine Einkommensdaten", previousChange: (value: string) => `${value}% zum Vormonat`, noPrevious: "Kein Vergleich mit dem Vormonat", noTrend: "Noch keine Daten", addForTrends: "Füge Transaktionen hinzu, um Trends zu sehen", trendDetail: (amount: string, change: string) => `${amount} • +${change}% zum Vormonat`, notCalculated: "Noch nicht berechnet" }
      : language === "fr" ? { noTransactions: "Aucune transaction pour le moment", recentZero: "Aucune de cette période sur les 7 derniers jours", recentOne: "1 de cette période sur les 7 derniers jours", recentMany: (count: number) => `${count} de cette période sur les 7 derniers jours`, incomeRatio: (value: string) => `${value}% des revenus`, noIncome: "Aucune donnée de revenus", previousChange: (value: string) => `${value}% par rapport au mois précédent`, noPrevious: "Aucune comparaison avec le mois précédent", noTrend: "Aucune donnée", addForTrends: "Ajoutez des transactions pour voir les tendances", trendDetail: (amount: string, change: string) => `${amount} • +${change}% par rapport au mois précédent`, notCalculated: "Pas encore calculé" }
      : language === "nl" ? { noTransactions: "Nog geen transacties", recentZero: "Geen uit deze periode in de afgelopen 7 dagen", recentOne: "1 uit deze periode in de afgelopen 7 dagen", recentMany: (count: number) => `${count} uit deze periode in de afgelopen 7 dagen`, incomeRatio: (value: string) => `${value}% van het inkomen`, noIncome: "Nog geen inkomensgegevens", previousChange: (value: string) => `${value}% t.o.v. vorige maand`, noPrevious: "Geen vergelijking met vorige maand", noTrend: "Nog geen gegevens", addForTrends: "Voeg transacties toe om trends te zien", trendDetail: (amount: string, change: string) => `${amount} • +${change}% t.o.v. vorige maand`, notCalculated: "Nog niet berekend" }
      : language === "it" ? { noTransactions: "Nessuna transazione per ora", recentZero: "Nessuna di questo periodo negli ultimi 7 giorni", recentOne: "1 di questo periodo negli ultimi 7 giorni", recentMany: (count: number) => `${count} di questo periodo negli ultimi 7 giorni`, incomeRatio: (value: string) => `${value}% delle entrate`, noIncome: "Nessun dato sulle entrate", previousChange: (value: string) => `${value}% rispetto al mese precedente`, noPrevious: "Nessun confronto con il mese precedente", noTrend: "Nessun dato", addForTrends: "Aggiungi transazioni per vedere le tendenze", trendDetail: (amount: string, change: string) => `${amount} • +${change}% rispetto al mese precedente`, notCalculated: "Non ancora calcolato" }
      : { noTransactions: "No transactions yet", recentZero: "None from this period in the last 7 days", recentOne: "1 from this period in the last 7 days", recentMany: (count: number) => `${count} from this period in the last 7 days`, incomeRatio: (value: string) => `${value}% of income`, noIncome: "No income data yet", previousChange: (value: string) => `${value}% vs previous month`, noPrevious: "No previous month comparison", noTrend: "No data yet", addForTrends: "Add transactions to see spending trends", trendDetail: (amount: string, change: string) => `${amount} • +${change}% vs previous month`, notCalculated: "Not calculated yet" };
  const aggregates = calculateTransactionKpiAggregates(transactions, selectedMonth);
  const monthTransactions = aggregates.monthTransactions;
  const recentCount = countLastSevenDays(monthTransactions);
  const recentDetail = recentCount === 0 ? copy.recentZero : recentCount === 1 ? copy.recentOne : copy.recentMany(recentCount);
  const incomeDetail = aggregates.available && aggregates.incomeUsage.available ? copy.incomeRatio(formatPercentage(aggregates.incomeUsage.value, language)) : copy.noIncome;
  const previousDetail = aggregates.available && aggregates.expenseVariation.available ? copy.previousChange(formatSignedPercentage(aggregates.expenseVariation.value, language)) : copy.noPrevious;
  const spendDetail = aggregates.available && aggregates.incomeUsage.available ? `${incomeDetail} • ${previousDetail}` : incomeDetail;
  const categoryTrend = aggregates.categoryAggregationAvailable ? aggregates.risingCategory : null;
  const cards = [
    { title: t.movements, value: String(monthTransactions.length), detail: recentDetail, compactValue: false, color: "#3B82F6", icon: `${iconRoot}/receipt-outline.svg` },
    { title: t.monthlySpend, value: aggregates.available ? money(aggregates.expenses) : "—", detail: spendDetail, compactValue: false, color: "#F43F5E", icon: `${iconRoot}/trending-down-outline.svg` },
    { title: t.variableSpendRising, value: categoryTrend ? localizeTransactionCategory(categoryTrend.category, language) : copy.noTrend, detail: categoryTrend ? copy.trendDetail(money(categoryTrend.amount), formatPercentage(categoryTrend.growth, language)) : copy.addForTrends, compactValue: true, color: "#8B5CF6", icon: `${iconRoot}/pricetag-outline.svg` },
    { title: t.availableToSpend, value: "—", detail: copy.notCalculated, compactValue: false, color: "#22C55E", icon: "/moneypilot/dashboard-safe-to-spend-icon.svg" },
  ];
  return (
    <div data-transactions-kpis={mobile ? "mobile" : "desktop"} className={mobile ? "grid min-w-0 grid-cols-1 gap-3 min-[420px]:grid-cols-2" : "grid h-[111.017px] min-w-0 max-w-full shrink-0 grid-cols-4 gap-x-[12.503px]"}>
      {cards.map((card) => (
        <article key={card.title} className={`relative flex min-w-0 flex-col gap-[10.717px] rounded-[16.075px] border border-[var(--border-default)] bg-[var(--background-elevated)] p-[12.503px] shadow-[0_3.572px_12.503px_rgba(10,10,10,0.07)] [box-sizing:border-box] ${mobile ? "min-h-[128px] overflow-visible" : "h-[111.017px] min-h-[111.017px] overflow-hidden"}`}>
          <div className="flex h-[26.792px] min-w-0 items-center gap-[10.717px]">
            <span className="flex size-[26.792px] shrink-0 items-center justify-center rounded-[8.038px] border" style={{ borderColor: card.color, backgroundColor: `${card.color}24` }}>
              <Image src={card.icon} alt="" width={18} height={18} className="size-[17.861px]" />
            </span>
            <h2 className={`min-w-0 text-[12.503px] font-semibold text-[var(--text-primary)] ${mobile ? "break-words" : "truncate"}`}>{card.title}</h2>
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-end">
            <strong aria-label={card.value} className={card.compactValue ? "line-clamp-2 break-words text-[14.289px] font-semibold leading-[17px] text-[var(--text-primary)]" : `${mobile ? "break-words" : "truncate"} text-[20.54px] font-semibold leading-[24px] text-[var(--text-primary)]`}>{card.value}</strong>
            <p className={`mt-[3.572px] min-w-0 text-[8.931px] leading-[13px] text-[var(--text-secondary)] ${mobile ? "break-words" : "truncate"}`}>{card.detail}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

export function countLastSevenDays(transactions: Transaction[], todayISO = getLocalCivilDateISO()) {
  const firstDayISO = subtractCivilDays(todayISO, 6);
  if (!firstDayISO) return 0;
  return transactions.filter((transaction) => isCivilDateInRange(transaction.dateISO, firstDayISO, todayISO)).length;
}

function formatPercentage(value: number, language: Language) {
  return new Intl.NumberFormat(language === "pt" ? "pt-PT" : language === "es" ? "es-ES" : "en-IE", { maximumFractionDigits: 1 }).format(value * 100);
}

function formatSignedPercentage(value: number, language: Language) {
  const formatted = formatPercentage(Math.abs(value), language);
  return `${value >= 0 ? "+" : "−"}${formatted}`;
}
