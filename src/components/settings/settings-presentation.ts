import type { CurrencyCode, Language } from '../../i18n/config.ts';

export type SettingsPreferenceDraft = { currency?: CurrencyCode; language?: Language };
export function hasPendingSettings(draft: SettingsPreferenceDraft, currency: CurrencyCode | null, language: Language) {
  return (draft.currency !== undefined && draft.currency !== currency) || (draft.language !== undefined && draft.language !== language);
}

// Session-only notification mock; the profile API has no notification preference fields.
export const notificationIds = ['capture', 'budgets', 'goals', 'insights', 'weekly'] as const;
export type NotificationId = typeof notificationIds[number];
export function createLocalNotifications(): Record<NotificationId, boolean> { return { capture: false, budgets: false, goals: false, insights: false, weekly: false }; }

export const backgroundImageTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const maxBackgroundBytes = 5 * 1024 * 1024;
export function validateBackgroundFile(file: { type: string; size: number }): 'imageTypeError' | 'imageSizeError' | null {
  if (!(backgroundImageTypes as readonly string[]).includes(file.type)) return 'imageTypeError';
  if (file.size <= 0 || file.size > maxBackgroundBytes) return 'imageSizeError';
  return null;
}
