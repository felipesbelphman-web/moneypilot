import type { Metadata } from "next";
import { Bebas_Neue, Inter, Poppins } from "next/font/google";

import { LanguageProvider } from "@/components/LanguageProvider";
import DesktopSidebar from "@/components/navigation/DesktopSidebar";

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
      className={`${inter.variable} ${poppins.variable} ${bebasNeue.variable} antialiased`}
    >
      <body>
        <DesktopSidebar />
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
