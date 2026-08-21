"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Language = "en" | "pt" | "es";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
};

type LanguageProviderProps = {
  children: ReactNode;
};

const STORAGE_KEY = "moneypilot-language";

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

function isLanguage(value: string | null): value is Language {
  return value === "en" || value === "pt" || value === "es";
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem(STORAGE_KEY);

    if (!isLanguage(savedLanguage)) {
      document.documentElement.lang = "en";
      return;
    }

    document.documentElement.lang = savedLanguage;

    const frame = requestAnimationFrame(() => {
      setLanguageState(savedLanguage);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    document.documentElement.lang = nextLanguage;
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}