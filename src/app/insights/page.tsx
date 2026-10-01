"use client";

import Image from "next/image";
import { AccountAvatar } from "@/components/profile/AccountAvatar";
import "./insights.css";
import { useEffect, useMemo, useRef } from "react";
import { getDashboardMonth } from "@/components/dashboard/dashboard-financial-summary";
import { resolveNextBestActionCopy } from "@/components/dashboard/next-best-action";
import { useFinanceData } from "@/components/FinanceDataProvider";
import { InsightsSpendingChart } from "@/components/insights/InsightsSpendingChart";
import { type Language, useLanguage } from "@/components/LanguageProvider";
import { useCurrency } from "@/components/CurrencyProvider";

import { getInsightsViewState, insightsPrerequisites, areInsightsPrerequisitesReady, insightsFinancialExistence } from "@/components/insights/insights-view-state";
import { financialMonthRange } from "@/lib/dates/financial-month-range";
import type { FinanceHydrationResourceName } from "@/lib/persistence/finance-persistence-model";

const iconRoot = "/moneypilot/insights/icons";
const styles = [{ color: "#9B5CFF", icon: "pricetag-outline.svg" }, { color: "#FD4873", icon: "receipt-refund.svg" }, { color: "#00E7B9", icon: "currency-dollar.svg" }, { color: "#348DFC", icon: "target.svg" }];
const card = "insights-card";
const localeByLanguage: Record<Language, string> = { en: "en-GB", pt: "pt-PT", es: "es-ES", de: "de-DE", fr: "fr-FR", nl: "nl-NL", it: "it-IT" };

