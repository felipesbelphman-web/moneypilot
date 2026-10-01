import { Banknote, Bell, Globe2, Palette } from 'lucide-react';
import { supportedCurrencies, supportedLanguages, type CurrencyCode, type Language } from '@/i18n/config';
import type { Theme } from '@/components/ThemeProvider';
import type { SettingsCopy } from '@/i18n/settings-copy';

export function SettingsSummary({ copy, currency, language, selectedLanguage, theme, notificationSummary }: { copy: SettingsCopy; currency: CurrencyCode | ''; language: Language; selectedLanguage: Language; theme: Theme; notificationSummary: string }) {
  const selectedCurrency = supportedCurrencies.find(item => item.code === currency);
  const metrics = [
    { label: copy.currentCurrency, value: selectedCurrency?.names[language] ?? '—', meta: selectedCurrency ? `${selectedCurrency.code} · ${selectedCurrency.symbol}` : copy.unavailable, Icon: Banknote },
    { label: copy.language, value: supportedLanguages.find(item => item.code === selectedLanguage)?.label ?? '—', meta: copy.languageDetail, Icon: Globe2 },
    { label: copy.theme, value: theme === 'dark' ? copy.dark : copy.light, meta: copy.themeImmediate, Icon: Palette },
    { label: copy.notifications, value: notificationSummary, meta: copy.localOnly, Icon: Bell },
  ];
  return <section className="settings-summary" aria-label={copy.settingsSummary}>{metrics.map(({ label, value, meta, Icon }) => <article className="settings-card settings-summary-card" key={label}><div><span className="settings-icon"><Icon size={19} aria-hidden="true" /></span><h2>{label}</h2></div><strong>{value}</strong><p>{meta}</p></article>)}</section>;
}
