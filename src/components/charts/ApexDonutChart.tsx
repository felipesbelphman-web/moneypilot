"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { ApexOptions } from "apexcharts";
import { useTheme } from "@/components/ThemeProvider";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false, loading: () => <div className="size-full" aria-hidden="true" /> });

export type ApexDonutItem = { label: string; value: number; valueLabel: string; percent: number; color: string; composition?: string[] };

export function ApexDonutChart({ items, totalLabel, totalValue, size }: { items: ApexDonutItem[]; totalLabel: string; totalValue: string; size: number }) {
  const { theme } = useTheme();
  const options = useMemo<ApexOptions>(() => ({
    chart: { type: "donut", height: size, width: size, background: "transparent", fontFamily: "var(--font-financial-condensed)", animations: { enabled: false }, sparkline: { enabled: true }, parentHeightOffset: 0 },
    colors: items.map((item) => item.color),
    labels: items.map((item) => item.composition?.length ? `${item.label} (${item.composition.join(", ")})` : item.label),
    stroke: { width: 1, colors: [theme === "dark" ? "#0D1117" : "#F5F7FA"] },
    plotOptions: { pie: { donut: { size: "67%", labels: { show: false } } } },
    dataLabels: { enabled: false },
    legend: { show: false },
    tooltip: { enabled: true, theme, y: { formatter: (_value, context) => { const item = items[context?.seriesIndex ?? -1]; return `${item?.valueLabel ?? ""} · ${(item?.percent ?? 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}%`; } } },
  }), [items, size, theme]);
  return <div className="relative" style={{ height: size, width: size }}>
    <ApexChart key={theme} options={options} series={items.map((item) => item.value)} type="donut" height={size} width={size} />
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-[25px] text-center">
      <strong className="numeric-value max-w-full truncate text-[9px] font-semibold leading-[11px] text-[var(--text-primary)]">{totalValue}</strong>
      <span className="mt-[2px] max-w-full truncate text-[7px] leading-[9px] text-[var(--financial-flow-muted)]">{totalLabel}</span>
    </div>
  </div>;
}
