import type { Language } from "../LanguageProvider";

type GoalsPresentationCopy = { loading: string; error: string; select: string; primary: string; secondary: string; plan: string };
export const goalsPresentationCopy: Record<Language, GoalsPresentationCopy> = {
  en: { loading: "Loading goals…", error: "Some financial data could not be loaded. Available information is shown below.", select: "Select goal", primary: "Primary", secondary: "Secondary", plan: "Plan to free up" },
  pt: { loading: "Carregando metas…", error: "Não foi possível carregar alguns dados financeiros. As informações disponíveis aparecem abaixo.", select: "Selecionar meta", primary: "Principal", secondary: "Secundária", plan: "Plano para liberar recursos" },
  es: { loading: "Cargando objetivos…", error: "No se pudieron cargar algunos datos financieros. La información disponible se muestra abajo.", select: "Seleccionar objetivo", primary: "Principal", secondary: "Secundario", plan: "Plan para liberar recursos" },
  de: { loading: "Ziele werden geladen…", error: "Einige Finanzdaten konnten nicht geladen werden. Verfügbare Informationen werden unten angezeigt.", select: "Ziel auswählen", primary: "Hauptziel", secondary: "Nebenziel", plan: "Plan für mehr Spielraum" },
  fr: { loading: "Chargement des objectifs…", error: "Certaines données financières n’ont pas pu être chargées. Les informations disponibles sont affichées ci-dessous.", select: "Choisir un objectif", primary: "Principal", secondary: "Secondaire", plan: "Plan pour dégager une marge" },
  nl: { loading: "Doelen laden…", error: "Sommige financiële gegevens konden niet worden geladen. Beschikbare informatie staat hieronder.", select: "Doel selecteren", primary: "Primair", secondary: "Secundair", plan: "Plan om ruimte vrij te maken" },
  it: { loading: "Caricamento degli obiettivi…", error: "Non è stato possibile caricare alcuni dati finanziari. Le informazioni disponibili sono mostrate qui sotto.", select: "Seleziona obiettivo", primary: "Principale", secondary: "Secondario", plan: "Piano per liberare risorse" },
};
