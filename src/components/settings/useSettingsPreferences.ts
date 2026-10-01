"use client";

import { useRef, useState } from 'react';
import { updateProfilePreferences } from '@/app/settings/actions';
import { useLanguage } from '@/components/LanguageProvider';
import { useCurrency } from '@/components/CurrencyProvider';
import { useFinanceData } from '@/components/FinanceDataProvider';
import { useAccountProfile } from '@/components/profile/AccountProfileProvider';
import { hasPendingSettings, type SettingsPreferenceDraft } from './settings-presentation';
import type { CurrencyCode, Language } from '@/i18n/config';

export function useSettingsPreferences() {
  const { language, setLanguage } = useLanguage();
  const { currency, isCurrencyHydrating, setConfirmedCurrency } = useCurrency();
  const { account } = useAccountProfile();
  const { transactions, budgets, budgetAdjustments, goals, goalContributionPlans, accountBalanceSettings, investments, isHydrating, hydrationError } = useFinanceData();
  const [draft, setDraft] = useState<SettingsPreferenceDraft>({});
  const [feedback, setFeedback] = useState<'saved' | 'error' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);
  const financialDataExists = isHydrating || Boolean(hydrationError) || accountBalanceSettings !== null || transactions.length > 0 || budgets.length > 0 || goals.length > 0 || investments.length > 0 || Object.keys(budgetAdjustments).length > 0 || Object.keys(goalContributionPlans).length > 0;
  const selectedCurrency: CurrencyCode | '' = draft.currency ?? currency ?? '';
  const selectedLanguage = draft.language ?? language;
  const hasChanges = hasPendingSettings(draft, currency, language);
  const currencyDisabled = financialDataExists || isCurrencyHydrating || isSaving;
  const canSave = hasChanges && Boolean(selectedCurrency) && Boolean(account) && !isCurrencyHydrating && !isSaving;

  function changeCurrency(value: CurrencyCode) {
    if (currencyDisabled || savingRef.current) return;
    setDraft(current => ({ ...current, currency: value })); setFeedback(null);
  }
  function changeLanguage(value: Language) {
    if (savingRef.current) return;
    setDraft(current => ({ ...current, language: value })); setFeedback(null);
  }
  async function saveChanges() {
    if (!canSave || !selectedCurrency || savingRef.current) return;
    savingRef.current = true; setIsSaving(true); setFeedback(null);
    try {
      const confirmed = await updateProfilePreferences({ locale: selectedLanguage, currencyCode: selectedCurrency });
      setLanguage(confirmed.locale);
      setConfirmedCurrency(confirmed.currencyCode);
      setDraft({}); setFeedback('saved');
    } catch {
      // Keep the draft for retry; never confirm a preference that the server rejected.
      setFeedback('error');
    } finally { savingRef.current = false; setIsSaving(false); }
  }
  return { selectedCurrency, selectedLanguage, hasChanges, canSave, currencyDisabled, financialDataExists, isSaving, feedback, changeCurrency, changeLanguage, saveChanges };
}
