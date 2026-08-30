"use client";

import {
  getSettingsAccount,
  updateDisplayName,
  updateProfilePreferences,
} from "./actions";
import {
  type Language,
  useLanguage,
} from "@/components/LanguageProvider";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DesktopScaleCanvas } from "@/components/DesktopScaleCanvas";
import { translations } from "@/i18n/translations";
import { useTheme } from "@/components/ThemeProvider";
import { useFinanceData } from "@/components/FinanceDataProvider";
import { currencyLabel, isCurrencyCode, supportedCurrencies, supportedLanguages, type CurrencyCode } from "@/i18n/config";
import { useCurrency } from "@/components/CurrencyProvider";

const iconRoot = "/moneypilot/settings/icons";
const card = "overflow-hidden rounded-[18px] border border-[#28313B] bg-[rgba(8,11,15,0.22)] shadow-[0_8px_18px_rgba(0,0,0,0.24)]";

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  if (name === "ai-insights") return <Image src="/moneypilot/investments/icons/sparkles-outline.svg" alt="" width={size} height={size} className="shrink-0" />;
  return <Image src={`${iconRoot}/${name}.svg`} alt="" width={size} height={size} className="shrink-0" />;
}

function Toggle({ checked, label }: { checked: boolean; label: string }) {
  return <button type="button" role="switch" aria-label={label} aria-checked={checked} disabled className={`relative h-[18px] w-[34px] shrink-0 cursor-not-allowed rounded-full opacity-60 ${checked ? "bg-[#22C55E]" : "bg-[#28313B]"}`}><span className={`absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white ${checked ? "left-[18px]" : "left-[2px]"}`} /></button>;
}

type Preferences = { currency: CurrencyCode | ""; language: Language | ""; theme: string; financialCycleDay: string };
const initialPreferences: Preferences = {
  currency: "",
  language: "",
  theme: "",
  financialCycleDay: "—",
};
const initialNotifications = [false, false, false, false, false];

