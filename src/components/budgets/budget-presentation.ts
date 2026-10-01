// Presentation only: keep the percentage truthful while bounding the visible bar.
export function getBudgetProgress(limit: number, spent: number | null) {
  if (spent === null || !Number.isFinite(spent) || spent < 0 || !Number.isFinite(limit) || limit <= 0) return { percent: null, width: 0 };
  const percent = Math.round(spent / limit * 100);
  return Number.isFinite(percent) ? { percent, width: Math.min(100, Math.max(0, percent)) } : { percent: null, width: 0 };
}

export const budgetUiCopy = {
  en: { loading: "Loading your budgets…", error: "Budgets could not be loaded. Please try again later.", unavailable: "Analysis unavailable", goal: "Budget impact on goals is not calculated yet.", noResults: "No budgets match your search." },
  pt: { loading: "Carregando seus orçamentos…", error: "Não foi possível carregar os orçamentos. Tente novamente mais tarde.", unavailable: "Análise indisponível", goal: "O impacto dos orçamentos nas metas ainda não é calculado.", noResults: "Nenhum orçamento corresponde à busca." },
  es: { loading: "Cargando tus presupuestos…", error: "No se pudieron cargar los presupuestos. Inténtalo más tarde.", unavailable: "Análisis no disponible", goal: "El impacto del presupuesto en los objetivos aún no se calcula.", noResults: "Ningún presupuesto coincide con la búsqueda." },
  de: { loading: "Budgets werden geladen…", error: "Budgets konnten nicht geladen werden. Versuche es später erneut.", unavailable: "Analyse nicht verfügbar", goal: "Die Auswirkungen der Budgets auf Ziele werden noch nicht berechnet.", noResults: "Keine Budgets entsprechen deiner Suche." },
  fr: { loading: "Chargement de vos budgets…", error: "Impossible de charger les budgets. Réessayez plus tard.", unavailable: "Analyse indisponible", goal: "L’impact des budgets sur les objectifs n’est pas encore calculé.", noResults: "Aucun budget ne correspond à votre recherche." },
  nl: { loading: "Je budgetten worden geladen…", error: "Budgetten konden niet worden geladen. Probeer het later opnieuw.", unavailable: "Analyse niet beschikbaar", goal: "De impact van budgetten op doelen wordt nog niet berekend.", noResults: "Geen budgetten komen overeen met je zoekopdracht." },
  it: { loading: "Caricamento dei budget…", error: "Impossibile caricare i budget. Riprova più tardi.", unavailable: "Analisi non disponibile", goal: "L’impatto dei budget sugli obiettivi non viene ancora calcolato.", noResults: "Nessun budget corrisponde alla ricerca." },
};
