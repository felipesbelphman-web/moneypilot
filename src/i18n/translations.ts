import { appTranslations, goalTranslations, supplementalTranslations } from "./app-translations";

const baseTranslations = {
  en: {
    ...appTranslations.en,
    ...supplementalTranslations.en,
    ...goalTranslations.en,
    common: {
      selectLanguage: "Select language",
      showPassword: "Show password",
      hidePassword: "Hide password",
    },
    landing: {
      hero: {
        titleLine1: "Understand your money.",
        titleLine2: "Plan your goals.",
        titleLine3: "Make better decisions.",
        description:
          "Organize spending, track budgets, receive financial insights, and move toward your financial goals.",
        createAccount: "Create account",
        login: "Sign in",
        alreadyHaveAccount: "Already have an account?",
      },

      benefits: [
        {
          title: "Spending control",
          description: "See where your money is going.",
        },
        {
          title: "Financial goals",
          description: "Set goals and track your progress.",
        },
        {
          title: "Financial insights",
          description: "Receive smart analysis and recommendations.",
        },
      ],

      security:
        "Your data is handled securely and privately.",

      dashboard: {
        visualAlt: "MoneyPilot preview",
        incomeChartLabel: "Income chart",
        expenseTotalLabel: "Total spending",
        goalProgressLabel: "Goal progress",
        overview: "Overview",
        daily: "Daily",

        income: "Income",
        expenses: "Expenses",
        netBalance: "Net balance",

        goal: "Goal: Travel",
        deadline: "Deadline: 15 Nov 2027",

        spendingTag: "SPENDING",
        spendingByCategory: "Spending by category",

        categories: {
          housing: "Housing",
          food: "Food",
          transport: "Transport",
          leisure: "Leisure",
          health: "Health",
        },

        months: [
          "JAN",
          "FEB",
          "MAR",
          "APR",
          "MAY",
          "JUN",
          "JUL",
          "AUG",
          "SEP",
          "OCT",
          "NOV",
          "DEC",
        ],
      },

      finalCta: {
        title:
          "Start taking better care of your financial future today.",
        description:
          "Organize expenses, track goals and move forward with greater clarity and confidence with MoneyPilot.",
        createAccount: "Create free account",
        alreadyHaveAccount: "Already have an account?",
        login: "Log in",
      },
    },
    auth: {
      hero: {
        signup: { titleLines: ["The home of your dreams", "starts with planning."], description: "Organize your money, track your goals and build the path to your new home step by step." },
        login: { titleLines: ["Your next car", "starts with a plan."], description: "Set how much you need to save and track your progress until you reach the ideal amount for your purchase." },
        forgotPassword: { titleLines: ["The big day deserves", "great planning."], description: "Plan your goal for the ceremony, celebration and honeymoon without losing control of your finances." },
        verifyEmail: { titleLines: ["A new love also deserves", "good planning."], description: "Organize your finances for the baby's arrival and prepare more calmly for every moment of this new chapter." },
        resetPassword: { titleLines: ["Invest today in the future", "you want."], description: "Create a goal for college, courses or certifications and track your progress until you achieve your objectives." },
      },
      security: { title: "Privacy first",
      description: "Your financial data is protected by authentication. We never display sensitive information without an active session.", privacy: ["Privacy", "protected"], encryption: ["End-to-end", "encryption"], control: ["You are in", "control"], connection: ["Secure", "connection"] },
      eyebrow: { welcome: "WELCOME TO MONEYPILOT", recoverAccess: "RECOVER ACCESS", verifyEmail: "CHECK YOUR EMAIL", newPassword: "CREATE NEW PASSWORD" },
      title: { signup: "Create your account", login: "Log in", forgotPassword: "Forgot password", verifyEmail: "Check your email", resetPassword: "Create a new password" },
      description: { signup: "Start organizing your finances with a secure, personal account.", login: "Access your account to manage your finances securely and conveniently.", forgotPassword: "Enter the email address for your account and we'll send you a link to reset your password.", verifyEmail: "We sent a recovery link to", resetPassword: "Choose a strong, secure new password for your account." },
      firstName: "First name", firstNamePlaceholder: "Enter your first name", lastName: "Last name", lastNamePlaceholder: "Enter your last name", email: "Email", emailPlaceholder: "you@example.com", password: "Password", passwordPlaceholder: "Enter your password", newPassword: "New password", newPasswordPlaceholder: "Enter your new password", confirmPassword: "Confirm new password",
      strength: { weak: "Weak", medium: "Medium", strong: "Strong" },
      createAccount: "Create account", login: "Log in", forgotPassword: "Forgot password", resetPassword: "Reset password", resend: "Send again", sendRecoveryLink: "Send recovery link", or: "or", google: "Continue with Google", comingSoon: "COMING SOON", backToLogin: "Back to login", noAccount: "Don't have an account yet?", alreadyHaveAccount: "Already have an account?", linkValidPrefix: "The link is", linkValidDuration: "valid for 1 hour.", checkSpam: "Also check your spam folder.",
    },
  },

  pt: {
    ...appTranslations.pt,
    ...supplementalTranslations.pt,
    ...goalTranslations.pt,
    common: {
      selectLanguage: "Selecionar idioma",
      showPassword: "Mostrar senha",
      hidePassword: "Ocultar senha",
    },
    landing: {
      hero: {
        titleLine1: "Entenda seu dinheiro.",
        titleLine2: "Planeje seus objetivos.",
        titleLine3: "Tome decisões melhores.",
        description:
          "Organize gastos, acompanhe orçamentos, receba insights financeiros e avance rumo aos seus objetivos financeiros.",
        createAccount: "Criar conta",
        login: "Entrar",
        alreadyHaveAccount: "Já tem uma conta?",
      },

      benefits: [
        {
          title: "Controle de gastos",
          description: "Veja para onde seu dinheiro está indo.",
        },
        {
          title: "Metas financeiras",
          description: "Defina objetivos e acompanhe seu progresso.",
        },
        {
          title: "Insights financeiros",
          description: "Receba análises inteligentes e recomendações.",
        },
      ],

      security:
        "Seus dados são tratados com segurança e privacidade.",

      dashboard: {
        visualAlt: "Visual do MoneyPilot",
        incomeChartLabel: "Gráfico de receitas",
        expenseTotalLabel: "Total de gastos",
        goalProgressLabel: "Progresso da meta",
        overview: "Visão geral",
        daily: "Diário",

        income: "Receitas",
        expenses: "Despesas",
        netBalance: "Saldo líquido",

        goal: "Meta: Viajar",
        deadline: "Prazo: 15 Nov 2027",

        spendingTag: "GASTOS",
        spendingByCategory: "Gastos por categoria",

        categories: {
          housing: "Moradia",
          food: "Alimentação",
          transport: "Transporte",
          leisure: "Lazer",
          health: "Saúde",
        },

        months: [
          "JAN",
          "FEV",
          "MAR",
          "ABR",
          "MAI",
          "JUN",
          "JUL",
          "AGO",
          "SET",
          "OUT",
          "NOV",
          "DEZ",
        ],
      },

      finalCta: {
        title:
          "Comece hoje a cuidar melhor do seu futuro financeiro.",
        description:
          "Organize gastos, acompanhe metas e avance com mais clareza e segurança com a MoneyPilot.",
        createAccount: "Criar conta grátis",
        alreadyHaveAccount: "Já tem uma conta?",
        login: "Entrar",
      },
    },
    auth: {
      hero: {
        signup: { titleLines: ["A casa dos seus sonhos", "começa com planejamento."], description: "Organize seu dinheiro, acompanhe suas metas e construa passo a passo o caminho para o seu novo lar." },
        login: { titleLines: ["Seu próximo carro", "começa com um plano."], description: "Defina quanto precisa guardar e acompanhe sua evolução até chegar ao valor ideal para a sua compra." },
        forgotPassword: { titleLines: ["O grande dia merece um", "grande planejamento."], description: "Organize sua meta para cerimônia, festa e lua de mel sem perder o controle das suas finanças." },
        verifyEmail: { titleLines: ["Um novo amor também merece", "um bom planejamento."], description: "Organize suas finanças para a chegada do bebê e prepare-se com mais tranquilidade para cada momento dessa nova fase." },
        resetPassword: { titleLines: ["Invista hoje no futuro", "que você deseja."], description: "Crie uma meta para faculdade, cursos ou certificações e acompanhe seu progresso até alcançar seus objetivos." },
      },
      security: { title: "Segurança em primeiro lugar", description: "Seus dados estão protegidos com criptografia e nunca compartilhamos suas informações com terceiros.", privacy: ["Privacidade", "protegida"], encryption: ["Criptografia", "de ponta"], control: ["Você no", "controle"], connection: ["Conexão", "segura"] },
      eyebrow: { welcome: "BEM-VINDO AO MONEYPILOT", recoverAccess: "RECUPERAR ACESSO", verifyEmail: "VERIFIQUE SEU E-MAIL", newPassword: "CRIAR NOVA SENHA" },
      title: { signup: "Crie sua conta", login: "Entrar", forgotPassword: "Esqueci minha senha", verifyEmail: "Verifique seu e-mail", resetPassword: "Criar uma nova senha" },
      description: { signup: "Comece a organizar suas finanças com uma conta segura e pessoal.", login: "Acesse sua conta e acompanhe suas finanças com segurança.", forgotPassword: "Informe o e-mail da sua conta que enviaremos um link para você redefinir sua senha.", verifyEmail: "Enviamos um link de recuperação para", resetPassword: "Escolha uma nova senha forte e segura para sua conta." },
      firstName: "Nome", firstNamePlaceholder: "Digite seu nome", lastName: "Sobrenome", lastNamePlaceholder: "Digite seu sobrenome", email: "E-mail", emailPlaceholder: "voce@exemplo.com", password: "Senha", passwordPlaceholder: "Digite sua senha", newPassword: "Nova senha", newPasswordPlaceholder: "Digite sua nova senha", confirmPassword: "Confirmar nova senha",
      strength: { weak: "Fraca", medium: "Média", strong: "Forte" },
      createAccount: "Criar conta", login: "Entrar", forgotPassword: "Esqueci minha senha", resetPassword: "Redefinir senha", resend: "Enviar novamente", sendRecoveryLink: "Enviar link de recuperação", or: "ou", google: "Entrar com Google", comingSoon: "EM BREVE", backToLogin: "Voltar para o Login", noAccount: "Ainda não tem uma conta?", alreadyHaveAccount: "Já tem uma conta?", linkValidPrefix: "O link é", linkValidDuration: "válido por 1 hora.", checkSpam: "Verifique também sua caixa de spam.",
    },
  },

  es: {
    ...appTranslations.es,
    ...supplementalTranslations.es,
    ...goalTranslations.es,
    common: {
      selectLanguage: "Seleccionar idioma",
      showPassword: "Mostrar contraseña",
      hidePassword: "Ocultar contraseña",
    },
    landing: {
      hero: {
        titleLine1: "Entiende tu dinero.",
        titleLine2: "Planifica tus objetivos.",
        titleLine3: "Toma mejores decisiones.",
        description:
          "Organiza gastos, controla presupuestos, recibe información financiera y avanza hacia tus objetivos financieros.",
        createAccount: "Crear cuenta",
        login: "Iniciar sesión",
        alreadyHaveAccount: "¿Ya tienes una cuenta?",
      },

      benefits: [
        {
          title: "Control de gastos",
          description: "Descubre en qué estás gastando tu dinero.",
        },
        {
          title: "Objetivos financieros",
          description: "Define objetivos y sigue tu progreso.",
        },
        {
          title: "Insights financieros",
          description: "Recibe análisis inteligentes y recomendaciones.",
        },
      ],

      security:
        "Tus datos se tratan con seguridad y privacidad.",

      dashboard: {
        visualAlt: "Vista previa de MoneyPilot",
        incomeChartLabel: "Gráfico de ingresos",
        expenseTotalLabel: "Gastos totales",
        goalProgressLabel: "Progreso de la meta",
        overview: "Resumen",
        daily: "Diario",

        income: "Ingresos",
        expenses: "Gastos",
        netBalance: "Saldo neto",

        goal: "Meta: Viajar",
        deadline: "Plazo: 15 Nov 2027",

        spendingTag: "GASTOS",
        spendingByCategory: "Gastos por categoría",

        categories: {
          housing: "Vivienda",
          food: "Alimentación",
          transport: "Transporte",
          leisure: "Ocio",
          health: "Salud",
        },

        months: [
          "ENE",
          "FEB",
          "MAR",
          "ABR",
          "MAY",
          "JUN",
          "JUL",
          "AGO",
          "SEP",
          "OCT",
          "NOV",
          "DIC",
        ],
      },

      finalCta: {
        title:
          "Empieza hoy a cuidar mejor tu futuro financiero.",
        description:
          "Organiza gastos, controla tus metas y avanza con mayor claridad y seguridad con MoneyPilot.",
        createAccount: "Crear cuenta gratis",
        alreadyHaveAccount: "¿Ya tienes una cuenta?",
        login: "Iniciar sesión",
      },
    },
    auth: {
      hero: {
        signup: { titleLines: ["La casa de tus sueños", "empieza con planificación."], description: "Organiza tu dinero, sigue tus metas y construye paso a paso el camino hacia tu nuevo hogar." },
        login: { titleLines: ["Tu próximo coche", "empieza con un plan."], description: "Define cuánto necesitas ahorrar y sigue tu progreso hasta alcanzar la cantidad ideal para tu compra." },
        forgotPassword: { titleLines: ["El gran día merece", "una gran planificación."], description: "Organiza tu meta para la ceremonia, la celebración y la luna de miel sin perder el control de tus finanzas." },
        verifyEmail: { titleLines: ["Un nuevo amor también merece", "una buena planificación."], description: "Organiza tus finanzas para la llegada del bebé y prepárate con más tranquilidad para cada momento de esta nueva etapa." },
        resetPassword: { titleLines: ["Invierte hoy en el futuro", "que deseas."], description: "Crea una meta para la universidad, cursos o certificaciones y sigue tu progreso hasta alcanzar tus objetivos." },
      },
      security: { title: "La seguridad es lo primero", description: "Tus datos están protegidos con cifrado y nunca compartimos tu información con terceros.", privacy: ["Privacidad", "protegida"], encryption: ["Cifrado", "de extremo a extremo"], control: ["Tú tienes", "el control"], connection: ["Conexión", "segura"] },
      eyebrow: { welcome: "TE DAMOS LA BIENVENIDA A MONEYPILOT", recoverAccess: "RECUPERAR ACCESO", verifyEmail: "REVISA TU CORREO ELECTRÓNICO", newPassword: "CREAR NUEVA CONTRASEÑA" },
      title: { signup: "Crea tu cuenta", login: "Iniciar sesión", forgotPassword: "Olvidé mi contraseña", verifyEmail: "Revisa tu correo electrónico", resetPassword: "Crear una nueva contraseña" },
      description: { signup: "Empieza a organizar tus finanzas con una cuenta segura y personal.", login: "Accede a tu cuenta y controla tus finanzas de forma segura.", forgotPassword: "Introduce el correo electrónico de tu cuenta y te enviaremos un enlace para restablecer tu contraseña.", verifyEmail: "Enviamos un enlace de recuperación a", resetPassword: "Elige una contraseña nueva, segura y resistente para tu cuenta." },
      firstName: "Nombre", firstNamePlaceholder: "Introduce tu nombre", lastName: "Apellido", lastNamePlaceholder: "Introduce tu apellido", email: "Correo electrónico", emailPlaceholder: "tu@ejemplo.com", password: "Contraseña", passwordPlaceholder: "Introduce tu contraseña", newPassword: "Nueva contraseña", newPasswordPlaceholder: "Introduce tu nueva contraseña", confirmPassword: "Confirmar nueva contraseña",
      strength: { weak: "Débil", medium: "Media", strong: "Fuerte" },
      createAccount: "Crear cuenta", login: "Iniciar sesión", forgotPassword: "Olvidé mi contraseña", resetPassword: "Restablecer contraseña", resend: "Enviar de nuevo", sendRecoveryLink: "Enviar enlace de recuperación", or: "o", google: "Continuar con Google", comingSoon: "PRÓXIMAMENTE", backToLogin: "Volver al inicio de sesión", noAccount: "¿Aún no tienes una cuenta?", alreadyHaveAccount: "¿Ya tienes una cuenta?", linkValidPrefix: "El enlace es", linkValidDuration: "válido durante 1 hora.", checkSpam: "Revisa también tu carpeta de spam.",
    },
  },
} as const;

