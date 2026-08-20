"use client";

import { useEffect, useId, useState } from "react";

const FINAL_VALUE = 2264;

type AnimatedExpenseTotalChartProps = {
  variant?: "desktop" | "mobile";
};

export default function AnimatedExpenseTotalChart({
  variant = "desktop",
}: AnimatedExpenseTotalChartProps) {
  const [progress, setProgress] = useState(0);
  const [value, setValue] = useState(0);

  const isMobile = variant === "mobile";

  // Evita conflito entre o gráfico desktop e o mobile.
  const generatedId = useId();
  const maskId = `expense-chart-reveal-${generatedId.replace(/:/g, "")}`;

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
  const frame = requestAnimationFrame(() => {
    setProgress(1);
    setValue(FINAL_VALUE);
  });

  return () => cancelAnimationFrame(frame);
}

    const duration = 1600;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const animationProgress = Math.min(elapsed / duration, 1);

      const easedProgress = 1 - Math.pow(1 - animationProgress, 3);

      setProgress(easedProgress);
      setValue(FINAL_VALUE * easedProgress);

      if (animationProgress < 1) {
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

  const size = isMobile ? 111.24 : 156;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 156 156"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`Total de gastos: €${formattedValue}`}
    >
      <defs>
        <mask id={maskId}>
          <rect width="156" height="156" fill="black" />

          <circle
            cx="78"
            cy="78"
            r="72"
            fill="none"
            stroke="white"
            strokeWidth="15"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset={1 - progress}
            transform="rotate(-90 78 78)"
          />
        </mask>
      </defs>

      {/* Gráfico circular */}
      <g mask={`url(#${maskId})`}>
        <path
          opacity="0.2"
          d="M146.779 58.5189C149.877 57.665 151.718 54.4511 150.634 51.4255C145.694 37.6318 136.945 25.5151 125.406 16.4857C122.875 14.5051 119.245 15.2408 117.46 17.913C115.675 20.5853 116.413 24.1797 118.917 26.1936C128.161 33.6261 135.231 43.4179 139.378 54.5304C140.501 57.5414 143.681 59.3729 146.779 58.5189Z"
          fill="#FFF5ED"
        />

        <path
          opacity="0.7"
          d="M48.6586 11.9085C47.3631 8.96733 43.9161 7.61395 41.0803 9.1262C33.5522 13.1406 26.7257 18.3758 20.8844 24.6303C13.7168 32.3048 8.18176 41.3545 4.61441 51.231C1.04705 61.1076 -0.478321 71.6055 0.130704 82.0888C0.627026 90.6325 2.53254 99.0216 5.7577 106.92C6.97264 109.895 10.4889 111.057 13.3648 109.623C16.2408 108.188 17.3833 104.701 16.2078 101.71C13.663 95.2342 12.1544 88.3846 11.7495 81.4139C11.2318 72.503 12.5284 63.5798 15.5606 55.1847C18.5929 46.7896 23.2977 39.0975 29.3901 32.5741C34.156 27.4711 39.6934 23.1664 45.7891 19.8114C48.6047 18.2618 49.9541 14.8497 48.6586 11.9085Z"
          fill="#FFF5ED"
        />

        <path
          d="M147.9 63.1913C151.049 62.5466 154.147 64.5757 154.554 67.7636C156.63 84.0225 153.507 100.579 145.551 115.023C136.656 131.172 122.301 143.625 105.059 150.153C87.8164 156.68 68.8132 156.854 51.4542 150.644C35.9274 145.089 22.6235 134.752 13.4122 121.194C11.6061 118.536 12.5838 114.964 15.37 113.362C18.1561 111.76 21.6928 112.738 23.5339 115.372C31.3416 126.543 42.4523 135.063 55.3744 139.686C70.1296 144.964 86.2823 144.816 100.938 139.268C115.594 133.72 127.796 123.134 135.356 109.408C141.978 97.3867 144.661 83.6446 143.114 70.1038C142.749 66.9107 144.752 63.836 147.9 63.1913Z"
          fill="#FFF5ED"
        />

        <path
          opacity="0.4"
          d="M53.0634 10.1398C51.9651 7.11944 53.519 3.75804 56.6132 2.88918C65.6607 0.3486 75.1108 -0.53161 84.503 0.308654C93.8952 1.14892 103.039 3.69262 111.492 7.79886C114.383 9.20316 115.315 12.787 113.698 15.5645C112.081 18.3419 108.528 19.2571 105.619 17.8912C98.6549 14.6215 91.1584 12.5889 83.4659 11.9007C75.7734 11.2125 68.0352 11.8821 60.6015 13.8638C57.4961 14.6916 54.1616 13.1602 53.0634 10.1398Z"
          fill="#FFF5ED"
        />
      </g>

      {/* Valor central */}
      <text
        x="78"
        y={isMobile ? "86" : "84"}
        textAnchor="middle"
        fill="#FFF5ED"
        opacity="0.9"
        fontSize={isMobile ? "33.6" : "20"}
        fontFamily="var(--font-bebas-neue)"
      >
        €{formattedValue}
      </text>
    </svg>
  );
}