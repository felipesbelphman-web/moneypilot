import Link from 'next/link';
import { ArrowUpRight, Download, Headphones, Landmark, LockKeyhole, MonitorSmartphone, Tags, TriangleAlert } from 'lucide-react';
import type { SettingsCopy } from '@/i18n/settings-copy';

const securityIcons = [Download, Landmark, LockKeyhole, MonitorSmartphone, Tags];
export function SettingsSecurity({ copy, onUnavailable }: { copy: SettingsCopy; onUnavailable: (index: number) => void }) {
  return <section className="settings-card" aria-labelledby="settings-security-title"><h2 id="settings-security-title">{copy.accountSecurity}</h2>{copy.securityItems.map((label, index) => {
    const Icon = securityIcons[index];
    return <div className="settings-security-row" key={label}><Icon size={18} aria-hidden="true" /><span>{label}</span>{index === 4 ? <Link className="settings-secondary" href="/categories">{copy.open}<ArrowUpRight size={14} aria-hidden="true" /></Link> : <button className="settings-secondary" type="button" aria-label={`${label}: ${copy.comingSoon}`} aria-haspopup="dialog" onClick={() => onUnavailable(index)}>{copy.comingSoon}</button>}</div>;
  })}</section>;
}
export function SettingsDangerZone({ copy, onOpen }: { copy: SettingsCopy; onOpen: () => void }) {
  return <section className="settings-card settings-danger" aria-labelledby="settings-danger-title"><h2 id="settings-danger-title"><TriangleAlert size={19} aria-hidden="true" />{copy.dangerZone}</h2><p>{copy.dangerDescription}</p><button type="button" className="settings-secondary" aria-haspopup="dialog" onClick={onOpen}>{copy.deleteAccount}</button></section>;
}
export function SettingsSupport({ copy }: { copy: SettingsCopy }) {
  return <section className="settings-card settings-support" aria-labelledby="settings-support-title"><h2 id="settings-support-title"><Headphones size={19} aria-hidden="true" />{copy.support}</h2><p>{copy.supportDescription}</p><Link className="settings-primary" href="/help">{copy.support}<ArrowUpRight size={16} aria-hidden="true" /></Link></section>;
}
