import type { Metadata } from "next";
import { Bebas_Neue, Inter, Poppins, Roboto_Mono } from "next/font/google";
import Script from "next/script";

import { LanguageProvider } from "@/components/LanguageProvider";
import { FinanceDataProvider } from "@/components/FinanceDataProvider";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { AccountProfileProvider } from "@/components/profile/AccountProfileProvider";
import { ThemeProvider, themeBootstrapScript } from "@/components/ThemeProvider";
import DesktopSidebar, { SidebarLayoutProvider } from "@/components/navigation/DesktopSidebar";
import { AppShellFrame } from "@/components/layout/AppShellFrame";
import { getOptionalCurrentAccount } from "@/lib/auth/profile";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  weight: "400",
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MoneyPilot",
  description:
    "Understand your money, plan your goals and make better financial decisions.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const initialAccount = await getOptionalCurrentAccount();

  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${inter.variable} ${poppins.variable} ${bebasNeue.variable} ${robotoMono.variable} antialiased`}
    >
      <head>
        <Script id="moneypilot-theme-bootstrap" strategy="beforeInteractive">
          {themeBootstrapScript}
        </Script>
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <CurrencyProvider>
              <AccountProfileProvider initialAccount={initialAccount}>
                <FinanceDataProvider>
                  <SidebarLayoutProvider>
                    <AppShellFrame sidebar={<DesktopSidebar />}>
                      {children}
                    </AppShellFrame>
                  </SidebarLayoutProvider>
                </FinanceDataProvider>
              </AccountProfileProvider>
            </CurrencyProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
