import { Banknote, Globe2, Palette, CalendarDays } from 'lucide-react';
import { currencyLabel, supportedCurrencies, supportedLanguages, isCurrencyCode, isLanguage, type CurrencyCode, type Language } from '@/i18n/config';
import type { Theme } from '@/components/ThemeProvider';
import type { SettingsCopy } from '@/i18n/settings-copy';

type Props = { copy: SettingsCopy; language: Language; currency: CurrencyCode | ''; selectedLanguage: Language; theme: Theme; currencyDisabled: boolean; financialDataExists: boolean; isSaving: boolean; onCurrencyChange: (value: CurrencyCode) => void; onLanguageChange: (value: Language) => void; onThemeChange: (value: Theme) => void };
export function SettingsPreferences({ copy, language, currency, selectedLanguage, theme, currencyDisabled, financialDataExists, isSaving, onCurrencyChange, onLanguageChange, onThemeChange }: Props) {
  return <section className="settings-card" aria-labelledby="settings-preferences-title">
    <h2 id="settings-preferences-title">{copy.generalPreferences}</h2>
    <div className="settings-preference-row"><Banknote aria-hidden="true" size={19} /><div><label htmlFor="settings-currency">{copy.currency}</label><p id="settings-currency-hint">{financialDataExists ? copy.currencyBlocked : copy.currencyDetail}</p></div><select id="settings-currency" value={currency} disabled={currencyDisabled} aria-describedby="settings-currency-hint" onChange={event => { if (isCurrencyCode(event.target.value)) onCurrencyChange(event.target.value); }}><option value="" disabled>—</option>{supportedCurrencies.map(item => <option value={item.code} key={item.code}>{currencyLabel(item.code, language)}</option>)}</select></div>
    <div className="settings-preference-row"><Globe2 aria-hidden="true" size={19} /><div><label htmlFor="settings-language">{copy.language}</label><p>{copy.languageDetail}</p></div><select id="settings-language" value={selectedLanguage} disabled={isSaving} onChange={event => { if (isLanguage(event.target.value)) onLanguageChange(event.target.value); }}>{supportedLanguages.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}</select></div>
    <div className="settings-preference-row"><Palette aria-hidden="true" size={19} /><div><label htmlFor="settings-theme">{copy.theme}</label><p>{copy.themeImmediate}</p></div><select id="settings-theme" value={theme} onChange={event => { if (event.target.value === 'light' || event.target.value === 'dark') onThemeChange(event.target.value); }}><option value="light">{copy.light}</option><option value="dark">{copy.dark}</option></select></div>
    <div className="settings-preference-row"><CalendarDays aria-hidden="true" size={19} /><div><label htmlFor="settings-cycle">{copy.financialCycleDay}</label><p id="settings-cycle-hint">{copy.cycleDetail}</p></div><input id="settings-cycle" type="text" value="—" disabled aria-describedby="settings-cycle-hint" /></div>
  </section>;
}
