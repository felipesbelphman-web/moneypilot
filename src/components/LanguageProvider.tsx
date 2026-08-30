"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

export type Language = "en" | "pt" | "es" | "de" | "fr" | "nl" | "it";

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

export function isLanguage(value: string | null): value is Language {
  return value === "en" || value === "pt" || value === "es" || value === "de" || value === "fr" || value === "nl" || value === "it";
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>("en");

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    document.documentElement.lang = nextLanguage;
  }, []);

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

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function applyAccountLanguage() {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!active || !userId) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("locale")
        .eq("id", userId)
        .single<{ locale: string }>();

      const profileLocale = profile?.locale ?? null;
      if (active && isLanguage(profileLocale)) {
        setLanguage(profileLocale);
      }
    }

    void applyAccountLanguage();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_IN" || event === "USER_UPDATED") {
          void applyAccountLanguage();
        }
      },
    );

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [setLanguage]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
    }),
    [language, setLanguage],
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
