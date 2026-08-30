"use client";

import { FinancialFlow } from "@/components/financial-flow/FinancialFlow";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";

export default function FinancialFlowPage() {
    const { language } = useLanguage();
    const t = translations[language].financialFlow;
    return (
        <main className="min-h-screen bg-[#080B0F] px-[48px] py-[40px] text-[#F5F7FA]">
            <div className="mx-auto w-full max-w-[1440px]">
                {/* Header da página */}
                <div className="mb-[32px]">
                    <h1 className="text-[32px] font-bold tracking-[-0.5px]">
                        {t.pageTitle}
                    </h1>

                    <p className="mt-[8px] text-[14px] text-[#9CA6B2]">
                        {t.pageDescription}
                    </p>
                </div>

                {/* Financial Flow */}
                <FinancialFlow />
            </div>
        </main>
    );
}
