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

import { useLanguage } from "@/components/LanguageProvider";
import {
  formatMoney,
  isCurrencyCode,
  type CurrencyCode,
} from "@/i18n/config";
import { createClient } from "@/lib/supabase/client";

type CurrencyContextValue = {
  currency: CurrencyCode | null;
  isCurrencyHydrating: boolean;
  setConfirmedCurrency: (currency: CurrencyCode) => void;
  formatMoney: (value: number) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const [currency, setCurrency] = useState<CurrencyCode | null>(null);
  const [isCurrencyHydrating, setIsCurrencyHydrating] = useState(true);

  const setConfirmedCurrency = useCallback((nextCurrency: CurrencyCode) => {
    setCurrency(nextCurrency);
    setIsCurrencyHydrating(false);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    let generation = 0;

    async function synchronizeCurrency(userId: string | null) {
      const requestId = ++generation;
      if (!userId) {
        if (active) {
          setCurrency(null);
          setIsCurrencyHydrating(false);
        }
        return;
      }

      setCurrency(null);
      setIsCurrencyHydrating(true);
      const { data: profile } = await supabase
        .from("profiles")
        .select("currency_code")
        .eq("id", userId)
        .single<{ currency_code: string }>();

      if (!active || requestId !== generation) return;
      const profileCurrency = profile?.currency_code ?? "";
      setCurrency(isCurrencyCode(profileCurrency) ? profileCurrency : null);
      setIsCurrencyHydrating(false);
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      queueMicrotask(() => void synchronizeCurrency(session?.user.id ?? null));
    });

    void supabase.auth.getUser().then(({ data }) => {
      if (active) void synchronizeCurrency(data.user?.id ?? null);
    });

    return () => {
      active = false;
      generation += 1;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<CurrencyContextValue>(() => ({
    currency,
    isCurrencyHydrating,
    setConfirmedCurrency,
    formatMoney: (amount) => currency ? formatMoney(amount, { currency, language }) : "—",
  }), [currency, isCurrencyHydrating, language, setConfirmedCurrency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used inside CurrencyProvider");
  return context;
}