const translations = {
  en: { loadError: "Some financial data could not be loaded. Available data is shown below.", title: "AI Insights", description: "Understand your finances through real data and deterministic analysis.", analysis: "AI analysis", comparison: "Comparison with previous month", spending: "Where your money goes", patterns: "Detected patterns", plan: "Recommended plan", opportunities: "Priority opportunities", total: "Total", labels: ["Monthly priority", "Income usage", "Potential savings", "Goal impact"], noPriority: "No priority yet", priorityHelp: "Add transactions and budgets to identify what needs attention.", noIncome: "No income data yet", notCalculated: "Not calculated yet", noGoal: "No goal yet", goalHelp: "Create a goal to measure potential impact.", noInsights: "No insights yet", insightsHelp: "Add transactions or import a statement to start building your analysis.", notEnough: "Not enough data yet", comparisonHelp: "Add transactions across multiple months to see changes over time.", noSpending: "No spending data yet", spendingHelp: "Add expenses to see your category breakdown.", noPatterns: "No patterns yet", patternsHelp: "Patterns will appear after MoneyPilot has enough transaction history.", noRecommendation: "No recommendation yet", recommendationHelp: "Add financial data to receive the next deterministic action.", noOpportunities: "No opportunities detected yet", opportunitiesHelp: "Opportunities will appear when financial data needs attention.", loading: "Loading financial data…", ofIncome: "of income used", perMonth: "/month", remaining: "remaining" },
  pt: { loadError: "Não foi possível carregar alguns dados financeiros. Os dados disponíveis aparecem abaixo.", title: "Insights de IA", description: "Entenda suas finanças com dados reais e análise determinística.", analysis: "Análise de IA", comparison: "Comparação com o mês anterior", spending: "Para onde vai seu dinheiro", patterns: "Padrões detectados", plan: "Plano recomendado", opportunities: "Oportunidades prioritárias", total: "Total", labels: ["Prioridade do mês", "Uso da renda", "Economia possível", "Impacto na meta"], noPriority: "Nenhuma prioridade ainda", priorityHelp: "Adicione transações e orçamentos para identificar o que precisa de atenção.", noIncome: "Ainda não há dados de renda", notCalculated: "Ainda não calculado", noGoal: "Nenhuma meta ainda", goalHelp: "Crie uma meta para medir o impacto potencial.", noInsights: "Ainda não há insights", insightsHelp: "Adicione transações ou importe um extrato para começar sua análise.", notEnough: "Ainda não há dados suficientes", comparisonHelp: "Adicione transações em vários meses para ver mudanças ao longo do tempo.", noSpending: "Ainda não há dados de despesas", spendingHelp: "Adicione despesas para ver a distribuição por categoria.", noPatterns: "Ainda não há padrões", patternsHelp: "Os padrões aparecerão quando o MoneyPilot tiver histórico suficiente.", noRecommendation: "Ainda não há recomendação", recommendationHelp: "Adicione dados financeiros para receber a próxima ação determinística.", noOpportunities: "Nenhuma oportunidade detectada", opportunitiesHelp: "As oportunidades aparecerão quando os dados financeiros precisarem de atenção.", loading: "Carregando dados financeiros…", ofIncome: "da renda usada", perMonth: "/mês", remaining: "restantes" },
  es: { loadError: "No se pudieron cargar algunos datos financieros. Los datos disponibles se muestran abajo.", title: "Insights de IA", description: "Entiende tus finanzas con datos reales y análisis determinista.", analysis: "Análisis de IA", comparison: "Comparación con el mes anterior", spending: "Adónde va tu dinero", patterns: "Patrones detectados", plan: "Plan recomendado", opportunities: "Oportunidades prioritarias", total: "Total", labels: ["Prioridad del mes", "Uso de los ingresos", "Ahorro posible", "Impacto en el objetivo"], noPriority: "Aún no hay prioridad", priorityHelp: "Añade transacciones y presupuestos para identificar qué necesita atención.", noIncome: "Aún no hay datos de ingresos", notCalculated: "Aún no calculado", noGoal: "Aún no hay objetivo", goalHelp: "Crea un objetivo para medir el impacto potencial.", noInsights: "Aún no hay insights", insightsHelp: "Añade transacciones o importa un extracto para comenzar tu análisis.", notEnough: "Aún no hay datos suficientes", comparisonHelp: "Añade transacciones de varios meses para ver cambios en el tiempo.", noSpending: "Aún no hay datos de gastos", spendingHelp: "Añade gastos para ver la distribución por categoría.", noPatterns: "Aún no hay patrones", patternsHelp: "Los patrones aparecerán cuando MoneyPilot tenga suficiente historial.", noRecommendation: "Aún no hay recomendación", recommendationHelp: "Añade datos financieros para recibir la siguiente acción determinista.", noOpportunities: "Aún no se detectaron oportunidades", opportunitiesHelp: "Las oportunidades aparecerán cuando los datos financieros necesiten atención.", loading: "Cargando datos financieros…", ofIncome: "de los ingresos usados", perMonth: "/mes", remaining: "restantes" },
};
const extendedTranslations = {
  ...translations,
  de: { ...translations.en, loadError: "Einige Finanzdaten konnten nicht geladen werden. Verfügbare Daten werden unten angezeigt.", title: "KI-Einblicke", description: "Verstehe deine Finanzen anhand echter Daten und nachvollziehbarer Analysen.", analysis: "KI-Analyse", comparison: "Vergleich mit dem Vormonat", spending: "Wohin dein Geld fließt", patterns: "Erkannte Muster", plan: "Empfohlener Plan", opportunities: "Wichtige Möglichkeiten", labels: ["Priorität des Monats", "Einkommensnutzung", "Mögliches Sparpotenzial", "Auswirkung auf das Ziel"], noPriority: "Noch keine Priorität", priorityHelp: "Füge Transaktionen und Budgets hinzu, um Handlungsbedarf zu erkennen.", noIncome: "Noch keine Einkommensdaten", notCalculated: "Noch nicht berechnet", noGoal: "Noch kein Ziel", goalHelp: "Erstelle ein Ziel, um mögliche Auswirkungen zu messen.", noInsights: "Noch keine Einblicke", insightsHelp: "Füge Transaktionen hinzu oder importiere einen Kontoauszug.", notEnough: "Noch nicht genügend Daten", comparisonHelp: "Füge Transaktionen aus mehreren Monaten hinzu.", noSpending: "Noch keine Ausgabendaten", spendingHelp: "Füge Ausgaben hinzu, um die Verteilung nach Kategorien zu sehen.", noPatterns: "Noch keine Muster", patternsHelp: "Muster erscheinen, sobald genügend Transaktionsverlauf vorhanden ist.", noRecommendation: "Noch keine Empfehlung", recommendationHelp: "Füge Finanzdaten hinzu, um eine Empfehlung zu erhalten.", noOpportunities: "Noch keine Möglichkeiten erkannt", opportunitiesHelp: "Möglichkeiten erscheinen, wenn Finanzdaten Aufmerksamkeit erfordern.", loading: "Finanzdaten werden geladen…", ofIncome: "des Einkommens verwendet", perMonth: "/Monat", remaining: "verbleibend" },
  fr: { ...translations.en, loadError: "Certaines données financières n’ont pas pu être chargées. Les données disponibles sont affichées ci-dessous.", title: "Analyses IA", description: "Comprenez vos finances à partir de données réelles et d’analyses déterministes.", analysis: "Analyse IA", comparison: "Comparaison avec le mois précédent", spending: "Où va votre argent", patterns: "Tendances détectées", plan: "Plan recommandé", opportunities: "Opportunités prioritaires", labels: ["Priorité du mois", "Utilisation des revenus", "Épargne potentielle", "Impact sur l’objectif"], noPriority: "Aucune priorité pour le moment", priorityHelp: "Ajoutez des transactions et des budgets pour identifier les points d’attention.", noIncome: "Aucune donnée de revenus", notCalculated: "Pas encore calculé", noGoal: "Aucun objectif", goalHelp: "Créez un objectif pour mesurer l’impact potentiel.", noInsights: "Aucune analyse pour le moment", insightsHelp: "Ajoutez des transactions ou importez un relevé.", notEnough: "Données insuffisantes", comparisonHelp: "Ajoutez des transactions sur plusieurs mois.", noSpending: "Aucune donnée de dépenses", spendingHelp: "Ajoutez des dépenses pour voir la répartition par catégorie.", noPatterns: "Aucune tendance pour le moment", patternsHelp: "Les tendances apparaîtront avec un historique suffisant.", noRecommendation: "Aucune recommandation", recommendationHelp: "Ajoutez des données financières pour recevoir une recommandation.", noOpportunities: "Aucune opportunité détectée", opportunitiesHelp: "Les opportunités apparaîtront lorsque vos données nécessiteront votre attention.", loading: "Chargement des données financières…", ofIncome: "des revenus utilisés", perMonth: "/mois", remaining: "restants" },
  nl: { ...translations.en, loadError: "Sommige financiële gegevens konden niet worden geladen. Beschikbare gegevens staan hieronder.", title: "AI-inzichten", description: "Krijg inzicht in je financiën met echte gegevens en vaste analyses.", analysis: "AI-analyse", comparison: "Vergelijking met vorige maand", spending: "Waar je geld naartoe gaat", patterns: "Gedetecteerde patronen", plan: "Aanbevolen plan", opportunities: "Belangrijkste kansen", labels: ["Prioriteit van de maand", "Gebruik van inkomen", "Mogelijke besparing", "Effect op doel"], noPriority: "Nog geen prioriteit", priorityHelp: "Voeg transacties en budgetten toe om aandachtspunten te vinden.", noIncome: "Nog geen inkomensgegevens", notCalculated: "Nog niet berekend", noGoal: "Nog geen doel", goalHelp: "Maak een doel om het mogelijke effect te meten.", noInsights: "Nog geen inzichten", insightsHelp: "Voeg transacties toe of importeer een afschrift.", notEnough: "Nog niet genoeg gegevens", comparisonHelp: "Voeg transacties uit meerdere maanden toe.", noSpending: "Nog geen uitgavengegevens", spendingHelp: "Voeg uitgaven toe om de verdeling per categorie te zien.", noPatterns: "Nog geen patronen", patternsHelp: "Patronen verschijnen zodra er genoeg transactiehistorie is.", noRecommendation: "Nog geen aanbeveling", recommendationHelp: "Voeg financiële gegevens toe om een aanbeveling te ontvangen.", noOpportunities: "Nog geen kansen gevonden", opportunitiesHelp: "Kansen verschijnen wanneer financiële gegevens aandacht vragen.", loading: "Financiële gegevens laden…", ofIncome: "van inkomen gebruikt", perMonth: "/maand", remaining: "resterend" },
  it: { ...translations.en, loadError: "Non è stato possibile caricare alcuni dati finanziari. I dati disponibili sono mostrati qui sotto.", title: "Analisi IA", description: "Comprendi le tue finanze con dati reali e analisi deterministiche.", analysis: "Analisi IA", comparison: "Confronto con il mese precedente", spending: "Dove va il tuo denaro", patterns: "Modelli rilevati", plan: "Piano consigliato", opportunities: "Opportunità prioritarie", labels: ["Priorità del mese", "Utilizzo delle entrate", "Risparmio potenziale", "Impatto sull’obiettivo"], noPriority: "Nessuna priorità per ora", priorityHelp: "Aggiungi transazioni e budget per individuare ciò che richiede attenzione.", noIncome: "Nessun dato sulle entrate", notCalculated: "Non ancora calcolato", noGoal: "Nessun obiettivo", goalHelp: "Crea un obiettivo per misurare il potenziale impatto.", noInsights: "Nessuna analisi per ora", insightsHelp: "Aggiungi transazioni o importa un estratto conto.", notEnough: "Dati non ancora sufficienti", comparisonHelp: "Aggiungi transazioni di più mesi.", noSpending: "Nessun dato sulle spese", spendingHelp: "Aggiungi spese per vedere la distribuzione per categoria.", noPatterns: "Nessun modello per ora", patternsHelp: "I modelli appariranno quando ci sarà uno storico sufficiente.", noRecommendation: "Nessun consiglio per ora", recommendationHelp: "Aggiungi dati finanziari per ricevere un consiglio.", noOpportunities: "Nessuna opportunità rilevata", opportunitiesHelp: "Le opportunità appariranno quando i dati richiederanno attenzione.", loading: "Caricamento dei dati finanziari…", ofIncome: "delle entrate utilizzato", perMonth: "/mese", remaining: "rimanenti" },
};

