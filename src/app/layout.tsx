import type { Metadata } from "next";
import { Bebas_Neue, Inter, Poppins } from "next/font/google";

import { LanguageProvider } from "@/components/LanguageProvider";
import { FinanceDataProvider } from "@/components/FinanceDataProvider";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import DesktopSidebar from "@/components/navigation/DesktopSidebar";
import { ThemeProvider, themeBootstrapScript } from "@/components/ThemeProvider";

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

export const metadata: Metadata = {
  title: "MoneyPilot",
  description:
    "Understand your money, plan your goals and make better financial decisions.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${inter.variable} ${poppins.variable} ${bebasNeue.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <CurrencyProvider>
              <FinanceDataProvider>
                <DesktopSidebar />
                {children}
              </FinanceDataProvider>
            </CurrencyProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
