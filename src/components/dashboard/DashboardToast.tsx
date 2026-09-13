"use client";

import { IconCircleCheck, IconX } from "@tabler/icons-react";
import { useLanguage } from "../LanguageProvider";

export type DashboardToastState = { id: string; tone: "success"; title: string; description?: string };

export function DashboardToast({ toast, onClose }: { toast: DashboardToastState; onClose: () => void }) {
  const { language } = useLanguage();
  const closeLabel = { en: "Close notification", pt: "Fechar notificação", es: "Cerrar notificación", de: "Benachrichtigung schließen", fr: "Fermer la notification", nl: "Melding sluiten", it: "Chiudi notifica" }[language];
  return <div role="status" aria-live="polite" className="absolute right-[20px] top-[20px] z-40 flex h-[84px] w-[362px] items-center rounded-[16px] border border-[#22C55E]/45 bg-[var(--background-elevated)] px-[13px] shadow-[0_14px_32px_rgba(0,0,0,0.18)]"><div className="grid size-[44px] shrink-0 place-items-center rounded-full bg-[#22C55E]/15 text-[#22C55E]"><IconCircleCheck size={24} aria-hidden="true" /></div><div className="ml-[14px] min-w-0"><strong className="block truncate text-[14px] text-[var(--text-primary)]">{toast.title}</strong>{toast.description && <p className="mt-[5px] truncate text-[12px] text-[var(--text-secondary)]">{toast.description}</p>}</div><button type="button" onClick={onClose} aria-label={closeLabel} className="ml-auto grid size-[36px] shrink-0 place-items-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--background-card)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-elevated)]"><IconX size={18} aria-hidden="true" /></button></div>;
}
