"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { ApexOptions } from "apexcharts";
import { useCurrency } from "@/components/CurrencyProvider";
import { useLanguage, type Language } from "@/components/LanguageProvider";
import { useTheme } from "@/components/ThemeProvider";
import { getFinancialChartScale } from "@/components/financial-flow/financialChartScale";

const ApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => <div className="h-[142px] w-full" aria-hidden="true" />,
});

const localeByLanguage: Record<Language, string> = {
  en: "en-GB",
  pt: "pt-PT",
  es: "es-ES",
  de: "de-DE",
  fr: "fr-FR",
  nl: "nl-NL",
  it: "it-IT",
};

const toolbarCopy: Record<Language, { selectionZoom: string; zoomIn: string; zoomOut: string; pan: string; reset: string }> = {
  en: { selectionZoom: "Zoom selection", zoomIn: "Zoom in", zoomOut: "Zoom out", pan: "Pan", reset: "Reset zoom" },
  pt: { selectionZoom: "Selecionar zoom", zoomIn: "Ampliar", zoomOut: "Reduzir", pan: "Mover", reset: "Redefinir zoom" },
  es: { selectionZoom: "Seleccionar zoom", zoomIn: "Acercar", zoomOut: "Alejar", pan: "Desplazar", reset: "Restablecer zoom" },
  de: { selectionZoom: "Zoom auswählen", zoomIn: "Vergrößern", zoomOut: "Verkleinern", pan: "Verschieben", reset: "Zoom zurücksetzen" },
  fr: { selectionZoom: "Sélectionner le zoom", zoomIn: "Zoom avant", zoomOut: "Zoom arrière", pan: "Déplacer", reset: "Réinitialiser le zoom" },
  nl: { selectionZoom: "Zoom selecteren", zoomIn: "Inzoomen", zoomOut: "Uitzoomen", pan: "Verschuiven", reset: "Zoom herstellen" },
  it: { selectionZoom: "Seleziona zoom", zoomIn: "Ingrandisci", zoomOut: "Riduci", pan: "Sposta", reset: "Reimposta zoom" },
};

type FinancialFlowAreaChartProps = {
  color: string;
  datesISO: string[];
  label: string;
  resetKey: string;
  values: number[];
};

function civilDateToUtcTimestamp(dateISO: string) {
  const [year, month, day] = dateISO.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function FinancialFlowAreaChart({ color, datesISO, label, resetKey, values }: FinancialFlowAreaChartProps) {
  const { language } = useLanguage();
  const { formatMoney: money } = useCurrency();
  const { theme } = useTheme();
  const locale = localeByLanguage[language];
  const copy = toolbarCopy[language];

  const series = useMemo(
    () => [{ name: label, data: values }],
    [label, values],
  );
  const scale = useMemo(() => getFinancialChartScale([values]), [values]);
  const visibleDateTicks = useMemo(() => new Set(Array.from({ length: Math.min(5, datesISO.length) }, (_, index) => {
    const pointIndex = Math.round(index * (datesISO.length - 1) / Math.max(1, Math.min(5, datesISO.length) - 1));
    return datesISO[pointIndex];
  })), [datesISO]);

  const options = useMemo<ApexOptions>(() => ({
    chart: {
      id: `financial-flow-${resetKey}`,
      type: "area",
      height: 142,
      background: "transparent",
      foreColor: theme === "dark" ? "#9CA6B2" : "#596474",
      fontFamily: "inherit",
      animations: { enabled: false },
      locales: [{ name: language, options: { toolbar: copy } }],
      defaultLocale: language,
      parentHeightOffset: 0,
      toolbar: {
        show: true,
        offsetX: -2,
        offsetY: -5,
        autoSelected: "zoom",
        tools: { download: false, selection: false, zoom: true, zoomin: true, zoomout: true, pan: true, reset: true },
      },
      zoom: { enabled: true, type: "x", autoScaleYaxis: false },
    },
    colors: [color],
    dataLabels: { enabled: false },
    stroke: { curve: "straight", width: 3, lineCap: "round" },
    fill: {
      type: "gradient",
      gradient: { shadeIntensity: 0, opacityFrom: 0.5, opacityTo: 0, stops: [0, 100] },
    },
    markers: { size: 0, hover: { size: 4, sizeOffset: 2 }, strokeWidth: 2, strokeColors: color },
    grid: {
      show: true,
      borderColor: theme === "dark" ? "rgba(145,158,171,0.16)" : "rgba(71,85,105,0.14)",
      strokeDashArray: 3,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { top: 0, right: 8, bottom: 7, left: 18 },
    },
    annotations: {
      xaxis: [],
      yaxis: scale.min < 0 && scale.max > 0 ? [{ y: 0, borderColor: theme === "dark" ? "rgba(245,247,250,0.46)" : "rgba(15,23,42,0.42)", strokeDashArray: 0 }] : [],
      points: [],
      images: [],
      texts: [],
    },
    xaxis: {
      type: "category",
      categories: datesISO,
      tickPlacement: "on",
      axisBorder: { show: false },
      axisTicks: { show: false },
      crosshairs: { show: true, stroke: { color, width: 1, dashArray: 3 } },
      labels: {
        hideOverlappingLabels: false,
        trim: false,
        rotate: 0,
        rotateAlways: true,
        offsetY: 5,
        style: { colors: theme === "dark" ? "#A8B0BC" : "#4B5563", fontSize: "9px", fontWeight: 500, fontFamily: "var(--font-financial-condensed)" },
        formatter: (value) => visibleDateTicks.has(String(value)) ? new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", timeZone: "UTC" }).format(civilDateToUtcTimestamp(String(value))) : "",
      },
      tooltip: { enabled: false },
    },
    yaxis: {
      opposite: false,
      tickAmount: scale.tickAmount,
      forceNiceScale: false,
      min: scale.min,
      max: scale.max,
      labels: {
        minWidth: 54,
        maxWidth: 74,
        align: "right",
        offsetX: -3,
        cssClass: "financial-flow-y-axis-label",
        style: { colors: theme === "dark" ? "#A8B0BC" : "#4B5563", fontSize: "9px", fontWeight: 500, fontFamily: "var(--font-financial-condensed)" },
        formatter: (value) => money(value),
      },
    },
    tooltip: {
      enabled: true,
      shared: false,
      intersect: false,
      theme,
      x: {
        formatter: (_value, context) => {
          const dateISO = datesISO[context?.dataPointIndex ?? -1];
          return dateISO ? new Intl.DateTimeFormat(locale, { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).format(civilDateToUtcTimestamp(dateISO)) : "";
        },
      },
      y: { formatter: (value) => money(value), title: { formatter: () => `${label}: ` } },
    },
    legend: { show: false },
  }), [color, copy, datesISO, label, language, locale, money, resetKey, scale, theme, visibleDateTicks]);

  return (
    <div className="financial-flow-apex-chart h-[142px] w-full overflow-visible [&_.apexcharts-toolbar]:origin-top-right [&_.apexcharts-toolbar]:scale-[0.78]">
      <ApexChart key={`${resetKey}-${theme}`} options={options} series={series} type="area" height={142} width="100%" />
    </div>
  );
}
