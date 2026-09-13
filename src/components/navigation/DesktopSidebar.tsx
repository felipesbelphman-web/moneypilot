"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeft } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { signOut } from "@/app/auth/actions";
import { useLanguage } from "@/components/LanguageProvider";
import { AccountAvatar } from "@/components/profile/AccountAvatar";
import { useAccountProfile } from "@/components/profile/AccountProfileProvider";
import { useTheme } from "@/components/ThemeProvider";
import { translations } from "@/i18n/translations";

type IconName = "home" | "transactions" | "budgets" | "insights" | "goals" | "investments" | "settings" | "help" | "logout";
type SidebarLayoutContextValue = { expanded: boolean; setExpanded: (expanded: boolean) => void };

const routes = ["/dashboard", "/transactions", "/budgets", "/insights", "/goals", "/categories", "/investments", "/settings"];
const icons: Record<IconName, string> = {
  home: "/moneypilot/navigation/dashboard.svg",
  transactions: "/moneypilot/navigation/transactions.svg",
  budgets: "/moneypilot/navigation/budgets.svg",
  insights: "/moneypilot/navigation/insights.svg",
  goals: "/moneypilot/navigation/goals.svg",
  investments: "/moneypilot/navigation/investments.svg",
  settings: "/moneypilot/navigation/settings.svg",
  help: "/moneypilot/navigation/help-icon.svg",
  logout: "/moneypilot/navigation/logout-icon.svg",
};
const SidebarLayoutContext = createContext<SidebarLayoutContextValue | undefined>(undefined);
const SIDEBAR_STORAGE_KEY = "moneypilot-sidebar-expanded";

function subscribeToClientReady() {
  return () => {};
}

function getClientReadySnapshot() {
  return true;
}

function getServerClientReadySnapshot() {
  return false;
}

function Icon({ name }: { name: IconName }) {
  return <span aria-hidden className="size-[22px] shrink-0 bg-current" style={{ WebkitMask: `url("${icons[name]}") center/contain no-repeat`, mask: `url("${icons[name]}") center/contain no-repeat` }} />;
}

function active(path: string, href: string) {
  return path === href || path.startsWith(`${href}/`);
}

