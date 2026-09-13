"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

import type { CurrentAccount } from "@/lib/auth/profile";

type AccountProfileContextValue = {
  account: CurrentAccount | null;
  isReady: boolean;
  setAccount: (account: CurrentAccount | null) => void;
};

const AccountProfileContext = createContext<AccountProfileContextValue | null>(
  null,
);

export function AccountProfileProvider({
  children,
  initialAccount,
}: {
  children: ReactNode;
  initialAccount: CurrentAccount | null;
}) {
  const [account, setAccount] = useState(initialAccount);
  const value = useMemo(
    () => ({ account, isReady: true, setAccount }),
    [account],
  );

  return (
    <AccountProfileContext.Provider value={value}>
      {children}
    </AccountProfileContext.Provider>
  );
}

export function useAccountProfile() {
  const context = useContext(AccountProfileContext);

  if (!context) {
    throw new Error(
      "useAccountProfile must be used inside AccountProfileProvider",
    );
  }

  return context;
}
