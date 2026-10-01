import type { Language } from './config.ts';
import type { HelpArticleId, HelpCategoryId, HelpShortcutId } from '../components/help/help-model.ts';

export type HelpCopy = {
  brand: string; title: string; description: string; searchTitle: string; searchDescription: string;
  searchLabel: string; searchPlaceholder: string; shortcut: string; categoriesLabel: string;
  faqTitle: string; articleCount: string; localNotice: string; empty: string; clear: string;
  supportTitle: string; supportDescription: string; contact: string; responseTime: string;
  shortcutsTitle: string; modalTitle: string; modalDescription: string; close: string;
  categories: Record<HelpCategoryId, { title: string; description: string }>;
  articles: Record<HelpArticleId, { question: string; answer: string }>;
  shortcuts: Record<HelpShortcutId, { title: string; description: string }>;
};

export const helpCopy: Record<Language, HelpCopy> = {
  pt: {
    brand: 'MoneyPilot', title: 'Suporte e ajuda', description: 'Encontre respostas e aproveite melhor o MoneyPilot.',
    searchTitle: 'Como podemos ajudar?', searchDescription: 'Explore os tópicos ou encontre a resposta que procura.',
    searchLabel: 'Pesquisar na ajuda', searchPlaceholder: 'Busque por transações, orçamento, conta…', shortcut: 'Ctrl / ⌘ K', categoriesLabel: 'Categorias de ajuda',
    faqTitle: 'Perguntas frequentes', articleCount: 'Artigos: {count}', localNotice: 'Conteúdo demonstrativo local e temporário.',
    empty: 'Nenhum resultado encontrado. Tente outro termo ou remova o filtro.', clear: 'Limpar pesquisa e filtros',
    supportTitle: 'Ainda precisa de ajuda?', supportDescription: 'O canal de suporte está sendo preparado para ajudar você.', contact: 'Falar com suporte', responseTime: 'Tempo estimado de resposta: disponível em breve.',
    shortcutsTitle: 'Atalhos úteis', modalTitle: 'Suporte disponível em breve', modalDescription: 'O canal de atendimento ainda não está disponível. Por enquanto, consulte as perguntas frequentes e os atalhos desta página. Nenhuma mensagem será enviada.', close: 'Entendi',
    categories: {
      'getting-started': { title: 'Primeiros passos', description: 'Conheça o MoneyPilot e organize suas finanças.' },
      transactions: { title: 'Transações e categorias', description: 'Importe extratos e classifique seus gastos.' },
      planning: { title: 'Orçamentos e metas', description: 'Planeje seus gastos e acompanhe seus objetivos.' },
      account: { title: 'Conta e segurança', description: 'Gerencie seu perfil e suas preferências.' },
    },
    articles: {
      start: { question: 'Como começar a usar o MoneyPilot?', answer: 'Comece por Transações para registrar suas receitas e despesas. Revise as categorias e depois acesse o Dashboard para acompanhar sua atividade. Em Configurações, confira o idioma e a moeda da conta.' },
      import: { question: 'Como importar um extrato CSV?', answer: 'Abra Transações e selecione Importar extrato. Escolha seu arquivo CSV e revise a prévia antes de confirmar a importação. O atalho abaixo abre essa área; esta página de ajuda não importa arquivos.' },
      classify: { question: 'Como organizar minhas categorias?', answer: 'Acesse Categorias e classificação nos atalhos para revisar as categorias existentes. Em Transações, confira a classificação de cada lançamento para manter seus gastos organizados.' },
      budget: { question: 'Como acompanhar meu orçamento mensal?', answer: 'Na área Orçamentos, selecione o mês e confira os limites e gastos registrados. Revise as categorias incluídas antes de ajustar seu planejamento.' },
      goal: { question: 'Onde acompanho minhas metas financeiras?', answer: 'Abra a área de Objetivos para consultar suas metas, valores e prazos. Revise o progresso e os dados da meta sempre que seu planejamento mudar.' },
      security: { question: 'Onde gerencio minha conta e privacidade?', answer: 'Acesse Configurações para consultar as opções de perfil, preferências e segurança disponíveis. Esta demonstração de ajuda não solicita senhas nem altera dados da sua conta.' },
    },
    shortcuts: {
      import: { title: 'Importar extrato', description: 'Abra a importação CSV em Transações.' },
      categories: { title: 'Categorias e classificação', description: 'Organize as categorias dos seus lançamentos.' },
      security: { title: 'Segurança e privacidade', description: 'Revise as configurações da conta.' },
      insights: { title: 'Insights financeiros', description: 'Explore a análise das suas finanças.' },
    },
  },
  en: {
    brand: 'MoneyPilot', title: 'Support and help', description: 'Find answers and get more from MoneyPilot.', searchTitle: 'How can we help?', searchDescription: 'Explore topics or find the answer you need.',
    searchLabel: 'Search help', searchPlaceholder: 'Search transactions, budgets, account…', shortcut: 'Ctrl / ⌘ K', categoriesLabel: 'Help categories',
    faqTitle: 'Frequently asked questions', articleCount: 'Articles: {count}', localNotice: 'Temporary local demonstration content.', empty: 'No results found. Try another term or remove the filter.', clear: 'Clear search and filters',
    supportTitle: 'Still need help?', supportDescription: 'We are preparing a support channel to help you.', contact: 'Contact support', responseTime: 'Estimated response time: coming soon.', shortcutsTitle: 'Useful shortcuts',
    modalTitle: 'Support is coming soon', modalDescription: 'The support channel is not available yet. For now, explore the questions and shortcuts on this page. No message will be sent.', close: 'Got it',
    categories: {
      'getting-started': { title: 'Getting started', description: 'Discover MoneyPilot and organize your finances.' }, transactions: { title: 'Transactions and categories', description: 'Import statements and classify spending.' }, planning: { title: 'Budgets and goals', description: 'Plan spending and track your goals.' }, account: { title: 'Account and security', description: 'Manage your profile and preferences.' },
    },
    articles: {
      start: { question: 'How do I get started with MoneyPilot?', answer: 'Start in Transactions to record income and expenses. Review the categories, then open the Dashboard to follow your activity. Check your account language and currency in Settings.' },
      import: { question: 'How do I import a CSV statement?', answer: 'Open Transactions and select Import statement. Choose a CSV file and review the preview before confirming the import. The shortcut below opens that area; this help page does not import files.' },
      classify: { question: 'How do I organize my categories?', answer: 'Use the Categories and classification shortcut to review existing categories. In Transactions, check the classification of each entry to keep your spending organized.' },
      budget: { question: 'How do I track my monthly budget?', answer: 'In Budgets, select the month and review your limits and recorded spending. Check the included categories before adjusting your plan.' },
      goal: { question: 'Where can I track my financial goals?', answer: 'Open Goals to review your targets, amounts and dates. Revisit your progress and goal details whenever your plans change.' },
      security: { question: 'Where do I manage my account and privacy?', answer: 'Open Settings to see the available profile, preference and security options. This help demonstration does not request passwords or change account data.' },
    },
    shortcuts: { import: { title: 'Import statement', description: 'Open CSV import in Transactions.' }, categories: { title: 'Categories and classification', description: 'Organize the categories of your entries.' }, security: { title: 'Security and privacy', description: 'Review your account settings.' }, insights: { title: 'Financial insights', description: 'Explore analysis of your finances.' } },
  },
  es: {
    brand: 'MoneyPilot', title: 'Soporte y ayuda', description: 'Encuentra respuestas y aprovecha mejor MoneyPilot.', searchTitle: '¿Cómo podemos ayudarte?', searchDescription: 'Explora los temas o encuentra la respuesta que buscas.', searchLabel: 'Buscar en la ayuda', searchPlaceholder: 'Busca transacciones, presupuestos, cuenta…', shortcut: 'Ctrl / ⌘ K', categoriesLabel: 'Categorías de ayuda', faqTitle: 'Preguntas frecuentes', articleCount: 'Artículos: {count}', localNotice: 'Contenido demostrativo local y temporal.', empty: 'No se encontraron resultados. Prueba otro término o elimina el filtro.', clear: 'Limpiar búsqueda y filtros', supportTitle: '¿Aún necesitas ayuda?', supportDescription: 'Estamos preparando un canal de soporte para ayudarte.', contact: 'Contactar con soporte', responseTime: 'Tiempo estimado de respuesta: próximamente.', shortcutsTitle: 'Accesos útiles', modalTitle: 'Soporte disponible próximamente', modalDescription: 'El canal de atención aún no está disponible. Consulta las preguntas y los accesos de esta página. No se enviará ningún mensaje.', close: 'Entendido',
    categories: { 'getting-started': { title: 'Primeros pasos', description: 'Descubre MoneyPilot y organiza tus finanzas.' }, transactions: { title: 'Transacciones y categorías', description: 'Importa extractos y clasifica tus gastos.' }, planning: { title: 'Presupuestos y objetivos', description: 'Planifica tus gastos y sigue tus objetivos.' }, account: { title: 'Cuenta y seguridad', description: 'Gestiona tu perfil y tus preferencias.' } },
    articles: {
      start: { question: '¿Cómo empezar a usar MoneyPilot?', answer: 'Empieza en Transacciones para registrar ingresos y gastos. Revisa las categorías y abre el Dashboard para seguir tu actividad. Comprueba el idioma y la moneda en Configuración.' },
      import: { question: '¿Cómo importar un extracto CSV?', answer: 'Abre Transacciones y selecciona Importar extracto. Elige el archivo CSV y revisa la vista previa antes de confirmar. El acceso de abajo abre esa área; esta página de ayuda no importa archivos.' },
      classify: { question: '¿Cómo organizar mis categorías?', answer: 'Usa el acceso Categorías y clasificación para revisar las categorías existentes. En Transacciones, comprueba la clasificación de cada movimiento.' },
      budget: { question: '¿Cómo seguir mi presupuesto mensual?', answer: 'En Presupuestos, selecciona el mes y revisa los límites y gastos registrados. Comprueba las categorías incluidas antes de ajustar tu plan.' },
      goal: { question: '¿Dónde puedo seguir mis objetivos financieros?', answer: 'Abre Objetivos para consultar tus metas, importes y fechas. Revisa el progreso y los datos cuando cambie tu planificación.' },
      security: { question: '¿Dónde gestiono mi cuenta y privacidad?', answer: 'Abre Configuración para consultar las opciones de perfil, preferencias y seguridad disponibles. Esta demostración no solicita contraseñas ni modifica datos de tu cuenta.' },
    },
    shortcuts: { import: { title: 'Importar extracto', description: 'Abre la importación CSV en Transacciones.' }, categories: { title: 'Categorías y clasificación', description: 'Organiza las categorías de tus movimientos.' }, security: { title: 'Seguridad y privacidad', description: 'Revisa la configuración de tu cuenta.' }, insights: { title: 'Análisis financieros', description: 'Explora el análisis de tus finanzas.' } },
  },
  de: {
    brand: 'MoneyPilot', title: 'Support und Hilfe', description: 'Finde Antworten und nutze MoneyPilot besser.', searchTitle: 'Wie können wir helfen?', searchDescription: 'Entdecke Themen oder finde die passende Antwort.', searchLabel: 'Hilfe durchsuchen', searchPlaceholder: 'Transaktionen, Budgets, Konto suchen…', shortcut: 'Ctrl / ⌘ K', categoriesLabel: 'Hilfekategorien', faqTitle: 'Häufig gestellte Fragen', articleCount: 'Artikel: {count}', localNotice: 'Vorläufige lokale Demonstrationsinhalte.', empty: 'Keine Ergebnisse. Versuche einen anderen Begriff oder entferne den Filter.', clear: 'Suche und Filter zurücksetzen', supportTitle: 'Noch Fragen?', supportDescription: 'Wir bereiten einen Supportkanal für dich vor.', contact: 'Support kontaktieren', responseTime: 'Geschätzte Antwortzeit: demnächst verfügbar.', shortcutsTitle: 'Nützliche Links', modalTitle: 'Support bald verfügbar', modalDescription: 'Der Supportkanal ist noch nicht verfügbar. Nutze vorerst die Fragen und Links auf dieser Seite. Es wird keine Nachricht gesendet.', close: 'Verstanden',
    categories: { 'getting-started': { title: 'Erste Schritte', description: 'Entdecke MoneyPilot und ordne deine Finanzen.' }, transactions: { title: 'Transaktionen und Kategorien', description: 'Importiere Auszüge und ordne Ausgaben zu.' }, planning: { title: 'Budgets und Ziele', description: 'Plane Ausgaben und verfolge deine Ziele.' }, account: { title: 'Konto und Sicherheit', description: 'Verwalte dein Profil und deine Einstellungen.' } },
    articles: {
      start: { question: 'Wie starte ich mit MoneyPilot?', answer: 'Erfasse Einnahmen und Ausgaben unter Transaktionen. Prüfe die Kategorien und öffne die Übersicht, um deine Aktivitäten zu verfolgen. Sprache und Währung findest du in den Einstellungen.' },
      import: { question: 'Wie importiere ich einen CSV-Auszug?', answer: 'Öffne Transaktionen und wähle Kontoauszug importieren. Wähle eine CSV-Datei und prüfe die Vorschau vor der Bestätigung. Der Link unten öffnet diesen Bereich; diese Hilfeseite importiert keine Dateien.' },
      classify: { question: 'Wie ordne ich meine Kategorien?', answer: 'Öffne Kategorien und Zuordnung über die Links, um vorhandene Kategorien zu prüfen. Kontrolliere unter Transaktionen die Zuordnung der einzelnen Einträge.' },
      budget: { question: 'Wie verfolge ich mein Monatsbudget?', answer: 'Wähle unter Budgets den Monat und prüfe Limits und erfasste Ausgaben. Kontrolliere die enthaltenen Kategorien, bevor du deinen Plan anpasst.' },
      goal: { question: 'Wo verfolge ich meine finanziellen Ziele?', answer: 'Öffne Ziele, um Beträge und Termine zu prüfen. Überprüfe Fortschritt und Zieldaten, wenn sich deine Planung ändert.' },
      security: { question: 'Wo verwalte ich Konto und Datenschutz?', answer: 'Unter Einstellungen findest du die verfügbaren Profil-, Präferenz- und Sicherheitsoptionen. Diese Hilfedemonstration fragt keine Passwörter ab und ändert keine Kontodaten.' },
    },
    shortcuts: { import: { title: 'Kontoauszug importieren', description: 'CSV-Import unter Transaktionen öffnen.' }, categories: { title: 'Kategorien und Zuordnung', description: 'Ordne die Kategorien deiner Einträge.' }, security: { title: 'Sicherheit und Datenschutz', description: 'Prüfe deine Kontoeinstellungen.' }, insights: { title: 'Finanzielle Einblicke', description: 'Entdecke Analysen deiner Finanzen.' } },
  },
  fr: {
    brand: 'MoneyPilot', title: 'Assistance et aide', description: 'Trouvez des réponses et profitez mieux de MoneyPilot.', searchTitle: 'Comment pouvons-nous vous aider ?', searchDescription: 'Explorez les thèmes ou trouvez la réponse recherchée.', searchLabel: 'Rechercher dans l’aide', searchPlaceholder: 'Transactions, budgets, compte…', shortcut: 'Ctrl / ⌘ K', categoriesLabel: 'Catégories d’aide', faqTitle: 'Questions fréquentes', articleCount: 'Articles : {count}', localNotice: 'Contenu de démonstration local et temporaire.', empty: 'Aucun résultat. Essayez un autre terme ou retirez le filtre.', clear: 'Effacer la recherche et les filtres', supportTitle: 'Encore besoin d’aide ?', supportDescription: 'Nous préparons un canal d’assistance pour vous aider.', contact: 'Contacter l’assistance', responseTime: 'Délai de réponse estimé : bientôt disponible.', shortcutsTitle: 'Liens utiles', modalTitle: 'Assistance bientôt disponible', modalDescription: 'Le canal d’assistance n’est pas encore disponible. Consultez les questions et les liens de cette page. Aucun message ne sera envoyé.', close: 'Compris',
    categories: { 'getting-started': { title: 'Premiers pas', description: 'Découvrez MoneyPilot et organisez vos finances.' }, transactions: { title: 'Transactions et catégories', description: 'Importez des relevés et classez vos dépenses.' }, planning: { title: 'Budgets et objectifs', description: 'Planifiez vos dépenses et suivez vos objectifs.' }, account: { title: 'Compte et sécurité', description: 'Gérez votre profil et vos préférences.' } },
    articles: {
      start: { question: 'Comment commencer avec MoneyPilot ?', answer: 'Commencez dans Transactions pour saisir revenus et dépenses. Vérifiez les catégories, puis consultez le tableau de bord. La langue et la devise se trouvent dans les paramètres.' },
      import: { question: 'Comment importer un relevé CSV ?', answer: 'Ouvrez Transactions et sélectionnez Importer un relevé. Choisissez un fichier CSV et vérifiez l’aperçu avant de confirmer. Le lien ci-dessous ouvre cette section ; cette page d’aide n’importe aucun fichier.' },
      classify: { question: 'Comment organiser mes catégories ?', answer: 'Utilisez le lien Catégories et classement pour consulter les catégories existantes. Dans Transactions, vérifiez le classement de chaque opération.' },
      budget: { question: 'Comment suivre mon budget mensuel ?', answer: 'Dans Budgets, choisissez le mois et consultez les plafonds et dépenses enregistrées. Vérifiez les catégories incluses avant de modifier votre plan.' },
      goal: { question: 'Où suivre mes objectifs financiers ?', answer: 'Ouvrez Objectifs pour consulter les montants et les échéances. Vérifiez la progression et les détails lorsque vos projets changent.' },
      security: { question: 'Où gérer mon compte et ma confidentialité ?', answer: 'Ouvrez Paramètres pour consulter les options de profil, de préférences et de sécurité. Cette démonstration ne demande aucun mot de passe et ne modifie aucune donnée du compte.' },
    },
    shortcuts: { import: { title: 'Importer un relevé', description: 'Ouvrir l’import CSV dans Transactions.' }, categories: { title: 'Catégories et classement', description: 'Organisez les catégories de vos opérations.' }, security: { title: 'Sécurité et confidentialité', description: 'Consultez les paramètres du compte.' }, insights: { title: 'Analyses financières', description: 'Explorez l’analyse de vos finances.' } },
  },
  nl: {
    brand: 'MoneyPilot', title: 'Ondersteuning en hulp', description: 'Vind antwoorden en haal meer uit MoneyPilot.', searchTitle: 'Hoe kunnen we helpen?', searchDescription: 'Verken onderwerpen of vind het antwoord dat je zoekt.', searchLabel: 'Zoeken in hulp', searchPlaceholder: 'Zoek transacties, budgetten, account…', shortcut: 'Ctrl / ⌘ K', categoriesLabel: 'Hulpcategorieën', faqTitle: 'Veelgestelde vragen', articleCount: 'Artikelen: {count}', localNotice: 'Tijdelijke lokale demonstratie-inhoud.', empty: 'Geen resultaten. Probeer een andere term of verwijder het filter.', clear: 'Zoekopdracht en filters wissen', supportTitle: 'Nog hulp nodig?', supportDescription: 'We bereiden een ondersteuningskanaal voor je voor.', contact: 'Contact opnemen', responseTime: 'Verwachte reactietijd: binnenkort beschikbaar.', shortcutsTitle: 'Handige links', modalTitle: 'Ondersteuning binnenkort beschikbaar', modalDescription: 'Het ondersteuningskanaal is nog niet beschikbaar. Bekijk de vragen en links op deze pagina. Er wordt geen bericht verzonden.', close: 'Begrepen',
    categories: { 'getting-started': { title: 'Aan de slag', description: 'Ontdek MoneyPilot en orden je financiën.' }, transactions: { title: 'Transacties en categorieën', description: 'Importeer afschriften en classificeer uitgaven.' }, planning: { title: 'Budgetten en doelen', description: 'Plan uitgaven en volg je doelen.' }, account: { title: 'Account en beveiliging', description: 'Beheer je profiel en voorkeuren.' } },
    articles: {
      start: { question: 'Hoe begin ik met MoneyPilot?', answer: 'Begin bij Transacties om inkomsten en uitgaven vast te leggen. Controleer de categorieën en open het overzicht om je activiteit te volgen. Controleer taal en valuta bij Instellingen.' },
      import: { question: 'Hoe importeer ik een CSV-afschrift?', answer: 'Open Transacties en kies Afschrift importeren. Selecteer een CSV-bestand en controleer het voorbeeld voordat je bevestigt. De link hieronder opent dat onderdeel; deze hulppagina importeert geen bestanden.' },
      classify: { question: 'Hoe orden ik mijn categorieën?', answer: 'Gebruik Categorieën en classificatie om bestaande categorieën te bekijken. Controleer bij Transacties de classificatie van elke boeking.' },
      budget: { question: 'Hoe volg ik mijn maandbudget?', answer: 'Selecteer bij Budgetten de maand en bekijk limieten en vastgelegde uitgaven. Controleer de opgenomen categorieën voordat je je plan aanpast.' },
      goal: { question: 'Waar volg ik mijn financiële doelen?', answer: 'Open Doelen om bedragen en datums te bekijken. Controleer de voortgang en doeldetails wanneer je plannen veranderen.' },
      security: { question: 'Waar beheer ik mijn account en privacy?', answer: 'Open Instellingen voor de beschikbare profiel-, voorkeur- en beveiligingsopties. Deze hulpdemonstratie vraagt geen wachtwoorden en wijzigt geen accountgegevens.' },
    },
    shortcuts: { import: { title: 'Afschrift importeren', description: 'Open CSV-import bij Transacties.' }, categories: { title: 'Categorieën en classificatie', description: 'Orden de categorieën van je boekingen.' }, security: { title: 'Beveiliging en privacy', description: 'Controleer je accountinstellingen.' }, insights: { title: 'Financiële inzichten', description: 'Verken de analyse van je financiën.' } },
  },
  it: {
    brand: 'MoneyPilot', title: 'Supporto e aiuto', description: 'Trova risposte e sfrutta al meglio MoneyPilot.', searchTitle: 'Come possiamo aiutarti?', searchDescription: 'Esplora gli argomenti o trova la risposta che cerchi.', searchLabel: 'Cerca nella guida', searchPlaceholder: 'Cerca transazioni, budget, account…', shortcut: 'Ctrl / ⌘ K', categoriesLabel: 'Categorie di aiuto', faqTitle: 'Domande frequenti', articleCount: 'Articoli: {count}', localNotice: 'Contenuti dimostrativi locali e temporanei.', empty: 'Nessun risultato. Prova un altro termine o rimuovi il filtro.', clear: 'Cancella ricerca e filtri', supportTitle: 'Hai ancora bisogno di aiuto?', supportDescription: 'Stiamo preparando un canale di supporto per aiutarti.', contact: 'Contatta il supporto', responseTime: 'Tempo di risposta stimato: disponibile a breve.', shortcutsTitle: 'Collegamenti utili', modalTitle: 'Supporto disponibile a breve', modalDescription: 'Il canale di assistenza non è ancora disponibile. Consulta le domande e i collegamenti di questa pagina. Non verrà inviato alcun messaggio.', close: 'Ho capito',
    categories: { 'getting-started': { title: 'Primi passi', description: 'Scopri MoneyPilot e organizza le tue finanze.' }, transactions: { title: 'Transazioni e categorie', description: 'Importa estratti conto e classifica le spese.' }, planning: { title: 'Budget e obiettivi', description: 'Pianifica le spese e segui i tuoi obiettivi.' }, account: { title: 'Account e sicurezza', description: 'Gestisci il profilo e le preferenze.' } },
    articles: {
      start: { question: 'Come iniziare a usare MoneyPilot?', answer: 'Inizia da Transazioni per registrare entrate e spese. Controlla le categorie e apri la panoramica per seguire la tua attività. Verifica lingua e valuta nelle Impostazioni.' },
      import: { question: 'Come importare un estratto conto CSV?', answer: 'Apri Transazioni e seleziona Importa estratto conto. Scegli un file CSV e controlla l’anteprima prima di confermare. Il collegamento sotto apre quella sezione; questa pagina di aiuto non importa file.' },
      classify: { question: 'Come organizzare le mie categorie?', answer: 'Usa Categorie e classificazione per esaminare le categorie esistenti. In Transazioni, controlla la classificazione di ogni movimento.' },
      budget: { question: 'Come seguire il mio budget mensile?', answer: 'In Budget, seleziona il mese e controlla limiti e spese registrate. Verifica le categorie incluse prima di modificare il piano.' },
      goal: { question: 'Dove seguire i miei obiettivi finanziari?', answer: 'Apri Obiettivi per consultare importi e scadenze. Rivedi i progressi e i dettagli quando cambia la tua pianificazione.' },
      security: { question: 'Dove gestire account e privacy?', answer: 'Apri Impostazioni per consultare le opzioni disponibili di profilo, preferenze e sicurezza. Questa dimostrazione non richiede password e non modifica i dati dell’account.' },
    },
    shortcuts: { import: { title: 'Importa estratto conto', description: 'Apri l’importazione CSV in Transazioni.' }, categories: { title: 'Categorie e classificazione', description: 'Organizza le categorie dei tuoi movimenti.' }, security: { title: 'Sicurezza e privacy', description: 'Controlla le impostazioni dell’account.' }, insights: { title: 'Analisi finanziarie', description: 'Esplora l’analisi delle tue finanze.' } },
  },
};
