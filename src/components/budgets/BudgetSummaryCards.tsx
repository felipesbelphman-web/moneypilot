"use client";

import { useCurrency } from "@/components/CurrencyProvider";

import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";
import type { BudgetWithProgress } from "@/components/budgets/budget-model";
import type { BudgetProjection } from "@/components/budgets/budget-projection";

const iconRoot = "/moneypilot/budgets/icons";

export function BudgetSummaryCards({ budgets, projection, month, currentMonth, hasAnyBudgets }: { budgets: BudgetWithProgress[]; projection: BudgetProjection; month: string; currentMonth: string; hasAnyBudgets: boolean }) {
  const { language } = useLanguage();
  const { formatMoney: money } = useCurrency();
  const t = translations[language].appBudgets;
  const needsAction = budgets.filter((budget) => budget.status !== null && budget.status !== "Dentro do limite");
  const locale = language === "pt" ? "pt-PT" : language === "es" ? "es-ES" : "en-IE";
  const copy = {
    en: { used: "used", elapsed: "of the month elapsed", plannedOne: "planned category", plannedMany: "planned categories", noAction: "No category needs action", noSpending: "No spending recorded", emptyForecast: "Create a budget to calculate forecast", onTrack: "Estimated within the planned budget at the current pace", above: "above", below: "below", pace: "the plan at the current pace" }, pt: { used: "usado", elapsed: "do mês passou", plannedOne: "categoria planejada", plannedMany: "categorias planejadas", noAction: "Nenhuma categoria requer ação", noSpending: "Nenhum gasto registrado", emptyForecast: "Crie um orçamento para calcular a previsão", onTrack: "Estimativa dentro do orçamento planejado no ritmo atual", above: "acima", below: "abaixo", pace: "do plano no ritmo atual" }, es: { used: "usado", elapsed: "del mes transcurrido", plannedOne: "categoría planificada", plannedMany: "categorías planificadas", noAction: "Ninguna categoría requiere acción", noSpending: "No hay gastos registrados", emptyForecast: "Crea un presupuesto para calcular la previsión", onTrack: "Estimación dentro del presupuesto planificado al ritmo actual", above: "por encima", below: "por debajo", pace: "del plan al ritmo actual" },
    de: { used: "verwendet", elapsed: "des Monats vergangen", plannedOne: "geplante Kategorie", plannedMany: "geplante Kategorien", noAction: "Keine Kategorie erfordert eine Aktion", noSpending: "Keine Ausgaben erfasst", emptyForecast: "Erstelle ein Budget, um die Prognose zu berechnen", onTrack: "Beim aktuellen Tempo voraussichtlich im geplanten Budget", above: "über", below: "unter", pace: "dem Plan beim aktuellen Tempo" }, fr: { used: "utilisé", elapsed: "du mois écoulé", plannedOne: "catégorie planifiée", plannedMany: "catégories planifiées", noAction: "Aucune catégorie ne nécessite d’action", noSpending: "Aucune dépense enregistrée", emptyForecast: "Créez un budget pour calculer la prévision", onTrack: "Estimation conforme au budget prévu au rythme actuel", above: "au-dessus", below: "en dessous", pace: "du plan au rythme actuel" }, nl: { used: "gebruikt", elapsed: "van de maand verstreken", plannedOne: "geplande categorie", plannedMany: "geplande categorieën", noAction: "Geen categorie vereist actie", noSpending: "Geen uitgaven geregistreerd", emptyForecast: "Maak een budget om de verwachting te berekenen", onTrack: "Bij het huidige tempo naar verwachting binnen het budget", above: "boven", below: "onder", pace: "plan bij het huidige tempo" }, it: { used: "utilizzato", elapsed: "del mese trascorso", plannedOne: "categoria pianificata", plannedMany: "categorie pianificate", noAction: "Nessuna categoria richiede interventi", noSpending: "Nessuna spesa registrata", emptyForecast: "Crea un budget per calcolare la previsione", onTrack: "Stima entro il budget pianificato al ritmo attuale", above: "sopra", below: "sotto", pace: "il piano al ritmo attuale" },
  }[language];
  const usedDetail = projection.available && projection.budgetUsedPercent !== null ? `${projection.budgetUsedPercent.toLocaleString(locale, { maximumFractionDigits: 1 })}% ${copy.used} · ${projection.monthElapsedPercent.toLocaleString(locale, { maximumFractionDigits: 1 })}% ${copy.elapsed}` : copy.noSpending;
  const plannedDetail = `${budgets.length} ${budgets.length === 1 ? copy.plannedOne : copy.plannedMany}`;
  const noActionDetail = copy.noAction;
  const hasBudgets = budgets.length > 0 && projection.available;
  const isPastMonth = month < currentMonth;
  const isFutureMonth = month > currentMonth;
  const periodCopy = {
    en: { actual: "Actual total", estimate: "Current-pace estimate", closed: "Recorded spending for the selected period", future: "Forecast unavailable before the month starts", emptyPeriod: "No budget in the selected period" }, pt: { actual: "Total realizado", estimate: "Estimativa no ritmo atual", closed: "Gasto registrado no período selecionado", future: "Previsão indisponível antes do início do mês", emptyPeriod: "Nenhum orçamento no período selecionado" }, es: { actual: "Total realizado", estimate: "Estimación al ritmo actual", closed: "Gasto registrado en el período seleccionado", future: "Previsión no disponible antes de que comience el mes", emptyPeriod: "No hay presupuesto en el período seleccionado" }, de: { actual: "Tatsächlicher Gesamtbetrag", estimate: "Schätzung beim aktuellen Tempo", closed: "Erfasste Ausgaben im ausgewählten Zeitraum", future: "Prognose vor Monatsbeginn nicht verfügbar", emptyPeriod: "Kein Budget im ausgewählten Zeitraum" }, fr: { actual: "Total réalisé", estimate: "Estimation au rythme actuel", closed: "Dépenses enregistrées sur la période sélectionnée", future: "Prévision indisponible avant le début du mois", emptyPeriod: "Aucun budget sur la période sélectionnée" }, nl: { actual: "Werkelijk totaal", estimate: "Schatting bij huidig tempo", closed: "Geregistreerde uitgaven in de geselecteerde periode", future: "Verwachting niet beschikbaar vóór het begin van de maand", emptyPeriod: "Geen budget in de geselecteerde periode" }, it: { actual: "Totale effettivo", estimate: "Stima al ritmo attuale", closed: "Spese registrate nel periodo selezionato", future: "Previsione non disponibile prima dell’inizio del mese", emptyPeriod: "Nessun budget nel periodo selezionato" },
  }[language];
  const emptySpentDetail = copy.noSpending;
  const emptyForecastDetail = hasAnyBudgets ? periodCopy.emptyPeriod : copy.emptyForecast;
  const difference = projection.available ? Math.abs(projection.projectedDifference) : null;
  const forecastDetail = difference === 0
    ? copy.onTrack
    : difference === null ? emptyForecastDetail : `≈ ${money(difference)} ${projection.projectedOverBudget ? copy.above : copy.below} ${copy.pace}`;
  const cards = [
    { title: t.planned, value: projection.available ? money(projection.plannedTotal) : "—", detail: plannedDetail, color: "#3B82F6", icon: `${iconRoot}/document.svg`, detailColor: "#9CA6B2" },
    { title: t.spent, value: projection.available ? money(projection.spentTotal) : "—", detail: hasBudgets ? usedDetail : emptySpentDetail, color: "#F43F5E", icon: `${iconRoot}/spent-badge.svg`, detailColor: "#9CA6B2" },
    { title: isPastMonth ? periodCopy.actual : isFutureMonth ? t.forecast : periodCopy.estimate, value: hasBudgets && !isFutureMonth ? money(projection.projectedTotal) : "—", detail: hasBudgets ? isPastMonth ? periodCopy.closed : isFutureMonth ? periodCopy.future : forecastDetail : emptyForecastDetail, color: hasBudgets && projection.canProject && projection.projectedOverBudget ? "#F59E0B" : "#22C55E", icon: `${iconRoot}/forecast.svg`, detailColor: hasBudgets && projection.canProject && projection.projectedOverBudget ? "#F59E0B" : hasBudgets && !isFutureMonth ? "#22C55E" : "#9CA6B2" },
    { title: t.needsAction, value: String(needsAction.length), detail: needsAction.map((budget) => budget.category).join(" · ") || noActionDetail, color: "#F59E0B", icon: `${iconRoot}/warning.svg`, detailColor: "#9CA6B2" },
  ];
  return (
    <div className="absolute left-0 top-[72px] flex h-[116px] w-[1090px] gap-[14px] overflow-hidden">
      {cards.map((card) => (
        <article key={card.title} className="relative h-[116px] w-[262px] shrink-0 overflow-hidden rounded-[18px] border border-[#28313B] bg-[rgba(8,11,15,0.22)] shadow-[0_8px_18px_rgba(0,0,0,0.24)] backdrop-blur-[3.5px]">
          <div className="absolute left-[12px] top-[12px] flex size-[30px] items-center justify-center rounded-[9px] border" style={{ borderColor: card.color, backgroundColor: `${card.color}24` }}>
            <Image src={card.icon} alt="" width={20} height={20} className="size-[20px]" />
          </div>
          <h2 className="absolute left-[52px] top-[17px] text-[11px] font-semibold text-[#F5F7FA]">{card.title}</h2>
          <strong className="absolute left-[12px] top-[53px] text-[23px] font-semibold leading-none text-[#F5F7FA]">{card.value}</strong>
          <p className="absolute left-[12px] top-[88px] text-[9.5px]" style={{ color: card.detailColor }}>{card.detail}</p>
        </article>
      ))}
    </div>
  );
}
