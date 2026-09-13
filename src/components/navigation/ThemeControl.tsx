"use client";

import Image from "next/image";

import { useLanguage } from "@/components/LanguageProvider";
import { useTheme } from "@/components/ThemeProvider";
import { translations } from "@/i18n/translations";

export function ThemeControl({ orientation = "vertical" }: { orientation?: "vertical" | "horizontal" }) {
  const { language } = useLanguage();
  const { theme, setTheme } = useTheme();
  const t = translations[language].appNavigation;
  const isHorizontal = orientation === "horizontal";

  return (
    <div
      role="group"
      aria-label={t.theme}
      className={`flex shrink-0 items-center justify-center overflow-hidden border-[var(--theme-switch-surface)] bg-[var(--theme-switch-surface)] ${isHorizontal ? "h-[54.188px] w-[102px] flex-row gap-[19.125px] rounded-[35.063px] border-[3.188px]" : "h-[128px] w-[48px] flex-col gap-[24px] rounded-[44px] border-4 px-[2px] py-[12px]"}`}
    >
      <button type="button" onClick={() => setTheme("dark")} aria-label={t.darkTheme} aria-pressed={theme === "light"} title={t.darkTheme} className={`theme-option grid shrink-0 place-items-center rounded-full ${isHorizontal ? "size-[28.688px]" : "size-[36px]"} ${theme === "light" ? "is-selected" : "opacity-40"}`}>
        <Image src="/moneypilot/navigation/moon.svg" alt="" width={20} height={20} className="size-[19.636px]" />
      </button>
      <button type="button" onClick={() => setTheme("light")} aria-label={t.lightTheme} aria-pressed={theme === "dark"} title={t.lightTheme} className={`theme-option grid shrink-0 place-items-center rounded-full ${isHorizontal ? "size-[28.688px]" : "size-[36px]"} ${theme === "dark" ? "is-selected" : "opacity-40"}`}>
        <Image src="/moneypilot/navigation/sun.svg" alt="" width={20} height={20} className="size-[19.636px]" />
      </button>
    </div>
  );
}
