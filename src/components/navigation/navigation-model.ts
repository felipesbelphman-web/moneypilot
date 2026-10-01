export const navigationItems = [
  { href: "/dashboard", label: "dashboard", icon: "dashboard" },
  { href: "/transactions", label: "transactions", icon: "transactions" },
  { href: "/budgets", label: "budgets", icon: "budgets" },
  { href: "/insights", label: "insights", icon: "insights" },
  { href: "/goals", label: "goals", icon: "goals" },
  { href: "/investments", label: "investments", icon: "investments" },
  { href: "/settings", label: "settings", icon: "settings" },
] as const;

export type NavigationIcon = typeof navigationItems[number]["icon"] | "help" | "logout";

export function navigationIconPath(icon: NavigationIcon) {
  // The exported SVG alpha masks are shared; currentColor supplies each theme.
  return `/moneypilot/navigation/dark/${icon}.svg`;
}

export function isNavigationActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
