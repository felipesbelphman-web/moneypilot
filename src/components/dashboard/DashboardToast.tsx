"use client";

import Image from "next/image";
import { useLanguage } from "../LanguageProvider";

export type DashboardToastState = { id: string; tone: "success"; title: string; description?: string };

export function DashboardToast({ toast, onClose }: { toast: DashboardToastState; onClose: () => void }) {
  const { language } = useLanguage();
  const close = { en: ["Dismiss notification", "Close"], pt: ["Dispensar notificação", "Fechar"], es: ["Descartar notificación", "Cerrar"], de: ["Benachrichtigung schließen", "Schließen"], fr: ["Fermer la notification", "Fermer"], nl: ["Melding sluiten", "Sluiten"], it: ["Chiudi notifica", "Chiudi"] }[language];
  return <div role="status" aria-live="polite" className="absolute right-[20px] top-[20px] z-40 flex h-[84px] w-[362px] items-center rounded-[16px] border border-[#22C55E]/45 bg-[var(--background-elevated)] px-[13px] shadow-[0_14px_32px_rgba(0,0,0,0.18)]"><div className="grid size-[44px] shrink-0 place-items-center rounded-full bg-[#22C55E]/15"><Image src="/moneypilot/icon-shield-check.svg" alt="" width={24} height={24} /></div><div className="ml-[14px] min-w-0"><strong className="block truncate text-[14px] text-[var(--text-primary)]">{toast.title}</strong>{toast.description && <p className="mt-[5px] truncate text-[12px] text-[var(--text-secondary)]">{toast.description}</p>}</div><button type="button" onClick={onClose} aria-label={close[0]} className="ml-auto h-[30px] rounded-full px-[8px] text-[9px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--background-card)]">{close[1]}</button></div>;
}
