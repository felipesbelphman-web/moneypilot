"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/app/auth/actions";
import { useLanguage } from "@/components/LanguageProvider";
import { useTheme } from "@/components/ThemeProvider";
import { translations } from "@/i18n/translations";

type SidebarIconName =
  | "home" | "transactions" | "budgets" | "insights" | "goals"
  | "investments" | "settings" | "help" | "logout";

const desktopRoutes = [
  "/dashboard", "/transactions", "/budgets", "/insights", "/goals",
  "/categories", "/investments", "/settings",
];

const iconPaths: Record<SidebarIconName, string> = {
  home: "/moneypilot/navigation/home.svg",
  transactions: "/moneypilot/navigation/transactions.svg",
  budgets: "/moneypilot/navigation/budgets.svg",
  insights: "/moneypilot/navigation/insights.svg",
  goals: "/moneypilot/navigation/goals.svg",
  investments: "/moneypilot/navigation/investments.svg",
  settings: "/moneypilot/navigation/settings.svg",
  help: "/moneypilot/navigation/help-icon.svg",
  logout: "/moneypilot/navigation/logout-icon.svg",
};

function SidebarIcon({ name }: { name: SidebarIconName }) {
  const icon = iconPaths[name];
  return (
    <span
      aria-hidden="true"
      className="size-[24px] shrink-0 bg-current"
      style={{
        WebkitMaskImage: `url("${icon}")`,
        maskImage: `url("${icon}")`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}

function routeIsActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function DesktopSidebar() {
  const { language } = useLanguage();
  const { theme, setTheme } = useTheme();
  const t = translations[language].appNavigation;
  const pathname = usePathname();
  const navigationItems: { name: SidebarIconName; label: string; href?: string }[] = [
    { name: "home", label: t.dashboard, href: "/dashboard" },
    { name: "transactions", label: t.transactions, href: "/transactions" },
    { name: "budgets", label: t.budgets, href: "/budgets" },
    { name: "insights", label: t.insights, href: "/insights" },
    { name: "goals", label: t.goals, href: "/goals" },
    { name: "investments", label: t.investments, href: "/investments" },
    { name: "settings", label: t.settings, href: "/settings" },
    { name: "help", label: t.help },
  ];
  const isDesktopRoute = desktopRoutes.some((route) => routeIsActive(pathname, route));

  if (!isDesktopRoute) return null;

  return (
    <aside
      data-desktop-sidebar="true"
      aria-label={t.navigation}
      className="pointer-events-auto fixed left-[141px] top-1/2 z-[50] hidden h-[720px] w-[66px] -translate-y-1/2 flex-col items-center justify-center gap-[32px] overflow-hidden rounded-[33px] border border-[var(--border-default)] bg-[var(--background-sidebar)] px-[8px] py-[32px] text-[var(--sidebar-icon)] shadow-[var(--sidebar-shadow)] backdrop-blur-[12px] min-[900px]:flex"
    >
      {navigationItems.map((item) => {
        const active = item.href ? routeIsActive(pathname, item.href) : false;
        const className = `sidebar-navigation-item flex shrink-0 items-center justify-center rounded-full transition-[color,background-color,box-shadow] ${active ? "is-active size-[46px] bg-[var(--brand-secondary)] text-white shadow-[0_6px_14px_rgba(37,99,235,0.28)]" : "size-[24px] text-[var(--sidebar-icon)] hover:text-[var(--text-primary)]"}`;
        const content = <SidebarIcon name={item.name} />;

        return item.href ? (
          <Link key={item.name} href={item.href} aria-label={item.label} aria-current={active ? "page" : undefined} title={item.label} className={className}>
            {content}
          </Link>
        ) : (
          <button key={item.name} type="button" aria-label={item.label} title={item.label} className={className}>
            {content}
          </button>
        );
      })}

      <form action={signOut} className="flex size-[24px] shrink-0">
        <button type="submit" aria-label={t.logout} title={t.logout} className="sidebar-navigation-item flex size-[24px] items-center justify-center rounded-full text-[var(--sidebar-icon)] transition-colors hover:text-[var(--text-primary)]">
          <SidebarIcon name="logout" />
        </button>
      </form>

      <div role="group" aria-label={t.theme} className="flex h-[128px] w-[48px] shrink-0 flex-col items-center justify-center gap-[24px] overflow-hidden rounded-[44px] border-4 border-[var(--theme-switch-surface)] bg-[var(--theme-switch-surface)] px-[2px] py-[12px]">
        <button type="button" onClick={() => setTheme("dark")} aria-label={t.darkTheme} aria-pressed={theme === "light"} title={t.darkTheme} className={`theme-option grid size-[36px] shrink-0 place-items-center rounded-full ${theme === "light" ? "is-selected" : "opacity-40"}`}>
          <Image src="/moneypilot/navigation/moon.svg" alt="" width={20} height={20} className="size-[19.636px]" />
        </button>
        <button type="button" onClick={() => setTheme("light")} aria-label={t.lightTheme} aria-pressed={theme === "dark"} title={t.lightTheme} className={`theme-option grid size-[36px] shrink-0 place-items-center rounded-full ${theme === "dark" ? "is-selected" : "opacity-40"}`}>
          <Image src="/moneypilot/navigation/sun.svg" alt="" width={20} height={20} className="size-[19.636px]" />
        </button>
      </div>
    </aside>
  );
}
