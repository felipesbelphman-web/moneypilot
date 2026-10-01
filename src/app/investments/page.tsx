"use client";

import Image from "next/image";
import { AccountAvatar } from "@/components/profile/AccountAvatar";
import { investmentPresentationCopy } from "@/components/investments/investment-presentation";
import "./investments.css";
import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { useFinanceData } from "@/components/FinanceDataProvider";
import { InvestmentAssetsList } from "@/components/investments/InvestmentAssetsList";
import { InvestmentPerformanceChart, type InvestmentRange } from "@/components/investments/InvestmentPerformanceChart";
import { PortfolioAllocationChart } from "@/components/investments/PortfolioAllocationChart";
import { ManualInvestmentModal } from "@/components/investments/ManualInvestmentModal";

import { areFinanceResourcesReady } from "@/lib/persistence/finance-resource-status";

const iconRoot = "/moneypilot/investments/icons";
const summaryStyles = [{ icon: "wallet-outline", tone: "blue" }, { icon: "trending-up-outline", tone: "positive" }, { icon: "pulse-outline", tone: "positive" }, { icon: "shield-checkmark-outline", tone: "warning" }];

const copy = {
  en: { title: "Investments", description: "Understand risk, protect your goals and decide your next contribution with more context.", filters: ["All", "Stocks", "Crypto"], summary: "Investment summary", metrics: [{ label: "Invested assets", value: "—", detail: "No investment data yet" }, { label: "Total return", value: "—", detail: "Not calculated yet" }, { label: "Available cash", value: "—", detail: "No investment cash data" }, { label: "Portfolio risk", value: "Not available", detail: "Add investment data to assess portfolio risk." }], performance: "Portfolio performance", noPerformance: "No performance data yet", performanceHelp: "Performance will appear when investment data is available.", allocation: "Portfolio allocation", noAllocation: "No allocation data yet", allocationHelp: "Add assets to see your portfolio allocation.", assets: "Your assets", noAssets: "No investment assets yet", assetsHelp: "Add investment data to build your portfolio.", contribution: "Before the next contribution", noContribution: "No contribution review yet", contributionHelp: "Investment guidance will appear when portfolio data is available.", criteria: "View criteria →", insight: "Investment insight", noInsights: "No insights yet", insightsHelp: "Add investment data to start analysis.", decisions: "Priority decisions", noDecisions: "No decisions yet", decisionsHelp: "Decisions will appear when MoneyPilot has enough investment data.", avatar: "User avatar" },
  pt: { title: "Investimentos", description: "Entenda o risco, proteja suas metas e decida o próximo aporte com mais contexto.", filters: ["Todos", "Ações", "Cripto"], summary: "Resumo dos investimentos", metrics: [{ label: "Patrimônio investido", value: "—", detail: "Ainda não há dados de investimentos" }, { label: "Resultado total", value: "—", detail: "Ainda não calculado" }, { label: "Caixa disponível", value: "—", detail: "Ainda não há dados de caixa de investimentos" }, { label: "Risco da carteira", value: "Indisponível", detail: "Adicione dados de investimentos para avaliar o risco da carteira." }], performance: "Evolução da carteira", noPerformance: "Ainda não há dados de desempenho", performanceHelp: "O desempenho aparecerá quando houver dados de investimentos.", allocation: "Alocação da carteira", noAllocation: "Ainda não há dados de alocação", allocationHelp: "Adicione ativos para ver a alocação da carteira.", assets: "Seus ativos", noAssets: "Ainda não há ativos de investimento", assetsHelp: "Adicione dados de investimentos para montar sua carteira.", contribution: "Antes do próximo aporte", noContribution: "Ainda não há revisão de aporte", contributionHelp: "As orientações aparecerão quando houver dados da carteira.", criteria: "Ver critérios →", insight: "Insight de investimentos", noInsights: "Ainda não há insights", insightsHelp: "Adicione dados de investimentos para iniciar a análise.", decisions: "Decisões prioritárias", noDecisions: "Ainda não há decisões", decisionsHelp: "As decisões aparecerão quando o MoneyPilot tiver dados de investimentos suficientes.", avatar: "Avatar do usuário" },
  es: { title: "Inversiones", description: "Comprende el riesgo, protege tus objetivos y decide la próxima aportación con más contexto.", filters: ["Todos", "Acciones", "Cripto"], summary: "Resumen de inversiones", metrics: [{ label: "Patrimonio invertido", value: "—", detail: "Aún no hay datos de inversiones" }, { label: "Resultado total", value: "—", detail: "Aún no calculado" }, { label: "Efectivo disponible", value: "—", detail: "Aún no hay datos de efectivo de inversiones" }, { label: "Riesgo de la cartera", value: "No disponible", detail: "Añade datos de inversiones para evaluar el riesgo de la cartera." }], performance: "Evolución de la cartera", noPerformance: "Aún no hay datos de rendimiento", performanceHelp: "El rendimiento aparecerá cuando haya datos de inversiones.", allocation: "Distribución de la cartera", noAllocation: "Aún no hay datos de distribución", allocationHelp: "Añade activos para ver la distribución de la cartera.", assets: "Tus activos", noAssets: "Aún no hay activos de inversión", assetsHelp: "Añade datos de inversiones para crear tu cartera.", contribution: "Antes de la próxima aportación", noContribution: "Aún no hay revisión de aportación", contributionHelp: "La orientación aparecerá cuando haya datos de la cartera.", criteria: "Ver criterios →", insight: "Insight de inversiones", noInsights: "Aún no hay insights", insightsHelp: "Añade datos de inversiones para iniciar el análisis.", decisions: "Decisiones prioritarias", noDecisions: "Aún no hay decisiones", decisionsHelp: "Las decisiones aparecerán cuando MoneyPilot tenga suficientes datos de inversiones.", avatar: "Avatar del usuario" },
};
const extendedCopy = {
  ...copy,
  de: { ...copy.en, title: "Investitionen", description: "Behalte Risiken, Ziele und künftige Einzahlungen im Blick.", filters: ["Alle", "Aktien", "Krypto"], summary: "Investitionsübersicht", metrics: [{ label: "Investiertes Vermögen", value: "—", detail: "Noch keine Investitionsdaten" }, { label: "Gesamtrendite", value: "—", detail: "Noch nicht berechnet" }, { label: "Verfügbares Guthaben", value: "—", detail: "Noch keine Guthabendaten" }, { label: "Portfoliorisiko", value: "Nicht verfügbar", detail: "Füge Investitionsdaten hinzu, um das Risiko zu bewerten." }], performance: "Portfolioentwicklung", noPerformance: "Noch keine Performancedaten", performanceHelp: "Die Entwicklung erscheint, sobald Investitionsdaten verfügbar sind.", allocation: "Portfolioaufteilung", noAllocation: "Noch keine Aufteilungsdaten", allocationHelp: "Füge Anlagen hinzu, um die Portfolioaufteilung zu sehen.", assets: "Deine Anlagen", noAssets: "Noch keine Anlagen", assetsHelp: "Füge Investitionsdaten hinzu, um dein Portfolio aufzubauen.", contribution: "Vor der nächsten Einzahlung", noContribution: "Noch keine Prüfung verfügbar", contributionHelp: "Hinweise erscheinen, sobald Portfoliodaten verfügbar sind.", criteria: "Kriterien anzeigen →", insight: "Investitionseinblick", noInsights: "Noch keine Einblicke", insightsHelp: "Füge Investitionsdaten hinzu, um die Analyse zu starten.", decisions: "Wichtige Entscheidungen", noDecisions: "Noch keine Entscheidungen", decisionsHelp: "Entscheidungen erscheinen bei ausreichenden Investitionsdaten.", avatar: "Benutzeravatar" },
  fr: { ...copy.en, title: "Investissements", description: "Comprenez le risque, protégez vos objectifs et préparez votre prochain versement.", filters: ["Tous", "Actions", "Crypto"], summary: "Résumé des investissements", metrics: [{ label: "Actifs investis", value: "—", detail: "Aucune donnée d’investissement" }, { label: "Rendement total", value: "—", detail: "Pas encore calculé" }, { label: "Liquidités disponibles", value: "—", detail: "Aucune donnée de liquidités" }, { label: "Risque du portefeuille", value: "Indisponible", detail: "Ajoutez des données pour évaluer le risque du portefeuille." }], performance: "Performance du portefeuille", noPerformance: "Aucune donnée de performance", performanceHelp: "La performance apparaîtra lorsque des données seront disponibles.", allocation: "Répartition du portefeuille", noAllocation: "Aucune donnée de répartition", allocationHelp: "Ajoutez des actifs pour voir la répartition du portefeuille.", assets: "Vos actifs", noAssets: "Aucun actif d’investissement", assetsHelp: "Ajoutez des données pour constituer votre portefeuille.", contribution: "Avant le prochain versement", noContribution: "Aucune analyse de versement", contributionHelp: "Les conseils apparaîtront lorsque les données seront disponibles.", criteria: "Voir les critères →", insight: "Analyse des investissements", noInsights: "Aucune analyse", insightsHelp: "Ajoutez des données d’investissement pour commencer l’analyse.", decisions: "Décisions prioritaires", noDecisions: "Aucune décision", decisionsHelp: "Les décisions apparaîtront avec suffisamment de données.", avatar: "Avatar utilisateur" },
  nl: { ...copy.en, title: "Beleggingen", description: "Begrijp risico’s, bescherm je doelen en bereid je volgende inleg voor.", filters: ["Alle", "Aandelen", "Crypto"], summary: "Beleggingsoverzicht", metrics: [{ label: "Belegd vermogen", value: "—", detail: "Nog geen beleggingsgegevens" }, { label: "Totaalrendement", value: "—", detail: "Nog niet berekend" }, { label: "Beschikbaar saldo", value: "—", detail: "Nog geen beleggingssaldo" }, { label: "Portefeuillerisico", value: "Niet beschikbaar", detail: "Voeg beleggingsgegevens toe om het risico te beoordelen." }], performance: "Portefeuilleprestaties", noPerformance: "Nog geen prestatiegegevens", performanceHelp: "Prestaties verschijnen zodra beleggingsgegevens beschikbaar zijn.", allocation: "Portefeuilleverdeling", noAllocation: "Nog geen verdelingsgegevens", allocationHelp: "Voeg beleggingen toe om de verdeling te zien.", assets: "Je beleggingen", noAssets: "Nog geen beleggingen", assetsHelp: "Voeg beleggingsgegevens toe om je portefeuille op te bouwen.", contribution: "Voor de volgende inleg", noContribution: "Nog geen beoordeling", contributionHelp: "Advies verschijnt zodra portefeuillegegevens beschikbaar zijn.", criteria: "Criteria bekijken →", insight: "Beleggingsinzicht", noInsights: "Nog geen inzichten", insightsHelp: "Voeg beleggingsgegevens toe om de analyse te starten.", decisions: "Belangrijkste beslissingen", noDecisions: "Nog geen beslissingen", decisionsHelp: "Beslissingen verschijnen bij voldoende beleggingsgegevens.", avatar: "Gebruikersavatar" },
  it: { ...copy.en, title: "Investimenti", description: "Comprendi il rischio, proteggi i tuoi obiettivi e prepara il prossimo versamento.", filters: ["Tutti", "Azioni", "Cripto"], summary: "Riepilogo investimenti", metrics: [{ label: "Patrimonio investito", value: "—", detail: "Nessun dato sugli investimenti" }, { label: "Rendimento totale", value: "—", detail: "Non ancora calcolato" }, { label: "Liquidità disponibile", value: "—", detail: "Nessun dato sulla liquidità" }, { label: "Rischio del portafoglio", value: "Non disponibile", detail: "Aggiungi dati per valutare il rischio del portafoglio." }], performance: "Andamento del portafoglio", noPerformance: "Nessun dato sull’andamento", performanceHelp: "L’andamento apparirà quando saranno disponibili dati.", allocation: "Allocazione del portafoglio", noAllocation: "Nessun dato sull’allocazione", allocationHelp: "Aggiungi asset per vedere l’allocazione del portafoglio.", assets: "I tuoi asset", noAssets: "Nessun asset di investimento", assetsHelp: "Aggiungi dati per creare il tuo portafoglio.", contribution: "Prima del prossimo versamento", noContribution: "Nessuna revisione disponibile", contributionHelp: "Le indicazioni appariranno quando saranno disponibili dati.", criteria: "Vedi criteri →", insight: "Analisi degli investimenti", noInsights: "Nessuna analisi", insightsHelp: "Aggiungi dati sugli investimenti per iniziare l’analisi.", decisions: "Decisioni prioritarie", noDecisions: "Nessuna decisione", decisionsHelp: "Le decisioni appariranno con dati sufficienti.", avatar: "Avatar utente" },
};

