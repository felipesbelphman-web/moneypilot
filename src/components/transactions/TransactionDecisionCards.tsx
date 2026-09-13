"use client";

import Image from "next/image";
import Link from "next/link";

import type { Goal } from "@/components/goals/goal-model";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";

type TransactionDecisionCardsProps = { goals: Goal[]; isHydrating: boolean; hasLoadError: boolean; mobile?: boolean };

const decisionCopy = {
  en: { loading: "Loading your data…", loadError: "Unable to load the data for this analysis.", noPattern: "No pattern identified in this period", noGoals: "No goals created", noGoalsHelp: "Create a goal to track how your financial plan supports it.", goToGoals: "Go to goals →", insufficient: "There is not enough data yet to estimate the impact on this goal." },
  pt: { loading: "Carregando seus dados…", loadError: "Não foi possível carregar os dados desta análise.", noPattern: "Nenhum padrão identificado neste período", noGoals: "Nenhuma meta cadastrada", noGoalsHelp: "Crie uma meta para acompanhar como seu planejamento financeiro pode apoiá-la.", goToGoals: "Ir para metas →", insufficient: "Ainda não há dados suficientes para estimar o impacto nesta meta." },
  es: { loading: "Cargando tus datos…", loadError: "No se pudieron cargar los datos de este análisis.", noPattern: "No se identificó ningún patrón en este período", noGoals: "No hay objetivos creados", noGoalsHelp: "Crea un objetivo para seguir cómo puede apoyarlo tu planificación financiera.", goToGoals: "Ir a objetivos →", insufficient: "Aún no hay datos suficientes para estimar el impacto en este objetivo." },
  de: { loading: "Deine Daten werden geladen…", loadError: "Die Daten für diese Analyse konnten nicht geladen werden.", noPattern: "In diesem Zeitraum wurde kein Muster erkannt", noGoals: "Keine Ziele erstellt", noGoalsHelp: "Erstelle ein Ziel, um zu verfolgen, wie deine Finanzplanung es unterstützen kann.", goToGoals: "Zu den Zielen →", insufficient: "Es liegen noch nicht genügend Daten vor, um die Auswirkung auf dieses Ziel zu schätzen." },
  fr: { loading: "Chargement de vos données…", loadError: "Impossible de charger les données de cette analyse.", noPattern: "Aucune tendance identifiée sur cette période", noGoals: "Aucun objectif créé", noGoalsHelp: "Créez un objectif pour suivre comment votre planification financière peut le soutenir.", goToGoals: "Voir les objectifs →", insufficient: "Il n’y a pas encore assez de données pour estimer l’impact sur cet objectif." },
  nl: { loading: "Je gegevens worden geladen…", loadError: "De gegevens voor deze analyse konden niet worden geladen.", noPattern: "Geen patroon gevonden in deze periode", noGoals: "Geen doelen aangemaakt", noGoalsHelp: "Maak een doel om te volgen hoe je financiële planning dit kan ondersteunen.", goToGoals: "Naar doelen →", insufficient: "Er zijn nog niet genoeg gegevens om de impact op dit doel te schatten." },
  it: { loading: "Caricamento dei dati…", loadError: "Impossibile caricare i dati per questa analisi.", noPattern: "Nessun andamento identificato in questo periodo", noGoals: "Nessun obiettivo creato", noGoalsHelp: "Crea un obiettivo per monitorare come la pianificazione finanziaria può sostenerlo.", goToGoals: "Vai agli obiettivi →", insufficient: "Non ci sono ancora dati sufficienti per stimare l’impatto su questo obiettivo." },
} as const;

export function TransactionDecisionCards({ goals, isHydrating, hasLoadError, mobile = false }: TransactionDecisionCardsProps) {
  const { language } = useLanguage();
  const t = translations[language].appTransactions;
  const copy = decisionCopy[language];
  const goalState = isHydrating ? "loading" : hasLoadError ? "error" : goals.length === 0 ? "empty" : "insufficient";
  const patternMessage = isHydrating ? copy.loading : hasLoadError ? copy.loadError : copy.noPattern;

  return (
    <div className={mobile ? "grid min-w-0 grid-cols-1 gap-3" : "grid h-[148px] min-w-0 max-w-full shrink-0 grid-cols-2 items-center gap-x-[24px]"}>
      <article className="flex h-[112px] min-h-[112px] min-w-0 flex-col justify-center gap-[24px] overflow-hidden rounded-[16.075px] border border-[var(--border-default)] bg-[var(--background-elevated)] px-[12.503px] pb-[8.931px] pt-[9.824px] shadow-[0_3.572px_12.503px_rgba(10,10,10,0.07)]">
        <div className="flex h-[18px] w-full items-center"><div className="flex items-center gap-[7.144px]"><Image src="/moneypilot/transactions/icons/sparkles-outline.svg" alt="" width={18} height={18} className="size-[18px]" /><h2 className="text-[14px] font-semibold">{t.patternDetected}</h2></div></div>
        <p className="truncate text-[12px] font-medium text-[var(--text-secondary)]">{patternMessage}</p>
      </article>

      <article className="flex h-[112px] min-h-[112px] min-w-0 flex-col justify-center gap-[12px] overflow-hidden rounded-[16.075px] border border-[var(--border-default)] bg-[var(--background-elevated)] px-[12.503px] pb-[8.931px] pt-[9.824px] shadow-[0_3.572px_12.503px_rgba(10,10,10,0.07)]">
        <div className="flex h-[18px] w-full items-center"><div className="flex items-center gap-[7.144px]"><Image src="/moneypilot/transactions/icons/target.svg" alt="" width={18} height={18} className="size-[18px]" /><h2 className="text-[14px] font-semibold">{t.goalImpact}</h2></div></div>
        {goalState === "loading" && <p className="text-[12px] font-medium text-[var(--text-secondary)]">{copy.loading}</p>}
        {goalState === "error" && <p className="text-[12px] font-medium text-[var(--text-secondary)]">{copy.loadError}</p>}
        {goalState === "empty" && <><p className="line-clamp-2 text-[12px] font-medium"><strong>{copy.noGoals}.</strong> <span className="text-[var(--text-secondary)]">{copy.noGoalsHelp}</span></p><Link href="/goals" className="w-fit text-[10.72px] font-medium text-[var(--dashboard-brand-primary)]">{copy.goToGoals}</Link></>}
        {goalState === "insufficient" && <p className="text-[12px] font-medium text-[var(--text-secondary)]">{copy.insufficient}</p>}
      </article>
    </div>
  );
}
