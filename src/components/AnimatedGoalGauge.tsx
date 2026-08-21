"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";

const FINAL_PROGRESS = 37;

const rings = [
  {
    radius: 25.65,
    finalPercent: 30.2,
    color: "#CFFE56",
  },
  {
    radius: 30,
    finalPercent: 37.5,
    color: "#6AC4DC",
  },
  {
    radius: 34.6,
    finalPercent: 42.5,
    color: "#FA531C",
  },
  {
    radius: 39.2,
    finalPercent: 60.6,
    color: "#B729E9",
  },
];

type AnimatedGoalGaugeProps = {
  variant?: "desktop" | "mobile";
};

export default function AnimatedGoalGauge({
  variant = "desktop",
}: AnimatedGoalGaugeProps) {
  const { language } = useLanguage();
  const t = translations[language].landing.dashboard;
  const [progress, setProgress] = useState(0);

  const isMobile = variant === "mobile";

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
  const frame = requestAnimationFrame(() => {
    setProgress(FINAL_PROGRESS);
  });

  return () => cancelAnimationFrame(frame);
}

    const duration = 1400;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const animationProgress = Math.min(elapsed / duration, 1);

      // Começa rápido e desacelera suavemente no final.
      const easedProgress = 1 - Math.pow(1 - animationProgress, 3);

      setProgress(FINAL_PROGRESS * easedProgress);

      if (animationProgress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <svg
      width="82"
      height="81"
      viewBox="0 0 82 81"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`${t.goalProgressLabel}: ${Math.round(progress)}%`}
    >
      {rings.map((ring) => {
        const circumference = 2 * Math.PI * ring.radius;

        const animatedPercent =
          (progress / FINAL_PROGRESS) * ring.finalPercent;

        const dashOffset =
          circumference * (1 - animatedPercent / 100);

        return (
          <g key={ring.radius}>
            {/* Fundo do anel */}
            <circle
              cx="40.65"
              cy="40.5"
              r={ring.radius}
              stroke="#FFF5ED"
              strokeOpacity="0.1"
              strokeWidth="2.8"
              fill="none"
            />

            {/* Parte colorida */}
            <circle
              cx="40.65"
              cy="40.5"
              r={ring.radius}
              stroke={ring.color}
              strokeWidth="2.8"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 40.65 40.5)"
            />
          </g>
        );
      })}

      <text
        x="40.65"
        y={isMobile ? "45.5" : "44"}
        textAnchor="middle"
        fill="#C3C4C4"
        fontSize={isMobile ? "15.34" : "11"}
        fontWeight="500"
        fontFamily="inherit"
      >
        {Math.round(progress)}%
      </text>
    </svg>
  );
}
