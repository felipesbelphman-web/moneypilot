"use client";

import { useCurrency } from "@/components/CurrencyProvider";

import Image from "next/image";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";
import type { BudgetWithProgress } from "@/components/budgets/budget-model";
import type { BudgetProjection } from "@/components/budgets/budget-projection";

const iconRoot = "/moneypilot/budgets/icons";

export function BudgetSummaryCards({ budgets, projection }: { budgets: BudgetWithProgress[]; projection: BudgetProjection }) {
  const { language } = useLanguage();
  const { formatMoney: money } = useCurrency();
  const t = translations[language].appBudgets;
  const needsAction = budgets.filter((budget) => budget.status === "Atenção" || budget.status === "Perto do limite" || budget.status === "Estourado");
  const locale = language === "pt" ? "pt-PT" : language === "es" ? "es-ES" : "en-IE";
  const copy = {
    en: { used: "used", elapsed: "of the month elapsed", planned: "planned categories", noAction: "No category needs action", noSpending: "No spending recorded", emptyForecast: "Create a budget to calculate forecast", onTrack: "On track with the planned budget", above: "above", below: "below", pace: "plan at the current pace" }, pt: { used: "usado", elapsed: "do mês passou", planned: "categorias planejadas", noAction: "Nenhuma categoria requer ação", noSpending: "Nenhum gasto registrado", emptyForecast: "Crie um orçamento para calcular a previsão", onTrack: "Dentro do orçamento planejado", above: "acima", below: "abaixo", pace: "do plano no ritmo atual" }, es: { used: "usado", elapsed: "del mes transcurrido", planned: "categorías planificadas", noAction: "Ninguna categoría requiere acción", noSpending: "No hay gastos registrados", emptyForecast: "Crea un presupuesto para calcular la previsión", onTrack: "Dentro del presupuesto planificado", above: "por encima", below: "por debajo", pace: "del plan al ritmo actual" },
    de: { used: "verwendet", elapsed: "des Monats vergangen", planned: "geplante Kategorien", noAction: "Keine Kategorie erfordert eine Aktion", noSpending: "Keine Ausgaben erfasst", emptyForecast: "Erstelle ein Budget, um die Prognose zu berechnen", onTrack: "Im geplanten Budget", above: "über", below: "unter", pace: "dem Plan beim aktuellen Tempo" }, fr: { used: "utilisé", elapsed: "du mois écoulé", planned: "catégories planifiées", noAction: "Aucune catégorie ne nécessite d’action", noSpending: "Aucune dépense enregistrée", emptyForecast: "Créez un budget pour calculer la prévision", onTrack: "Conforme au budget prévu", above: "au-dessus", below: "en dessous", pace: "du plan au rythme actuel" }, nl: { used: "gebruikt", elapsed: "van de maand verstreken", planned: "geplande categorieën", noAction: "Geen categorie vereist actie", noSpending: "Geen uitgaven geregistreerd", emptyForecast: "Maak een budget om de verwachting te berekenen", onTrack: "Volgens het geplande budget", above: "boven", below: "onder", pace: "plan bij het huidige tempo" }, it: { used: "utilizzato", elapsed: "del mese trascorso", planned: "categorie pianificate", noAction: "Nessuna categoria richiede interventi", noSpending: "Nessuna spesa registrata", emptyForecast: "Crea un budget per calcolare la previsione", onTrack: "In linea con il budget pianificato", above: "sopra", below: "sotto", pace: "il piano al ritmo attuale" },
  }[language];
  const usedDetail = `${projection.budgetUsedPercent.toLocaleString(locale, { maximumFractionDigits: 1 })}% ${copy.used} · ${projection.monthElapsedPercent.toLocaleString(locale, { maximumFractionDigits: 1 })}% ${copy.elapsed}`;
  const plannedDetail = `${budgets.length} ${copy.planned}`;
  const noActionDetail = copy.noAction;
  const hasBudgets = budgets.length > 0;
  const emptySpentDetail = copy.noSpending;
  const emptyForecastDetail = copy.emptyForecast;
  const difference = Math.abs(projection.projectedDifference);
  const forecastDetail = difference === 0
    ? copy.onTrack
    : `≈ ${money(difference)} ${projection.projectedOverBudget ? copy.above : copy.below} ${copy.pace}`;
  const cards = [
    { title: t.planned, value: money(projection.plannedTotal), detail: plannedDetail, color: "#3B82F6", icon: `${iconRoot}/document.svg`, detailColor: "#9CA6B2" },
    { title: t.spent, value: money(projection.spentTotal), detail: hasBudgets ? usedDetail : emptySpentDetail, color: "#F43F5E", icon: `${iconRoot}/spent-badge.svg`, detailColor: "#9CA6B2" },
    { title: t.forecast, value: hasBudgets ? money(projection.projectedTotal) : "—", detail: hasBudgets ? forecastDetail : emptyForecastDetail, color: "#22C55E", icon: `${iconRoot}/forecast.svg`, detailColor: hasBudgets ? "#22C55E" : "#9CA6B2" },
    { title: t.needsAction, value: String(needsAction.length), detail: needsAction.map((budget) => budget.category).join(" · ") || noActionDetail, color: "#F59E0B", icon: `${iconRoot}/warning.svg`, detailColor: "#9CA6B2" },
  ];
  return (
    <div className="absolute left-0 top-[122px] flex h-[116px] w-[1090px] gap-[14px] overflow-hidden">
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
