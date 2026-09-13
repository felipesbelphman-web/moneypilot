"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { usePathname } from "next/navigation";

type ShellSize = "app" | "public";

const DASHBOARD_DESIGN_WIDTH = 1445;
const DASHBOARD_DESIGN_HEIGHT = 1088.107177734375;
const DASHBOARD_VIEWPORT_PADDING = 32;
const DASHBOARD_MAX_DESKTOP_SCALE = 1.2;
const INTERNAL_PAGE_DESIGN_WIDTH = 1375;

function getShellSize(pathname: string): ShellSize {
  if (pathname === "/" || pathname.startsWith("/auth")) return "public";
  return "app";
}

export function AppShellFrame({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const shellSize = getShellSize(pathname);
  const fitsDashboard = pathname === "/dashboard";
  const viewportRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const [dashboardViewport, setDashboardViewport] = useState({
    scale: 1,
    height: DASHBOARD_DESIGN_HEIGHT,
  });
  const [internalPageStage, setInternalPageStage] = useState({
    scale: 1,
    height: 862,
  });

  useEffect(() => {
    if (!fitsDashboard) return;

    const updateDashboardScale = () => {
      const availableWidth = window.innerWidth - DASHBOARD_VIEWPORT_PADDING * 2;
      const scale = Math.min(
        DASHBOARD_MAX_DESKTOP_SCALE,
        availableWidth / DASHBOARD_DESIGN_WIDTH,
      );

      setDashboardViewport({
        scale,
        height: DASHBOARD_DESIGN_HEIGHT * scale,
      });
    };

    updateDashboardScale();
    window.addEventListener("resize", updateDashboardScale);
    return () => window.removeEventListener("resize", updateDashboardScale);
  }, [fitsDashboard]);

  useEffect(() => {
    if (shellSize !== "app" || fitsDashboard) return;

    const updateStage = () => {
      const scale = Math.min(
        DASHBOARD_MAX_DESKTOP_SCALE,
        (window.innerWidth - DASHBOARD_VIEWPORT_PADDING * 2) / INTERNAL_PAGE_DESIGN_WIDTH,
      );

      setInternalPageStage({
        scale,
        height: shellRef.current?.offsetHeight ?? 862,
      });
    };

    updateStage();
    const observer = new ResizeObserver(updateStage);
    if (shellRef.current) observer.observe(shellRef.current);
    window.addEventListener("resize", updateStage);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateStage);
    };
  }, [fitsDashboard, pathname, shellSize]);

  useEffect(() => {
    if (shellSize !== "app") return;

    const scrollContainer = viewportRef.current;
    scrollContainer?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    scrollContainer?.focus({ preventScroll: true });
  }, [pathname, shellSize]);

  const shell = (
    <div ref={shellRef} data-app-shell data-shell-size={shellSize}>
      {sidebar}
      <main data-app-scroll>{children}</main>
    </div>
  );

  const stageStyle = {
    "--dashboard-scale": dashboardViewport.scale,
    width: DASHBOARD_DESIGN_WIDTH * dashboardViewport.scale,
    height: dashboardViewport.height,
  } as CSSProperties;

  const internalStageStyle = {
    "--internal-page-scale": internalPageStage.scale,
    width: INTERNAL_PAGE_DESIGN_WIDTH * internalPageStage.scale,
    height: internalPageStage.height * internalPageStage.scale,
  } as CSSProperties;

  return (
    <div ref={viewportRef} tabIndex={-1} data-shell-viewport="true" data-shell-size={shellSize} data-dashboard-fit={fitsDashboard || undefined}>
      {fitsDashboard ? (
        <div data-dashboard-stage style={stageStyle}>{shell}</div>
      ) : shellSize === "app" ? (
        <div data-internal-page-stage style={internalStageStyle}>{shell}</div>
      ) : shell}
    </div>
  );
}