export default function SettingsPage() {
  const { language, setLanguage } = useLanguage();
  const { setConfirmedCurrency } = useCurrency();
  const { theme, setTheme } = useTheme();
  const { transactions, budgets, budgetAdjustments, goals, goalContributionPlans, isHydrating } = useFinanceData();
  const t = translations[language].appSettings;
  const neutral = ({
    en: { unavailable: "Unavailable", notSaved: "No saved preference yet.", notifications: "Notification preferences are not available yet.", export: "Data export is not available yet.", bank: "Bank synchronization is not available yet.", password: "Password changes are not available here yet.", sessions: "Session details are not available yet.", action: "Coming soon" },
    pt: { unavailable: "Indisponível", notSaved: "Ainda não há uma preferência salva.", notifications: "As preferências de notificação ainda não estão disponíveis.", export: "A exportação de dados ainda não está disponível.", bank: "A sincronização bancária ainda não está disponível.", password: "A alteração de senha ainda não está disponível aqui.", sessions: "Os detalhes das sessões ainda não estão disponíveis.", action: "Em breve" },
    es: { unavailable: "No disponible", notSaved: "Aún no hay una preferencia guardada.", notifications: "Las preferencias de notificación aún no están disponibles.", export: "La exportación de datos aún no está disponible.", bank: "La sincronización bancaria aún no está disponible.", password: "El cambio de contraseña aún no está disponible aquí.", sessions: "Los detalles de las sesiones aún no están disponibles.", action: "Próximamente" },
    de: { unavailable: "Nicht verfügbar", notSaved: "Noch keine Einstellung gespeichert.", notifications: "Benachrichtigungseinstellungen sind noch nicht verfügbar.", export: "Der Datenexport ist noch nicht verfügbar.", bank: "Die Banksynchronisierung ist noch nicht verfügbar.", password: "Das Passwort kann hier noch nicht geändert werden.", sessions: "Sitzungsdetails sind noch nicht verfügbar.", action: "Demnächst" },
    fr: { unavailable: "Indisponible", notSaved: "Aucune préférence enregistrée pour le moment.", notifications: "Les préférences de notification ne sont pas encore disponibles.", export: "L’exportation des données n’est pas encore disponible.", bank: "La synchronisation bancaire n’est pas encore disponible.", password: "Le mot de passe ne peut pas encore être modifié ici.", sessions: "Les détails des sessions ne sont pas encore disponibles.", action: "Bientôt disponible" },
    nl: { unavailable: "Niet beschikbaar", notSaved: "Nog geen voorkeur opgeslagen.", notifications: "Meldingsvoorkeuren zijn nog niet beschikbaar.", export: "Gegevensexport is nog niet beschikbaar.", bank: "Banksynchronisatie is nog niet beschikbaar.", password: "Het wachtwoord kan hier nog niet worden gewijzigd.", sessions: "Sessiedetails zijn nog niet beschikbaar.", action: "Binnenkort" },
    it: { unavailable: "Non disponibile", notSaved: "Nessuna preferenza salvata.", notifications: "Le preferenze di notifica non sono ancora disponibili.", export: "L’esportazione dei dati non è ancora disponibile.", bank: "La sincronizzazione bancaria non è ancora disponibile.", password: "La password non può ancora essere modificata qui.", sessions: "I dettagli delle sessioni non sono ancora disponibili.", action: "Prossimamente" },
  } satisfies Record<Language, { unavailable: string; notSaved: string; notifications: string; export: string; bank: string; password: string; sessions: string; action: string }>)[language];
  const [preferencesState, setPreferencesState] = useState(initialPreferences);
  const notifications = initialNotifications;
  const [savedPreferences, setSavedPreferences] = useState(initialPreferences);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [currencyWarning, setCurrencyWarning] = useState(false);
  const [accountEmail, setAccountEmail] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const accountInitial = (displayName || accountEmail).trim().charAt(0).toUpperCase() || "M";
  const hasFinancialData = isHydrating || transactions.length > 0 || budgets.length > 0 || goals.length > 0 || Object.keys(budgetAdjustments).length > 0 || Object.keys(goalContributionPlans).length > 0;
  const currencyBlockedCopy: Record<Language, string> = { en: "Changing currency for existing financial data is not supported yet. Currency conversion will be added later.", pt: "Ainda não é possível alterar a moeda quando existem dados financeiros. A conversão será adicionada futuramente.", es: "Aún no se puede cambiar la moneda cuando existen datos financieros. La conversión se añadirá más adelante.", de: "Die Währung kann bei vorhandenen Finanzdaten noch nicht geändert werden. Eine Umrechnung folgt später.", fr: "Le changement de devise n’est pas encore disponible lorsque des données financières existent. La conversion sera ajoutée ultérieurement.", nl: "De valuta kan nog niet worden gewijzigd als er financiële gegevens bestaan. Valutaconversie volgt later.", it: "Non è ancora possibile cambiare valuta quando esistono dati finanziari. La conversione sarà aggiunta in seguito." };
  const hasChanges = preferencesState.currency !== savedPreferences.currency || preferencesState.language !== savedPreferences.language;
  const backgroundImage = "/moneypilot/dashboard-racing-bg.png";

  const preferences = [
    { key: "currency", label: t.currency, detail: t.currencyDetail, icon: "currency" },
    { key: "language", label: t.language, detail: t.languageDetail, icon: "locale" },
    { key: "theme", label: t.theme, detail: t.themeDetail, icon: "appearance" },
    { key: "financialCycleDay", label: t.financialCycleDay, detail: t.cycleDetail, icon: "cycle" },
  ] as const;
  const notificationIcons = ["transaction-capture", "budget-alerts", "goal-reminders", "ai-insights", "weekly-summary"];
  const notificationRows = t.notificationItems.map((label, index) => ({ label, icon: notificationIcons[index] }));
  const securityIcons = ["export", "bank-sync", "password", "sessions", "categories"];
  const unavailableSecurityDetails = [neutral.export, neutral.bank, neutral.password, neutral.sessions];
  const security = t.securityItems.map((label, index) => ({ label, detail: unavailableSecurityDetails[index] ?? t.securityDetails[index], action: index === 4 ? t.securityActions[index] : neutral.action, icon: securityIcons[index], href: index === 4 ? "/categories" : undefined }));

  const selectedCurrency = preferencesState.currency ? supportedCurrencies.find((item) => item.code === preferencesState.currency) : undefined;
  const metrics = [
    { label: t.currentCurrency, value: selectedCurrency?.names[language] ?? "—", valueMeta: selectedCurrency ? `${selectedCurrency.code} · ${selectedCurrency.symbol}` : undefined, detail: t.currencyDetail, icon: "cash", color: "#3B82F6", iconBackground: "rgba(59,130,246,0.14)" },
    { label: t.language, value: supportedLanguages.find((item) => item.code === preferencesState.language)?.label ?? "—", valueMeta: undefined, detail: t.languageDetail, icon: "language", color: "#22C55E", iconBackground: "rgba(34,197,94,0.14)" },
    { label: t.theme, value: theme === "dark" ? t.dark : t.light, valueMeta: undefined, detail: t.currentExperience, icon: "theme", color: "#F59E0B", iconBackground: "rgba(245,158,11,0.14)" },
    { label: t.notifications, value: neutral.unavailable, valueMeta: undefined, detail: neutral.notifications, icon: "notifications", color: "#8B5CF6", iconBackground: "rgba(139,92,246,0.14)" },
  ];
  function preferenceValue(key: keyof Preferences) {
    if (key === "theme") return theme === "dark" ? t.dark : t.light;
    if (key === "currency") return preferencesState.currency ? currencyLabel(preferencesState.currency, language) : "—";
    if (key === "language") return supportedLanguages.find((item) => item.code === preferencesState.language)?.label ?? "—";
    return preferencesState.financialCycleDay;
  }

  useEffect(() => {
  let active = true;

  getSettingsAccount()
    .then((account) => {
      if (!active) return;

      const cleanDisplayName = (account.profile.display_name ?? "").trim();
      const nameParts = cleanDisplayName.split(/\s+/).filter(Boolean);

      setAccountEmail(account.email);
      setDisplayName(cleanDisplayName);
      setFirstName(nameParts[0] ?? "");
      setLastName(nameParts.slice(1).join(" "));
      const profileLanguage = supportedLanguages.find((item) => item.code === account.profile.locale)?.code ?? "en";
      const profileCurrency = isCurrencyCode(account.profile.currency_code) ? account.profile.currency_code : "EUR";

      setPreferencesState((current) => ({
        ...current,
        language: profileLanguage,
        currency: profileCurrency,
      }));

      setSavedPreferences((current) => ({
        ...current,
        language: profileLanguage,
        currency: profileCurrency,
      }));

      setLanguage(profileLanguage);
      setConfirmedCurrency(profileCurrency);
          })
          .catch((error) => {
            console.error("Failed to load account settings:", error);
          });

        return () => {
          active = false;
        };
        }, [setConfirmedCurrency, setLanguage]);

  function cyclePreference(key: keyof Preferences) {
    if (key === "financialCycleDay") return;
    if (key === "theme") {
      setTheme(theme === "dark" ? "light" : "dark");
      return;
    }
    if (key === "currency" && hasFinancialData) {
      setCurrencyWarning(true);
      return;
    }
    setPreferencesState((current) => {
      if (key === "currency") {
        const values = supportedCurrencies.map((item) => item.code);
        return { ...current, currency: values[(values.indexOf(current.currency || "EUR") + 1) % values.length] };
      }
      const values = supportedLanguages.map((item) => item.code);
      return { ...current, language: values[(values.indexOf(current.language || "en") + 1) % values.length] };
    });
    setCurrencyWarning(false);
    setSaveError(false);
    setSavedFeedback(false);
  }

  async function saveChanges() {
  if (!hasChanges) return;

  if (!preferencesState.language || !preferencesState.currency) return;
  const locale = preferencesState.language;
  const currencyCode = preferencesState.currency;

  try {
    await updateProfilePreferences({
      locale,
      currencyCode,
    });

    setLanguage(locale);
    setConfirmedCurrency(currencyCode);

    setSavedPreferences(preferencesState);
    setSavedFeedback(true);
    setSaveError(false);
  } catch (error) {
    console.error(
      "Failed to save profile preferences:",
      error,
    );

    setPreferencesState(savedPreferences);

    if (savedPreferences.language) {
      setLanguage(savedPreferences.language);
    }

    if (savedPreferences.currency) {
      setConfirmedCurrency(savedPreferences.currency);
    }

    setSavedFeedback(false);
    setSaveError(true);
  }
}

async function saveProfileName() {
  const cleanFirstName = firstName.trim();
  const cleanLastName = lastName.trim();

  if (!cleanFirstName || !cleanLastName) {
    return;
  }

  setProfileSaving(true);
  setProfileSaved(false);

  try {
    const result = await updateDisplayName(
      `${cleanFirstName} ${cleanLastName}`,
    );

    const parts = result.displayName.split(/\s+/).filter(Boolean);

    setDisplayName(result.displayName);
    setFirstName(parts[0] ?? "");
    setLastName(parts.slice(1).join(" "));
    setProfileSaved(true);
  } catch (error) {
    console.error("Failed to save profile name:", error);
  } finally {
    setProfileSaving(false);
  }
}

  return (
    <main className="min-h-screen overflow-hidden bg-[#080B0F] font-[Inter] text-[#F5F7FA]">
      <DesktopScaleCanvas>
        <div className="relative h-[1024px] w-[1536px] overflow-hidden">
          <div className="absolute inset-0 bg-[var(--background-app)]" />
          <section className="absolute left-[231px] top-[107px] h-[810px] w-[1164px] overflow-hidden rounded-[38px] border border-[rgba(40,49,59,0.16)] bg-[rgba(13,17,23,0.50)] px-[32px] py-[16px] shadow-[0_22px_42px_rgba(0,0,0,0.45)] backdrop-blur-[20px]">
            <div className="flex h-[767.67px] w-[1098px] flex-col gap-[12px]">
              <div className="flex h-[36.75px] shrink-0 items-center gap-[18.375px]"><span className="h-[36.75px] w-[36.75px] shrink-0 overflow-hidden"><Image src="/moneypilot/moneypilot-logo.svg" alt="" width={180} height={40} priority className="h-[36.75px] w-auto max-w-none" /></span><span className="money-pilot-wordmark font-brand text-[21.44px] font-medium leading-[26.031px] tracking-[0.4288px]">MoneyPilot</span></div>
              <header className="flex h-[57.92px] shrink-0 items-center justify-between"><div className="flex h-[52px] w-[700px] flex-col justify-center gap-[4px]"><h1 className="text-[23.168px] font-semibold leading-none">{t.title}</h1><p className="text-[13.2px] text-[#9CA6B2]">{t.description}</p></div><div className="flex h-[52px] items-center gap-[16px]"><div className="relative"><button type="button" onClick={saveChanges} disabled={!hasChanges} className="flex h-[38px] w-[146px] items-center justify-center gap-[7px] rounded-[19px] bg-[#3B82F6] text-[10px] font-semibold text-white disabled:pointer-events-none">{t.save}<Image src={`${iconRoot}/save.svg`} alt="" width={18.25} height={18.25} className="size-[18.25px]" /></button>{savedFeedback && <span className="absolute -bottom-[14px] left-0 w-full text-center text-[7.5px] text-[#22C55E]">{t.saved}</span>}{saveError && <span role="alert" className="absolute -bottom-[24px] right-0 w-[300px] text-right text-[7.5px] leading-[10px] text-[#F43F5E]">{language === "pt" ? "Não foi possível salvar o idioma. A seleção anterior foi restaurada." : language === "es" ? "No se pudo guardar el idioma. Se restauró la selección anterior." : language === "de" ? "Die Sprache konnte nicht gespeichert werden. Die vorherige Auswahl wurde wiederhergestellt." : language === "fr" ? "Impossible d’enregistrer la langue. La sélection précédente a été restaurée." : language === "nl" ? "De taal kon niet worden opgeslagen. De vorige keuze is hersteld." : language === "it" ? "Impossibile salvare la lingua. È stata ripristinata la selezione precedente." : "The language could not be saved. The previous selection was restored."}</span>}</div><div aria-label={translations[language].appCommon.userAvatar} className="flex size-[52.128px] items-center justify-center rounded-full border border-[#28313B] bg-[#19212C] text-[18px] font-semibold text-[#9CA6B2]">{accountInitial}</div></div></header>
              <section aria-label={t.settingsSummary} className="flex h-[100px] shrink-0 gap-[12px]">{metrics.map((item) => <article key={item.label} className={`${card} relative h-[100px] w-[265.5px] shrink-0`}><span className="absolute left-[11px] top-[11px] flex h-[30px] w-[30px] items-center justify-center rounded-[9px] border" style={{ borderColor: item.color, backgroundColor: item.iconBackground }}><Icon name={item.icon} size={16} /></span><h2 className="absolute left-[51px] top-[16px] text-[11px] font-semibold">{item.label}</h2><div className="absolute left-[11px] top-[45px] flex h-[28px] w-[243px] flex-col justify-center overflow-hidden"><strong className="block truncate text-[15px] font-semibold leading-[16px]">{item.value}</strong>{item.valueMeta && <span className="block text-[9px] font-semibold leading-[11px] text-[#9CA6B2]">{item.valueMeta}</span>}</div><p className="absolute left-[11px] top-[78px] w-[243px] truncate text-[9px] text-[#9CA6B2]">{item.detail}</p></article>)}</section>
              <section className="flex h-[198px] shrink-0 gap-[12px]">
                <article className={`${card} h-[198px] w-[543px] shrink-0 px-[14px] py-[12px]`}><h2 className="mb-[7px] text-[14px] font-semibold">{t.generalPreferences}</h2>{preferences.map((item) => <div key={item.label} className="flex h-[36px] items-center border-b border-[#28313B]/70 last:border-0"><span className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-transparent"><Icon name={item.icon} size={15} /></span><div className="ml-[9px] flex-1"><strong className="block text-[8.8px]">{item.label}</strong><span className="block text-[7.6px] text-[#9CA6B2]">{item.key === "financialCycleDay" ? neutral.notSaved : item.key === "currency" && currencyWarning ? currencyBlockedCopy[language] : item.detail}</span></div><button type="button" disabled={item.key === "financialCycleDay"} aria-label={`${item.label}: ${preferenceValue(item.key)}`} onClick={() => cyclePreference(item.key)} className={`h-[24px] max-w-[210px] truncate rounded-[12px] border px-[10px] text-[8px] font-semibold disabled:cursor-not-allowed disabled:text-[#64707D] ${item.key === "theme" && theme === "dark" ? "border-[#3B82F6] bg-[#3B82F6] text-white" : "border-[#28313B] bg-[var(--background-control)]"}`}>{preferenceValue(item.key)}</button></div>)}</article>
                <article className={`${card} h-[198px] w-[543px] shrink-0 px-[14px] py-[12px]`}><h2 className="mb-[7px] text-[14px] font-semibold">{t.notifications}</h2>{notificationRows.map((item, index) => <div key={item.label} className="flex h-[29px] items-center border-b border-[#28313B]/70 last:border-0"><span className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] bg-transparent"><Icon name={item.icon} size={14} /></span><span className="ml-[9px] flex-1 text-[8.8px] font-semibold">{item.label}</span><Toggle label={`${t.toggle} ${item.label}`} checked={notifications[index]} /></div>)}</article>
              </section>
              <section className="flex h-[198px] shrink-0 gap-[12px]">
                <article className={`${card} relative h-[198px] w-[543px] shrink-0 px-[14px] py-[12px]`}><h2 className="flex items-center gap-[8px] text-[14px] font-semibold"><Icon name="background" size={17} />{t.backgroundPersonalization}</h2><div className="absolute left-[14px] top-[47px] h-[108px] w-[178px] rounded-[12px] border border-[#28313B] bg-cover bg-center" style={{ backgroundImage: `linear-gradient(rgba(8,11,15,.5),rgba(8,11,15,.5)),url(${backgroundImage})` }} /><div className="absolute left-[207px] top-[45px] w-[318px]"><h3 className="text-[9.2px] font-semibold">{t.currentBackground}</h3><p className="mt-[5px] text-[7.8px] leading-[12px] text-[#9CA6B2]">{neutral.notSaved}</p><div className="mt-[13px] flex gap-[8px]"><button type="button" disabled className="h-[27px] cursor-not-allowed rounded-[14px] bg-[#28313B] px-[13px] text-[8px] font-semibold text-[#64707D]">{neutral.action}</button></div><p className="mt-[9px] text-[7.4px] text-[#7F8996]">{t.imageRecommendation}</p></div><p className="absolute bottom-[10px] left-[14px] text-[7.7px] text-[#9CA6B2]">{t.backgroundScroll}</p></article>
                <article className={`${card} h-[198px] w-[543px] shrink-0 px-[14px] py-[12px]`}><div className="mb-[3px] flex items-center justify-between"><h2 className="text-[13px] font-semibold">{t.accountSecurity}</h2>
                <button
                  type="button"
                  onClick={() => {
                    setProfileSaved(false);
                    setProfileEditorOpen(true);
                  }}
                  className="text-[7.4px] font-medium text-[#64707D] transition hover:text-[#3B82F6]"
                >
                  {t.profile} · {displayName ? `${displayName} · ` : ""}
                  {accountEmail || t.loading}
                </button>
                </div>{security.map((item) => <div key={item.label} className="flex h-[29px] items-center"><Icon name={item.icon} size={14} /><div className="ml-[6px] flex-1"><strong className="block text-[8.9px] leading-none">{item.label}</strong><span className="mt-[2px] block text-[7.1px] leading-none text-[#9CA6B2]">{item.detail}</span></div>{item.href ? <Link href={item.href} className="rounded-[8px] border border-[#28313B] bg-[rgba(13,17,23,0.55)] px-[9px] py-[6px] text-[8.5px] font-semibold">{item.action}</Link> : <button type="button" disabled className="cursor-not-allowed rounded-[8px] border border-[#28313B] bg-[rgba(13,17,23,0.55)] px-[9px] py-[6px] text-[8.5px] font-semibold text-[#64707D]">{item.action}</button>}</div>)}</article>
              </section>
              <section className="flex h-[86px] shrink-0 gap-[12px]"><article className="relative h-[86px] w-[543px] shrink-0 rounded-[18px] border border-[rgba(244,63,93,0.60)] bg-[rgba(77,14,20,0.35)] px-[14px] py-[12px]"><h2 className="flex items-center gap-[8px] text-[13px] font-semibold text-[#F5F7FA]"><Icon name="delete" size={16} />{t.dangerZone}</h2><p className="mt-[9px] text-[8px] text-[#9CA6B2]">{t.dangerDescription}</p><button type="button" onClick={() => setDeleteConfirmation((value) => !value)} className="absolute right-[14px] top-[30px] h-[28px] rounded-[14px] border border-[#28313B] bg-[rgba(13,17,23,0.55)] px-[14px] text-[8px] font-semibold">{deleteConfirmation ? t.actionDisabled : t.deleteAccount}</button></article><article className={`${card} relative h-[86px] w-[543px] shrink-0 px-[14px] py-[12px]`}><h2 className="flex items-center gap-[8px] text-[13px] font-semibold"><Icon name="support" size={16} />{t.support}</h2><p className="mt-[9px] text-[8px] text-[#9CA6B2]">{t.supportDescription}</p><button type="button" className="absolute right-[14px] top-[30px] h-[28px] rounded-[14px] bg-[#3B82F6] px-[14px] text-[8px] font-semibold">{t.contactSupport}</button></article></section>
            </div>
          </section>
        </div>
            </DesktopScaleCanvas>

      {profileEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[4px]">
          <div className="w-[420px] rounded-[24px] border border-[#28313B] bg-[#0D1117] p-[24px] shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[18px] font-semibold text-[#F5F7FA]">
                  {t.profile}
                </h2>

                <p className="mt-[4px] text-[12px] text-[#9CA6B2]">
                  {accountEmail}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setProfileEditorOpen(false)}
                className="flex size-[32px] items-center justify-center rounded-full border border-[#28313B] text-[16px] text-[#9CA6B2]"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="mt-[24px] grid grid-cols-2 gap-[12px]">
              <div className="flex flex-col gap-[7px]">
                <label
                  htmlFor="settings-first-name"
                  className="text-[11px] font-medium text-[#9CA6B2]"
                >
                  {translations[language].auth.firstName}
                </label>

                <input
                  id="settings-first-name"
                  value={firstName}
                  onChange={(event) => {
                    setFirstName(event.target.value);
                    setProfileSaved(false);
                  }}
                  autoComplete="given-name"
                  className="h-[42px] rounded-[12px] border border-[#28313B] bg-[#080B0F] px-[12px] text-[13px] text-[#F5F7FA] outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div className="flex flex-col gap-[7px]">
                <label
                  htmlFor="settings-last-name"
                  className="text-[11px] font-medium text-[#9CA6B2]"
                >
                  {translations[language].auth.lastName}
                </label>

                <input
                  id="settings-last-name"
                  value={lastName}
                  onChange={(event) => {
                    setLastName(event.target.value);
                    setProfileSaved(false);
                  }}
                  autoComplete="family-name"
                  className="h-[42px] rounded-[12px] border border-[#28313B] bg-[#080B0F] px-[12px] text-[13px] text-[#F5F7FA] outline-none focus:border-[#3B82F6]"
                />
              </div>
            </div>

            <div className="mt-[24px] flex items-center justify-end gap-[12px]">
              {profileSaved && (
                <span className="text-[11px] font-medium text-[#22C55E]">
                  {t.saved}
                </span>
              )}

              <button
                type="button"
                onClick={() => setProfileEditorOpen(false)}
                className="h-[38px] rounded-[19px] border border-[#28313B] px-[18px] text-[11px] font-semibold text-[#9CA6B2]"
              >
                {translations[language].appCommon.cancel}
              </button>

              <button
                type="button"
                onClick={saveProfileName}
                disabled={
                  profileSaving ||
                  !firstName.trim() ||
                  !lastName.trim()
                }
                className="h-[38px] rounded-[19px] bg-[#3B82F6] px-[18px] text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {profileSaving ? "..." : t.save}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
