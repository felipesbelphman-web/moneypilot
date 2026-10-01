"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { investmentPresentationCopy } from "./investment-presentation";
import type { Investment } from "@/components/investments/investment-model";
import { calculateInvestmentValuation } from "@/lib/domain/investment-validation";

type InvestmentAssetsListProps = {
  investments: Investment[];
  emptyTitle: string;
  emptyDetail: string;
};

function formatMoney(value: number, currency: string, language: string) {
  return new Intl.NumberFormat(language, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatQuantity(value: number, language: string) {
  return new Intl.NumberFormat(language, {
    maximumFractionDigits: 8,
  }).format(value);
}

export function InvestmentAssetsList({ investments, emptyTitle, emptyDetail }: InvestmentAssetsListProps) {
  const { language } = useLanguage();
  const ui = investmentPresentationCopy[language];
  if (investments.length === 0) return <div className="investment-empty"><strong>{emptyTitle}</strong><p>{emptyDetail}</p></div>;
  return <table className="investment-assets" aria-label={ui.name}>
    <thead><tr><th scope="col">{ui.name}</th><th scope="col">{ui.quantity}</th><th scope="col">{ui.invested}</th><th scope="col">{ui.current}</th></tr></thead>
    <tbody>{investments.map(investment => {
      const valuation = calculateInvestmentValuation(investment);
      return <tr key={investment.id}>
        <td data-label={ui.name}><strong>{investment.name}</strong><small>{investment.symbol ? `${investment.symbol} · ` : ""}{ui.types[investment.assetType]}</small></td>
        <td data-label={ui.quantity}>{formatQuantity(investment.quantity, language)}</td>
        <td data-label={ui.invested}>{valuation.available ? formatMoney(valuation.investedValue, investment.nativeCurrency, language) : ui.unavailable}</td>
        <td data-label={ui.current}>{!valuation.available || valuation.currentValue === null ? ui.unavailable : formatMoney(valuation.currentValue, investment.nativeCurrency, language)}<small>{investment.priceMode === "manual" ? ui.manual : ui.planned}</small></td>
      </tr>;
    })}</tbody>
  </table>;
}
