"use client";

export type InvestmentRange = "7D" | "1M" | "3M" | "1A";

export function InvestmentPerformanceChart({ title, detail }: { title: string; detail: string }) {
  return <div className="investment-empty" role="status"><strong >{title}</strong><p >{detail}</p></div>;
}
