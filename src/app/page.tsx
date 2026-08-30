"use client";

import Image from "next/image";
import Link from "next/link";
import MoneyPilotMobileHome from "@/components/MoneyPilotMobileHome";
import AnimatedGoalGauge from "@/components/AnimatedGoalGauge";
import AnimatedOverviewChart from "@/components/AnimatedOverviewChart";
import AnimatedIncomeValues from "@/components/AnimatedIncomeValues";
import AnimatedIncomeIcon from "@/components/AnimatedIncomeIcon";
import AnimatedExpenseValues from "@/components/AnimatedExpenseValues";
import AnimatedExpenseIcon from "@/components/AnimatedExpenseIcon";
import AnimatedBalanceValues from "@/components/AnimatedBalanceValues";
import AnimatedGoalIcon from "@/components/AnimatedGoalIcon";
import AnimatedBalanceIcon from "@/components/AnimatedBalanceIcon";
import AnimatedExpenseTotalChart from "@/components/AnimatedExpenseTotalChart";
import AnimatedExpenseCategories from "@/components/AnimatedExpenseCategories";
import MobileScaleCanvas from "@/components/MobileScaleCanvas";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";

const benefitIcons = [
  "/moneypilot/icon-pie-chart.svg",
  "/moneypilot/icon-target.svg",
  "/moneypilot/icon-cpu.svg",
];

      export default function Home() {
        const { language } = useLanguage();
        const t = translations[language].landing;

        return (
          <main className="public-identity min-h-screen bg-white [--brand-primary:#3b82f6] [--brand-secondary:#3b82f6] [--brand-soft:#94d2bd] [--brand-highlight:#e9d8a6] md:h-[865px] md:min-h-0 md:overflow-hidden">
            {/* Mobile */}
              <div className="md:hidden">
                <MobileScaleCanvas>
                  <MoneyPilotMobileHome />
                </MobileScaleCanvas>
              </div>

            {/* Desktop */}
            <section className="hidden h-full w-full md:flex">
        {/* Lado esquerdo */}
<div className="relative h-full w-[44.7917%] overflow-hidden">
  <div className="flex h-[865px] w-[860px] origin-top-left scale-[0.84] flex-col px-[72px] pb-[48px] pt-[64px] min-[1600px]:scale-100">

    <div className="flex w-full items-center justify-between">
  <Image
    src="/moneypilot/moneypilot-logo.svg"
    alt="MoneyPilot"
    width={232}
    height={48}
    priority
  />

  <LanguageSelector />
</div>

          <h1 className="mt-[30px] min-h-[194px] max-w-[700px] text-[48px] font-semibold leading-[62px] tracking-[-0.96px] text-[var(--text-primary)]">
            {t.hero.titleLine1}
            <br />
            {t.hero.titleLine2}
            <br />
            {t.hero.titleLine3}
          </h1>

          <p className="mt-[30px] min-h-[60px] max-w-[680px] text-[18px] font-medium leading-6 text-[var(--text-secondary)]">
            {t.hero.description}
          </p>

          {/* Accent */}
          <div className="mt-[30px] flex h-1 items-center gap-2">
            <span className="h-1 w-[54px] rounded-full bg-[#3b82f6]" />
            <span className="h-1 w-[26px] rounded-full bg-[var(--brand-soft)]" />
            <span className="h-1 w-3 rounded-full bg-[var(--brand-highlight)]" />
          </div>

          {/* Botões */}
            <div className="mt-[30px] flex h-[56px] w-[616px] gap-4">
              <Link
                href="/auth"
                className="flex h-[56px] w-[300px] shrink-0 items-center justify-center gap-[10px] rounded-[8px] bg-[#3b82f6] text-[14px] font-medium text-white transition-colors hover:bg-[#2563eb]"
              >
                <Image
                  src="/moneypilot/icon-user-circle.svg"
                  alt=""
                  width={24}
                  height={24}
                />

                {t.hero.createAccount}
              </Link>

              <Link
                href="/auth?mode=login"
                className="flex h-[56px] w-[300px] shrink-0 items-center justify-center gap-[10px] rounded-[8px] border !border-[#3b82f6] bg-white text-[14px] font-medium !text-[#3b82f6] transition-colors hover:bg-[#eff6ff]"
              >
                {t.hero.login}

                <Image
                  src="/moneypilot/icon-login.svg"
                  alt=""
                  width={24}
                  height={24}
                />
              </Link>
            </div>

          <Link
            href="/auth?mode=login"
            className="mt-[30px] w-fit text-xs font-medium !text-[#3b82f6] hover:underline"
          >
              {t.hero.alreadyHaveAccount} {t.hero.login}
          </Link>

          {/* Benefícios */}
          <div className="mt-[30px] grid w-full max-w-[716px] grid-cols-3 gap-[14px]">
            {t.benefits.map((benefit, index) => (
              <article
                key={benefit.title}
                className="h-[148px] rounded-2xl border border-[#3b82f6] bg-white px-[14px] py-4 shadow-[0_1px_2px_rgba(0,18,25,0.05)]"
              >
                <Image
                  src={benefitIcons[index]}
                  alt=""
                  width={24}
                  height={24}
                />

                <h2 className="mt-2 text-sm font-medium leading-5 text-[var(--text-primary)]">
                  {benefit.title}
                </h2>

                <p className="mt-2 max-w-[190px] text-xs font-medium leading-[17px] text-[var(--text-secondary)]">
                  {benefit.description}
                </p>
              </article>
            ))}
          </div>

          {/* Segurança */}
          <div className="mt-[30px] flex items-center gap-[10px]">
            <Image
              src="/moneypilot/icon-shield-chevron.svg"
              alt=""
              width={24}
              height={24}
            />

            <p className="text-xs font-medium leading-[17px] text-[var(--text-secondary)]">
              {t.security}
            </p>
            </div>
          </div>
        </div>

        {/* Lado direito */}
        <div className="relative h-full w-[55.2083%] overflow-hidden bg-[var(--brand-primary)]">
  <Image
  src="/moneypilot/welcome-right-bg.png"
  alt={t.dashboard.visualAlt}
  fill
  priority
  className="object-cover"
  sizes="55vw"
 />
  {/* Dashboard financeiro */}
<div className="absolute left-[48px] top-1/2 z-10 h-[616px] w-[548px] origin-left -translate-y-1/2 scale-[0.82] min-[1600px]:scale-100">

  {/* Card: Visão geral */}
  <article className="money-card-in relative h-[175px] w-[359px] overflow-hidden rounded-[18px] bg-white">
    <h2 className="absolute left-[18px] top-[22px] text-[13px] font-semibold text-[#161616]">
      {t.dashboard.overview}
    </h2>

    <span className="absolute right-[18px] top-[23px] text-[11px] font-semibold text-[#161616]">
      {t.dashboard.daily}
    </span>

    <AnimatedOverviewChart />

    {/* Meses */}
    <div className="absolute bottom-[21px] left-[18px] flex w-[322px] justify-between text-[7px] font-bold text-black/90">
      {t.dashboard.months.map((month) => <span key={month}>{month}</span>)}
    </div>
  </article>
      {/* Card: Receitas */}
<article className="absolute left-[373px] top-0 h-[175px] w-[175px] overflow-hidden rounded-[20px] bg-[#3b82f6]">

    {/* Ícone */}
    <div className="absolute left-[16px] top-[20px] flex h-[32px] w-[32px] items-center justify-center rounded-full bg-white">
      <AnimatedIncomeIcon />
    </div>

    {/* Valores animados */}
    <AnimatedIncomeValues />

    <p className="absolute left-[16px] top-[141px] text-[12px] font-medium leading-[14px] text-white">
      {t.dashboard.income}
    </p>

  </article>

  {/* Card: Despesas */}
  <article className="absolute left-0 top-[187px] h-[175px] w-[175px] overflow-hidden rounded-[19px] bg-[#ae2012]">

    {/* Título */}
    <p className="absolute left-[12px] top-[18px] flex h-[32px] items-center text-[14px] font-medium text-white">
      {t.dashboard.expenses}
    </p>

    {/* Ícone */}
    <div className="absolute right-[12px] top-[18px] flex h-[32px] w-[32px] items-center justify-center rounded-full bg-white">
      <AnimatedExpenseIcon />
    </div>

        <AnimatedExpenseValues />

  </article>
            {/* Card: Meta */}
            <article className="absolute left-[187px] top-[187px] h-[175px] w-[175px] overflow-hidden rounded-[19px] bg-[#242424] px-[14px] py-[18px]">

              {/* Header */}
              <div className="flex items-center gap-[6px]">
                <AnimatedGoalIcon />

                <p className="text-[12px] font-medium text-white">
                  {t.dashboard.goal}
                </p>
              </div>

              <div className="absolute left-1/2 top-[48px] flex h-[84px] w-[84px] -translate-x-1/2 items-center justify-center">
                <AnimatedGoalGauge />
              </div>

              {/* Prazo */}
                <div className="absolute bottom-[18px] left-[14px] flex items-center gap-[5px]">
                  <Image
                    src="/moneypilot/calendar-alt.svg"
                    alt=""
                    width={17}
                    height={17}
                  />

                  <p className="text-[12px] font-medium text-white">
                    {t.dashboard.deadline}
                  </p>
                </div>

            </article>
            {/* Card: Saldo líquido */}
            <article className="absolute left-[373px] top-[187px] h-[175px] w-[175px] overflow-hidden rounded-[19px] bg-[#22c55e] px-[14px] py-[18px]">

             {/* Ícone */}
              <div className="absolute left-[14px] top-[18px] flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#161616]">
                <AnimatedBalanceIcon />
              </div>

              <AnimatedBalanceValues />

              {/* Título */}
              <p className="absolute bottom-[18px] left-[14px] text-[11px] font-medium text-[#161616]/50">
                {t.dashboard.netBalance}
              </p>

            </article>
              {/* Card: Gastos por categoria */}
              <article className="absolute left-0 top-[374px] h-[242px] w-[548px] overflow-hidden rounded-[29px] bg-[#fb602d] p-6">

                {/* Tag */}
                <div className="absolute left-[24px] top-[24px] rounded-full bg-[#ffeee8] px-[7px] py-[2px]">
                  <span className="text-[10px] font-semibold text-[#fa531c]">
                    {t.dashboard.spendingTag}
                  </span>
                </div>

                {/* Título */}
                <h2 className="absolute left-[236px] top-[26px] text-[13px] font-medium text-white">
                  {t.dashboard.spendingByCategory}
                </h2>
                {/* Gráfico total de gastos */}
                <div className="absolute left-[24px] top-[62px] h-[156px] w-[156px]">
                  <AnimatedExpenseTotalChart />
                </div>

                {/* Legenda das categorias */}
                <AnimatedExpenseCategories />
              </article>
          </div>
        </div>
      </section>
    </main>
  );
}
