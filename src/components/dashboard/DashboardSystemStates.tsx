"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type Language, useLanguage } from "../LanguageProvider";

const skeleton = "animate-pulse rounded-[6px] bg-[color-mix(in_srgb,var(--text-secondary)_12%,transparent)]";

const systemCopy: Record<Language, {
  loading: [string, string, string, string];
  empty: [string, string, string, string, string, string, string];
  steps: [string, string][];
  error: [string, string, string, string, string, string, string, string];
  help: [string, string][];
}> = {
  en: { loading: ["Loading your financial overview", "MoneyPilot is preparing your latest transactions, budgets and goals.", "SYNCING", "Your data stays in this session while MoneyPilot calculates the current view."], empty: ["No financial data yet", "Add your first transaction or import a statement. MoneyPilot will build your overview, budgets and goal insights from there.", "Add transaction", "Import statement", "What happens next", "No bank connection is required for the MoneyPilot MVP.", "MoneyPilot setup"], steps: [["Add or import", "Start with one transaction or a CSV statement."], ["MoneyPilot organizes", "Expenses are classified into your financial view."], ["Get decisions", "Budgets, goals and next actions become available."]], error: ["ERROR", "We couldn’t load your financial overview", "Your data is safe. MoneyPilot couldn’t complete this request right now. Try again, or return to the previous screen.", "Try again", "Go back", "If the problem continues", "YOUR DATA IS SAFE", "Retrying only reloads this view. It does not create, delete, or move financial data."], help: [["Check your connection", "Make sure your internet connection is available."], ["Try once more", "Retry the action. Your saved data will not be duplicated."], ["Get help", "Open Support if the same error keeps appearing."]] },
  pt: { loading: ["A carregar a sua visão financeira", "O MoneyPilot está a preparar as suas transações, orçamentos e objetivos mais recentes.", "A SINCRONIZAR", "Os seus dados permanecem nesta sessão enquanto o MoneyPilot calcula a vista atual."], empty: ["Ainda não existem dados financeiros", "Adicione a primeira transação ou importe um extrato. O MoneyPilot criará a sua visão geral, orçamentos e análises de objetivos.", "Adicionar transação", "Importar extrato", "O que acontece a seguir", "Não é necessária uma ligação bancária para o MVP do MoneyPilot.", "Configuração do MoneyPilot"], steps: [["Adicionar ou importar", "Comece com uma transação ou um extrato CSV."], ["O MoneyPilot organiza", "As despesas são classificadas na sua visão financeira."], ["Obter decisões", "Orçamentos, objetivos e próximas ações ficam disponíveis."]], error: ["ERRO", "Não foi possível carregar a sua visão financeira", "Os seus dados estão seguros. O MoneyPilot não conseguiu concluir este pedido agora. Tente novamente ou volte ao ecrã anterior.", "Tentar novamente", "Voltar", "Se o problema continuar", "OS SEUS DADOS ESTÃO SEGUROS", "Tentar novamente apenas recarrega esta vista. Não cria, elimina nem move dados financeiros."], help: [["Verifique a ligação", "Certifique-se de que a ligação à internet está disponível."], ["Tente mais uma vez", "Repita a ação. Os dados guardados não serão duplicados."], ["Obtenha ajuda", "Abra o Suporte se o mesmo erro continuar a aparecer."]] },
  es: { loading: ["Cargando tu resumen financiero", "MoneyPilot está preparando tus transacciones, presupuestos y objetivos más recientes.", "SINCRONIZANDO", "Tus datos permanecen en esta sesión mientras MoneyPilot calcula la vista actual."], empty: ["Aún no hay datos financieros", "Añade tu primera transacción o importa un extracto. MoneyPilot creará tu resumen, presupuestos y análisis de objetivos.", "Añadir transacción", "Importar extracto", "Qué ocurre después", "No se requiere conexión bancaria para el MVP de MoneyPilot.", "Configuración de MoneyPilot"], steps: [["Añade o importa", "Empieza con una transacción o un extracto CSV."], ["MoneyPilot organiza", "Los gastos se clasifican en tu vista financiera."], ["Obtén decisiones", "Los presupuestos, objetivos y próximas acciones estarán disponibles."]], error: ["ERROR", "No pudimos cargar tu resumen financiero", "Tus datos están seguros. MoneyPilot no pudo completar esta solicitud ahora. Inténtalo de nuevo o vuelve a la pantalla anterior.", "Intentar de nuevo", "Volver", "Si el problema continúa", "TUS DATOS ESTÁN SEGUROS", "Reintentar solo recarga esta vista. No crea, elimina ni mueve datos financieros."], help: [["Comprueba tu conexión", "Asegúrate de que tu conexión a internet está disponible."], ["Inténtalo otra vez", "Repite la acción. Tus datos guardados no se duplicarán."], ["Obtén ayuda", "Abre Soporte si el mismo error sigue apareciendo."]] },
  de: { loading: ["Ihre Finanzübersicht wird geladen", "MoneyPilot bereitet Ihre neuesten Transaktionen, Budgets und Ziele vor.", "SYNCHRONISIERUNG", "Ihre Daten bleiben in dieser Sitzung, während MoneyPilot die aktuelle Ansicht berechnet."], empty: ["Noch keine Finanzdaten", "Fügen Sie Ihre erste Transaktion hinzu oder importieren Sie einen Kontoauszug. MoneyPilot erstellt daraus Ihre Übersicht, Budgets und Zielanalysen.", "Transaktion hinzufügen", "Kontoauszug importieren", "Wie es weitergeht", "Für das MoneyPilot-MVP ist keine Bankverbindung erforderlich.", "MoneyPilot einrichten"], steps: [["Hinzufügen oder importieren", "Beginnen Sie mit einer Transaktion oder einer CSV-Datei."], ["MoneyPilot organisiert", "Ausgaben werden Ihrer Finanzübersicht zugeordnet."], ["Entscheidungen erhalten", "Budgets, Ziele und nächste Schritte werden verfügbar."]], error: ["FEHLER", "Ihre Finanzübersicht konnte nicht geladen werden", "Ihre Daten sind sicher. MoneyPilot konnte diese Anfrage gerade nicht abschließen. Versuchen Sie es erneut oder kehren Sie zum vorherigen Bildschirm zurück.", "Erneut versuchen", "Zurück", "Falls das Problem weiterhin besteht", "IHRE DATEN SIND SICHER", "Ein erneuter Versuch lädt nur diese Ansicht neu. Finanzdaten werden weder erstellt noch gelöscht oder verschoben."], help: [["Verbindung prüfen", "Stellen Sie sicher, dass Ihre Internetverbindung verfügbar ist."], ["Erneut versuchen", "Wiederholen Sie die Aktion. Ihre gespeicherten Daten werden nicht dupliziert."], ["Hilfe erhalten", "Öffnen Sie den Support, wenn derselbe Fehler erneut auftritt."]] },
  fr: { loading: ["Chargement de votre vue financière", "MoneyPilot prépare vos dernières transactions, vos budgets et vos objectifs.", "SYNCHRONISATION", "Vos données restent dans cette session pendant que MoneyPilot calcule la vue actuelle."], empty: ["Aucune donnée financière pour le moment", "Ajoutez votre première transaction ou importez un relevé. MoneyPilot créera ensuite votre vue d’ensemble, vos budgets et vos analyses d’objectifs.", "Ajouter une transaction", "Importer un relevé", "Étapes suivantes", "Aucune connexion bancaire n’est requise pour le MVP de MoneyPilot.", "Configuration de MoneyPilot"], steps: [["Ajouter ou importer", "Commencez par une transaction ou un relevé CSV."], ["MoneyPilot organise", "Les dépenses sont classées dans votre vue financière."], ["Obtenir des décisions", "Les budgets, objectifs et prochaines actions deviennent disponibles."]], error: ["ERREUR", "Impossible de charger votre vue financière", "Vos données sont en sécurité. MoneyPilot n’a pas pu traiter cette demande pour le moment. Réessayez ou revenez à l’écran précédent.", "Réessayer", "Retour", "Si le problème persiste", "VOS DONNÉES SONT EN SÉCURITÉ", "Réessayer recharge uniquement cette vue. Aucune donnée financière n’est créée, supprimée ou déplacée."], help: [["Vérifiez votre connexion", "Assurez-vous que votre connexion Internet est disponible."], ["Réessayez", "Relancez l’action. Vos données enregistrées ne seront pas dupliquées."], ["Obtenir de l’aide", "Ouvrez l’assistance si la même erreur persiste."]] },
  nl: { loading: ["Je financiële overzicht wordt geladen", "MoneyPilot bereidt je nieuwste transacties, budgetten en doelen voor.", "SYNCHRONISEREN", "Je gegevens blijven in deze sessie terwijl MoneyPilot de huidige weergave berekent."], empty: ["Nog geen financiële gegevens", "Voeg je eerste transactie toe of importeer een afschrift. MoneyPilot bouwt daarmee je overzicht, budgetten en doelinzichten op.", "Transactie toevoegen", "Afschrift importeren", "Wat gebeurt er daarna", "Voor de MoneyPilot-MVP is geen bankkoppeling vereist.", "MoneyPilot instellen"], steps: [["Toevoegen of importeren", "Begin met één transactie of een CSV-afschrift."], ["MoneyPilot organiseert", "Uitgaven worden ingedeeld in je financiële overzicht."], ["Beslissingen ontvangen", "Budgetten, doelen en volgende acties worden beschikbaar."]], error: ["FOUT", "We konden je financiële overzicht niet laden", "Je gegevens zijn veilig. MoneyPilot kon dit verzoek nu niet voltooien. Probeer het opnieuw of ga terug naar het vorige scherm.", "Opnieuw proberen", "Terug", "Als het probleem aanhoudt", "JE GEGEVENS ZIJN VEILIG", "Opnieuw proberen herlaadt alleen deze weergave. Financiële gegevens worden niet aangemaakt, verwijderd of verplaatst."], help: [["Controleer je verbinding", "Controleer of je internetverbinding beschikbaar is."], ["Probeer het nogmaals", "Herhaal de actie. Je opgeslagen gegevens worden niet gedupliceerd."], ["Hulp krijgen", "Open Ondersteuning als dezelfde fout blijft verschijnen."]] },
  it: { loading: ["Caricamento della panoramica finanziaria", "MoneyPilot sta preparando le transazioni, i budget e gli obiettivi più recenti.", "SINCRONIZZAZIONE", "I tuoi dati restano in questa sessione mentre MoneyPilot calcola la vista attuale."], empty: ["Nessun dato finanziario", "Aggiungi la prima transazione o importa un estratto conto. MoneyPilot creerà la panoramica, i budget e le analisi degli obiettivi.", "Aggiungi transazione", "Importa estratto conto", "Cosa succede dopo", "Per l’MVP di MoneyPilot non è richiesto alcun collegamento bancario.", "Configurazione di MoneyPilot"], steps: [["Aggiungi o importa", "Inizia con una transazione o un estratto CSV."], ["MoneyPilot organizza", "Le spese vengono classificate nella tua vista finanziaria."], ["Ottieni decisioni", "Budget, obiettivi e prossime azioni diventano disponibili."]], error: ["ERRORE", "Non è stato possibile caricare la panoramica finanziaria", "I tuoi dati sono al sicuro. MoneyPilot non ha potuto completare la richiesta ora. Riprova o torna alla schermata precedente.", "Riprova", "Indietro", "Se il problema persiste", "I TUOI DATI SONO AL SICURO", "Riprova ricarica solo questa vista. Non crea, elimina o sposta dati finanziari."], help: [["Controlla la connessione", "Assicurati che la connessione Internet sia disponibile."], ["Prova ancora", "Ripeti l’azione. I dati salvati non verranno duplicati."], ["Ottieni assistenza", "Apri l’Assistenza se lo stesso errore continua a comparire."]] },
};

