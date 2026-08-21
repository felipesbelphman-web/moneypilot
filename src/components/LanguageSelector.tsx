"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import {
  type Language,
  useLanguage,
} from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";

const languages: {
  code: Language;
  label: string;
  flag: string;
  flagAlt: string;
}[] = [
  {
    code: "en",
    label: "EN",
    flag: "/moneypilot/language-usa.svg",
    flagAlt: "English",
  },
  {
    code: "pt",
    label: "PT",
    flag: "/moneypilot/language-brazil.svg",
    flagAlt: "Português",
  },
  {
    code: "es",
    label: "ES",
    flag: "/moneypilot/language-spain.svg",
    flagAlt: "Español",
  },
];

function UsaFlag() {
  return (
    <div className="relative h-6 w-6 shrink-0">
      <Image
        src="/moneypilot/language-usa.svg"
        alt="English"
        fill
        className="object-fill"
      />

      <div className="absolute inset-[18.28%_0.08%_18.27%_0.08%]">
        <Image
          src="/moneypilot/language-usa-layer-1.svg"
          alt=""
          fill
          className="object-fill"
        />
      </div>

      <div className="absolute inset-[0_16.59%_87.2%_16.59%]">
        <Image
          src="/moneypilot/language-usa-layer-2.svg"
          alt=""
          fill
          className="object-fill"
        />
      </div>

      <div className="absolute inset-[87.22%_16.61%_0_16.61%]">
        <Image
          src="/moneypilot/language-usa-layer-3.svg"
          alt=""
          fill
          className="object-fill"
        />
      </div>

      <div className="absolute inset-[0_43%_47.11%_0]">
        <Image
          src="/moneypilot/language-usa-layer-4.svg"
          alt=""
          fill
          className="object-fill"
        />
      </div>

      <div className="absolute inset-[14.22%_45.55%_49.28%_2.55%]">
        <Image
          src="/moneypilot/language-usa-layer-5.svg"
          alt=""
          fill
          className="object-fill"
        />
      </div>

      <div className="absolute inset-[0.01%_45.55%_85.78%_17.42%]">
        <Image
          src="/moneypilot/language-usa-layer-6.svg"
          alt=""
          fill
          className="object-fill"
        />
      </div>

      <Image
        src="/moneypilot/language-usa-layer-7.svg"
        alt=""
        fill
        className="object-fill"
      />
    </div>
  );
}

function LanguageFlag({
  language,
  alt,
  src,
}: {
  language: Language;
  alt: string;
  src: string;
}) {
  if (language === "en") {
    return <UsaFlag />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={24}
      height={24}
      className="h-6 w-6 shrink-0 object-contain"
    />
  );
}

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const t = translations[language];

  const [isOpen, setIsOpen] = useState(false);

  const selectorRef = useRef<HTMLDivElement>(null);

  const currentLanguage =
    languages.find((item) => item.code === language) ?? languages[0];

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLanguageChange = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    setIsOpen(false);
  };

  return (
    <div ref={selectorRef} className="relative z-50">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label={t.common.selectLanguage}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex items-center gap-3"
      >
        <LanguageFlag
          language={currentLanguage.code}
          alt={currentLanguage.flagAlt}
          src={currentLanguage.flag}
        />

        <div className="flex items-center gap-[6px]">
          <span className="text-[18px] font-medium leading-6 text-[var(--text-primary)]">
            {currentLanguage.label}
          </span>

          <Image
            src="/moneypilot/icon-chevron-down.svg"
            alt=""
            width={24}
            height={24}
            className={`h-6 w-6 shrink-0 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-[38px] w-[132px] overflow-hidden rounded-xl border border-[#dce5e5] bg-white p-1 shadow-[0_8px_24px_rgba(0,18,25,0.12)]"
        >
          {languages.map((item) => {
            const isSelected = item.code === language;

            return (
              <button
                key={item.code}
                type="button"
                role="menuitem"
                onClick={() => handleLanguageChange(item.code)}
                className={`flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left transition-colors ${
                  isSelected
                    ? "bg-[#edf7f7]"
                    : "bg-white hover:bg-[#f7f9f9]"
                }`}
              >
                <LanguageFlag
                  language={item.code}
                  alt={item.flagAlt}
                  src={item.flag}
                />

                <span
                  className={`text-[16px] font-medium leading-5 ${
                    isSelected
                      ? "text-[var(--brand-primary)]"
                      : "text-[var(--text-primary)]"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
