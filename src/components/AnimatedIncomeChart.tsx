"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";

const points = [
  { cx: 3.29311, cy: 64.7645 },
  { cx: 34.028, cy: 47.2014 },
  { cx: 58.1784, cy: 55.9828 },
  { cx: 82.3273, cy: 29.6381 },
  { cx: 97.6959, cy: 29.6381 },
  { cx: 119.65, cy: 3.29311 },
  { cx: 139.409, cy: 25.2473 },
  { cx: 152.582, cy: 23.0517 },
  { cx: 167.948, cy: 31.8335 },
  { cx: 187.707, cy: 20.8562 },
];

export default function AnimatedIncomeChart() {
  const { language } = useLanguage();
  const t = translations[language].landing.dashboard;
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
  const frame = requestAnimationFrame(() => {
    setIsAnimated(true);
  });

  return () => cancelAnimationFrame(frame);
}

    const frame = requestAnimationFrame(() => {
      setIsAnimated(true);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <svg
      width="191"
      height="69"
      viewBox="0 0 191 69"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={t.incomeChartLabel}
    >
      {/* Linha principal */}
      <path
        d="M4.39014 65.8621C8.04915 67.3257 18.8798 66.0816 32.9304 49.3965C38.4189 45.0059 53.7868 57.0805 60.373 54.8851C64.7638 52.3238 75.5213 43.6886 83.4248 29.638H97.6949C101.685 23.2544 107.995 12.8104 113.673 6.73922C117.027 3.15321 122.516 2.80838 125.877 6.38853C134.556 15.636 134.957 33.3304 151.482 24.1495C155.873 28.1744 166.631 34.907 174.534 29.638C182.438 24.369 188.073 20.8564 189.902 19.7587"
        stroke="#0A9396"
        strokeWidth="3.95173"
        pathLength="1"
        strokeDasharray="1"
        strokeDashoffset={isAnimated ? 0 : 1}
        style={{
          transition: "stroke-dashoffset 1.6s ease-out",
        }}
      />

      {/* Pontos */}
      {points.map((point, index) => (
        <circle
          key={`${point.cx}-${point.cy}`}
          cx={point.cx}
          cy={point.cy}
          r="2.79311"
          fill="#FCFDFD"
          stroke="#0A9396"
          opacity={isAnimated ? 1 : 0}
          style={{
            transition: "opacity 0.25s ease-out",
            transitionDelay: `${0.15 + index * 0.14}s`,
          }}
        />
      ))}
    </svg>
  );
}
