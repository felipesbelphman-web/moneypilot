import { Bell, BellRing, CalendarCheck, ChartNoAxesCombined, ReceiptText } from 'lucide-react';
import type { SettingsCopy } from '@/i18n/settings-copy';
import { notificationIds, type NotificationId } from './settings-presentation';

const icons = [ReceiptText, BellRing, CalendarCheck, ChartNoAxesCombined, Bell];
export function SettingsNotifications({ copy, values, onToggle }: { copy: SettingsCopy; values: Record<NotificationId, boolean>; onToggle: (id: NotificationId) => void }) {
  return <section className="settings-card" aria-labelledby="settings-notifications-title"><div className="settings-section-title"><h2 id="settings-notifications-title">{copy.notifications}</h2><span className="settings-badge">{copy.localOnly}</span></div><p className="settings-note" id="settings-notifications-note">{copy.notificationsLocal}</p>{notificationIds.map((id, index) => {
    const Icon = icons[index];
    return <div className="settings-notification-row" key={id}><Icon size={18} aria-hidden="true" /><span id={`settings-notification-${id}`}>{copy.notificationItems[index]}</span><button type="button" className="settings-switch" role="switch" aria-checked={values[id]} aria-labelledby={`settings-notification-${id}`} aria-describedby="settings-notifications-note" onClick={() => onToggle(id)}><span /></button></div>;
  })}</section>;
}
