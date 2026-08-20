"use client";

import { useEffect, useState } from "react";

export default function AnimatedGoalIcon() {
  const [showArrow, setShowArrow] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
  const frame = requestAnimationFrame(() => {
    setShowArrow(true);
  });

  return () => cancelAnimationFrame(frame);
}

    const timer = window.setTimeout(() => {
      setShowArrow(true);
    }, 500);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="relative h-[24px] w-[24px]">
      {/* Alvo sem flecha */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="1"
          stroke="white"
          strokeWidth="2"
        />

        <circle
          cx="12"
          cy="12"
          r="5"
          stroke="white"
          strokeWidth="2"
        />

        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="white"
          strokeWidth="2"
        />
      </svg>

      {/* Flecha */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0"
        aria-hidden="true"
      >
        <g
          style={{
            opacity: showArrow ? 1 : 0,
            transform: showArrow
              ? "translate(0px, 0px)"
              : "translate(10px, -10px)",
            transformOrigin: "12px 12px",
            transition:
              "transform 700ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease-out",
          }}
        >
          {/* Corpo da flecha */}
          <path
            d="M12 12L19 5"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Ponta */}
          <path
            d="M16 5H19V8"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Pequeno impacto no centro */}
        <circle
          cx="12"
          cy="12"
          r={showArrow ? "2.4" : "1"}
          stroke="white"
          strokeWidth="1"
          opacity={showArrow ? "0" : "0"}
          style={{
            transition:
              "r 350ms ease-out 650ms, opacity 350ms ease-out 650ms",
          }}
        />
      </svg>
    </div>
  );
}