"use client";

import Image from "next/image";
import Link from "next/link";
import AnimatedOverviewChart from "@/components/AnimatedOverviewChart";
import AnimatedIncomeIcon from "@/components/AnimatedIncomeIcon";
import AnimatedIncomeValues from "@/components/AnimatedIncomeValues";
import AnimatedExpenseIcon from "@/components/AnimatedExpenseIcon";
import AnimatedExpenseValues from "@/components/AnimatedExpenseValues";
import AnimatedGoalGauge from "@/components/AnimatedGoalGauge";
import AnimatedGoalIcon from "@/components/AnimatedGoalIcon";
import AnimatedBalanceIcon from "@/components/AnimatedBalanceIcon";
import AnimatedBalanceValues from "@/components/AnimatedBalanceValues";
import AnimatedExpenseTotalChart from "@/components/AnimatedExpenseTotalChart";
import AnimatedExpenseCategories from "@/components/AnimatedExpenseCategories";
import LanguageSelector from "@/components/LanguageSelector";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";

const benefitIcons = [
  "/moneypilot/icon-pie-chart.svg",
  "/moneypilot/icon-target.svg",
  "/moneypilot/icon-cpu.svg",
];

export default function MoneyPilotMobileHome() {
  const { language } = useLanguage();
  const t = translations[language].landing;

  return (
    <div className="mx-auto w-full max-w-[440px] bg-white">
      {/* Hero */}
      <section className="flex flex-col gap-6 px-6 py-12">
        {/* Logo + idioma */}
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

        {/* Título */}
        <h1 className="text-[28px] font-semibold leading-normal tracking-[-0.56px] text-[var(--text-primary)]">
          {t.hero.titleLine1}
          <br />
          {t.hero.titleLine2}
          <br />
          {t.hero.titleLine3}
        </h1>

        {/* Descrição */}
        <p className="text-[18px] font-medium leading-6 text-[var(--text-secondary)]">
          {t.hero.description}
        </p>

        {/* Barras decorativas */}
        <div className="flex h-1 items-center gap-2">
          <span className="h-1 w-[54px] rounded-full bg-[var(--brand-secondary)]" />
          <span className="h-1 w-[26px] rounded-full bg-[var(--brand-soft)]" />
          <span className="h-1 w-3 rounded-full bg-[var(--brand-highlight)]" />
        </div>

        {/* Botões */}
        <div className="mt-1 grid h-14 grid-cols-2 gap-4">
          <Link
            href="/auth"
            className="flex h-14 items-center justify-center gap-[10px] rounded-lg bg-[var(--brand-primary)] text-[14px] font-medium text-white transition-opacity hover:opacity-90"
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
            className="flex h-14 items-center justify-center gap-[10px] rounded-lg border border-[var(--brand-primary)] bg-white text-[14px] font-medium text-[var(--brand-primary)] transition-colors hover:bg-[#eef6f6]"
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

        {/* Link login */}
        <Link
          href="/auth?mode=login"
          className="w-fit text-[12px] font-medium leading-[17px] text-[var(--brand-primary)] hover:underline"
        >
          {t.hero.alreadyHaveAccount} {t.hero.login}
        </Link>

        {/* Benefícios */}
        <div className="flex flex-col gap-4">
          {t.benefits.map((benefit, index) => (
            <article
              key={benefit.title}
              className="flex h-[96px] flex-col gap-2 rounded-[22px] border border-[var(--brand-primary)] bg-white px-[14px] py-4 shadow-[0_1px_2px_rgba(0,18,25,0.05)]"
            >
              <div className="flex items-center gap-2">
                <Image
                  src={benefitIcons[index]}
                  alt=""
                  width={24}
                  height={24}
                />

                <h2 className="text-[16px] font-medium leading-[22px] text-[var(--text-primary)]">
                  {benefit.title}
                </h2>
              </div>

              <p className="text-[14px] font-medium leading-5 text-[var(--text-secondary)]">
                {benefit.description}
              </p>
            </article>
          ))}
        </div>

        {/* Segurança */}
        <div className="flex items-center justify-center gap-[10px]">
          <Image
            src="/moneypilot/icon-shield-chevron.svg"
            alt=""
            width={24}
            height={24}
          />

          <p className="text-[12px] font-medium leading-[17px] text-[var(--text-secondary)]">
            {t.security}
          </p>
        </div>
        </section>
              {/* Dashboard mobile */}
      <section className="flex flex-col gap-6">
        {/* Visão geral */}
        <div className="px-6">
          <article className="relative h-[191px] w-full overflow-hidden rounded-[22px] bg-[#f7f9f9]">
            {/* Título */}
            <h2 className="absolute left-[18px] top-[22px] text-[16px] font-medium leading-[22px] text-[#161616]">
              {t.dashboard.overview}
            </h2>
            {/* Período */}
            <span className="absolute right-[18px] top-[23px] text-[12px] font-medium leading-[17px] text-[#161616]">
              {t.dashboard.daily}
            </span>

            {/* Gráfico animado */}
            <AnimatedOverviewChart variant="mobile" />

            {/* Meses */}
            <div className="absolute bottom-[21px] left-[18px] right-[18px] flex items-center justify-between text-center text-[10px] font-bold text-black/90">
              {t.dashboard.months.map((month) => <span key={month}>{month}</span>)}
            </div>
          </article>
        </div>

        {/* Linha Receitas e Despesas */}
        <div className="flex justify-center gap-4">
          {/* Card Receitas */}
          <article className="relative h-[184px] w-[184px] overflow-hidden rounded-[22px] bg-[#005f73]">
            {/* Ícone */}
            <div className="absolute left-[14px] top-[21px] flex h-[35.29px] w-[35.29px] items-center justify-center rounded-full bg-white">
              <AnimatedIncomeIcon variant="mobile" />
            </div>

            {/* Valores animados */}
            <AnimatedIncomeValues variant="mobile" />

            {/* Label */}
            <p className="absolute bottom-[22px] left-[14px] text-[13px] font-medium leading-[15px] text-white">
              {t.dashboard.income}
            </p>
          </article>
          {/* Card Despesas */}
            <article className="relative h-[184px] w-[184px] overflow-hidden rounded-[22px] bg-[#9b2226]">
            {/* Título */}
            <p className="absolute left-[14px] top-[26px] text-[15.44px] font-medium leading-normal text-white">
                {t.dashboard.expenses}
            </p>

            {/* Ícone */}
            <div className="absolute right-[14px] top-[21px] flex h-[35.29px] w-[35.29px] items-center justify-center rounded-full bg-white">
                <AnimatedExpenseIcon variant="mobile" />
            </div>

            {/* Valores animados */}
            <AnimatedExpenseValues variant="mobile" />
            </article>
        </div>
        {/* Linha Meta e Saldo */}
<div className="flex justify-center gap-4">
  {/* Card Meta */}
  <article className="relative h-[184px] w-[184px] overflow-hidden rounded-[22px] bg-[#242424]">
    {/* Cabeçalho */}
    <div className="absolute left-[18px] top-[23px] flex items-center gap-[6px]">
      <AnimatedGoalIcon />

      <p className="text-[12px] font-medium leading-normal text-white">
        {t.dashboard.goal}
      </p>
    </div>

    {/* Progresso */}
    <div className="absolute left-1/2 top-[51px] flex h-[81px] w-[82px] -translate-x-1/2 items-center justify-center">
      <AnimatedGoalGauge variant="mobile" />
    </div>

    {/* Prazo */}
    <div className="absolute bottom-[23px] left-[18px] flex items-center gap-[4px]">
      <Image
        src="/moneypilot/calendar-alt.svg"
        alt=""
        width={17}
        height={17}
      />

      <p className="whitespace-nowrap text-[12px] font-medium text-white">
        {t.dashboard.deadline}
      </p>
    </div>
  </article>
          {/* Card Saldo Líquido */}
<article className="relative h-[184px] w-[184px] overflow-hidden rounded-[22px] bg-[#d3fb6d]">
    {/* Ícone */}
    <div className="absolute left-[14px] top-[21px] flex h-[35.29px] w-[35.29px] items-center justify-center rounded-full bg-[#161616]">
      <div className="translate-x-[1px]">
       <AnimatedBalanceIcon size={24} />
    </div>
        </div>

  {/* Valores animados */}
  <AnimatedBalanceValues variant="mobile" />

  {/* Label */}
  <p className="absolute left-[14px] top-[146px] text-[11px] font-medium leading-[13px] text-[#161616]/50">
    {t.dashboard.netBalance}
  </p>
</article>
</div>
      
      {/* Gastos por categoria */}
        <div className="px-6">
        <article className="flex h-[194px] w-full items-center justify-center overflow-hidden rounded-[22px] bg-[#fb602d]">
        <div className="flex w-[344px] items-center justify-between">
            {/* Gráfico */}
            <div className="flex h-[150px] w-[111.24px] shrink-0 items-center justify-center">
            <AnimatedExpenseTotalChart variant="mobile" />
            </div>

            {/* Categorias */}
            <div className="flex w-[205px] flex-col">
            <h2 className="mb-[5px] text-[16px] font-medium leading-normal text-white">
                {t.dashboard.spendingByCategory}
            </h2>

            <AnimatedExpenseCategories variant="mobile" />
            </div>
        </div>
        </article>
</div>
          {/* CTA final */}
<section className="relative h-[521px] w-full overflow-hidden">
  {/* Foto de fundo */}
  <Image
    src="/moneypilot/cta-final-bg.png"
    alt={t.dashboard.visualAlt}
    fill
    className="object-cover"
    sizes="440px"
  />

  {/* Overlay escuro */}
  <div className="absolute inset-0 bg-black/25" />

  {/* Container */}
  <div className="relative z-10 flex h-full w-full items-center justify-center p-3">
    <div className="flex w-full max-w-[394px] flex-col gap-6 rounded-[22px] border-[1.5px] border-[#dde5e5] bg-white/10 p-6">
      {/* Logo */}
      <Image
        src="/moneypilot/moneypilot-logo.svg"
        alt="MoneyPilot"
        width={232}
        height={48}
        className="brightness-0 invert"
      />

      {/* Headline */}
      <h2 className="text-[30px] font-semibold leading-[34px] tracking-[-0.6px] text-white">
        {t.finalCta.title}
      </h2>

      {/* Texto */}
      <p className="text-[16px] font-medium leading-5 text-white">
        {t.finalCta.description}
      </p>

      {/* Ações */}
      <div className="flex flex-col gap-3">
        <Link
          href="/auth"
          className="flex h-14 w-full items-center justify-center gap-[10px] rounded-[14px] bg-[var(--brand-primary)] text-[14px] font-medium text-white transition-opacity hover:opacity-90"
        >
          <Image
            src="/moneypilot/icon-user-circle.svg"
            alt=""
            width={24}
            height={24}
          />

          {t.finalCta.createAccount}
        </Link>

        <Link
          href="/auth?mode=login"
          className="flex h-14 w-full items-center justify-center gap-[10px] text-[14px] font-medium text-white"
        >
          <span>
            {t.finalCta.alreadyHaveAccount}{" "}
            <strong className="font-semibold">{t.finalCta.login}</strong>
          </span>

          <Image
            src="/moneypilot/icon-login.svg"
            alt=""
            width={24}
            height={24}
          />
        </Link>
      </div>
    </div>
  </div>
</section>
      </section>
    </div>
  );
}