export const translations = {
  ...baseTranslations,
  de: { ...baseTranslations.en, ...appTranslations.de, ...supplementalTranslations.de, ...goalTranslations.de, common: { selectLanguage: "Sprache auswählen", showPassword: "Passwort anzeigen", hidePassword: "Passwort ausblenden" }, landing: { ...baseTranslations.en.landing, hero: { titleLine1: "Verstehe dein Geld.", titleLine2: "Plane deine Ziele.", titleLine3: "Triff bessere Entscheidungen.", description: "Organisiere Ausgaben, behalte Budgets im Blick, erhalte finanzielle Einblicke und komm deinen finanziellen Zielen näher.", createAccount: "Konto erstellen", login: "Anmelden", alreadyHaveAccount: "Du hast bereits ein Konto?" }, benefits: [{ title: "Ausgabenkontrolle", description: "Sieh, wohin dein Geld fließt." }, { title: "Finanzielle Ziele", description: "Lege Ziele fest und verfolge deinen Fortschritt." }, { title: "Finanzielle Einblicke", description: "Erhalte intelligente Analysen und Empfehlungen." }], security: "Deine Daten werden sicher und vertraulich behandelt.", finalCta: { title: "Kümmere dich noch heute besser um deine finanzielle Zukunft.", description: "Organisiere Ausgaben, verfolge Ziele und gehe mit MoneyPilot klarer und sicherer voran.", createAccount: "Kostenloses Konto erstellen", alreadyHaveAccount: "Du hast bereits ein Konto?", login: "Anmelden" } }, auth: { ...baseTranslations.en.auth, hero: { signup: { titleLines: ["Dein Traumhaus", "beginnt mit guter Planung."], description: "Organisiere dein Geld, verfolge deine Ziele und plane Schritt für Schritt dein neues Zuhause." }, login: { titleLines: ["Dein nächstes Auto", "beginnt mit einem Plan."], description: "Lege deinen Sparbetrag fest und verfolge deinen Fortschritt bis zum Kauf." }, forgotPassword: { titleLines: ["Der große Tag verdient", "eine gute Planung."], description: "Plane Zeremonie, Feier und Flitterwochen, ohne deine Finanzen aus den Augen zu verlieren." }, verifyEmail: { titleLines: ["Ein neues Leben verdient", "ebenfalls gute Planung."], description: "Organisiere deine Finanzen für die Ankunft des Babys und bereite dich in Ruhe vor." }, resetPassword: { titleLines: ["Investiere heute in die Zukunft,", "die du dir wünschst."], description: "Erstelle ein Ziel für Studium, Kurse oder Zertifikate und verfolge deinen Fortschritt." } }, security: { title: "Sicherheit zuerst", description: "Deine Daten sind verschlüsselt; wir geben deine Informationen niemals an Dritte weiter.", privacy: ["Privatsphäre", "geschützt"], encryption: ["Ende-zu-Ende", "verschlüsselt"], control: ["Du behältst die", "Kontrolle"], connection: ["Sichere", "Verbindung"] }, eyebrow: { welcome: "WILLKOMMEN BEI MONEYPILOT", recoverAccess: "ZUGANG WIEDERHERSTELLEN", verifyEmail: "E-MAIL PRÜFEN", newPassword: "NEUES PASSWORT ERSTELLEN" }, title: { signup: "Konto erstellen", login: "Anmelden", forgotPassword: "Passwort vergessen", verifyEmail: "E-Mail prüfen", resetPassword: "Neues Passwort erstellen" }, description: { signup: "Organisiere deine Finanzen mit einem sicheren, persönlichen Konto.", login: "Greife sicher auf dein Konto und deine Finanzen zu.", forgotPassword: "Gib deine E-Mail-Adresse ein; wir senden dir einen Link zum Zurücksetzen.", verifyEmail: "Wir haben einen Wiederherstellungslink gesendet an", resetPassword: "Wähle ein starkes, sicheres neues Passwort." }, firstName: "Vorname", firstNamePlaceholder: "Vornamen eingeben", lastName: "Nachname", lastNamePlaceholder: "Nachnamen eingeben", email: "E-Mail", password: "Passwort", passwordPlaceholder: "Passwort eingeben", newPassword: "Neues Passwort", newPasswordPlaceholder: "Neues Passwort eingeben", confirmPassword: "Neues Passwort bestätigen", strength: { weak: "Schwach", medium: "Mittel", strong: "Stark" }, createAccount: "Konto erstellen", login: "Anmelden", forgotPassword: "Passwort vergessen", resetPassword: "Passwort zurücksetzen", resend: "Erneut senden", sendRecoveryLink: "Wiederherstellungslink senden", or: "oder", google: "Mit Google fortfahren", comingSoon: "DEMNÄCHST", backToLogin: "Zurück zur Anmeldung", noAccount: "Noch kein Konto?", alreadyHaveAccount: "Du hast bereits ein Konto?", linkValidPrefix: "Der Link ist", linkValidDuration: "1 Stunde gültig.", checkSpam: "Prüfe auch deinen Spam-Ordner." } },
  fr: { ...baseTranslations.en, ...appTranslations.fr, ...supplementalTranslations.fr, ...goalTranslations.fr, common: { selectLanguage: "Choisir la langue", showPassword: "Afficher le mot de passe", hidePassword: "Masquer le mot de passe" }, landing: { ...baseTranslations.en.landing, hero: { titleLine1: "Comprenez votre argent.", titleLine2: "Planifiez vos objectifs.", titleLine3: "Prenez de meilleures décisions.", description: "Organisez vos dépenses, suivez vos budgets, recevez des analyses financières et rapprochez-vous de vos objectifs financiers.", createAccount: "Créer un compte", login: "Se connecter", alreadyHaveAccount: "Vous avez déjà un compte ?" }, benefits: [{ title: "Maîtrise des dépenses", description: "Voyez où va votre argent." }, { title: "Objectifs financiers", description: "Définissez vos objectifs et suivez vos progrès." }, { title: "Analyses financières", description: "Recevez des analyses et recommandations intelligentes." }], security: "Vos données sont traitées avec sécurité et confidentialité.", finalCta: { title: "Prenez soin de votre avenir financier dès aujourd’hui.", description: "Organisez vos dépenses, suivez vos objectifs et avancez avec plus de clarté grâce à MoneyPilot.", createAccount: "Créer un compte gratuit", alreadyHaveAccount: "Vous avez déjà un compte ?", login: "Se connecter" } }, auth: { ...baseTranslations.en.auth, hero: { signup: { titleLines: ["La maison de vos rêves", "commence par un plan."], description: "Organisez votre argent, suivez vos objectifs et construisez pas à pas votre futur foyer." }, login: { titleLines: ["Votre prochaine voiture", "commence par un plan."], description: "Définissez votre épargne et suivez vos progrès jusqu’au montant nécessaire." }, forgotPassword: { titleLines: ["Le grand jour mérite", "une grande préparation."], description: "Planifiez cérémonie, fête et lune de miel sans perdre le contrôle de vos finances." }, verifyEmail: { titleLines: ["Une nouvelle vie mérite aussi", "une bonne préparation."], description: "Organisez vos finances pour l’arrivée du bébé et préparez sereinement ce nouveau chapitre." }, resetPassword: { titleLines: ["Investissez aujourd’hui dans l’avenir", "que vous souhaitez."], description: "Créez un objectif pour vos études, cours ou certifications et suivez vos progrès." } }, security: { title: "La sécurité avant tout", description: "Vos données sont chiffrées et nous ne partageons jamais vos informations avec des tiers.", privacy: ["Confidentialité", "protégée"], encryption: ["Chiffrement", "de bout en bout"], control: ["Vous gardez le", "contrôle"], connection: ["Connexion", "sécurisée"] }, eyebrow: { welcome: "BIENVENUE SUR MONEYPILOT", recoverAccess: "RÉCUPÉRER L’ACCÈS", verifyEmail: "VÉRIFIEZ VOTRE E-MAIL", newPassword: "CRÉER UN MOT DE PASSE" }, title: { signup: "Créer votre compte", login: "Se connecter", forgotPassword: "Mot de passe oublié", verifyEmail: "Vérifiez votre e-mail", resetPassword: "Créer un mot de passe" }, description: { signup: "Commencez à organiser vos finances avec un compte personnel sécurisé.", login: "Accédez à votre compte et suivez vos finances en toute sécurité.", forgotPassword: "Saisissez votre adresse e-mail et nous vous enverrons un lien de réinitialisation.", verifyEmail: "Nous avons envoyé un lien de récupération à", resetPassword: "Choisissez un nouveau mot de passe fort et sécurisé." }, firstName: "Prénom", firstNamePlaceholder: "Saisissez votre prénom", lastName: "Nom", lastNamePlaceholder: "Saisissez votre nom", email: "E-mail", password: "Mot de passe", passwordPlaceholder: "Saisissez votre mot de passe", newPassword: "Nouveau mot de passe", newPasswordPlaceholder: "Saisissez votre nouveau mot de passe", confirmPassword: "Confirmer le mot de passe", strength: { weak: "Faible", medium: "Moyen", strong: "Fort" }, createAccount: "Créer un compte", login: "Se connecter", forgotPassword: "Mot de passe oublié", resetPassword: "Réinitialiser", resend: "Renvoyer", sendRecoveryLink: "Envoyer le lien", or: "ou", google: "Continuer avec Google", comingSoon: "BIENTÔT DISPONIBLE", backToLogin: "Retour à la connexion", noAccount: "Vous n’avez pas encore de compte ?", alreadyHaveAccount: "Vous avez déjà un compte ?", linkValidPrefix: "Le lien est", linkValidDuration: "valable pendant 1 heure.", checkSpam: "Vérifiez également vos courriers indésirables." } },
  nl: { ...baseTranslations.en, ...appTranslations.nl, ...supplementalTranslations.nl, ...goalTranslations.nl, common: { selectLanguage: "Taal kiezen", showPassword: "Wachtwoord tonen", hidePassword: "Wachtwoord verbergen" }, landing: { ...baseTranslations.en.landing, hero: { titleLine1: "Begrijp je geld.", titleLine2: "Plan je doelen.", titleLine3: "Neem betere beslissingen.", description: "Organiseer uitgaven, volg budgetten, ontvang financiële inzichten en kom dichter bij je financiële doelen.", createAccount: "Account maken", login: "Inloggen", alreadyHaveAccount: "Heb je al een account?" }, benefits: [{ title: "Uitgaven beheren", description: "Zie waar je geld naartoe gaat." }, { title: "Financiële doelen", description: "Stel doelen en volg je voortgang." }, { title: "Financiële inzichten", description: "Ontvang slimme analyses en aanbevelingen." }], security: "Je gegevens worden veilig en vertrouwelijk behandeld.", finalCta: { title: "Zorg vandaag beter voor je financiële toekomst.", description: "Organiseer uitgaven, volg doelen en ga met MoneyPilot duidelijker en zekerder vooruit.", createAccount: "Gratis account maken", alreadyHaveAccount: "Heb je al een account?", login: "Inloggen" } }, auth: { ...baseTranslations.en.auth, hero: { signup: { titleLines: ["Je droomhuis", "begint met een plan."], description: "Organiseer je geld, volg je doelen en bouw stap voor stap aan je nieuwe thuis." }, login: { titleLines: ["Je volgende auto", "begint met een plan."], description: "Bepaal hoeveel je wilt sparen en volg je voortgang tot je aankoop." }, forgotPassword: { titleLines: ["De grote dag verdient", "een goede planning."], description: "Plan ceremonie, feest en huwelijksreis zonder de grip op je financiën te verliezen." }, verifyEmail: { titleLines: ["Nieuw leven verdient ook", "een goede planning."], description: "Organiseer je financiën voor de komst van de baby en bereid je rustig voor." }, resetPassword: { titleLines: ["Investeer vandaag in de toekomst", "die je wilt."], description: "Maak een doel voor studie, cursussen of certificaten en volg je voortgang." } }, security: { title: "Veiligheid voorop", description: "Je gegevens zijn versleuteld en we delen je informatie nooit met derden.", privacy: ["Privacy", "beschermd"], encryption: ["End-to-end", "versleuteling"], control: ["Jij houdt de", "controle"], connection: ["Veilige", "verbinding"] }, eyebrow: { welcome: "WELKOM BIJ MONEYPILOT", recoverAccess: "TOEGANG HERSTELLEN", verifyEmail: "CONTROLEER JE E-MAIL", newPassword: "NIEUW WACHTWOORD MAKEN" }, title: { signup: "Account maken", login: "Inloggen", forgotPassword: "Wachtwoord vergeten", verifyEmail: "Controleer je e-mail", resetPassword: "Nieuw wachtwoord maken" }, description: { signup: "Organiseer je financiën met een veilig, persoonlijk account.", login: "Open je account en volg je financiën veilig.", forgotPassword: "Voer je e-mailadres in; we sturen je een link om je wachtwoord opnieuw in te stellen.", verifyEmail: "We hebben een herstellink gestuurd naar", resetPassword: "Kies een sterk en veilig nieuw wachtwoord." }, firstName: "Voornaam", firstNamePlaceholder: "Voer je voornaam in", lastName: "Achternaam", lastNamePlaceholder: "Voer je achternaam in", email: "E-mail", password: "Wachtwoord", passwordPlaceholder: "Voer je wachtwoord in", newPassword: "Nieuw wachtwoord", newPasswordPlaceholder: "Voer je nieuwe wachtwoord in", confirmPassword: "Bevestig nieuw wachtwoord", strength: { weak: "Zwak", medium: "Gemiddeld", strong: "Sterk" }, createAccount: "Account maken", login: "Inloggen", forgotPassword: "Wachtwoord vergeten", resetPassword: "Wachtwoord herstellen", resend: "Opnieuw sturen", sendRecoveryLink: "Herstellink sturen", or: "of", google: "Doorgaan met Google", comingSoon: "BINNENKORT", backToLogin: "Terug naar inloggen", noAccount: "Nog geen account?", alreadyHaveAccount: "Heb je al een account?", linkValidPrefix: "De link is", linkValidDuration: "1 uur geldig.", checkSpam: "Controleer ook je spammap." } },
  it: { ...baseTranslations.en, ...appTranslations.it, ...supplementalTranslations.it, ...goalTranslations.it, common: { selectLanguage: "Seleziona lingua", showPassword: "Mostra password", hidePassword: "Nascondi password" }, landing: { ...baseTranslations.en.landing, hero: { titleLine1: "Comprendi il tuo denaro.", titleLine2: "Pianifica i tuoi obiettivi.", titleLine3: "Prendi decisioni migliori.", description: "Organizza le spese, controlla i budget, ricevi analisi finanziarie e avvicinati ai tuoi obiettivi finanziari.", createAccount: "Crea account", login: "Accedi", alreadyHaveAccount: "Hai già un account?" }, benefits: [{ title: "Controllo delle spese", description: "Scopri dove va il tuo denaro." }, { title: "Obiettivi finanziari", description: "Imposta obiettivi e segui i progressi." }, { title: "Analisi finanziarie", description: "Ricevi analisi e consigli intelligenti." }], security: "I tuoi dati sono gestiti in modo sicuro e riservato.", finalCta: { title: "Inizia oggi a prenderti cura del tuo futuro finanziario.", description: "Organizza le spese, segui gli obiettivi e procedi con più chiarezza grazie a MoneyPilot.", createAccount: "Crea account gratuito", alreadyHaveAccount: "Hai già un account?", login: "Accedi" } }, auth: { ...baseTranslations.en.auth, hero: { signup: { titleLines: ["La casa dei tuoi sogni", "inizia con un piano."], description: "Organizza il denaro, segui gli obiettivi e costruisci passo dopo passo la tua nuova casa." }, login: { titleLines: ["La tua prossima auto", "inizia con un piano."], description: "Definisci quanto risparmiare e segui i progressi fino all’acquisto." }, forgotPassword: { titleLines: ["Il grande giorno merita", "una grande pianificazione."], description: "Pianifica cerimonia, festa e luna di miele senza perdere il controllo delle finanze." }, verifyEmail: { titleLines: ["Una nuova vita merita", "una buona pianificazione."], description: "Organizza le finanze per l’arrivo del bambino e preparati con serenità." }, resetPassword: { titleLines: ["Investi oggi nel futuro", "che desideri."], description: "Crea un obiettivo per università, corsi o certificazioni e segui i progressi." } }, security: { title: "La sicurezza prima di tutto", description: "I tuoi dati sono crittografati e non condividiamo mai le tue informazioni con terzi.", privacy: ["Privacy", "protetta"], encryption: ["Crittografia", "end-to-end"], control: ["Hai tu il", "controllo"], connection: ["Connessione", "sicura"] }, eyebrow: { welcome: "BENVENUTO IN MONEYPILOT", recoverAccess: "RECUPERA ACCESSO", verifyEmail: "CONTROLLA L’E-MAIL", newPassword: "CREA NUOVA PASSWORD" }, title: { signup: "Crea il tuo account", login: "Accedi", forgotPassword: "Password dimenticata", verifyEmail: "Controlla l’e-mail", resetPassword: "Crea una nuova password" }, description: { signup: "Inizia a organizzare le finanze con un account personale e sicuro.", login: "Accedi al tuo account e controlla le finanze in sicurezza.", forgotPassword: "Inserisci l’indirizzo e-mail e ti invieremo un link per reimpostare la password.", verifyEmail: "Abbiamo inviato un link di recupero a", resetPassword: "Scegli una nuova password forte e sicura." }, firstName: "Nome", firstNamePlaceholder: "Inserisci il tuo nome", lastName: "Cognome", lastNamePlaceholder: "Inserisci il tuo cognome", email: "E-mail", password: "Password", passwordPlaceholder: "Inserisci la password", newPassword: "Nuova password", newPasswordPlaceholder: "Inserisci la nuova password", confirmPassword: "Conferma nuova password", strength: { weak: "Debole", medium: "Media", strong: "Forte" }, createAccount: "Crea account", login: "Accedi", forgotPassword: "Password dimenticata", resetPassword: "Reimposta password", resend: "Invia di nuovo", sendRecoveryLink: "Invia link di recupero", or: "o", google: "Continua con Google", comingSoon: "PROSSIMAMENTE", backToLogin: "Torna all’accesso", noAccount: "Non hai ancora un account?", alreadyHaveAccount: "Hai già un account?", linkValidPrefix: "Il link è", linkValidDuration: "valido per 1 ora.", checkSpam: "Controlla anche la cartella spam." } },
} as const;

export type TranslationLanguage = keyof typeof translations;
