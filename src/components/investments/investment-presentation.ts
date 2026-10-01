import type { Language } from "@/i18n/config";

type InvestmentCopy = {
  add: string; loading: string; loadError: string; saveError: string; unavailable: string;
  partial: string; partialHelp: string; comingSoon: string; planned: string; tracking: string;
  noResults: string; noResultsHelp: string; ai: string; quantity: string; invested: string; current: string;
  manualTitle: string; manualDescription: string; manual: string; close: string; name: string; symbol: string;
  assetType: string; types: Record<"stock" | "etf" | "crypto" | "other", string>; currency: string;
  averagePrice: string; currentPrice: string; nameError: string; quantityError: string; currencyError: string;
  priceError: string; manualTracking: string; manualHelp: string; cancel: string; saving: string; save: string;
};

export const investmentPresentationCopy: Record<Language, InvestmentCopy> = {
  en: {
    add: "Add investment", loading: "Loading investments…", loadError: "Some financial data could not be loaded. Available investments are shown.", saveError: "The investment could not be saved. Your entries have been kept.", unavailable: "Unavailable",
    partial: "Portfolio total: Partial", partialHelp: "A complete portfolio total is unavailable. Values remain in each asset’s currency; no currency conversion is applied.", comingSoon: "Coming soon", planned: "Planned", tracking: "Automatic price tracking",
    noResults: "No assets match this filter", noResultsHelp: "Choose another asset filter to see your investments.", ai: "AI insight", quantity: "Quantity", invested: "Invested", current: "Current",
    manualTitle: "Add manual investment", manualDescription: "Add a position using prices you control.", manual: "Manual", close: "Close", name: "Investment name", symbol: "Symbol", assetType: "Asset type", types: { stock: "Stock", etf: "ETF", crypto: "Crypto", other: "Other" }, currency: "Currency",
    averagePrice: "Average purchase price", currentPrice: "Current price", nameError: "Enter an investment name.", quantityError: "Enter a quantity greater than zero.", currencyError: "Use a 3-letter currency code.", priceError: "Enter a price greater than zero.", manualTracking: "Manual price tracking", manualHelp: "MoneyPilot uses the prices you enter to calculate invested and current values. No market provider is used in manual mode.", cancel: "Cancel", saving: "Saving…", save: "Save investment",
  },
  pt: {
    add: "Adicionar investimento", loading: "Carregando investimentos…", loadError: "Não foi possível carregar alguns dados financeiros. Os investimentos disponíveis são exibidos.", saveError: "Não foi possível salvar o investimento. Os dados preenchidos foram mantidos.", unavailable: "Indisponível",
    partial: "Total da carteira: parcial", partialHelp: "O total completo da carteira está indisponível. Os valores permanecem na moeda de cada ativo, sem conversão cambial.", comingSoon: "Em breve", planned: "Planejado", tracking: "Acompanhamento automático de preços",
    noResults: "Nenhum ativo corresponde ao filtro", noResultsHelp: "Escolha outro filtro para ver seus investimentos.", ai: "Insight da IA", quantity: "Quantidade", invested: "Investido", current: "Atual",
    manualTitle: "Adicionar investimento manual", manualDescription: "Adicione uma posição com preços informados por você.", manual: "Manual", close: "Fechar", name: "Nome do investimento", symbol: "Símbolo", assetType: "Tipo de ativo", types: { stock: "Ação", etf: "ETF", crypto: "Cripto", other: "Outro" }, currency: "Moeda",
    averagePrice: "Preço médio de compra", currentPrice: "Preço atual", nameError: "Informe o nome do investimento.", quantityError: "Informe uma quantidade maior que zero.", currencyError: "Use um código de moeda de 3 letras.", priceError: "Informe um preço maior que zero.", manualTracking: "Acompanhamento manual de preços", manualHelp: "O MoneyPilot usa os preços informados para calcular os valores investido e atual. Nenhum provedor de mercado é usado no modo manual.", cancel: "Cancelar", saving: "Salvando…", save: "Salvar investimento",
  },
  es: {
    add: "Añadir inversión", loading: "Cargando inversiones…", loadError: "No se pudieron cargar algunos datos financieros. Se muestran las inversiones disponibles.", saveError: "No se pudo guardar la inversión. Se han conservado los datos introducidos.", unavailable: "No disponible",
    partial: "Total de la cartera: parcial", partialHelp: "El total completo no está disponible. Los valores se mantienen en la moneda de cada activo, sin conversión.", comingSoon: "Próximamente", planned: "Previsto", tracking: "Seguimiento automático de precios",
    noResults: "Ningún activo coincide con el filtro", noResultsHelp: "Elige otro filtro para ver tus inversiones.", ai: "Análisis de IA", quantity: "Cantidad", invested: "Invertido", current: "Actual",
    manualTitle: "Añadir inversión manual", manualDescription: "Añade una posición con precios que tú controlas.", manual: "Manual", close: "Cerrar", name: "Nombre de la inversión", symbol: "Símbolo", assetType: "Tipo de activo", types: { stock: "Acción", etf: "ETF", crypto: "Cripto", other: "Otro" }, currency: "Moneda",
    averagePrice: "Precio medio de compra", currentPrice: "Precio actual", nameError: "Introduce un nombre.", quantityError: "Introduce una cantidad mayor que cero.", currencyError: "Usa un código de moneda de 3 letras.", priceError: "Introduce un precio mayor que cero.", manualTracking: "Seguimiento manual de precios", manualHelp: "MoneyPilot usa los precios introducidos para calcular los valores invertido y actual. El modo manual no usa un proveedor de mercado.", cancel: "Cancelar", saving: "Guardando…", save: "Guardar inversión",
  },
  de: {
    add: "Investition hinzufügen", loading: "Investitionen werden geladen…", loadError: "Einige Finanzdaten konnten nicht geladen werden. Verfügbare Investitionen werden angezeigt.", saveError: "Die Investition konnte nicht gespeichert werden. Deine Eingaben bleiben erhalten.", unavailable: "Nicht verfügbar",
    partial: "Portfoliogesamtwert: teilweise", partialHelp: "Der vollständige Gesamtwert ist nicht verfügbar. Werte bleiben in der jeweiligen Anlagenwährung, ohne Umrechnung.", comingSoon: "Demnächst", planned: "Geplant", tracking: "Automatische Preisverfolgung",
    noResults: "Keine Anlagen für diesen Filter", noResultsHelp: "Wähle einen anderen Filter, um deine Anlagen zu sehen.", ai: "KI-Einblick", quantity: "Menge", invested: "Investiert", current: "Aktuell",
    manualTitle: "Manuelle Investition hinzufügen", manualDescription: "Füge eine Position mit selbst angegebenen Preisen hinzu.", manual: "Manuell", close: "Schließen", name: "Name der Investition", symbol: "Symbol", assetType: "Anlagetyp", types: { stock: "Aktie", etf: "ETF", crypto: "Krypto", other: "Sonstiges" }, currency: "Währung",
    averagePrice: "Durchschnittlicher Kaufpreis", currentPrice: "Aktueller Preis", nameError: "Gib einen Namen ein.", quantityError: "Gib eine Menge größer als null ein.", currencyError: "Verwende einen Währungscode mit 3 Buchstaben.", priceError: "Gib einen Preis größer als null ein.", manualTracking: "Manuelle Preisverfolgung", manualHelp: "MoneyPilot berechnet investierte und aktuelle Werte aus deinen Preisen. Im manuellen Modus wird kein Marktdatenanbieter verwendet.", cancel: "Abbrechen", saving: "Wird gespeichert…", save: "Investition speichern",
  },
  fr: {
    add: "Ajouter un investissement", loading: "Chargement des investissements…", loadError: "Certaines données financières n’ont pas pu être chargées. Les investissements disponibles sont affichés.", saveError: "L’investissement n’a pas pu être enregistré. Vos saisies sont conservées.", unavailable: "Indisponible",
    partial: "Total du portefeuille : partiel", partialHelp: "Le total complet est indisponible. Les valeurs restent dans la devise de chaque actif, sans conversion.", comingSoon: "Bientôt disponible", planned: "Prévu", tracking: "Suivi automatique des prix",
    noResults: "Aucun actif pour ce filtre", noResultsHelp: "Choisissez un autre filtre pour voir vos investissements.", ai: "Analyse de l’IA", quantity: "Quantité", invested: "Investi", current: "Actuel",
    manualTitle: "Ajouter un investissement manuel", manualDescription: "Ajoutez une position avec les prix que vous renseignez.", manual: "Manuel", close: "Fermer", name: "Nom de l’investissement", symbol: "Symbole", assetType: "Type d’actif", types: { stock: "Action", etf: "ETF", crypto: "Crypto", other: "Autre" }, currency: "Devise",
    averagePrice: "Prix d’achat moyen", currentPrice: "Prix actuel", nameError: "Saisissez un nom.", quantityError: "Saisissez une quantité supérieure à zéro.", currencyError: "Utilisez un code de devise de 3 lettres.", priceError: "Saisissez un prix supérieur à zéro.", manualTracking: "Suivi manuel des prix", manualHelp: "MoneyPilot utilise vos prix pour calculer les valeurs investie et actuelle. Aucun fournisseur de marché n’est utilisé en mode manuel.", cancel: "Annuler", saving: "Enregistrement…", save: "Enregistrer",
  },
  nl: {
    add: "Belegging toevoegen", loading: "Beleggingen laden…", loadError: "Sommige financiële gegevens konden niet worden geladen. Beschikbare beleggingen worden getoond.", saveError: "De belegging kon niet worden opgeslagen. Je invoer is bewaard.", unavailable: "Niet beschikbaar",
    partial: "Portefeuilletotaal: gedeeltelijk", partialHelp: "Het volledige totaal is niet beschikbaar. Waarden blijven in de valuta van elke belegging, zonder omrekening.", comingSoon: "Binnenkort", planned: "Gepland", tracking: "Automatische koersvolging",
    noResults: "Geen beleggingen voor dit filter", noResultsHelp: "Kies een ander filter om je beleggingen te zien.", ai: "AI-inzicht", quantity: "Aantal", invested: "Belegd", current: "Huidig",
    manualTitle: "Handmatige belegging toevoegen", manualDescription: "Voeg een positie toe met zelf ingevoerde prijzen.", manual: "Handmatig", close: "Sluiten", name: "Naam van de belegging", symbol: "Symbool", assetType: "Type belegging", types: { stock: "Aandeel", etf: "ETF", crypto: "Crypto", other: "Overig" }, currency: "Valuta",
    averagePrice: "Gemiddelde aankoopprijs", currentPrice: "Huidige prijs", nameError: "Voer een naam in.", quantityError: "Voer een aantal groter dan nul in.", currencyError: "Gebruik een valutacode van 3 letters.", priceError: "Voer een prijs groter dan nul in.", manualTracking: "Handmatige koersvolging", manualHelp: "MoneyPilot gebruikt je prijzen om belegde en huidige waarden te berekenen. De handmatige modus gebruikt geen marktgegevensprovider.", cancel: "Annuleren", saving: "Opslaan…", save: "Belegging opslaan",
  },
  it: {
    add: "Aggiungi investimento", loading: "Caricamento investimenti…", loadError: "Impossibile caricare alcuni dati finanziari. Sono mostrati gli investimenti disponibili.", saveError: "Impossibile salvare l’investimento. I dati inseriti sono stati conservati.", unavailable: "Non disponibile",
    partial: "Totale portafoglio: parziale", partialHelp: "Il totale completo non è disponibile. I valori restano nella valuta di ciascun asset, senza conversione.", comingSoon: "Prossimamente", planned: "Previsto", tracking: "Monitoraggio automatico dei prezzi",
    noResults: "Nessun asset per questo filtro", noResultsHelp: "Scegli un altro filtro per vedere i tuoi investimenti.", ai: "Analisi IA", quantity: "Quantità", invested: "Investito", current: "Attuale",
    manualTitle: "Aggiungi investimento manuale", manualDescription: "Aggiungi una posizione con prezzi inseriti da te.", manual: "Manuale", close: "Chiudi", name: "Nome dell’investimento", symbol: "Simbolo", assetType: "Tipo di asset", types: { stock: "Azione", etf: "ETF", crypto: "Cripto", other: "Altro" }, currency: "Valuta",
    averagePrice: "Prezzo medio d’acquisto", currentPrice: "Prezzo attuale", nameError: "Inserisci un nome.", quantityError: "Inserisci una quantità maggiore di zero.", currencyError: "Usa un codice valuta di 3 lettere.", priceError: "Inserisci un prezzo maggiore di zero.", manualTracking: "Monitoraggio manuale dei prezzi", manualHelp: "MoneyPilot usa i prezzi inseriti per calcolare i valori investito e attuale. La modalità manuale non usa un fornitore di mercato.", cancel: "Annulla", saving: "Salvataggio…", save: "Salva investimento",
  },
};
