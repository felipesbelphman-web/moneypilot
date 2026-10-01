import type { Language } from './config';
import { translations } from './translations';

type SettingsPresentationCopy = {
  pending: string; saving: string; savedPreferences: string; saveError: string;
  currencyBlocked: string; themeImmediate: string; cycleDetail: string; unavailable: string;
  localOnly: string; notificationsLocal: string; notificationSummary: string;
  changeImage: string; restoreDefault: string; imageRecommendation: string;
  backgroundDescription: string; backgroundScroll: string; defaultBackground: string;
  imageTypeError: string; imageSizeError: string; imageLoadError: string;
  comingSoon: string; unavailableDescription: string; close: string; open: string;
  securityItems: [string, string, string, string, string];
  dangerDescription: string; deleteUnavailable: string; supportDescription: string;
};

const presentation: Record<Language, SettingsPresentationCopy> = {
  en: {
    pending: 'Unsaved changes', saving: 'Saving…', savedPreferences: 'Currency and language saved.', saveError: 'Could not save your preferences. Your changes are still available to retry.',
    currencyBlocked: 'Currency cannot be changed while financial data exists or is loading. Currency conversion is not available yet.', themeImmediate: 'Applied immediately and saved on this device.', cycleDetail: 'Financial cycle settings are not available yet.', unavailable: 'Unavailable',
    localOnly: 'Session only', notificationsLocal: 'Local demonstration only. These switches do not send notifications and are not included in Save changes.', notificationSummary: '{count} of 5 enabled locally',
    changeImage: 'Change image', restoreDefault: 'Restore default', imageRecommendation: 'JPEG, PNG or WebP · up to 5 MB · recommended 1920 × 1080', backgroundDescription: 'Session preview only. No upload or saved background setting.', backgroundScroll: 'When available, the background will follow the content area. This preview does not change other pages.', defaultBackground: 'Default preview',
    imageTypeError: 'Choose a JPEG, PNG or WebP image.', imageSizeError: 'Choose a non-empty image of 5 MB or less.', imageLoadError: 'This image could not be displayed. Choose another file.',
    comingSoon: 'Coming soon', unavailableDescription: '{feature} is not available yet. No action has been performed.', close: 'Got it', open: 'Open', securityItems: ['Export data', 'Bank synchronization', 'Change password', 'Connected sessions', 'Categories and classification'],
    dangerDescription: 'Account deletion is not available yet. Review the information before proceeding.', deleteUnavailable: 'Account deletion is not available. Your account and data have not been changed.', supportDescription: 'Find answers and useful shortcuts in the help center.',
  },
  pt: {
    pending: 'Alterações não salvas', saving: 'Salvando…', savedPreferences: 'Moeda e idioma salvos.', saveError: 'Não foi possível salvar as preferências. Suas alterações foram mantidas para tentar novamente.',
    currencyBlocked: 'A moeda não pode ser alterada enquanto houver dados financeiros ou carregamento em andamento. A conversão ainda não está disponível.', themeImmediate: 'Aplicado imediatamente e salvo neste dispositivo.', cycleDetail: 'A configuração do ciclo financeiro ainda não está disponível.', unavailable: 'Indisponível',
    localOnly: 'Somente nesta sessão', notificationsLocal: 'Demonstração local. Estes controles não enviam notificações e não fazem parte de Salvar alterações.', notificationSummary: '{count} de 5 ativadas localmente',
    changeImage: 'Trocar imagem', restoreDefault: 'Restaurar padrão', imageRecommendation: 'JPEG, PNG ou WebP · até 5 MB · recomendado 1920 × 1080', backgroundDescription: 'Somente prévia da sessão. Nenhuma imagem é enviada ou salva como fundo.', backgroundScroll: 'Quando disponível, o fundo acompanhará a área de conteúdo. Esta prévia não altera outras páginas.', defaultBackground: 'Prévia padrão',
    imageTypeError: 'Escolha uma imagem JPEG, PNG ou WebP.', imageSizeError: 'Escolha uma imagem não vazia de até 5 MB.', imageLoadError: 'Não foi possível exibir esta imagem. Escolha outro arquivo.',
    comingSoon: 'Em breve', unavailableDescription: '{feature} ainda não está disponível. Nenhuma ação foi realizada.', close: 'Entendi', open: 'Abrir', securityItems: ['Exportar dados', 'Sincronização bancária', 'Alterar senha', 'Sessões conectadas', 'Categorias e classificação'],
    dangerDescription: 'A exclusão de conta ainda não está disponível. Consulte as informações antes de prosseguir.', deleteUnavailable: 'A exclusão de conta não está disponível. Sua conta e seus dados não foram alterados.', supportDescription: 'Encontre respostas e atalhos úteis na central de ajuda.',
  },
  es: {
    pending: 'Cambios sin guardar', saving: 'Guardando…', savedPreferences: 'Moneda e idioma guardados.', saveError: 'No se pudieron guardar las preferencias. Los cambios se mantienen para volver a intentarlo.',
    currencyBlocked: 'No se puede cambiar la moneda mientras existan datos financieros o se estén cargando. La conversión aún no está disponible.', themeImmediate: 'Se aplica inmediatamente y se guarda en este dispositivo.', cycleDetail: 'La configuración del ciclo financiero aún no está disponible.', unavailable: 'No disponible',
    localOnly: 'Solo esta sesión', notificationsLocal: 'Demostración local. Estos controles no envían notificaciones ni forman parte de Guardar cambios.', notificationSummary: '{count} de 5 activadas localmente',
    changeImage: 'Cambiar imagen', restoreDefault: 'Restaurar predeterminado', imageRecommendation: 'JPEG, PNG o WebP · hasta 5 MB · recomendado 1920 × 1080', backgroundDescription: 'Solo vista previa de la sesión. No se sube ni se guarda ninguna imagen de fondo.', backgroundScroll: 'Cuando esté disponible, el fondo acompañará el área de contenido. Esta vista previa no cambia otras páginas.', defaultBackground: 'Vista previa predeterminada',
    imageTypeError: 'Elige una imagen JPEG, PNG o WebP.', imageSizeError: 'Elige una imagen no vacía de hasta 5 MB.', imageLoadError: 'No se pudo mostrar esta imagen. Elige otro archivo.',
    comingSoon: 'Próximamente', unavailableDescription: '{feature} aún no está disponible. No se ha realizado ninguna acción.', close: 'Entendido', open: 'Abrir', securityItems: ['Exportar datos', 'Sincronización bancaria', 'Cambiar contraseña', 'Sesiones conectadas', 'Categorías y clasificación'],
    dangerDescription: 'La eliminación de cuentas aún no está disponible. Consulta la información antes de continuar.', deleteUnavailable: 'La eliminación de cuentas no está disponible. Tu cuenta y tus datos no han cambiado.', supportDescription: 'Encuentra respuestas y accesos útiles en el centro de ayuda.',
  },
  de: {
    pending: 'Ungespeicherte Änderungen', saving: 'Wird gespeichert…', savedPreferences: 'Währung und Sprache gespeichert.', saveError: 'Die Einstellungen konnten nicht gespeichert werden. Deine Änderungen bleiben für einen erneuten Versuch erhalten.',
    currencyBlocked: 'Die Währung kann bei vorhandenen oder noch ladenden Finanzdaten nicht geändert werden. Eine Umrechnung ist noch nicht verfügbar.', themeImmediate: 'Wird sofort angewendet und auf diesem Gerät gespeichert.', cycleDetail: 'Einstellungen zum Finanzzyklus sind noch nicht verfügbar.', unavailable: 'Nicht verfügbar',
    localOnly: 'Nur diese Sitzung', notificationsLocal: 'Lokale Demonstration. Diese Schalter senden keine Benachrichtigungen und werden nicht mit Änderungen speichern gespeichert.', notificationSummary: '{count} von 5 lokal aktiviert',
    changeImage: 'Bild ändern', restoreDefault: 'Standard wiederherstellen', imageRecommendation: 'JPEG, PNG oder WebP · bis 5 MB · empfohlen 1920 × 1080', backgroundDescription: 'Nur Sitzungsvorschau. Kein Hochladen und kein gespeicherter Hintergrund.', backgroundScroll: 'Wenn verfügbar, folgt der Hintergrund dem Inhaltsbereich. Diese Vorschau ändert keine anderen Seiten.', defaultBackground: 'Standardvorschau',
    imageTypeError: 'Wähle ein JPEG-, PNG- oder WebP-Bild.', imageSizeError: 'Wähle eine nicht leere Bilddatei mit höchstens 5 MB.', imageLoadError: 'Das Bild konnte nicht angezeigt werden. Wähle eine andere Datei.',
    comingSoon: 'Demnächst', unavailableDescription: '{feature} ist noch nicht verfügbar. Es wurde keine Aktion ausgeführt.', close: 'Verstanden', open: 'Öffnen', securityItems: ['Daten exportieren', 'Banksynchronisierung', 'Passwort ändern', 'Verbundene Sitzungen', 'Kategorien und Zuordnung'],
    dangerDescription: 'Das Löschen von Konten ist noch nicht verfügbar. Lies zuerst die Informationen.', deleteUnavailable: 'Das Löschen von Konten ist nicht verfügbar. Dein Konto und deine Daten wurden nicht verändert.', supportDescription: 'Finde Antworten und nützliche Links im Hilfebereich.',
  },
  fr: {
    pending: 'Modifications non enregistrées', saving: 'Enregistrement…', savedPreferences: 'Devise et langue enregistrées.', saveError: 'Impossible d’enregistrer les préférences. Vos modifications sont conservées pour réessayer.',
    currencyBlocked: 'La devise ne peut pas être modifiée tant que des données financières existent ou sont en cours de chargement. La conversion n’est pas encore disponible.', themeImmediate: 'Appliqué immédiatement et enregistré sur cet appareil.', cycleDetail: 'Le réglage du cycle financier n’est pas encore disponible.', unavailable: 'Indisponible',
    localOnly: 'Cette session uniquement', notificationsLocal: 'Démonstration locale. Ces boutons n’envoient aucune notification et ne font pas partie de l’enregistrement des préférences.', notificationSummary: '{count} sur 5 activées localement',
    changeImage: 'Changer l’image', restoreDefault: 'Rétablir par défaut', imageRecommendation: 'JPEG, PNG ou WebP · 5 Mo maximum · recommandé 1920 × 1080', backgroundDescription: 'Aperçu de session uniquement. Aucune image envoyée ni enregistrée comme fond.', backgroundScroll: 'Lorsqu’il sera disponible, le fond suivra la zone de contenu. Cet aperçu ne modifie aucune autre page.', defaultBackground: 'Aperçu par défaut',
    imageTypeError: 'Choisissez une image JPEG, PNG ou WebP.', imageSizeError: 'Choisissez une image non vide de 5 Mo maximum.', imageLoadError: 'Impossible d’afficher cette image. Choisissez un autre fichier.',
    comingSoon: 'Bientôt disponible', unavailableDescription: '{feature} n’est pas encore disponible. Aucune action n’a été effectuée.', close: 'Compris', open: 'Ouvrir', securityItems: ['Exporter les données', 'Synchronisation bancaire', 'Changer le mot de passe', 'Sessions connectées', 'Catégories et classement'],
    dangerDescription: 'La suppression du compte n’est pas encore disponible. Consultez les informations avant de continuer.', deleteUnavailable: 'La suppression du compte n’est pas disponible. Votre compte et vos données n’ont pas été modifiés.', supportDescription: 'Trouvez des réponses et des liens utiles dans le centre d’aide.',
  },
  nl: {
    pending: 'Niet-opgeslagen wijzigingen', saving: 'Opslaan…', savedPreferences: 'Valuta en taal opgeslagen.', saveError: 'De voorkeuren konden niet worden opgeslagen. Je wijzigingen blijven bewaard om opnieuw te proberen.',
    currencyBlocked: 'De valuta kan niet worden gewijzigd als financiële gegevens bestaan of worden geladen. Omrekening is nog niet beschikbaar.', themeImmediate: 'Wordt direct toegepast en op dit apparaat opgeslagen.', cycleDetail: 'Instellingen voor de financiële cyclus zijn nog niet beschikbaar.', unavailable: 'Niet beschikbaar',
    localOnly: 'Alleen deze sessie', notificationsLocal: 'Lokale demonstratie. Deze schakelaars versturen geen meldingen en vallen niet onder Wijzigingen opslaan.', notificationSummary: '{count} van 5 lokaal ingeschakeld',
    changeImage: 'Afbeelding wijzigen', restoreDefault: 'Standaard herstellen', imageRecommendation: 'JPEG, PNG of WebP · maximaal 5 MB · aanbevolen 1920 × 1080', backgroundDescription: 'Alleen een sessievoorbeeld. Geen upload of opgeslagen achtergrond.', backgroundScroll: 'Zodra beschikbaar, volgt de achtergrond het inhoudsgebied. Dit voorbeeld verandert geen andere pagina’s.', defaultBackground: 'Standaardvoorbeeld',
    imageTypeError: 'Kies een JPEG-, PNG- of WebP-afbeelding.', imageSizeError: 'Kies een niet-lege afbeelding van maximaal 5 MB.', imageLoadError: 'Deze afbeelding kon niet worden getoond. Kies een ander bestand.',
    comingSoon: 'Binnenkort', unavailableDescription: '{feature} is nog niet beschikbaar. Er is geen actie uitgevoerd.', close: 'Begrepen', open: 'Openen', securityItems: ['Gegevens exporteren', 'Banksynchronisatie', 'Wachtwoord wijzigen', 'Verbonden sessies', 'Categorieën en classificatie'],
    dangerDescription: 'Accounts verwijderen is nog niet beschikbaar. Lees de informatie voordat je doorgaat.', deleteUnavailable: 'Accounts verwijderen is niet beschikbaar. Je account en gegevens zijn niet gewijzigd.', supportDescription: 'Vind antwoorden en handige links in het helpcentrum.',
  },
  it: {
    pending: 'Modifiche non salvate', saving: 'Salvataggio…', savedPreferences: 'Valuta e lingua salvate.', saveError: 'Impossibile salvare le preferenze. Le modifiche sono conservate per riprovare.',
    currencyBlocked: 'La valuta non può essere cambiata quando esistono dati finanziari o sono in caricamento. La conversione non è ancora disponibile.', themeImmediate: 'Applicato subito e salvato su questo dispositivo.', cycleDetail: 'Le impostazioni del ciclo finanziario non sono ancora disponibili.', unavailable: 'Non disponibile',
    localOnly: 'Solo questa sessione', notificationsLocal: 'Dimostrazione locale. Questi controlli non inviano notifiche e non fanno parte di Salva modifiche.', notificationSummary: '{count} su 5 attivate localmente',
    changeImage: 'Cambia immagine', restoreDefault: 'Ripristina predefinita', imageRecommendation: 'JPEG, PNG o WebP · massimo 5 MB · consigliato 1920 × 1080', backgroundDescription: 'Solo anteprima della sessione. Nessun caricamento o sfondo salvato.', backgroundScroll: 'Quando disponibile, lo sfondo seguirà l’area dei contenuti. Questa anteprima non modifica altre pagine.', defaultBackground: 'Anteprima predefinita',
    imageTypeError: 'Scegli un’immagine JPEG, PNG o WebP.', imageSizeError: 'Scegli un’immagine non vuota di massimo 5 MB.', imageLoadError: 'Impossibile mostrare questa immagine. Scegli un altro file.',
    comingSoon: 'Prossimamente', unavailableDescription: '{feature} non è ancora disponibile. Non è stata eseguita alcuna azione.', close: 'Ho capito', open: 'Apri', securityItems: ['Esporta dati', 'Sincronizzazione bancaria', 'Cambia password', 'Sessioni connesse', 'Categorie e classificazione'],
    dangerDescription: 'L’eliminazione dell’account non è ancora disponibile. Consulta le informazioni prima di procedere.', deleteUnavailable: 'L’eliminazione dell’account non è disponibile. Il tuo account e i tuoi dati non sono stati modificati.', supportDescription: 'Trova risposte e collegamenti utili nel centro assistenza.',
  },
};

export function getSettingsCopy(language: Language) { return { ...translations[language].appSettings, ...presentation[language] }; }
export type SettingsCopy = ReturnType<typeof getSettingsCopy>;
