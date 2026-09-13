"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { ApexOptions } from "apexcharts";
import { useCurrency } from "@/components/CurrencyProvider";
import { useTheme } from "@/components/ThemeProvider";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false, loading: () => <div className="h-[30px] w-[88px]" aria-hidden="true" /> });

export function BudgetSpendMarkerChart({ color, label, limit, max, spent }: { color: string; label: string; limit: number; max: number; spent: number }) {
  const { formatMoney: money } = useCurrency();
  const { theme } = useTheme();
  const options = useMemo<ApexOptions>(() => ({
    chart: { type: "bar", height: 30, width: 88, sparkline: { enabled: true }, animations: { enabled: false }, background: "transparent", parentHeightOffset: 0 },
    colors: [color], dataLabels: { enabled: false },
    plotOptions: { bar: { horizontal: true, barHeight: "38%", borderRadius: 2 } },
    xaxis: { min: 0, max: Math.max(1, max) },
    grid: { padding: { top: -9, bottom: -9, left: 0, right: 2 } },
    tooltip: { theme, x: { show: false }, y: { formatter: (value) => `${label}: ${money(value)} · ${money(limit)}` } }, legend: { show: false },
  }), [color, label, limit, max, money, theme]);
  const series = [{ data: [{ x: label, y: spent, goals: [{ name: label, value: limit, strokeColor: "#F5F7FA", strokeHeight: 14, strokeWidth: 2 }] }] }];
  return <ApexChart options={options} series={series} type="bar" height={30} width={88} />;
}
