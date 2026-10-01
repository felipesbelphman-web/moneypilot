"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, PanelLeft, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type ReactNode, type FocusEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";

import { signOut } from "@/app/auth/actions";
import { useLanguage } from "@/components/LanguageProvider";
import { AccountAvatar } from "@/components/profile/AccountAvatar";
import { useAccountProfile } from "@/components/profile/AccountProfileProvider";
import { useTheme } from "@/components/ThemeProvider";
import { isPrivateRoute } from "@/lib/auth/private-routes";
import { translations } from "@/i18n/translations";
import { navigationItems, isNavigationActive, navigationIconPath, type NavigationIcon } from "./navigation-model";

type SidebarLayoutContextValue = { expanded: boolean; setExpanded: (expanded: boolean) => void };
const SidebarLayoutContext = createContext<SidebarLayoutContextValue | undefined>(undefined);
const subscribeToClientReady = () => () => {};
const getClientReadySnapshot = () => true;
const getServerClientReadySnapshot = () => false;

function Icon({ name }: { name: NavigationIcon }) {
  const source = navigationIconPath(name);
  return <span aria-hidden="true" className="floating-sidebar__icon" style={{ width: 24, height: 24, WebkitMask: `url("${source}") center/contain no-repeat`, mask: `url("${source}") center/contain no-repeat` }} />;
}

export function SidebarLayoutProvider({ children }: { children: ReactNode }) {
  // Expansion is transient: each fresh app load starts with the Figma rail.
  const [expanded, setExpanded] = useState(false);
  const value = useMemo(() => ({ expanded, setExpanded }), [expanded]);
  return <SidebarLayoutContext.Provider value={value}>{children}</SidebarLayoutContext.Provider>;
}

export function useSidebarLayout() {
  const context = useContext(SidebarLayoutContext);
  if (!context) throw new Error("useSidebarLayout must be used inside SidebarLayoutProvider");
  return context;
}

