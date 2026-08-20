"use client";

import { useEffect, useState } from "react";

const FINAL_VALUE = 12450;
const FINAL_PERCENT = 8;

type AnimatedIncomeValuesProps = {
  variant?: "desktop" | "mobile";
};

export default function AnimatedIncomeValues({
  variant = "desktop",
}: AnimatedIncomeValuesProps) {
  const [value, setValue] = useState(0);
  const [percent, setPercent] = useState(0);

  const isMobile = variant === "mobile";

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
  const frame = requestAnimationFrame(() => {
    setValue(FINAL_VALUE);
    setPercent(FINAL_PERCENT);
  });

  return () => cancelAnimationFrame(frame);
}

    const duration = 1400;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Começa rápido e desacelera suavemente no final.
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setValue(FINAL_VALUE * easedProgress);
      setPercent(FINAL_PERCENT * easedProgress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, []);

  const formattedValue = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  return (
    <>
      {/* Percentual */}
      <span
        className={
          isMobile
            ? "absolute right-[14px] top-[25px] text-[26px] leading-[27px] text-white"
            : "absolute right-[18px] top-[29px] text-[24px] leading-[14px] text-white"
        }
        style={{ fontFamily: "var(--font-bebas-neue)" }}
      >
        +{Math.round(percent)}%
      </span>

      {/* Valor */}
      <p
        className={
          isMobile
            ? "absolute left-[14px] top-[97px] whitespace-nowrap text-[34px] leading-[35px] text-white"
            : "absolute left-[16px] top-[97px] whitespace-nowrap text-[31px] leading-8 text-white"
        }
        style={{ fontFamily: "var(--font-bebas-neue)" }}
      >
        €{formattedValue}
      </p>
    </>
  );
}