export function DashboardLoadingState() {
  const { language } = useLanguage(); const t = systemCopy[language].loading;
  return <div role="status" aria-live="polite" aria-busy="true" className="flex h-[725px] flex-col gap-[12px] pt-[12px]">
    <div className="flex h-[54px] items-center justify-between rounded-[14px] border border-[var(--border-default)] bg-[var(--background-card)] px-[14px]"><div><strong className="block text-[14px] text-[var(--text-primary)]">{t[0]}</strong><span className="text-[9px] text-[var(--text-secondary)]">{t[1]}</span></div><span className="rounded-full border border-[#3B82F6]/60 bg-[#3B82F6]/10 px-[28px] py-[5px] text-[8px] font-semibold text-[#3B82F6]">{t[2]}</span></div>
    <div className="grid h-[90px] grid-cols-4 gap-[12px]">{[0,1,2,3].map((item) => <SkeletonCard key={item} />)}</div>
    <div className="grid h-[184px] grid-cols-[1.8fr_1fr] gap-[12px]"><div className="rounded-[14px] border border-[var(--border-default)] bg-[var(--background-card)] p-[14px]"><div className={`${skeleton} h-[11px] w-[125px]`} /><div className="mt-[42px] flex h-[90px] items-end justify-center gap-[30px]">{[42,66,52,82,59,74,48].map((height, index) => <div key={index} className="flex items-end gap-[4px]"><span className={`${skeleton} w-[15px]`} style={{ height }} /><span className={`${skeleton} w-[8px] opacity-70`} style={{ height: height * .65 }} /></div>)}</div></div><div className="flex items-center gap-[22px] rounded-[14px] border border-[var(--border-default)] bg-[var(--background-card)] p-[18px]"><div className="size-[82px] rounded-full border-[14px] border-[color-mix(in_srgb,var(--text-secondary)_12%,transparent)]" /><div className="flex-1 space-y-[13px]"><div className={`${skeleton} h-[10px] w-full`} /><div className={`${skeleton} h-[10px] w-full`} /><div className={`${skeleton} h-[10px] w-4/5`} /></div></div></div>
    <div className="grid h-[180px] grid-cols-4 gap-[12px]">{[0,1,2,3].map((item) => <SkeletonCard key={item} tall />)}</div>
    <p className="mt-auto text-[9px] text-[var(--text-secondary)]">{t[3]}</p>
  </div>;
}