export default function DesktopSidebar() {
  const { language } = useLanguage();
  const { account } = useAccountProfile();
  const { theme } = useTheme();
  const { expanded, setExpanded } = useSidebarLayout();
  const pathname = usePathname();
  const t = translations[language].appNavigation;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const desktopRef = useRef<HTMLElement>(null);
  const desktopTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileDialogRef = useRef<HTMLElement>(null);
  const previousPathRef = useRef(pathname);
  const desktopId = useId();
  const mobileId = useId();
  const tooltipId = useId();
  const clientReady = useSyncExternalStore(subscribeToClientReady, getClientReadySnapshot, getServerClientReadySnapshot);

  const closeDesktop = useCallback(() => {
    setExpanded(false);
    setTooltip(null);
    requestAnimationFrame(() => desktopTriggerRef.current?.focus({ preventScroll: true }));
  }, [setExpanded]);
  const closeMobile = useCallback(() => {
    setMobileOpen(false);
    requestAnimationFrame(() => mobileTriggerRef.current?.focus({ preventScroll: true }));
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !desktopRef.current?.contains(event.target)) closeDesktop();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeDesktop(); }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [expanded, closeDesktop]);

  useEffect(() => {
    if (previousPathRef.current === pathname) return;
    previousPathRef.current = pathname;
    const frame = requestAnimationFrame(() => {
      if (expanded) closeDesktop();
      if (mobileOpen) closeMobile();
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, expanded, mobileOpen, closeDesktop, closeMobile]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    const scrollViewport = document.querySelector<HTMLElement>('[data-shell-viewport][data-shell-size="app"]');
    const previousViewportOverflow = scrollViewport?.style.overflow;
    document.body.style.overflow = "hidden";
    if (scrollViewport) scrollViewport.style.overflow = "hidden";
    mobileDialogRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeMobile(); }
      if (event.key !== "Tab") return;
      const controls = mobileDialogRef.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)');
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    const desktopQuery = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => { if (desktopQuery.matches) closeMobile(); };
    desktopQuery.addEventListener("change", closeOnDesktop);
    document.addEventListener("keydown", keyboard);
    return () => {
      document.body.style.overflow = previousOverflow;
      if (scrollViewport) scrollViewport.style.overflow = previousViewportOverflow ?? "";
      desktopQuery.removeEventListener("change", closeOnDesktop);
      document.removeEventListener("keydown", keyboard);
    };
  }, [mobileOpen, closeMobile]);

  if (!isPrivateRoute(pathname) && pathname !== "/help") return null;

  const toggle = {
    en: ["Expand menu", "Collapse menu"], pt: ["Expandir menu", "Recolher menu"],
    es: ["Expandir menú", "Contraer menú"], de: ["Menü erweitern", "Menü einklappen"],
    fr: ["Développer le menu", "Réduire le menu"], nl: ["Menu uitklappen", "Menu inklappen"],
    it: ["Espandi menu", "Comprimi menu"],
  }[language];
  const logo = theme === "dark" ? "/moneypilot/moneypilot-logo-white.svg" : "/moneypilot/moneypilot-logo.svg";

  const showTooltip = (event: FocusEvent<HTMLElement> | MouseEvent<HTMLElement>, text: string) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({ text, x: rect.right + 18, y: rect.top + rect.height / 2 });
  };
  const nav = (open: boolean, mobile = false) => {
    const close = mobile ? closeMobile : closeDesktop;
    const tooltipProps = (text: string) => !open ? {
      "aria-describedby": tooltip?.text === text ? tooltipId : undefined,
      onMouseEnter: (event: MouseEvent<HTMLElement>) => showTooltip(event, text),
      onFocus: (event: FocusEvent<HTMLElement>) => showTooltip(event, text),
      onMouseLeave: () => setTooltip(null),
      onBlur: () => setTooltip(null),
    } : {};
    return <nav className="floating-sidebar__nav" aria-label={t.navigation}>
      {!mobile && <button ref={desktopTriggerRef} type="button" data-sidebar-toggle
        onClick={() => { if (expanded) closeDesktop(); else { setTooltip(null); setExpanded(true); } }}
        aria-expanded={expanded} aria-controls={desktopId} aria-label={expanded ? toggle[1] : toggle[0]}
        {...tooltipProps(toggle[0])} className="floating-sidebar__toggle floating-sidebar__desktop-toggle">
        <PanelLeft size={24} strokeWidth={1.8} aria-hidden="true" />{expanded && <span>{toggle[1]}</span>}
      </button>}
      {navigationItems.map((item) => <Link key={item.href} href={item.href} onClick={close}
        className="floating-sidebar__item" aria-current={isNavigationActive(pathname, item.href) ? "page" : undefined}
        aria-label={t[item.label]} {...tooltipProps(t[item.label])}>
        <Icon name={item.icon} />{open && <span>{t[item.label]}</span>}
      </Link>)}
      <Link href="/help" onClick={close} className="floating-sidebar__item" aria-current={isNavigationActive(pathname, "/help") ? "page" : undefined} aria-label={t.help} {...tooltipProps(t.help)}>
        <Icon name="help" />{open && <span>{t.help}</span>}
      </Link>
      <form action={signOut} className="floating-sidebar__logout">
        <button type="submit" className="floating-sidebar__item" aria-label={t.logout} {...tooltipProps(t.logout)}>
          <Icon name="logout" />{open && <span>{t.logout}</span>}
        </button>
      </form>
    </nav>;
  };

  const mobileDrawer = clientReady && mobileOpen ? createPortal(
    <div data-mobile-sidebar-drawer className="floating-sidebar-mobile">
      <button type="button" data-mobile-sidebar-backdrop className="floating-sidebar-mobile__backdrop" aria-label={toggle[1]} onClick={closeMobile} />
      <aside ref={mobileDialogRef} id={mobileId} role="dialog" aria-modal="true" aria-label={t.navigation} className="floating-sidebar-mobile__dialog">
        <header className="floating-sidebar-mobile__header">
          <Image src={logo} alt="MoneyPilot" width={164} height={34} loading="eager" style={{ width: 164, height: "auto" }} />
          <button type="button" onClick={closeMobile} aria-label={toggle[1]} className="floating-sidebar__toggle"><X size={24} aria-hidden="true" /></button>
        </header>
        {nav(true, true)}
        <div className="floating-sidebar-mobile__profile"><AccountAvatar size={36} /><span>{account?.profile.display_name || account?.email || "MoneyPilot"}</span></div>
      </aside>
    </div>, document.body,
  ) : null;

  return <>
    <header data-mobile-navigation-bar className="floating-sidebar-mobile__bar">
      <button ref={mobileTriggerRef} type="button" onClick={() => setMobileOpen(true)} aria-label={toggle[0]} aria-expanded={mobileOpen} aria-controls={mobileId} className="floating-sidebar__toggle"><Menu size={24} aria-hidden="true" /></button>
    </header>
    <aside ref={desktopRef} data-desktop-sidebar data-expanded={expanded} aria-label={t.navigation} className="floating-sidebar">
      <div id={desktopId} className="floating-sidebar__surface">{nav(expanded)}</div>
    </aside>
    {mobileDrawer}
    {clientReady && tooltip && !expanded && createPortal(<span id={tooltipId} role="tooltip" className="floating-sidebar__tooltip" style={{ left: tooltip.x, top: tooltip.y }}>{tooltip.text}</span>, document.body)}
  </>;
}
