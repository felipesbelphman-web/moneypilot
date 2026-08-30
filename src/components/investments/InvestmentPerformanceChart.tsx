"use client";

export type InvestmentRange = "7D" | "1M" | "3M" | "1A";

export function InvestmentPerformanceChart({ title, detail }: { title: string; detail: string }) {
  return <div className="flex h-[130px] w-[653px] flex-col items-center justify-center text-center"><strong className="text-[10px]">{title}</strong><p className="mt-[5px] text-[8.5px] text-[#9CA6B2]">{detail}</p></div>;
}
