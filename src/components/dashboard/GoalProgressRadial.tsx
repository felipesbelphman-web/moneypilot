"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { ApexOptions } from "apexcharts";
import { useTheme } from "@/components/ThemeProvider";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false, loading: () => <div className="size-[66px]" aria-hidden="true" /> });

export function GoalProgressRadial({ percent }: { percent: number }) {
  const { theme } = useTheme();
  const visible = Math.min(100, Math.max(0, percent));
  const label = `${percent.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
  const options = useMemo<ApexOptions>(() => ({
    chart: { type: "radialBar", height: 66, width: 66, sparkline: { enabled: true }, animations: { enabled: false }, background: "transparent", parentHeightOffset: 0 },
    colors: ["var(--dashboard-chart-primary)"], stroke: { lineCap: "round" },
    plotOptions: { radialBar: { hollow: { size: "62%", background: "transparent" }, track: { background: theme === "dark" ? "var(--dashboard-brand-dark)" : "var(--dashboard-brand-soft)", strokeWidth: "100%" }, dataLabels: { name: { show: false }, value: { show: true, offsetY: 5, color: theme === "dark" ? "var(--dashboard-brand-accent)" : "var(--dashboard-brand-dark)", fontSize: "14px", fontWeight: 600, fontFamily: "var(--font-inter)", formatter: () => label } } } },
    tooltip: { enabled: false },
  }), [label, theme]);
  return <ApexChart options={options} series={[visible]} type="radialBar" height={66} width={66} />;
}
