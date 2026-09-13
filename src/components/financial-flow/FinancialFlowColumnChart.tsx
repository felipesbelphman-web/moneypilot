"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { ApexOptions } from "apexcharts";
import { useCurrency } from "@/components/CurrencyProvider";
import { useLanguage, type Language } from "@/components/LanguageProvider";
import { useTheme } from "@/components/ThemeProvider";
import { getFinancialChartScale } from "@/components/financial-flow/financialChartScale";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false, loading: () => <div className="h-[142px] w-full" aria-hidden="true" /> });
const locales: Record<Language, string> = { en: "en-GB", pt: "pt-PT", es: "es-ES", de: "de-DE", fr: "fr-FR", nl: "nl-NL", it: "it-IT" };
const timestamp = (value: string) => { const [year, month, day] = value.split("-").map(Number); return Date.UTC(year, month - 1, day); };

export function FinancialFlowColumnChart({ color, datesISO, label, resetKey, secondaryColor, secondaryValues, tooltipEnabled = true, values }: { color: string; datesISO: string[]; label: string; resetKey: string; secondaryColor?: string; secondaryValues?: number[]; tooltipEnabled?: boolean; values: number[] }) {
  const { formatMoney: money } = useCurrency();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const locale = locales[language];
  const series = useMemo(() => [{ name: label, data: values }, ...(secondaryValues ? [{ name: label, data: secondaryValues }] : [])], [label, secondaryValues, values]);
  const scale = useMemo(() => getFinancialChartScale([values, secondaryValues ?? []]), [secondaryValues, values]);
  const visibleDateTicks = useMemo(() => new Set(Array.from({ length: Math.min(5, datesISO.length) }, (_, index) => {
    const pointIndex = Math.round(index * (datesISO.length - 1) / Math.max(1, Math.min(5, datesISO.length) - 1));
    return datesISO[pointIndex];
  })), [datesISO]);
  const options = useMemo<ApexOptions>(() => ({
    chart: { id: `financial-flow-columns-${resetKey}`, type: "bar", height: 142, background: "transparent", fontFamily: "var(--font-financial-condensed)", foreColor: theme === "dark" ? "#9CA6B2" : "#596474", animations: { enabled: false }, toolbar: { show: false }, parentHeightOffset: 0 },
    colors: [color, secondaryColor ?? color], dataLabels: { enabled: false },
    plotOptions: { bar: { columnWidth: "58%", borderRadius: 2, borderRadiusApplication: "end", colors: { ranges: [{ from: Number.MIN_SAFE_INTEGER, to: -0.000001, color }] } } },
    grid: { borderColor: theme === "dark" ? "rgba(145,158,171,0.16)" : "rgba(71,85,105,0.14)", strokeDashArray: 3, xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } }, padding: { top: 0, right: 6, bottom: 7, left: 18 } },
    annotations: { xaxis: [], yaxis: scale.min < 0 && scale.max > 0 ? [{ y: 0, borderColor: theme === "dark" ? "rgba(245,247,250,0.46)" : "rgba(15,23,42,0.42)", strokeDashArray: 0 }] : [], points: [], images: [], texts: [] },
    xaxis: { type: "category", categories: datesISO, tickPlacement: "on", axisBorder: { show: false }, axisTicks: { show: false }, labels: { hideOverlappingLabels: false, trim: false, rotate: 0, rotateAlways: true, offsetY: 5, style: { colors: theme === "dark" ? "#A8B0BC" : "#4B5563", fontSize: "9px", fontWeight: 500 }, formatter: (value) => visibleDateTicks.has(String(value)) ? new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", timeZone: "UTC" }).format(timestamp(String(value))) : "" } },
    yaxis: { min: scale.min, max: scale.max, tickAmount: scale.tickAmount, forceNiceScale: false, labels: { minWidth: 54, maxWidth: 74, align: "right", offsetX: -3, cssClass: "financial-flow-y-axis-label", style: { colors: theme === "dark" ? "#A8B0BC" : "#4B5563", fontSize: "9px", fontWeight: 500 }, formatter: money } },
    tooltip: { enabled: tooltipEnabled, theme, x: { formatter: (_value, context) => { const dateISO = datesISO[context?.dataPointIndex ?? -1]; return dateISO ? new Intl.DateTimeFormat(locale, { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(timestamp(dateISO)) : ""; } }, y: { formatter: money, title: { formatter: () => `${label}: ` } } },
    legend: { show: false },
  }), [color, datesISO, label, locale, money, resetKey, scale, secondaryColor, theme, tooltipEnabled, visibleDateTicks]);
  return <div className="financial-flow-apex-chart h-[142px] w-full overflow-visible">
    <ApexChart key={`${resetKey}-${theme}`} options={options} series={series} type="bar" height={142} width="100%" />
  </div>;
}
