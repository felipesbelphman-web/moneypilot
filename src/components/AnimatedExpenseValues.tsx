"use client";

import { useEffect, useState } from "react";

const FINAL_VALUE = 966.51;
const FINAL_PERCENT = 5;

type AnimatedExpenseValuesProps = {
  variant?: "desktop" | "mobile";
};

export default function AnimatedExpenseValues({
  variant = "desktop",
}: AnimatedExpenseValuesProps) {
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
      {/* Valor */}
      <p
        className={
          isMobile
            ? "absolute right-[14px] top-[107px] whitespace-nowrap text-[34px] leading-[34px] text-white"
            : "absolute right-[16px] top-[103px] whitespace-nowrap text-[37px] leading-[31px] text-white"
        }
        style={{ fontFamily: "var(--font-bebas-neue)" }}
      >
        €{formattedValue}
      </p>

      {/* Percentual */}
      <p
        className={
          isMobile
            ? "absolute right-[14px] top-[153px] text-[25px] leading-[15px] text-white"
            : "absolute right-[12px] top-[143px] text-[23px] leading-[13px] text-white"
        }
        style={{ fontFamily: "var(--font-bebas-neue)" }}
      >
        -{Math.round(percent)}%
      </p>
    </>
  );
}