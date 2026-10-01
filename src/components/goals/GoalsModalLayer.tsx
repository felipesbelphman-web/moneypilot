"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

// Keep the existing dialogs outside the transformed desktop canvas.
export function GoalsModalLayer({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const openerRef = useRef(typeof document === "undefined" ? null : document.activeElement as HTMLElement | null);
  useEffect(() => {
    const opener = openerRef.current;
    const root = ref.current;
    const shell = document.querySelector<HTMLElement>("[data-shell-viewport]");
    const previousInert = shell?.inert ?? false;
    if (shell) shell.inert = true;
    const focusable = () => Array.from(root?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]') ?? []);
    if (!root?.contains(document.activeElement)) focusable()[0]?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const elements = focusable();
      const first = elements[0];
      const last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    root?.addEventListener("keydown", trap);
    return () => {
      root?.removeEventListener("keydown", trap);
      if (shell) shell.inert = previousInert;
      opener?.focus({ preventScroll: true });
    };
  }, []);
  return createPortal(<div ref={ref} className="goals-modal-layer">{children}</div>, document.body);
}
