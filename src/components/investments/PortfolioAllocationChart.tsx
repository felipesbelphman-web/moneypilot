"use client";

export function PortfolioAllocationChart({ title, detail }: { title: string; detail: string }) {
  return <div className="flex h-[145px] flex-col items-center justify-center text-center"><strong className="text-[10px]">{title}</strong><p className="mt-[5px] text-[8.5px] text-[#9CA6B2]">{detail}</p></div>;
}