function SkeletonCard({ tall = false }: { tall?: boolean }) {
  return <div className="rounded-[14px] border border-[var(--border-default)] bg-[var(--background-card)] p-[12px]"><div className={`${skeleton} h-[10px] w-[64px]`} /><div className={`${skeleton} mt-[13px] h-[16px] w-[92px]`} /><div className={`${skeleton} mt-[12px] h-[8px] w-3/4`} /><div className={`${skeleton} mt-[12px] ${tall ? "h-[34px]" : "h-[10px]"} w-full`} />{tall && <div className={`${skeleton} mt-[12px] h-[18px] w-full`} />}</div>;
}

export function DashboardEmptyState() {
  const { language } = useLanguage();
  const t = systemCopy[language].empty;
  const steps = systemCopy[language].steps;

  return (
    <div className="relative h-[724px] w-full">
      <section className="absolute left-1/2 top-[85px] h-[520px] w-[654px] -translate-x-1/2 overflow-hidden rounded-[24px] border border-[#D4D4D4] bg-white text-center shadow-[0_16px_28px_rgba(0,0,0,0.08)]">

        {/* Empty state icon */}
        <div className="absolute left-[282px] top-[33px] grid size-[88px] place-items-center rounded-full border border-[#BFDBFE] bg-[#EFF6FF]">
          <Image
            src="/moneypilot/system-states/file-earmark-plus.svg"
            alt=""
            width={36}
            height={36}
          />
        </div>

        {/* Title */}
        <h1 className="absolute left-1/2 top-[143px] flex h-[34px] w-[510px] -translate-x-1/2 items-center justify-center text-[24px] font-semibold leading-normal text-[#0A0A0A]">
          {t[0]}
        </h1>

        {/* Description */}
        <p className="absolute left-1/2 top-[183px] flex h-[54px] w-[510px] -translate-x-1/2 items-center justify-center text-[11px] font-normal leading-normal text-[#525252]">
          {t[1]}
        </p>

        {/* Actions */}
        <div className="absolute left-[145px] top-[259px] flex gap-[10px]">
          <Link
            href="/transactions"
            className="flex h-[44px] w-[176px] items-center justify-center gap-[12px] rounded-[22px] bg-[#3B82F6] px-[16px] text-[11px] font-semibold text-white"
          >
            {t[2]}

            <Image
              src="/moneypilot/system-states/add-circle-outline.svg"
              alt=""
              width={21}
              height={21}
            />
          </Link>

          <Link
            href="/transactions"
            className="flex h-[44px] w-[176px] items-center justify-center gap-[10px] rounded-[22px] border border-[#D4D4D4] bg-white text-[11px] font-semibold text-[#525252]"
          >
            {t[3]}

            <Image
              src="/moneypilot/system-states/file-earmark-pdf.svg"
              alt=""
              width={24}
              height={24}
            />
          </Link>
        </div>

        {/* What happens next */}
        <strong className="absolute left-1/2 top-[329px] flex h-[20px] w-[550px] -translate-x-1/2 items-center justify-center text-[11px] font-semibold text-[#0A0A0A]">
          {t[4]}
        </strong>

        {/* Steps */}
        <div className="absolute left-[33px] top-[365px] grid grid-cols-3 gap-[8px]">
          {steps.map(([title, text], index) => (
            <div
              key={title}
              className="relative h-[112px] w-[190px] rounded-[14px] border border-[#D4D4D4] bg-[#FAFAFA] text-left"
            >
              <div className="absolute left-[11px] top-[11px] grid size-[24px] place-items-center rounded-full border border-[#BFDBFE] bg-[#EFF6FF] text-[9px] font-semibold text-[#3B82F6]">
                {index + 1}
              </div>

              <strong className="absolute left-[45px] top-[13px] flex h-[20px] w-[126px] items-center text-[10px] font-semibold text-[#0A0A0A]">
                {title}
              </strong>

              <p className="absolute left-[11px] top-[44px] flex h-[48px] w-[166px] items-center text-[9px] font-normal leading-normal text-[#525252]">
                {text}
              </p>
            </div>
          ))}
        </div>

        {/* MVP note */}
        <p className="absolute left-1/2 top-[491px] flex h-[16px] w-[550px] -translate-x-1/2 items-center justify-center text-[9px] font-normal text-[#737373]">
          {t[5]}
        </p>
      </section>
    </div>
  );
}

