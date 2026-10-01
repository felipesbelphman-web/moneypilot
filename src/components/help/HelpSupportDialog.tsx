"use client";

import { useEffect, useId, useRef } from 'react';
import { Headphones } from 'lucide-react';
import type { HelpCopy } from '@/i18n/help-copy';

export function HelpSupportDialog({ copy, onClose }: { copy: HelpCopy; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    closeRef.current?.focus();
    return () => { dialog?.close(); if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, []);

  // Native modal dialog supplies focus containment and makes the page behind it inert.
  return <dialog ref={dialogRef} className="help-dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }}>
    <span className="help-icon"><Headphones size={25} aria-hidden="true" /></span>
    <h2 id={titleId}>{copy.modalTitle}</h2><p id={descriptionId}>{copy.modalDescription}</p>
    <button ref={closeRef} type="button" className="help-primary" onClick={onClose}>{copy.close}</button>
  </dialog>;
}
