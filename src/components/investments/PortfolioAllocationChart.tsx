"use client";

export function PortfolioAllocationChart({ title, detail }: { title: string; detail: string }) {
  return <div className="investment-empty" role="status"><strong >{title}</strong><p >{detail}</p></div>;
}
