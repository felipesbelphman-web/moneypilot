"use client";

import { useEffect, useState } from "react";

const FINAL_VALUE = 455.49;
const FINAL_PERCENT = 12;

type AnimatedBalanceValuesProps = {
  variant?: "desktop" | "mobile";
};

export default function AnimatedBalanceValues({
  variant = "desktop",
}: AnimatedBalanceValuesProps) {
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
      <p
        className={
          isMobile
            ? "absolute right-[14px] top-[25px] text-[22px] leading-[24px] text-[#161616]"
            : "absolute right-[14px] top-[18px] flex h-[32px] items-center text-[22px] text-[#161616]"
        }
        style={{ fontFamily: "var(--font-bebas-neue)" }}
      >
        +{Math.round(percent)}%
      </p>

      {/* Valor */}
      <p
        className={
          isMobile
            ? "absolute left-[14px] top-[106px] whitespace-nowrap text-[34px] leading-[30px] text-[#161616]"
            : "absolute left-[14px] top-[101px] whitespace-nowrap text-[38px] leading-[29px] text-[#161616]"
        }
        style={{ fontFamily: "var(--font-bebas-neue)" }}
      >
        €{formattedValue}
      </p>
    </>
  );
}