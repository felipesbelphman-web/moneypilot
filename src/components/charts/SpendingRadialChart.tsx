"use client";

import { useCurrency } from "@/components/CurrencyProvider";
import type { DashboardCategorySpending } from "@/components/dashboard/dashboard-financial-summary";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";
import { ApexDonutChart } from "@/components/charts/ApexDonutChart";

const categoryPalette = ["var(--dashboard-brand-primary)", "var(--dashboard-brand-accent)", "var(--dashboard-brand-primary-hover)", "#22C55E", "#8B5CF6"];
export type DisplayCategorySpending = DashboardCategorySpending & { color: string; composition?: DashboardCategorySpending[] };

export function getDisplayCategorySpending(data: DashboardCategorySpending[], maxItems = 5): DisplayCategorySpending[] {
  const otherCategory: DashboardCategorySpending = { category: "", localizationKey: "other", amount: 0, percentage: 0 };
  const remaining = data.slice(maxItems - 1);
  const visible = data.length <= maxItems ? data : [...data.slice(0, maxItems - 1), { ...remaining.reduce((other, item) => ({ ...other, amount: other.amount + item.amount, percentage: other.percentage + item.percentage }), otherCategory), composition: remaining }];
  return visible.map((item, index) => ({ ...item, color: categoryPalette[index % categoryPalette.length] }));
}

export function SpendingRadialChart({ data, total, showValues }: { data: DisplayCategorySpending[]; total: number | null; showValues: boolean }) {
  const { language } = useLanguage();
  const { formatMoney: money } = useCurrency();
  const t = translations[language].appDashboard;
  if (!showValues || total === null || data.length === 0) return <div className="grid size-[125px] shrink-0 place-items-center text-[8px] text-[#9CA6B2]">{data.length === 0 || total === null ? t.noSpendingData : t.valuesHidden}</div>;
  const items = data.map((item) => ({ label: item.localizationKey ? t[item.localizationKey] : item.category, value: item.amount, valueLabel: money(item.amount), percent: item.percentage * 100, color: item.color, composition: item.composition?.map((part) => part.localizationKey ? t[part.localizationKey] : part.category) }));
  return <div className="size-[125px] shrink-0"><ApexDonutChart items={items} totalLabel={t.total} totalValue={money(total)} size={125} /></div>;
}
