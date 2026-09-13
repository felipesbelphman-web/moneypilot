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
import { isLanguage, type Language } from "@/i18n/config";
import { ProfileRepository } from "@/lib/auth/profile-repository";
import { settleProfilePreferenceLoad } from "@/lib/auth/profile-contract";

export type { Language } from "@/i18n/config";

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

export { isLanguage } from "@/i18n/config";

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
    const repository = new ProfileRepository(supabase);
    let active = true;

    async function applyAccountLanguage() {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!active || !userId) return;

      const result = await settleProfilePreferenceLoad(() => repository.getPreferences(userId));
      if (active && result.status === "success") {
        setLanguage(result.data.locale);
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