function Glyph({ name }: { name: string }) {
  return <span aria-hidden="true" className="investment-glyph" style={{ WebkitMask: `url(${iconRoot}/${name}.svg) center/contain no-repeat`, mask: `url(${iconRoot}/${name}.svg) center/contain no-repeat` }} />;
}
function Empty({ title, detail }: { title: string; detail: string }) {
  return <div className="investment-empty"><strong>{title}</strong><p>{detail}</p></div>;
}

export default function InvestmentsPage() {
  const { language } = useLanguage();
  const { investments, upsertInvestment, resourceStatuses } = useFinanceData();
  const t = extendedCopy[language];
  const ui = investmentPresentationCopy[language];
  const [filter, setFilter] = useState(0);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const investmentsReady = areFinanceResourcesReady(resourceStatuses, ["investments"]);
  const isLoading = resourceStatuses.investments.status === "loading";
  const visibleInvestments = investmentsReady ? investments.filter((investment) => {
    if (filter === 1) return investment.assetType === "stock" || investment.assetType === "etf";
    if (filter === 2) return investment.assetType === "crypto";
    return true;
  }) : null;
  // No FX source exists: never combine currencies into a portfolio total.
  const mixedCurrencies = investmentsReady && new Set(investments.map(investment => investment.nativeCurrency)).size > 1;
  const ranges: InvestmentRange[] = ["7D", "1M", "3M", "1A"];
  return <div data-investments-page aria-busy={isLoading}>
    <div className="investments-layout">
      <div className="investments-brand"><Image src="/moneypilot/dashboard/day/logomark.svg" alt="" width={37} height={37} /><span>MoneyPilot</span></div>
      <header className="investments-header">
        <div><h1>{t.title}</h1><p>{t.description}</p></div>
        <div className="investments-header-actions"><div className="investments-filters" role="group" aria-label={ui.assetType}>
          {t.filters.map((item, index) => <button key={item} type="button" aria-pressed={filter === index} onClick={() => setFilter(index)}>{item}</button>)}
        </div><AccountAvatar size={52} /></div>
      </header>
      {!investmentsReady && !isLoading && <p role="alert" className="investments-state">{ui.loadError}</p>}
      {isLoading ? <div role="status" className="investments-loading">{ui.loading}</div> : visibleInvestments !== null ? <>
        {mixedCurrencies && <div role="status" className="investments-state"><strong>{ui.partial}</strong><p>{ui.partialHelp}</p></div>}
        <section aria-label={t.summary} className="investments-summary">
          {t.metrics.map((metric, index) => <article key={metric.label} className="investment-card investment-metric">
            <div><span className={`investment-metric-icon investment-tone-${summaryStyles[index].tone}`}><Glyph name={summaryStyles[index].icon} /></span><h2>{metric.label}</h2></div>
            <strong>{index === 3 ? ui.comingSoon : metric.value}</strong>
            <p>{index === 3 ? ui.unavailable : investments.length ? ui.unavailable : metric.detail}</p>
          </article>)}
        </section>
        <section className="investments-row">
          <article className="investment-card"><header><h2>{t.performance}</h2><div className="investment-ranges">{ranges.map(item => <button key={item} type="button" disabled>{item}</button>)}</div></header><InvestmentPerformanceChart title={t.noPerformance} detail={t.performanceHelp} /></article>
          <article className="investment-card"><h2>{t.allocation}</h2><PortfolioAllocationChart title={t.noAllocation} detail={t.allocationHelp} /></article>
        </section>
        <section className="investments-row">
          <article className="investment-card"><header><h2>{t.assets}</h2><button type="button" className="investment-primary" onClick={() => setManualModalOpen(true)}>{ui.add}</button></header>
            <InvestmentAssetsList investments={visibleInvestments} emptyTitle={investments.length ? ui.noResults : t.noAssets} emptyDetail={investments.length ? ui.noResultsHelp : t.assetsHelp} />
          </article>
          <article className="investment-card"><h2>{t.contribution}</h2><Empty title={t.noContribution} detail={t.contributionHelp} /><button type="button" disabled className="investment-criteria">{t.criteria}</button></article>
        </section>
        <section className="investments-row investments-row-reversed">
          <article className="investment-card"><h2 className="investment-ai"><Glyph name="sparkles-outline" />{ui.ai}</h2><Empty title={t.noInsights} detail={t.insightsHelp} /></article>
          <article className="investment-card"><h2>{t.decisions}</h2><Empty title={t.noDecisions} detail={t.decisionsHelp} /><p className="investment-planned">{ui.tracking}<span>{ui.planned}</span></p></article>
        </section>
      </> : null}
    </div>
    <ManualInvestmentModal open={manualModalOpen} onClose={() => setManualModalOpen(false)} onSubmit={async (draft) => {
      await upsertInvestment({ ...draft, id: crypto.randomUUID(), priceMode: "manual", marketAssetKey: null });
      setManualModalOpen(false);
    }} />
  </div>;
}
