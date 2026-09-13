"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { ApexOptions } from "apexcharts";
import { useLanguage, type Language } from "@/components/LanguageProvider";
import { useTheme } from "@/components/ThemeProvider";
import { useCurrency } from "@/components/CurrencyProvider";

const ApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
  loading: () => <div className="h-[108px] w-full" aria-hidden="true" />,
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

const usagePhraseByLanguage: Record<Language, { connector: string; suffix: string }> = {
  en: { connector: "of", suffix: "used" },
  pt: { connector: "de", suffix: "utilizados" },
  es: { connector: "de", suffix: "utilizados" },
  de: { connector: "von", suffix: "verwendet" },
  fr: { connector: "sur", suffix: "utilisés" },
  nl: { connector: "van", suffix: "gebruikt" },
  it: { connector: "su", suffix: "utilizzati" },
};

type MonthlyBudgetRadialGaugeProps = {
  excessLabel: string | null;
  label: string;
  limit: number;
  month: string;
  percent: number;
  spent: number;
  spentLabel: string;
};

export function MonthlyBudgetRadialGauge({ excessLabel, label, limit, month, percent, spent, spentLabel }: MonthlyBudgetRadialGaugeProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { formatMoney: money } = useCurrency();
  const locale = localeByLanguage[language];
  const arcPercent = Math.min(100, Math.max(0, percent));
  const percentLabel = `${percent.toLocaleString(locale, { maximumFractionDigits: 1 })}%`;
  const usagePhrase = usagePhraseByLanguage[language];

  const options = useMemo<ApexOptions>(() => ({
    chart: {
      id: `monthly-budget-usage-${month}`,
      type: "radialBar",
      height: 108,
      background: "transparent",
      fontFamily: "inherit",
      foreColor: theme === "dark" ? "#9CA6B2" : "#596474",
      animations: { enabled: false },
      sparkline: { enabled: true },
      parentHeightOffset: 0,
    },
    colors: ["var(--dashboard-chart-primary)"],
    stroke: { dashArray: 5, lineCap: "butt" },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: { size: "55%", background: "transparent" },
        track: {
          startAngle: -135,
          endAngle: 135,
          background: "var(--dashboard-brand-soft-strong)",
          strokeWidth: "96%",
          margin: 3,
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            show: true,
            offsetY: 7.2,
            color: theme === "dark" ? "#F5F7FA" : "#172033",
            fontSize: "20px",
            fontWeight: 700,
            fontFamily: "var(--font-financial-condensed)",
            formatter: () => percentLabel,
          },
        },
      },
    },
    labels: [label],
    tooltip: { enabled: false },
  }), [label, month, percentLabel, theme]);

  return (
    <div id={`monthly-budget-gauge-${month}`} className="relative h-[124px] w-full">
      <style>{`#monthly-budget-gauge-${month} .apexcharts-radialbar-track path { stroke-dasharray: 5 5; }`}</style>
      <ApexChart key={month} options={options} series={[arcPercent]} type="radialBar" height={108} width="100%" />
      <p className="absolute inset-x-0 top-[89.43px] text-center text-[10px] font-medium leading-[12px] text-[var(--financial-flow-muted)]">{label}</p>
      <p className={`absolute inset-x-0 whitespace-nowrap text-center text-[9px] leading-[11px] text-[var(--financial-flow-muted)] ${excessLabel ? "bottom-[11px]" : "bottom-0"}`} aria-label={`${spentLabel}: ${money(spent)} ${usagePhrase.connector} ${money(limit)} ${usagePhrase.suffix}`}>
        <strong className="numeric-value font-semibold text-[var(--text-primary)]">{money(spent)}</strong> {usagePhrase.connector} <strong className="numeric-value font-semibold text-[var(--text-primary)]">{money(limit)}</strong> {usagePhrase.suffix}
      </p>
      {excessLabel && <p className="absolute inset-x-0 bottom-0 whitespace-nowrap text-center text-[8px] font-medium leading-[10px] text-[#F59E0B]">{excessLabel}</p>}
    </div>
  );
}