export function DashboardErrorState({ error, onRetry }: { error: Error | string; onRetry?: () => void }) {
  const router = useRouter();
  const { language } = useLanguage(); const t = systemCopy[language].error; const help = systemCopy[language].help;
  return <div className="absolute inset-0 z-30 flex items-center justify-center bg-[color-mix(in_srgb,var(--background-app)_66%,transparent)] backdrop-blur-[5px]"><section role="alert" className="relative flex h-[420px] w-[660px] flex-col items-center rounded-[24px] border border-[var(--border-default)] bg-[var(--background-elevated)] px-[30px] py-[24px] text-center shadow-[0_22px_60px_rgba(0,0,0,0.32)]"><span className="absolute right-[24px] top-[20px] rounded-full border border-[#EF4444]/50 bg-[#EF4444]/10 px-[24px] py-[4px] text-[8px] font-semibold text-[#EF4444]">{t[0]}</span><div className="grid size-[54px] place-items-center rounded-full border border-[#EF4444]/55 bg-[#EF4444]/10 text-[24px] text-[#EF4444]" aria-hidden="true">!</div><h1 className="mt-[20px] text-[20px] font-semibold text-[var(--text-primary)]">{t[1]}</h1><p className="mt-[10px] max-w-[520px] text-[10px] leading-[14px] text-[var(--text-secondary)]">{t[2]}</p><div className="mt-[18px] flex gap-[12px]"><button type="button" onClick={onRetry} disabled={!onRetry} className="h-[34px] min-w-[120px] rounded-full bg-[#3B82F6] px-[22px] text-[10px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">{t[3]}</button><button type="button" onClick={() => router.back()} className="h-[34px] min-w-[120px] rounded-full border border-[var(--border-default)] px-[22px] text-[10px] font-medium text-[var(--text-primary)]">{t[4]}</button></div><strong className="mt-[22px] text-[9px] text-[var(--text-primary)]">{t[5]}</strong><div className="mt-[12px] grid w-full grid-cols-3 gap-[8px] text-left">{help.map(([title, text]) => <div key={title} className="h-[76px] rounded-[12px] border border-[var(--border-default)] bg-[var(--background-card)] p-[11px]"><strong className="text-[9px] text-[var(--text-primary)]">{title}</strong><p className="mt-[10px] text-[8px] leading-[11px] text-[var(--text-secondary)]">{text}</p></div>)}</div><div className="mt-[10px] w-full rounded-[10px] border border-[#22C55E]/45 bg-[#22C55E]/10 px-[12px] py-[8px] text-left"><strong className="block text-[8px] text-[#22C55E]">{t[6]}</strong><span className="text-[8px] text-[var(--text-secondary)]">{t[7]}</span></div><span className="sr-only">{error instanceof Error ? error.message : error}</span></section></div>;
}
