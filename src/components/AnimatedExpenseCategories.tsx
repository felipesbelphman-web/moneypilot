"use client";

import { useEffect, useState } from "react";

const categories = [
  { name: "Moradia", value: "55%" },
  { name: "Alimentação", value: "25%" },
  { name: "Transporte", value: "15%" },
  { name: "Lazer", value: "10%" },
  { name: "Saúde", value: "8%" },
];

type AnimatedExpenseCategoriesProps = {
  variant?: "desktop" | "mobile";
};

export default function AnimatedExpenseCategories({
  variant = "desktop",
}: AnimatedExpenseCategoriesProps) {
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

    const timer = window.setTimeout(() => {
      setIsAnimated(true);
    }, 550);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      className={
        isMobile
          ? "flex w-[206px] flex-col gap-[5px] text-white"
          : "absolute left-[236px] top-[62px] flex w-[287px] flex-col gap-[9px] text-[13px] font-medium leading-[16px] text-white"
      }
    >
      {categories.map((category, index) => (
        <div key={category.name}>
          <div
            className="flex items-center justify-between"
            style={{
              opacity: isAnimated ? 1 : 0,
              transform: isAnimated ? "translateY(0)" : "translateY(7px)",
              transition:
                "opacity 0.35s ease-out, transform 0.35s ease-out",
              transitionDelay: `${index * 0.12}s`,
            }}
          >
            <div
              className={
                isMobile
                  ? "flex items-center gap-[5px]"
                  : "flex items-center gap-2"
              }
            >
              <span
                className={
                  isMobile
                    ? "h-[5.23px] w-[5.23px] rounded-full bg-white"
                    : "h-[7px] w-[7px] rounded-full bg-white"
                }
              />

              <span
                className={
                  isMobile
                    ? "text-[12px] font-medium leading-[15px]"
                    : ""
                }
              >
                {category.name}
              </span>
            </div>

            <span
              className={
                isMobile
                  ? "text-[9.16px] font-medium leading-[11px]"
                  : ""
              }
            >
              {category.value}
            </span>
          </div>

          {index < categories.length - 1 && (
            <div
              className={
                isMobile
                  ? "mt-[5px] h-px w-full bg-white/20"
                  : "mt-[9px] h-px w-full bg-white/20"
              }
              style={{
                opacity: isAnimated ? 1 : 0,
                transition: "opacity 0.3s ease-out",
                transitionDelay: `${0.1 + index * 0.12}s`,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}