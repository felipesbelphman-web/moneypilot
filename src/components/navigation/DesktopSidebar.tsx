"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  IconChartPie,
  IconCreditCard,
  IconSettings,
  IconSmartHome,
  IconSparkles,
} from "@tabler/icons-react"; 
import { signOut } from "@/app/auth/actions";
import { LeaderboardStar } from "iconoir-react";

type SidebarIconName =
  | "home"
  | "card"
  | "chart"
  | "sparkles"
  | "goals"
  | "investments"
  | "settings"
  | "help";

const navigationItems: { name: SidebarIconName; label: string; href?: string }[] = [
  { name: "home", label: "Dashboard", href: "/dashboard" },
  { name: "card", label: "Transações", href: "/transactions" },
  { name: "chart", label: "Orçamentos", href: "/budgets" },
  { name: "sparkles", label: "Insights IA", href: "/insights" },
  { name: "goals", label: "Objetivos", href: "/goals" },
  { name: "investments", label: "Investimentos", href: "/investments" },
  { name: "settings", label: "Configurações", href: "/settings" },
  { name: "help", label: "Ajuda" },
];

const desktopRoutes = [
  "/dashboard",
  "/transactions",
  "/budgets",
  "/insights",
  "/goals",
  "/categories",
  "/investments",
  "/settings",
];

function InvestmentIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 12V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 12V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 12V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 4H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 4V14C4 14.5304 4.21071 15.0391 4.58579 15.4142C4.96086 15.7893 5.46957 16 6 16H18C18.5304 16 19.0391 15.7893 19.4142 15.4142C19.7893 15.0391 20 14.5304 20 14V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 16V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 20H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SidebarIcon({ name }: { name: SidebarIconName }) {
  switch (name) {
    case "home": return <IconSmartHome size={24} stroke={2} />;
    case "card": return <IconCreditCard size={24} stroke={2} />;
    case "chart": return <IconChartPie size={24} stroke={2} />;
    case "sparkles": return <IconSparkles size={24} stroke={2} />;
    case "goals": return <LeaderboardStar width={24} height={24} strokeWidth={2} aria-hidden="true" />;
    case "investments": return <InvestmentIcon />;
    case "settings": return <IconSettings size={24} stroke={2} />;
    case "help":
      return (
        <Image
          src="/moneypilot/navigation/help-icon.svg"
          alt=""
          width={24}
          height={24}
        />
      );
  }
}

export default function DesktopSidebar() {
  const pathname = usePathname();
  const isDesktopRoute = desktopRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!isDesktopRoute) return null;

  return (
    <aside
  data-desktop-sidebar="true"
  className="pointer-events-auto fixed left-[141px] top-1/2 z-[50] flex h-[562px] w-[66px] -translate-y-1/2 flex-col items-center justify-center gap-[32px] rounded-[33px] border border-[#28313B]/15 bg-[#0D1117]/50 px-[8px] py-[32px] text-[#D9E0E7] shadow-[0_12px_24px_rgba(0,0,0,0.35)] backdrop-blur-[20px]">
      {navigationItems.map((item) => {
        const active = item.href === pathname;
        const className = `flex pointer-events-auto h-[48px] w-[48px] shrink-0 items-center justify-center transition-colors ${active ? "rounded-full bg-[#3B82F6] text-white" : "-my-[12px] rounded-full text-[#D9E0E7] hover:text-white"}`;
        const content = <SidebarIcon name={item.name} />;

        return item.href ? <Link key={item.name} href={item.href} aria-label={item.label} className={className}>{content}</Link> : <button key={item.name} type="button" aria-label={item.label} className={className}>{content}</button>;
      })}
      <form action={signOut} className="-my-[12px]">
        <button
          type="submit"
          aria-label="Sair"
          title="Sair"
          className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full text-[#D9E0E7] transition-colors hover:text-white"
        >
          <span
            aria-hidden="true"
            className="h-[24px] w-[24px] bg-current"
            style={{
              WebkitMaskImage: "url('/moneypilot/navigation/logout-icon.svg')",
              maskImage: "url('/moneypilot/navigation/logout-icon.svg')",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
              WebkitMaskSize: "contain",
              maskSize: "contain",
            }}
          />
        </button>
      </form>
    </aside>
  );
}
