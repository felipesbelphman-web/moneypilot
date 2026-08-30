"use client";

import { useCurrency } from "@/components/CurrencyProvider";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";
import type { BudgetProjection } from "@/components/budgets/budget-projection";
import type { BudgetAdjustment } from "@/components/budgets/budget-model";

const iconRoot = "/moneypilot/budgets/icons";

type BudgetDecisionColumnProps = {
  projection: BudgetProjection;
  adjustment?: BudgetAdjustment;
  hasBudgets: boolean;
  hasGoals: boolean;
  onCreateBudget: () => void;
  onViewProjection: () => void;
  onReviewAdjustment: () => void;
};

export function BudgetDecisionColumn({ projection, adjustment, hasBudgets, hasGoals, onCreateBudget, onViewProjection, onReviewAdjustment }: BudgetDecisionColumnProps) {
  const { language } = useLanguage();
  const { formatMoney: money } = useCurrency();
  const t = translations[language].appBudgetsContent;
  const locale = language === "pt" ? "pt-PT" : language === "es" ? "es-ES" : "en-IE";
  const usedLabel = `${projection.budgetUsedPercent.toLocaleString(locale, { maximumFractionDigits: 1 })}%`;
  const elapsedLabel = `${projection.monthElapsedPercent.toLocaleString(locale, { maximumFractionDigits: 1 })}%`;
  const emptyCopy = language === "pt"
    ? { actionTitle: "Crie seu primeiro orçamento", actionDescription: "Defina limites para as categorias que deseja controlar.", createBudget: "Criar orçamento", noBudget: "Nenhum orçamento ainda", configured: "orçamento configurado", paceDescription: "Crie um orçamento para começar a acompanhar o ritmo dos gastos.", forecastUnavailable: "Previsão indisponível", forecastDescription: "Crie um orçamento para calculá-la.", noGoal: "Nenhuma meta selecionada", goalDescription: "Crie uma meta para ver o impacto do orçamento.", createGoal: "Criar meta" }
    : language === "es"
      ? { actionTitle: "Crea tu primer presupuesto", actionDescription: "Define límites para las categorías que quieras controlar.", createBudget: "Crear presupuesto", noBudget: "Aún no hay presupuesto", configured: "presupuesto configurado", paceDescription: "Crea un presupuesto para empezar a seguir el ritmo de los gastos.", forecastUnavailable: "Previsión no disponible", forecastDescription: "Crea un presupuesto para calcularla.", noGoal: "Ningún objetivo seleccionado", goalDescription: "Crea un objetivo para ver el impacto del presupuesto.", createGoal: "Crear objetivo" }
      : language === "de" ? { actionTitle: "Erstelle dein erstes Budget", actionDescription: "Lege Limits für die Kategorien fest, die du kontrollieren möchtest.", createBudget: "Budget erstellen", noBudget: "Noch kein Budget", configured: "Budget eingerichtet", paceDescription: "Erstelle ein Budget, um dein Ausgabentempo zu verfolgen.", forecastUnavailable: "Prognose nicht verfügbar", forecastDescription: "Erstelle ein Budget, um sie zu berechnen.", noGoal: "Kein Ziel ausgewählt", goalDescription: "Erstelle ein Ziel, um die Budgetauswirkung zu sehen.", createGoal: "Ziel erstellen" }
      : language === "fr" ? { actionTitle: "Créez votre premier budget", actionDescription: "Définissez des limites pour les catégories à surveiller.", createBudget: "Créer un budget", noBudget: "Aucun budget", configured: "budget configuré", paceDescription: "Créez un budget pour suivre le rythme des dépenses.", forecastUnavailable: "Prévision indisponible", forecastDescription: "Créez un budget pour la calculer.", noGoal: "Aucun objectif sélectionné", goalDescription: "Créez un objectif pour voir l’impact du budget.", createGoal: "Créer un objectif" }
      : language === "nl" ? { actionTitle: "Maak je eerste budget", actionDescription: "Stel limieten in voor de categorieën die je wilt beheren.", createBudget: "Budget maken", noBudget: "Nog geen budget", configured: "budget ingesteld", paceDescription: "Maak een budget om je uitgaventempo te volgen.", forecastUnavailable: "Verwachting niet beschikbaar", forecastDescription: "Maak een budget om deze te berekenen.", noGoal: "Geen doel geselecteerd", goalDescription: "Maak een doel om het effect van je budget te zien.", createGoal: "Doel maken" }
      : language === "it" ? { actionTitle: "Crea il tuo primo budget", actionDescription: "Imposta limiti per le categorie che vuoi controllare.", createBudget: "Crea budget", noBudget: "Nessun budget", configured: "budget configurato", paceDescription: "Crea un budget per seguire il ritmo delle spese.", forecastUnavailable: "Previsione non disponibile", forecastDescription: "Crea un budget per calcolarla.", noGoal: "Nessun obiettivo selezionato", goalDescription: "Crea un obiettivo per vedere l’impatto del budget.", createGoal: "Crea obiettivo" }
      : { actionTitle: "Create your first budget", actionDescription: "Set limits for the categories you want to control.", createBudget: "Create budget", noBudget: "No budget yet", configured: "budget configured", paceDescription: "Create a budget to start tracking spending pace.", forecastUnavailable: "Forecast unavailable", forecastDescription: "Create a budget to calculate it.", noGoal: "No goal selected", goalDescription: "Create a goal to see budget impact.", createGoal: "Create goal" };
  const dynamic = { en: { recovery: "Recovery target active", recover: "Recover", remaining: "Remaining target", week: "week", reduce: "Reduce by", until: "until month-end.", onTrack: "Budget on track", pace: "The current pace remains within the planned budget.", planned: "On track with the planned budget.", above: "above plan", below: "below plan", review: "Review plan" }, pt: { recovery: "Meta de recuperação ativa", recover: "Recupere", remaining: "Meta restante", week: "semana", reduce: "Reduza", until: "até o fim do mês.", onTrack: "Orçamento no caminho certo", pace: "O ritmo atual permanece dentro do orçamento planejado.", planned: "Dentro do orçamento planejado.", above: "acima do plano", below: "abaixo do plano", review: "Revisar plano" }, es: { recovery: "Objetivo de recuperación activo", recover: "Recupera", remaining: "Objetivo restante", week: "semana", reduce: "Reduce", until: "hasta final de mes.", onTrack: "Presupuesto bien encaminado", pace: "El ritmo actual se mantiene dentro del presupuesto planificado.", planned: "Dentro del presupuesto planificado.", above: "por encima del plan", below: "por debajo del plan", review: "Revisar plan" }, de: { recovery: "Wiederherstellungsziel aktiv", recover: "Spare", remaining: "Verbleibendes Ziel", week: "Woche", reduce: "Reduziere um", until: "bis zum Monatsende.", onTrack: "Budget im Plan", pace: "Das aktuelle Tempo bleibt im geplanten Budget.", planned: "Im geplanten Budget.", above: "über dem Plan", below: "unter dem Plan", review: "Plan prüfen" }, fr: { recovery: "Objectif de reprise actif", recover: "Récupérez", remaining: "Objectif restant", week: "semaine", reduce: "Réduisez de", until: "jusqu’à la fin du mois.", onTrack: "Budget en bonne voie", pace: "Le rythme actuel reste conforme au budget prévu.", planned: "Conforme au budget prévu.", above: "au-dessus du plan", below: "en dessous du plan", review: "Réviser le plan" }, nl: { recovery: "Hersteldoel actief", recover: "Bespaar", remaining: "Resterend doel", week: "week", reduce: "Verminder met", until: "tot het einde van de maand.", onTrack: "Budget op schema", pace: "Het huidige tempo blijft binnen het geplande budget.", planned: "Volgens het geplande budget.", above: "boven plan", below: "onder plan", review: "Plan bekijken" }, it: { recovery: "Obiettivo di recupero attivo", recover: "Recupera", remaining: "Obiettivo rimanente", week: "settimana", reduce: "Riduci di", until: "fino a fine mese.", onTrack: "Budget in linea", pace: "Il ritmo attuale resta nel budget pianificato.", planned: "In linea con il budget pianificato.", above: "sopra il piano", below: "sotto il piano", review: "Rivedi piano" } }[language];
  const goalImpactCopy = ({ en: "The suggested adjustment keeps your goal contribution protected.", pt: "O ajuste sugerido mantém protegida a contribuição para a sua meta.", es: "El ajuste sugerido mantiene protegida la aportación a tu objetivo.", de: "Die vorgeschlagene Anpassung schützt deinen Zielbeitrag.", fr: "L’ajustement suggéré protège votre versement vers l’objectif.", nl: "De voorgestelde aanpassing beschermt je bijdrage aan het doel.", it: "L’aggiustamento suggerito protegge il contributo al tuo obiettivo." })[language];
  const actionTitle = !hasBudgets
    ? emptyCopy.actionTitle
    : adjustment
    ? dynamic.recovery
    : projection.adjustmentNeeded > 0
    ? `${dynamic.recover} ${money(projection.adjustmentNeeded)}`
    : dynamic.onTrack;
  const actionDescription = !hasBudgets
    ? emptyCopy.actionDescription
    : adjustment
    ? `${dynamic.remaining}: ${money(adjustment.targetRemainingSpend)} · ~${money(adjustment.suggestedWeeklyReduction)}/${dynamic.week}`
    : projection.adjustmentNeeded > 0
    ? `${dynamic.reduce} ~${money(projection.suggestedWeeklyReduction)}/${dynamic.week} ${dynamic.until}`
    : dynamic.pace;
  const projectedDifferenceText = projection.projectedDifference === 0
    ? dynamic.planned
    : `${money(Math.abs(projection.projectedDifference))} ${projection.projectedOverBudget ? dynamic.above : dynamic.below}.`;
  return (
    <aside className="relative h-[516px] w-[330px] shrink-0">
      <section className="absolute left-0 top-0 flex h-[158px] w-[330px] flex-col gap-[6px] overflow-hidden rounded-[18px] border border-[#28313B] bg-[rgba(8,11,15,0.22)] px-[12px] py-[10px] shadow-[0_8px_18px_rgba(0,0,0,0.24)] backdrop-blur-[3.5px]">
        <div className="flex h-[20px] items-center gap-[7px]"><Image src={`${iconRoot}/sparkles.svg`} alt="" width={18} height={18} className="size-[18px]" /><h2 className="text-[12px] font-semibold">{t.nextBestAction}</h2></div>
        <p className="text-[8.5px] font-semibold leading-[10px] text-[#3B82F6]">{t.priority}</p>
        <p className="text-[16.5px] font-semibold leading-[19px]">{actionTitle}</p>
        <p className="w-[306px] text-[9.2px] leading-[12px] text-[#9CA6B2]">{actionDescription}</p>
        <button type="button" onClick={hasBudgets ? onReviewAdjustment : onCreateBudget} disabled={hasBudgets && !adjustment && (projection.adjustmentNeeded <= 0 || !projection.canProject || projection.remainingDays <= 0 || projection.plannedTotal <= 0)} className="flex h-[26px] w-[306px] items-center justify-center gap-[7px] rounded-[8px] bg-[#3B82F6] text-[10px] font-semibold disabled:cursor-not-allowed disabled:opacity-40"><span>{!hasBudgets ? emptyCopy.createBudget : adjustment ? dynamic.review : t.applyAdjustment}</span><Image src={`${iconRoot}/arrow-right.svg`} alt="" width={16} height={16} className="size-[16px]" /></button>
      </section>

      <section className="absolute left-0 top-[170px] flex h-[184px] w-[330px] flex-col gap-[6px] overflow-hidden rounded-[18px] border border-[#28313B] bg-[rgba(8,11,15,0.22)] px-[12px] py-[10px] shadow-[0_8px_18px_rgba(0,0,0,0.24)] backdrop-blur-[3.5px]">
        <div className="flex h-[20px] items-center gap-[7px]"><Image src="/moneypilot/dashboard-monthly-status-icon.svg" alt="" width={18} height={18} className="size-[18px]" /><h2 className="text-[12px] font-semibold">{t.budgetPace}</h2>{!hasBudgets && <span className="ml-auto text-[9px] font-semibold text-[#9CA6B2]">{emptyCopy.noBudget}</span>}</div>
        <div className="flex h-[34px] justify-between"><Metric value={usedLabel} label={hasBudgets ? t.budgetUsed : emptyCopy.configured} /><Metric value={elapsedLabel} label={t.monthElapsed} /></div>
        <div className="flex h-[38px] flex-col gap-[3px]"><Progress label={t.budget} value={usedLabel} width={`${Math.min(projection.budgetUsedPercent, 100)}%`} color="#3B82F6" /><Progress label={t.monthTime} value={elapsedLabel} width={`${projection.monthElapsedPercent}%`} color="#38BDF8" /></div>
        <div className="flex h-[38px] flex-col gap-px rounded-[8px] border border-[#F59E0B]/24 bg-[#F59E0B]/8 px-[8px] py-[5px]"><p className="text-[9.3px] font-semibold leading-[11px]">{hasBudgets ? <>{t.closingForecast}&nbsp; {money(projection.projectedTotal)}</> : emptyCopy.forecastUnavailable}</p><p className="text-[8.5px] leading-[10px] text-[#F59E0B]">{hasBudgets ? projectedDifferenceText : emptyCopy.forecastDescription}</p></div>
        {hasBudgets ? <button type="button" onClick={onViewProjection} className="w-fit text-[8.7px] font-semibold leading-[11px] text-[#3B82F6]">{t.viewProjection}</button> : <p className="text-[8.7px] leading-[11px] text-[#9CA6B2]">{emptyCopy.paceDescription}</p>}
      </section>

      <section className="absolute left-0 top-[366px] flex h-[150px] w-[330px] flex-col gap-[6px] overflow-hidden rounded-[18px] border border-[#28313B] bg-[rgba(8,11,15,0.22)] px-[12px] py-[10px] shadow-[0_8px_18px_rgba(0,0,0,0.24)] backdrop-blur-[3.5px]">
        <div className="flex h-[20px] items-center justify-between"><div className="flex items-center gap-[7px]"><Image src={`${iconRoot}/target.svg`} alt="" width={18} height={18} className="size-[18px]" /><h2 className="text-[12px] font-semibold">{t.goalImpact}</h2></div>{hasGoals && <span className="flex h-[18px] w-[58px] items-center justify-center rounded-[9px] bg-[#3B82F6]/10 text-[8px] font-semibold text-[#3B82F6]">{t.trip}</span>}</div>
        <p className="text-[12.5px] font-semibold leading-[16px]">{hasGoals ? t.delayText : emptyCopy.noGoal}</p>
        <p className="text-[9.2px] leading-[12px] text-[#9CA6B2]">{hasGoals ? goalImpactCopy : emptyCopy.goalDescription}</p>
        <Link href="/goals" className="flex h-[24px] w-[306px] items-center justify-center gap-[6px] rounded-[7px] border border-[#28313B] text-[9.2px] font-semibold text-[#3B82F6]">{hasGoals ? t.viewGoalImpact : emptyCopy.createGoal} <Image src={`${iconRoot}/arrow-right.svg`} alt="" width={15} height={15} className="size-[15px]" /></Link>
      </section>
    </aside>
  );
}

function Metric({ value, label }: { value: string; label: string }) { return <div className="flex h-[34px] w-[145px] flex-col gap-px"><strong className="text-[17px] leading-[19px]">{value}</strong><span className="text-[8.5px] leading-[10px] text-[#9CA6B2]">{label}</span></div>; }
function Progress({ label, value, width, color }: { label: string; value: string; width: string; color: string }) { return <div className="contents"><div className="flex h-[12px] items-center justify-between text-[8.5px] leading-[10px]"><span className="font-medium text-[#9CA6B2]">{label}</span><strong style={{ color }}>{value}</strong></div><div className="h-[5px] w-[304px] overflow-hidden rounded-[2.5px] bg-[#19212C]"><div className="h-full rounded-[2.5px]" style={{ width, backgroundColor: color }} /></div></div>; }
