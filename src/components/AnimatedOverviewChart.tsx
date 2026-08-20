"use client";

import { useEffect, useState } from "react";

type AnimatedOverviewChartProps = {
  variant?: "desktop" | "mobile";
};

export default function AnimatedOverviewChart({
  variant = "desktop",
}: AnimatedOverviewChartProps) {
  const [isAnimated, setIsAnimated] = useState(false);

  const isMobile = variant === "mobile";

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
    <>
      {/* Linha rosa */}
      <div
        className={
          isMobile
            ? "absolute left-[18px] top-[61px] h-[74px] w-[347px]"
            : "absolute left-[18px] top-[61px] h-[58px] w-[314px]"
        }
      >
        <svg
          viewBox="0 0 315.842 53.4925"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0.894696 51.9002L12.8519 45.1813C21.0888 40.5529 31.0847 40.3094 39.5373 44.5313C48.6635 49.0896 59.5304 48.4203 68.0282 42.7765L72.5363 39.7824C82.3216 33.2835 94.5704 31.698 105.688 35.4913L112.398 37.7808L119.081 40.8619C134.338 47.8961 151.845 48.2108 167.345 41.7293C173.595 39.1158 179.357 35.4627 184.386 30.925L203.485 13.6947L206.808 10.8831C218.98 0.583043 236.263 -1.09102 250.186 6.68137C253.583 8.5773 256.67 10.9799 259.342 13.8063L259.792 14.282C272.922 28.1695 293.701 31.5972 310.595 22.6624L314.988 20.3391"
            stroke="#F8A4FF"
            strokeWidth="3.65278"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset={isAnimated ? 0 : 1}
            style={{
              transition: "stroke-dashoffset 1.2s ease-out",
            }}
          />
        </svg>
      </div>

      {/* Linha verde */}
      <div
        className={
          isMobile
            ? "absolute left-[18px] top-[52px] h-[96px] w-[351px]"
            : "absolute left-[18px] top-[52px] h-[80px] w-[318px]"
        }
      >
        <svg
          viewBox="0 0 319.248 69.443"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M1.0796 28.399L16.5868 39.7635C19.73 42.067 22.0454 45.3237 23.1884 49.0492L23.6834 50.6625C27.1413 61.9328 40.7772 66.2997 50.139 59.1348C56.2716 54.4413 64.8042 54.4964 70.8756 59.2687L75.0378 62.5403C83.5589 69.238 95.534 69.3153 104.141 62.7282L116.477 53.2869C118.327 51.8711 120.287 50.6053 122.338 49.5015L139.472 40.2815C147.344 36.0454 154.551 30.6765 160.863 24.3464L174.829 10.3409C177.41 7.75235 180.458 5.67597 183.812 4.22153C197.392 -1.66772 213.228 3.63393 220.524 16.5127L223.861 22.4024C226.106 26.3651 229.074 29.8723 232.61 32.7429L248.949 46.0079C256.31 51.984 264.908 56.2498 274.119 58.4968C283.957 60.8966 294.223 60.9277 304.075 58.5877L318.826 55.0841"
            stroke="#0EC94E"
            strokeWidth="3.65278"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset={isAnimated ? 0 : 1}
            style={{
              transition: "stroke-dashoffset 1.35s ease-out",
              transitionDelay: "0.15s",
            }}
          />
        </svg>
      </div>

      {/* Ponto destacado */}
      <div
        className={
          isMobile
            ? "absolute left-[229px] top-[47px] h-[11px] w-[11px]"
            : "absolute left-[205px] top-[47px] h-[11px] w-[11px]"
        }
        style={{
          opacity: isAnimated ? 1 : 0,
          transform: isAnimated ? "scale(1)" : "scale(0.4)",
          transition:
            "opacity 0.28s ease-out 0.95s, transform 0.28s ease-out 0.95s",
        }}
      >
        <svg
          viewBox="0 0 11 11"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full"
          aria-hidden="true"
        >
          <circle cx="5.5" cy="5.5" r="5.5" fill="#D9D9D9" />
          <circle cx="5.5" cy="5.5" r="3.5" fill="#0EC94E" />
        </svg>
      </div>
    </>
  );
}