function Neutral({ title, detail }: { title: string; detail: string }) {
  return <div className="insights-neutral"><strong>{title}</strong>{detail && <p>{detail}</p>}</div>;
}

export default function InsightsPage() {
  const { language } = useLanguage();
  const { formatMoney: money } = useCurrency();
  const t = extendedTranslations[language];
  const data = useFinanceData();
  const { getTransactionPeriodState, ensureTransactionPeriod } = data;
  const month = getDashboardMonth();
  const range = useMemo(() => financialMonthRange(month), [month]);
  const period = getTransactionPeriodState(range);
  const requestedMonth = useRef<string | null>(null);
  useEffect(() => {
    if (requestedMonth.current !== month || period.status === "idle" || period.status === "stale") {
      requestedMonth.current = month;
      void ensureTransactionPeriod(range);
    }
  }, [month, range, period.status, getTransactionPeriodState, ensureTransactionPeriod]);
  const financialExistence = insightsFinancialExistence({ period, resourceStatuses: data.resourceStatuses,
    globalTransactionCount: data.transactions.length, budgetCount: data.budgets.length, goalCount: data.goals.length });
  const view = useMemo(() => getInsightsViewState({ period, budgets: data.budgets, budgetAdjustments: data.budgetAdjustments, goals: data.goals, goalContributionPlans: data.goalContributionPlans, resourceStatuses: data.resourceStatuses, month }), [period, data.budgets, data.budgetAdjustments, data.goals, data.goalContributionPlans, data.resourceStatuses, month]);
  const { summary, transactions, savings, projection, goal, goalCalculation, action } = view;
  const actionCopy = action ? resolveNextBestActionCopy(action, language) : null;
  const statusFor = (resource: FinanceHydrationResourceName) => resource === "transactions" ? period.status : data.resourceStatuses[resource].status;
  const unavailableCopy = (required: readonly FinanceHydrationResourceName[]) => {
    if (areInsightsPrerequisitesReady(data.resourceStatuses, period, required)) return null;
    return required.some(resource => statusFor(resource) === "error") ? t.loadError
      : required.some(resource => ["idle", "loading", "refreshing", "stale"].includes(statusFor(resource))) ? t.loading : t.notCalculated;
  };
  const transactionMessage = unavailableCopy(insightsPrerequisites.transactions);
  const recommendationMessage = unavailableCopy(insightsPrerequisites.recommendation) ?? (financialExistence === null ? t.notCalculated : null);
  const hasPriority = summary?.aggregationAvailable && summary.hasTransactions && summary.hasBudgets;
  const hasUsage = transactions?.available && transactions.income > 0 && transactions.monthTransactions.some(transaction => transaction.type === "expense");
  const hasSavings = transactions?.available && savings?.available && projection?.available && projection.plannedTotal > 0 && projection.canProject && savings.safeMonthlyCapacity > 0;
  const metrics = [
    { value: hasPriority && actionCopy ? actionCopy.title : t.noPriority, detail: hasPriority && actionCopy ? actionCopy.description : t.priorityHelp, unavailable: recommendationMessage },
    { value: hasUsage ? `${(transactions.expenses / transactions.income * 100).toLocaleString(language, { maximumFractionDigits: 1 })}%` : "—", detail: hasUsage ? `${money(transactions.expenses)} · ${t.ofIncome}` : t.noIncome, unavailable: transactionMessage },
    { value: hasSavings ? `${money(savings.safeMonthlyCapacity)}${t.perMonth}` : "—", detail: hasSavings ? actionCopy?.description ?? t.notCalculated : t.notCalculated, unavailable: unavailableCopy(insightsPrerequisites.savings) },
    { value: goal?.name ?? t.noGoal, detail: goalCalculation?.available ? `${money(goalCalculation.remainingAmount)} ${t.remaining}` : goal ? t.notCalculated : t.goalHelp, unavailable: unavailableCopy(insightsPrerequisites.goal) },
  ];
  const hasData = financialExistence === true && summary !== null && actionCopy !== null;
  const recommendation = hasData && action?.type !== "no_action";
  const monthLabel = new Intl.DateTimeFormat(localeByLanguage[language], { month: "long", year: "numeric" }).format(new Date());
  const panel = (heading: string, title: string, detail: string, unavailable = transactionMessage) => (
    <section className={card}><h2>{heading}</h2><Neutral title={unavailable ?? title} detail={unavailable ? "" : detail} /></section>
  );

  return <div data-insights-page aria-busy={insightsPrerequisites.recommendation.some(resource => ["idle", "loading", "refreshing", "stale"].includes(statusFor(resource)))}>
    <div className="insights-layout">
      <div className="insights-brand"><Image src="/moneypilot/dashboard/day/logomark.svg" alt="" width={37} height={37} /><span>MoneyPilot</span></div>
      <header className="insights-header">
        <div><h1>{t.title}</h1><p>{t.description}</p></div>
        <div className="insights-header-actions"><div className="insights-period"><Image src="/moneypilot/budgets/icons/calendar.svg" alt="" width={18} height={18} />{monthLabel}</div><AccountAvatar size={52} /></div>
      </header>
      {insightsPrerequisites.recommendation.some(resource => statusFor(resource) === "error") && <p className="insights-error" role="alert">{t.loadError}</p>}
      <div className="insights-metrics">{metrics.map((metric, index) => <article key={t.labels[index]} className={card}>
        <div className="insights-metric-label"><span className="insights-metric-icon" style={{ borderColor: styles[index].color, backgroundColor: styles[index].color + "24" }}><Image src={iconRoot + "/" + styles[index].icon} alt="" width={20} height={20} /></span><h2>{t.labels[index]}</h2></div>
        <strong>{metric.unavailable ? "—" : metric.value}</strong><p>{metric.unavailable ?? metric.detail}</p>
      </article>)}</div>
      <div className="insights-row insights-row-analysis">
        <section className={card + " insights-analysis"}>
          <div className="insights-analysis-heading"><span aria-hidden="true">AI</span><h2>{t.analysis}</h2></div>
          {hasData && actionCopy ? <div className="insights-analysis-body"><p>{actionCopy.description}</p><div className="insights-callout"><strong>{actionCopy.title}</strong></div></div> : <Neutral title={recommendationMessage ?? t.noInsights} detail={recommendationMessage ? "" : t.insightsHelp} />}
        </section>
        {panel(t.comparison, t.notEnough, t.comparisonHelp)}
      </div>
      <div className="insights-row">
        <section className={card}><h2>{t.spending}</h2><InsightsSpendingChart categories={view.categorySpending ?? []} total={transactions?.expenses ?? null} available={view.categorySpending !== null} language={language} emptyTitle={transactionMessage ?? t.noSpending} emptyCopy={transactionMessage ? "" : t.spendingHelp} totalLabel={t.total} /></section>
        {panel(t.patterns, t.noPatterns, t.patternsHelp)}
      </div>
      <div className="insights-row">
        {panel(t.plan, recommendation && actionCopy ? actionCopy.title : t.noRecommendation, recommendation && actionCopy ? actionCopy.description : t.recommendationHelp, recommendationMessage)}
        {panel(t.opportunities, summary?.monthlyStatus === "over_budget" && actionCopy ? actionCopy.title : t.noOpportunities, summary?.monthlyStatus === "over_budget" && actionCopy ? actionCopy.description : t.opportunitiesHelp, recommendationMessage)}
      </div>
    </div>
  </div>;
}
