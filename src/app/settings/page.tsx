"use client";

import Image from 'next/image';
import { useState } from 'react';
import { Save } from 'lucide-react';
import { updateProfileIdentity } from './actions';
import { useLanguage } from '@/components/LanguageProvider';
import { useTheme } from '@/components/ThemeProvider';
import { useAccountProfile } from '@/components/profile/AccountProfileProvider';
import { AccountAvatar } from '@/components/profile/AccountAvatar';
import { ProfileIdentityModal, type ProfileIdentitySaveInput } from '@/components/profile/ProfileIdentityModal';
import { getSettingsCopy } from '@/i18n/settings-copy';
import { languageLocales } from '@/i18n/config';
import { useSettingsPreferences } from '@/components/settings/useSettingsPreferences';
import { createLocalNotifications } from '@/components/settings/settings-presentation';
import { SettingsSummary } from '@/components/settings/SettingsSummary';
import { SettingsPreferences } from '@/components/settings/SettingsPreferences';
import { SettingsNotifications } from '@/components/settings/SettingsNotifications';
import { SettingsBackground } from '@/components/settings/SettingsBackground';
import { SettingsDangerZone, SettingsSecurity, SettingsSupport } from '@/components/settings/SettingsAccountSections';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import './settings.css';

export default function SettingsPage() {
  const { language } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { account, setAccount } = useAccountProfile();
  const preferences = useSettingsPreferences();
  const copy = getSettingsCopy(language);
  const [notifications, setNotifications] = useState(createLocalNotifications);
  const [profileIdentityOpen, setProfileIdentityOpen] = useState(false);
  const [information, setInformation] = useState<{ kind: 'delete' } | { kind: 'unavailable'; index: number } | null>(null);
  const notificationSummary = copy.notificationSummary.replace('{count}', new Intl.NumberFormat(languageLocales[language]).format(Object.values(notifications).filter(Boolean).length));

  async function saveProfileIdentity(input: ProfileIdentitySaveInput) {
    const formData = new FormData();
    formData.set('displayName', input.displayName);
    formData.set('avatarMode', input.avatarMode);
    formData.set('removePhoto', String(input.removePhoto));
    if (input.avatarFile) formData.set('avatarFile', input.avatarFile);
    const result = await updateProfileIdentity(formData);
    setAccount(account ? { ...account, avatarUrl: result.avatarUrl, profile: { ...account.profile, display_name: result.displayName, avatar_mode: result.avatarMode, avatar_path: result.avatarPath } } : null);
    setProfileIdentityOpen(false);
  }

  return <div data-settings-page>
    <div className="settings-brand"><Image src="/moneypilot/dashboard/day/logomark.svg" alt="" width={37} height={37} /><span>MoneyPilot</span></div>
    <header className="settings-header"><div><h1>{copy.title}</h1><p>{copy.description}</p></div><div className="settings-header-actions"><button type="button" className="settings-primary" disabled={!preferences.canSave} aria-busy={preferences.isSaving} onClick={preferences.saveChanges}><Save size={17} aria-hidden="true" />{preferences.isSaving ? copy.saving : copy.save}</button><button type="button" className="settings-avatar" aria-label={copy.profile} onClick={() => setProfileIdentityOpen(true)}><AccountAvatar size={48} /><Image className="settings-avatar-badge" src="/moneypilot/settings/profile/camera-badge.svg" alt="" width={20} height={20} /></button></div></header>
    <div className="settings-feedback" aria-live="polite">{preferences.hasChanges && <span className="settings-badge">{copy.pending}</span>}{preferences.feedback === 'saved' && <p role="status">{copy.savedPreferences}</p>}{preferences.feedback === 'error' && <p role="alert">{copy.saveError}</p>}</div>
    <SettingsSummary copy={copy} currency={preferences.selectedCurrency} language={language} selectedLanguage={preferences.selectedLanguage} theme={theme} notificationSummary={notificationSummary} />
    <div className="settings-columns">
      <div className="settings-column"><SettingsPreferences copy={copy} language={language} currency={preferences.selectedCurrency} selectedLanguage={preferences.selectedLanguage} theme={theme} currencyDisabled={preferences.currencyDisabled} financialDataExists={preferences.financialDataExists} isSaving={preferences.isSaving} onCurrencyChange={preferences.changeCurrency} onLanguageChange={preferences.changeLanguage} onThemeChange={setTheme} /><SettingsBackground copy={copy} /><SettingsDangerZone copy={copy} onOpen={() => setInformation({ kind: 'delete' })} /></div>
      <div className="settings-column"><SettingsNotifications copy={copy} values={notifications} onToggle={id => setNotifications(current => ({ ...current, [id]: !current[id] }))} /><SettingsSecurity copy={copy} onUnavailable={index => setInformation({ kind: 'unavailable', index })} /><SettingsSupport copy={copy} /></div>
    </div>
    {information && <SettingsDialog label={copy.comingSoon} onClose={() => setInformation(null)}><h2>{copy.comingSoon}</h2><p>{information.kind === 'delete' ? copy.deleteUnavailable : copy.unavailableDescription.replace('{feature}', copy.securityItems[information.index])}</p><button type="button" className="settings-primary" onClick={() => setInformation(null)}>{copy.close}</button></SettingsDialog>}
    {profileIdentityOpen && <ProfileIdentityModal open displayName={account?.profile.display_name ?? ''} email={account?.email ?? ''} avatarMode={account?.profile.avatar_mode ?? 'initials'} avatarPath={account?.profile.avatar_path ?? null} avatarUrl={account?.avatarUrl ?? null} onClose={() => setProfileIdentityOpen(false)} onSave={saveProfileIdentity} />}
  </div>;
}