export function SidebarLayoutProvider({ children }: { children: ReactNode }) {
  const [expanded, setExpandedState] = useState(false);

  useEffect(() => {
    const savedState = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (savedState !== "true") return;

    const frame = window.requestAnimationFrame(() => setExpandedState(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const setExpanded = (nextExpanded: boolean) => {
    setExpandedState(nextExpanded);
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextExpanded));
  };

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
  const clientReady = useSyncExternalStore(
    subscribeToClientReady,
    getClientReadySnapshot,
    getServerClientReadySnapshot,
  );

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    const scrollViewport = document.querySelector<HTMLElement>('[data-shell-viewport][data-shell-size="app"]');
    const previousViewportOverflow = scrollViewport?.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.body.style.overflow = "hidden";
    if (scrollViewport) scrollViewport.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      if (scrollViewport) scrollViewport.style.overflow = previousViewportOverflow ?? "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileOpen]);

  if (!routes.some((route) => active(pathname, route))) return null;

  const toggle = {
    en: ["Expand menu", "Collapse menu"],
    pt: ["Expandir menu", "Recolher menu"],
    es: ["Expandir menú", "Contraer menú"],
    de: ["Menü erweitern", "Menü einklappen"],
    fr: ["Développer le menu", "Réduire le menu"],
    nl: ["Menu uitklappen", "Menu inklappen"],
    it: ["Espandi menu", "Comprimi menu"],
  }[language];
  const items: { name: IconName; label: string; href: string }[] = [
    { name: "home", label: t.dashboard, href: "/dashboard" },
    { name: "transactions", label: t.transactions, href: "/transactions" },
    { name: "budgets", label: t.budgets, href: "/budgets" },
    { name: "goals", label: t.goals, href: "/goals" },
    { name: "investments", label: t.investments, href: "/investments" },
    { name: "insights", label: t.insights, href: "/insights" },
  ];
  const name = account?.profile.display_name || account?.email || "MoneyPilot";
  const logo = theme === "dark" ? "/moneypilot/moneypilot-logo-white.svg" : "/moneypilot/moneypilot-logo.svg";

  const nav = (open: boolean, mobile = false) => (
    <nav className={mobile ? "flex w-full flex-col gap-[8px]" : "sidebar-navigation"} aria-label={t.navigation}>
      {items.map((item) => {
        const selected = active(pathname, item.href);
        return (
          <div key={item.name} className="group relative w-full">
            <Link href={item.href} onClick={() => mobile && setMobileOpen(false)} aria-current={selected ? "page" : undefined} aria-label={item.label} title={!open ? item.label : undefined}
              className={`flex h-[48px] w-full items-center rounded-[8px] text-[14px] font-medium outline-none transition-all duration-300 ease-in-out focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-60 ${open ? "gap-[12px] px-[12px]" : "justify-center"} ${selected ? "bg-[var(--sidebar-item-active)] text-[var(--sidebar-item-active-foreground)]" : "text-[var(--sidebar-icon)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text-primary)]"}`}>
              <Icon name={item.name} />{open && <span className="truncate whitespace-nowrap">{item.label}</span>}
            </Link>
            {!open && !mobile && <span role="tooltip" className="pointer-events-none absolute left-full top-1/2 z-[70] ml-[10px] hidden -translate-y-1/2 whitespace-nowrap rounded-[7px] bg-[var(--background-tooltip)] px-[10px] py-[6px] text-[11px] font-medium text-[var(--text-inverse)] shadow-[0_8px_20px_rgba(0,0,0,0.2)] group-hover:block">{item.label}</span>}
          </div>
        );
      })}
      <div className="group relative w-full">
      <button type="button" aria-label={t.help} title={!open ? t.help : undefined}
        className={`flex h-[48px] w-full items-center rounded-[8px] text-[14px] font-medium text-[var(--sidebar-icon)] outline-none transition-all duration-300 ease-in-out hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-60 ${open ? "gap-[12px] px-[12px]" : "justify-center"}`}>
        <Icon name="help" />{open && t.help}
      </button>
      {!open && !mobile && <span role="tooltip" className="pointer-events-none absolute left-full top-1/2 z-[70] ml-[10px] hidden -translate-y-1/2 whitespace-nowrap rounded-[7px] bg-[var(--background-tooltip)] px-[10px] py-[6px] text-[11px] font-medium text-[var(--text-inverse)] shadow-[0_8px_20px_rgba(0,0,0,0.2)] group-hover:block">{t.help}</span>}
      </div>
    </nav>
  );

  const footer = (open: boolean, mobile = false) => (
    <div className={mobile ? "flex w-full flex-col gap-[6px]" : "sidebar-footer"}>
      <Link href="/settings" onClick={() => mobile && setMobileOpen(false)} aria-label={t.settings} title={!open ? t.settings : undefined}
        className={`flex items-center rounded-[8px] text-[var(--sidebar-icon)] outline-none transition-all duration-300 ease-in-out hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-inset ${mobile ? "h-[40px] text-[12px]" : "h-[48px] text-[14px] font-medium"} ${open ? "gap-[12px] px-[12px]" : "justify-center"}`}>
        <Icon name="settings" />{open && t.settings}
      </Link>
      <div className={`flex items-center rounded-[8px] bg-[var(--sidebar-item-hover)] transition-all duration-300 ease-in-out ${mobile ? "min-h-[50px]" : "h-[48px] shrink-0"} ${open ? mobile ? "gap-[9px] px-[7px]" : "gap-[12px] px-[12px]" : "justify-center"}`}>
        <AccountAvatar size={mobile ? 36 : 32} />
        {open && <div className="min-w-0 flex-1"><p className={`truncate font-medium text-[var(--text-primary)] ${mobile ? "text-[11px] font-semibold" : "text-[14px]"}`}>{name}</p><p className="text-[9px] text-[var(--text-tertiary)]">MoneyPilot</p></div>}
      </div>
      <form action={signOut}>
        <button type="submit" aria-label={t.logout} title={!open ? t.logout : undefined}
          className={`flex w-full items-center rounded-[8px] text-[var(--sidebar-icon)] outline-none transition-colors hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-60 ${mobile ? "h-[34px] text-[10px]" : "h-[48px] text-[14px] font-medium"} ${open ? "gap-[12px] px-[12px]" : "justify-center"}`}>
          <Icon name="logout" />{open && t.logout}
        </button>
      </form>
    </div>
  );

  const mobileDrawer = clientReady && mobileOpen ? createPortal(
      <div data-mobile-sidebar-drawer className="fixed inset-0 z-[90] min-[768px]:hidden">
        <button type="button" data-mobile-sidebar-backdrop aria-label={toggle[1]} onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-black/45" />
        <aside className="absolute inset-y-0 left-0 flex w-[264px] flex-col justify-between bg-[var(--background-sidebar)] p-[16px] text-[var(--text-primary)] shadow-[12px_0_30px_rgba(0,0,0,0.22)]">
          <div><div className="mb-[20px] flex items-center justify-between"><Image src={logo} alt="MoneyPilot" width={164} height={35} /><button type="button" onClick={() => setMobileOpen(false)} aria-label={toggle[1]}>×</button></div>{nav(true, true)}</div>
          {footer(true, true)}
        </aside>
      </div>,
    document.body,
  ) : null;

  return (
    <>
      <header data-mobile-navigation-bar className="sticky top-0 z-[80] flex h-16 w-full items-center border-b border-[var(--border-default)] bg-[var(--background-sidebar)] px-[14px] shadow-[0_4px_14px_rgba(0,0,0,0.06)] min-[768px]:hidden">
        <button type="button" onClick={() => setMobileOpen(true)} aria-label={toggle[0]}
          className="grid size-11 place-items-center rounded-[12px] border border-[var(--border-default)] bg-[var(--background-sidebar)] text-[var(--sidebar-icon)] shadow-[var(--sidebar-shadow)] outline-none hover:bg-[var(--sidebar-item-hover)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]">☰</button>
      </header>
      <aside data-desktop-sidebar data-expanded={expanded} aria-label={t.navigation}
        className="desktop-sidebar">
        <div className="sidebar-content">
          <div className={`sidebar-header ${expanded ? "justify-between" : "flex-col gap-[12px]"}`}>
            {expanded ? <Image src={logo} alt="MoneyPilot" width={164} height={35} /> : <div className="h-[34px] w-[34px] overflow-hidden"><Image src={logo} alt="MoneyPilot" width={164} height={34} className="max-w-none" /></div>}
            <button type="button" onClick={() => setExpanded(!expanded)} aria-label={expanded ? toggle[1] : toggle[0]} title={expanded ? toggle[1] : toggle[0]}
              className={`grid size-[24px] shrink-0 place-items-center rounded-[6px] border-0 bg-transparent text-[var(--sidebar-icon)] shadow-none outline-none transition-all duration-300 ease-in-out hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-60 ${expanded ? "" : "mx-auto"}`}><PanelLeft size={24} strokeWidth={1.8} aria-hidden="true" /></button>
          </div>
          <div className="sidebar-navigation-region">
            {nav(expanded)}
          </div>
          {footer(expanded)}
        </div>
      </aside>
      {mobileDrawer}
    </>
  );
}
