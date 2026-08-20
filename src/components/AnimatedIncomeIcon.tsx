"use client";

import { useEffect, useState } from "react";

type AnimatedIncomeIconProps = {
  variant?: "desktop" | "mobile";
};

export default function AnimatedIncomeIcon({
  variant = "desktop",
}: AnimatedIncomeIconProps) {
  const [isAnimated, setIsAnimated] = useState(false);

  const isMobile = variant === "mobile";
  const size = isMobile ? 26.47 : 24;

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
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Centro */}
      <path
        d="M12 15C13.1046 15 14 14.1046 14 13C14 11.8954 13.1046 11 12 11C10.8954 11 10 11.8954 10 13C10 14.1046 10.8954 15 12 15Z"
        stroke="#005F73"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Ponteiro animado */}
      <g
        style={{
          transformOrigin: "12px 13px",
          transform: isAnimated ? "rotate(0deg)" : "rotate(-90deg)",
          transition: "transform 1.4s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <path
          d="M13.45 11.55L15.5 9.5"
          stroke="#005F73"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Contorno do velocímetro */}
      <path
        d="M6.4 20C4.93815 18.8381 3.87391 17.2502 3.35478 15.4565C2.83564 13.6627 2.88732 11.7519 3.50264 9.98881C4.11797 8.22573 5.26647 6.69771 6.78899 5.6165C8.3115 4.53529 10.1326 3.95443 12 3.95443C13.8674 3.95443 15.6885 4.53529 17.211 5.6165C18.7335 6.69771 19.882 8.22573 20.4974 9.98881C21.1127 11.7519 21.1644 13.6627 20.6452 15.4565C20.1261 17.2502 19.0619 18.8381 17.6 20H6.4Z"
        stroke="#005F73"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}