"use client";

import { useEffect, useState } from "react";

type AnimatedExpenseIconProps = {
  variant?: "desktop" | "mobile";
};

export default function AnimatedExpenseIcon({
  variant = "desktop",
}: AnimatedExpenseIconProps) {
  const [isAnimated, setIsAnimated] = useState(false);

  const isMobile = variant === "mobile";
  const size = isMobile ? 22 : 20;

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
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Seta superior */}
      <g
        style={{
          opacity: isAnimated ? 1 : 0,
          transform: isAnimated
            ? "translateY(0px)"
            : "translateY(-4px)",
          transition:
            "opacity 300ms ease-out, transform 500ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <path
          d="M12.7499 5.99987V2.99987L8.99993 5.24987L5.24993 2.99987V5.99987L8.99993 8.24987L12.7499 5.99987Z"
          stroke="#9B2226"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Seta inferior */}
      <g
        style={{
          opacity: isAnimated ? 1 : 0,
          transform: isAnimated
            ? "translateY(0px)"
            : "translateY(-4px)",
          transition:
            "opacity 300ms ease-out 160ms, transform 500ms cubic-bezier(0.22, 1, 0.36, 1) 160ms",
        }}
      >
        <path
          d="M12.7499 12.7499V9.74989L8.99993 11.9999L5.24993 9.74989V12.7499L8.99993 14.9999L12.7499 12.7499Z"
          stroke="#9B2226"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}