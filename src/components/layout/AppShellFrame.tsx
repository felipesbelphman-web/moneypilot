"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useSidebarLayout } from "@/components/navigation/DesktopSidebar";

const DESIGN_WIDTH = 1440;
const DESIGN_HEIGHT = 1024;
const PANEL_WIDTH = 1164;
const NAVIGATION_GAP = 24;
const SAFE_MARGIN = 18;

export function AppShellFrame({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const { expanded } = useSidebarLayout();
  const sidebarWidth = expanded ? 216 : 66;
  const compositionWidth = sidebarWidth + NAVIGATION_GAP + PANEL_WIDTH;
  // Reserve the widest composition so toggling never changes vertical scale or scroll.
  const designWidth = Math.max(DESIGN_WIDTH, compositionWidth + SAFE_MARGIN * 2);
  const shellSize = pathname === "/" || pathname.startsWith("/auth") ? "public" : "app";
  const fitsDashboard = pathname === "/dashboard";
  const matchesDashboardFrame = ["/transactions", "/budgets", "/goals", "/investments", "/insights", "/settings", "/help"].some(route => pathname === route || pathname.startsWith(`${route}/`));
  const viewportRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState({ scale: 1, height: DESIGN_HEIGHT });

  useEffect(() => {
    if (shellSize !== "app") return;
    const updateStage = () => {
      const scale = window.innerWidth < 768 ? 1 : Math.min(1, window.innerWidth / designWidth);
      const height = Math.max(DESIGN_HEIGHT, shellRef.current?.offsetHeight ?? DESIGN_HEIGHT);
      setStage(previous => previous.scale === scale && previous.height === height ? previous : { scale, height });
    };
    updateStage();
    const observer = new ResizeObserver(updateStage);
    if (shellRef.current) observer.observe(shellRef.current);
    window.addEventListener("resize", updateStage);
    return () => { observer.disconnect(); window.removeEventListener("resize", updateStage); };
  }, [pathname, shellSize, designWidth]);

  useEffect(() => {
    if (shellSize !== "app") return;
    viewportRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    // A navigation selection returns focus to its opener, not the page scroller.
    if (!document.activeElement?.closest("[data-desktop-sidebar], [data-mobile-navigation-bar]")) {
      viewportRef.current?.focus({ preventScroll: true });
    }
  }, [pathname, shellSize]);

  const shell = <div ref={shellRef} data-app-shell data-shell-size={shellSize}>{sidebar}<main data-app-scroll>{children}</main></div>;
  const stageStyle = { width: designWidth * stage.scale, height: stage.height * stage.scale };
  const viewportStyle = { "--shell-scale": stage.scale, "--shell-sidebar-width": `${sidebarWidth}px`, "--shell-design-width": `${designWidth}px` } as CSSProperties;

  return <div ref={viewportRef} tabIndex={-1} data-shell-viewport="true" data-shell-size={shellSize} data-dashboard-fit={fitsDashboard || undefined} data-help-theme={pathname === "/help" || undefined} data-settings-theme={pathname === "/settings" || undefined} style={viewportStyle}>
    {fitsDashboard ? (
      <div data-shell-stage data-dashboard-stage style={stageStyle}>{shell}</div>
    ) : shellSize === "app" ? (
      <div data-shell-stage data-internal-page-stage data-dashboard-appearance={matchesDashboardFrame || undefined} style={stageStyle}>{shell}</div>
    ) : shell}
  </div>;
}
