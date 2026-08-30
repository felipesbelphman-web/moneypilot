import Image from "next/image";
import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";
import { ThemeLogo } from "@/components/ThemeLogo";
import { signIn, signUp } from "@/app/auth/actions";

type MoneyPilotMobileAuthProps = {
  isLogin?: boolean;
  isForgotPassword?: boolean;
  isVerifyEmail?: boolean;
  isResetPassword?: boolean;
  onLogin: () => void;
  onSignup?: () => void;
  onForgotPassword?: () => void;
  onVerifyEmail?: () => void;
};

export default function MoneyPilotMobileAuth({
  isLogin = false,
  isForgotPassword = false,
  isVerifyEmail = false,
  isResetPassword = false,
  onLogin,
  onSignup,
  onForgotPassword,
  onVerifyEmail,
}: MoneyPilotMobileAuthProps) {
  const { language } = useLanguage();
  const t = translations[language];
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  

const passwordScore = [
  newPassword.length >= 8,
  /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword),
  /\d/.test(newPassword),
  /[^A-Za-z0-9]/.test(newPassword),
].filter(Boolean).length;

const passwordLevel =
  newPassword.length === 0
    ? 0
    : passwordScore <= 1
      ? 1
      : passwordScore <= 3
        ? 2
        : 3;

const passwordStrength =
  passwordLevel === 0
    ? ""
    : passwordLevel === 1
      ? t.auth.strength.weak
      : passwordLevel === 2
        ? t.auth.strength.medium
        : t.auth.strength.strong;

  const hero = t.auth.hero[
    isResetPassword
      ? "resetPassword"
      : isVerifyEmail
        ? "verifyEmail"
        : isForgotPassword
          ? "forgotPassword"
          : isLogin
            ? "login"
            : "signup"
  ];

  return (
    <div className="w-[440px] bg-white">
      {/* Hero / Foto da casa */}
      <section className="relative h-[820px] w-[440px] overflow-hidden bg-[var(--background-secondary)] px-6 py-12">

        {/* Conteúdo */}
        <div className="relative z-10 flex h-full flex-col justify-between">
          {/* Logo */}
          <div className="flex h-12 items-center">
            <ThemeLogo width={220} priority className="h-12 w-auto" />
            </div>

          {/* Conteúdo inferior */}
          <div className="flex flex-col gap-9">
            {/* Texto */}
            <div className="flex flex-col gap-3">
                <h1 className="text-[30px] font-semibold leading-[38px] text-[var(--text-primary)]">
                {hero.titleLines.map((line) => (
                  <span key={line} className="block whitespace-nowrap">{line}</span>
                ))}
                </h1>
              <p className="text-[18px] font-medium leading-6 text-[var(--text-secondary)]">
                {hero.description}
                </p>
            </div>

            <div className="w-[392px] rounded-[20px] bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.10)]">
                {/* Cabeçalho + descrição */}
                    <div className="flex items-start gap-3">
                    <Image
                        src="/moneypilot/security-shield-lock.svg"
                        alt=""
                        width={24}
                        height={24}
                        className="h-6 w-6 shrink-0"
                    />

                    <div className="flex flex-1 flex-col gap-4">
                        <h3 className="text-[14px] font-semibold leading-6 text-[var(--text-primary)]">
                        {t.auth.security.title}
                        </h3>

                        <p className="text-[11px] leading-[18px] text-[var(--text-secondary)]">
                        {t.auth.security.description}
                        </p>
                    </div>
                    </div>

                        {/* Itens */}
                        <div className="mt-5 flex w-full items-start justify-between text-center">
                        {/* Privacidade */}
                        <div className="flex w-[70px] flex-col items-center gap-[5px]">
                            <Image
                            src="/moneypilot/security-privacy.svg"
                            alt=""
                            width={17.05}
                            height={17.05}
                            className="h-[17.05px] w-[17.05px]"
                            />

                            <p className="text-[10px] leading-[13px] text-[#111827]">
                            {t.auth.security.privacy[0]}
                            <br />
                            {t.auth.security.privacy[1]}
                            </p>
                        </div>

                        {/* Criptografia */}
                        <div className="flex w-[70px] flex-col items-center gap-[5px]">
                            <Image
                            src="/moneypilot/security-encryption.svg"
                            alt=""
                            width={17.05}
                            height={17.05}
                            className="h-[17.05px] w-[17.05px]"
                            />

                            <p className="text-[10px] leading-[13px] text-[#111827]">
                            {t.auth.security.encryption[0]}
                            <br />
                            {t.auth.security.encryption[1]}
                            </p>
                        </div>

                        {/* Controle */}
                        <div className="flex w-[70px] flex-col items-center gap-[5px]">
                            <Image
                            src="/moneypilot/security-control.svg"
                            alt=""
                            width={17.05}
                            height={17.05}
                            className="h-[17.05px] w-[17.05px]"
                            />

                            <p className="text-[10px] leading-[13px] text-[#111827]">
                            {t.auth.security.control[0]}
                            <br />
                            {t.auth.security.control[1]}
                            </p>
                        </div>

                        {/* Conexão */}
                        <div className="flex w-[70px] flex-col items-center gap-[5px]">
                            <Image
                            src="/moneypilot/security-connection.svg"
                            alt=""
                            width={17.05}
                            height={17.05}
                            className="h-[17.05px] w-[17.05px]"
                            />

                            <p className="text-[10px] leading-[13px] text-[#111827]">
                            {t.auth.security.connection[0]}
                            <br />
                            {t.auth.security.connection[1]}
                            </p>
                        </div>
                        </div>
                        </div>
                        </div>
                        </div>
                    </section>
                    {/* Área do formulário */}
                    <section className="flex w-[440px] items-center justify-center bg-[#fcfdfd] px-6 py-12">
                    {isResetPassword ? (
                        /* Card / Criar nova senha */
                        <div className="flex h-[690px] w-[392px] flex-col justify-between rounded-[22px] border-2 border-[var(--brand-secondary)] bg-white p-10 shadow-[0_8px_24px_rgba(0,18,26,0.08)]">
                            {/* Eyebrow */}
                            <div className="flex items-center gap-3">
                              <Image
                                src="/moneypilot/icon-keypad.svg"
                                alt=""
                                width={24}
                                height={24}
                                className="h-6 w-6 shrink-0"
                              />

                              <p className="text-[14px] font-semibold leading-[17px] tracking-[1.12px] text-[var(--brand-secondary)]">
                                {t.auth.eyebrow.newPassword}
                              </p>
                            </div>

                            {/* Título + descrição */}
                            <div className="flex flex-col gap-3">
                            <h2 className="text-[28px] font-semibold leading-[38px] text-[var(--text-primary)]">
                                {t.auth.title.resetPassword}
                            </h2>

                            <p className="text-[14px] font-medium leading-5 text-[var(--text-secondary)]">
                                {t.auth.description.resetPassword}
                            </p>
                            </div>

                            {/* Nova senha */}
                            <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-[6px]">
                              <Image
                                src="/moneypilot/icon-key.svg"
                                alt=""
                                width={24}
                                height={24}
                                className="h-6 w-6 shrink-0"
                              />

                              <label
                                htmlFor="mobile-new-password"
                                className="text-[14px] font-medium leading-5 text-[var(--text-primary)]"
                              >
                                {t.auth.newPassword}
                              </label>
                            </div>

                            <div className="relative">
                                <input
                                id="mobile-new-password"
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(event) => setNewPassword(event.target.value)}
                                placeholder={t.auth.newPasswordPlaceholder}
                                className="h-12 w-full rounded-lg border border-[var(--border-default)] px-4 pr-12 text-[14px] outline-none placeholder:text-[var(--text-tertiary)]"
                                />

                                <button
                                type="button"
                                onClick={() => setShowNewPassword((value) => !value)}
                                className="absolute right-4 top-1/2 -translate-y-1/2"
                                aria-label={showNewPassword ? t.common.hidePassword : t.common.showPassword}
                                >
                                <Image
                                    src={
                                    showNewPassword
                                        ? "/moneypilot/icon-eye-off.svg"
                                        : "/moneypilot/icon-eye.svg"
                                    }
                                    alt=""
                                    width={24}
                                    height={24}
                                />
                                </button>
                            </div>
                            </div>

                            {/* Força da senha */}
                            <div className="flex w-full items-center justify-between px-[3px]">
                                <div className="flex w-[240px] gap-1">
                                    <div
                                    className={`h-1 flex-1 rounded-full ${
                                        passwordLevel >= 1
                                        ? "bg-[var(--brand-primary)]"
                                        : "bg-[var(--border-default)]"
                                    }`}
                                    />

                                    <div
                                    className={`h-1 flex-1 rounded-full ${
                                        passwordLevel >= 2
                                        ? "bg-[#94d2bd]"
                                        : "bg-[var(--border-default)]"
                                    }`}
                                    />

                                    <div
                                    className={`h-1 flex-1 rounded-full ${
                                        passwordLevel >= 3
                                        ? "bg-[var(--brand-secondary)]"
                                        : "bg-[var(--border-default)]"
                                    }`}
                                    />
                                </div>

                               <span
                                  className={`min-w-[50px] text-right text-[16px] font-semibold leading-5 ${
                                    passwordLevel === 1
                                      ? "text-[var(--brand-primary)]"
                                      : passwordLevel === 2
                                        ? "text-[#94d2bd]"
                                        : passwordLevel === 3
                                          ? "text-[var(--brand-secondary)]"
                                          : "text-[var(--text-tertiary)]"
                                  }`}
                                >
                                  {passwordStrength}
                                </span>
                                </div>

                            {/* Confirmar nova senha */}
                            <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-[6px]">
                              <Image
                                src="/moneypilot/icon-key.svg"
                                alt=""
                                width={24}
                                height={24}
                                className="h-6 w-6 shrink-0"
                              />

                              <label
                                htmlFor="mobile-confirm-password"
                                className="text-[14px] font-medium leading-5 text-[var(--text-primary)]"
                              >
                                {t.auth.confirmPassword}
                              </label>
                            </div>

                            <div className="relative">
                                <input
                                id="mobile-confirm-password"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder={t.auth.passwordPlaceholder}
                                className="h-12 w-full rounded-lg border border-[var(--border-default)] px-4 pr-12 text-[14px] outline-none placeholder:text-[var(--text-tertiary)]"
                                />

                                <button
                                type="button"
                                onClick={() => setShowConfirmPassword((value) => !value)}
                                className="absolute right-4 top-1/2 -translate-y-1/2"
                                aria-label={
                                    showConfirmPassword ? t.common.hidePassword : t.common.showPassword
                                }
                                >
                                <Image
                                    src={
                                    showConfirmPassword
                                        ? "/moneypilot/icon-eye-off.svg"
                                        : "/moneypilot/icon-eye.svg"
                                    }
                                    alt=""
                                    width={24}
                                    height={24}
                                />
                                </button>
                            </div>
                            </div>

                            {/* Redefinir senha */}
                            <button
                            type="button"
                            className="flex h-12 w-full shrink-0 items-center justify-center rounded-lg bg-[var(--brand-primary)] text-[14px] font-semibold leading-5 text-white"
                            >
                            {t.auth.resetPassword}
                            </button>

                            {/* Voltar */}
                            <button
                              type="button"
                              onClick={onLogin}
                              className="flex w-full items-center justify-center gap-3 text-[13px] font-medium leading-5 text-[var(--brand-secondary)]"
                            >
                              <Image
                                src="/moneypilot/icon-arrow-left.svg"
                                alt=""
                                width={24}
                                height={24}
                                className="h-6 w-6 shrink-0"
                              />

                              <span>{t.auth.backToLogin}</span>
                            </button>
                        </div>
                        ) : isVerifyEmail ? (
                        /* Card / Verifique seu e-mail */
                        <div className="flex h-[690px] w-[392px] flex-col items-start justify-between rounded-[22px] border-2 border-[var(--brand-secondary)] bg-white p-10 shadow-[0_8px_24px_rgba(0,18,26,0.08)]">
                            {/* Eyebrow */}
                            <p className="w-full text-left text-[12px] font-semibold leading-[17px] tracking-[0.96px] text-[var(--brand-secondary)]">
                            {t.auth.eyebrow.verifyEmail}
                            </p>

                    {/* Ícone */}
                    <div className="flex w-full justify-center">
                    <Image
                        src="/moneypilot/auth-verify-email-icon.svg"
                        alt=""
                        width={52}
                        height={52}
                        className="h-[52px] w-[52px]"
                    />
                    </div>

                    {/* Título */}
                    <h2 className="w-full text-left text-[28px] font-semibold leading-[42px] text-[var(--text-primary)]">
                    {t.auth.title.verifyEmail}
                    </h2>

                    {/* Mensagem + aviso */}
                    <div className="flex w-full flex-col gap-3">
                    <p className="w-full text-left text-[14px] font-medium leading-5 text-[var(--text-secondary)]">
                        {t.auth.description.verifyEmail}{" "}
                        <span className="font-semibold text-[var(--text-primary)]">
                        {t.auth.emailPlaceholder}
                        </span>
                    </p>

                    <div className="flex w-full items-start gap-3">
                        <Image
                        src="/moneypilot/icon-alert-circle.svg"
                        alt=""
                        width={24}
                        height={24}
                        className="h-6 w-6 shrink-0"
                        />

                        <p className="flex-1 text-left text-[14px] font-medium leading-5 text-[var(--text-secondary)]">
                        {t.auth.linkValidPrefix}{" "}
                        <span className="font-semibold text-[var(--text-primary)]">
                            {t.auth.linkValidDuration}
                        </span>{" "}
                        {t.auth.checkSpam}
                        </p>
                    </div>
                    </div>

                    {/* Reenviar */}
                    <button
                      type="button"
                      className="flex h-12 w-full shrink-0 items-center justify-center rounded-lg bg-[var(--brand-primary)] text-[14px] font-semibold leading-5 text-white"
                    >
                      {t.auth.resend}
                    </button>

                    {/* Voltar */}
                    <button
                    type="button"
                    onClick={onLogin}
                    className="flex w-full items-center justify-center gap-3 text-[13px] font-medium leading-5 text-[var(--brand-secondary)]"
                    >
                    <Image
                        src="/moneypilot/icon-arrow-left.svg"
                        alt=""
                        width={24}
                        height={24}
                        className="h-6 w-6 shrink-0"
                    />

                    <span>{t.auth.backToLogin}</span>
                    </button>
                </div>
                ) : isForgotPassword ? (
          /* Card / Recuperar acesso */
          <div className="flex h-[690px] w-[392px] flex-col justify-between rounded-[20px] border-2 border-[#005f73] bg-white p-6 shadow-[0_8px_24px_rgba(0,18,26,0.08)]">
            {/* Eyebrow */}
            <p className="text-[12px] font-semibold leading-[17px] tracking-[0.96px] text-[#005f73]">
              {t.auth.eyebrow.recoverAccess}
            </p>

            {/* Ícone */}
            <div className="flex w-full justify-center">
              <Image
                src="/moneypilot/auth-forgot-password-icon.svg"
                alt=""
                width={52}
                height={52}
                className="h-[52px] w-[52px]"
              />
            </div>

            {/* Título */}
            <h2 className="text-[28px] font-semibold leading-[42px] text-[var(--text-primary)]">
              {t.auth.title.forgotPassword}
            </h2>

            {/* Descrição */}
            <p className="text-[14px] font-medium leading-5 text-[var(--text-secondary)]">
              {t.auth.description.forgotPassword}
            </p>

            {/* E-mail */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="mobile-forgot-email"
                className="text-[14px] font-medium leading-5 text-[var(--text-primary)]"
              >
                {t.auth.email}
              </label>

              <input
                id="mobile-forgot-email"
                type="email"
                placeholder={t.auth.emailPlaceholder}
                className="h-12 w-full rounded-lg border border-[var(--border-default)] px-4 text-[14px] font-medium outline-none placeholder:text-[var(--text-tertiary)]"
              />
            </div>

            {/* Enviar recuperação */}
            <button
            type="button"
            onClick={onVerifyEmail}
            className="flex h-12 w-full shrink-0 items-center justify-center rounded-lg bg-[var(--brand-primary)] text-[14px] font-semibold leading-5 text-white"
            >
            {t.auth.sendRecoveryLink}
            </button>

            {/* Divisor */}
            <div className="flex h-5 w-full items-center gap-3">
              <div className="h-px flex-1 bg-[var(--border-default)]" />

              <span className="text-[12px] font-medium leading-[17px] text-[var(--text-tertiary)]">
                {t.auth.or}
              </span>

              <div className="h-px flex-1 bg-[var(--border-default)]" />
            </div>

            {/* Google */}
            <button
              type="button"
              className="flex h-12 w-full shrink-0 items-center justify-center gap-[10px] rounded-[10px] border border-[var(--border-default)] bg-[#fcfdfd]"
            >
              <Image
                src="/moneypilot/icon-google.svg"
                alt=""
                width={20}
                height={20}
                className="h-5 w-5 shrink-0"
              />

              <span className="text-[14px] font-medium leading-5 text-[var(--text-secondary)]">
                {t.auth.google}
              </span>
            </button>

            {/* Voltar para Login */}
            <button
              type="button"
              onClick={onLogin}
              className="flex w-full items-center justify-center gap-3 text-[13px] font-medium leading-5 text-[var(--brand-secondary)]"
            >
              <Image
                src="/moneypilot/icon-arrow-left.svg"
                alt=""
                width={24}
                height={24}
                className="h-6 w-6 shrink-0"
              />

              <span>{t.auth.backToLogin}</span>
            </button>
          </div>
        ) : (
          /* Card Login / Criar conta atual */
          <form action={isLogin ? signIn : signUp} className="flex w-[392px] flex-col gap-5 rounded-[20px] border-[1.6px] border-[var(--brand-secondary)] bg-white px-3 py-6 shadow-[0_8px_24px_rgba(0,18,26,0.08)]">
            {/* Eyebrow */}
            <p className="text-[12px] font-semibold leading-[17px] tracking-[0.96px] text-[var(--brand-secondary)]">
              {t.auth.eyebrow.welcome}
            </p>

            {/* Tabs */}
            <div className="flex w-[380px] gap-3 self-center">
              <button
                type="button"
                onClick={onSignup}
                className={`flex h-12 w-[184px] shrink-0 items-center justify-center rounded-lg border-[1.6px] text-[14px] font-medium ${
                  !isLogin
                    ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white"
                    : "border-transparent bg-[#fcfdfd] text-[var(--text-secondary)]"
                }`}
              >
                {t.auth.createAccount}
              </button>

              <button
                type="button"
                onClick={onLogin}
                className={`flex h-12 w-[184px] shrink-0 items-center justify-center rounded-lg border-[1.6px] text-[14px] font-medium ${
                  isLogin
                    ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white"
                    : "border-[var(--brand-primary)] bg-[#fcfdfd] text-[var(--brand-primary)]"
                }`}
              >
                {t.auth.login}
              </button>
            </div>

            {!isLogin && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="mobile-signup-first-name"
                    className="text-[14px] font-medium text-[var(--text-primary)]"
                  >
                    {t.auth.firstName}
                  </label>

                  <input
                    id="mobile-signup-first-name"
                    name="firstName"
                    type="text"
                    required
                    autoComplete="given-name"
                    placeholder={t.auth.firstNamePlaceholder}
                    className="h-12 w-full rounded-lg border border-[var(--border-default)] px-4 text-[14px] outline-none placeholder:text-[var(--text-tertiary)]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="mobile-signup-last-name"
                    className="text-[14px] font-medium text-[var(--text-primary)]"
                  >
                    {t.auth.lastName}
                  </label>

                  <input
                    id="mobile-signup-last-name"
                    name="lastName"
                    type="text"
                    required
                    autoComplete="family-name"
                    placeholder={t.auth.lastNamePlaceholder}
                    className="h-12 w-full rounded-lg border border-[var(--border-default)] px-4 text-[14px] outline-none placeholder:text-[var(--text-tertiary)]"
                  />
                </div>
              </div>
            )}

            {/* E-mail */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="mobile-signup-email"
                className="text-[14px] font-medium text-[var(--text-primary)]"
              >
                {t.auth.email}
              </label>

              <input
                id="mobile-signup-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder={t.auth.emailPlaceholder}
                className="h-12 w-full rounded-lg border border-[var(--border-default)] px-4 text-[14px] outline-none placeholder:text-[var(--text-tertiary)]"
              />
            </div>

            {/* Senha */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="mobile-signup-password"
                className="text-[14px] font-medium text-[var(--text-primary)]"
              >
                {t.auth.password}
              </label>

              <input
                id="mobile-signup-password"
                name="password"
                type="password"
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
                placeholder={t.auth.passwordPlaceholder}
                className="h-12 w-full rounded-lg border border-[var(--border-default)] px-4 text-[14px] outline-none placeholder:text-[var(--text-tertiary)]"
              />
            </div>

            {/* Esqueci minha senha */}
            <button
              type="button"
              onClick={onForgotPassword}
              className="w-full text-right text-[13px] font-medium leading-5 text-[var(--brand-primary)]"
            >
              {t.auth.forgotPassword}
            </button>

            {/* Criar conta */}
            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center rounded-lg bg-[var(--brand-primary)] text-[14px] font-medium text-white"
            >
              {isLogin ? t.auth.login : t.auth.createAccount}
            </button>

            {/* Divisor */}
            <div className="flex h-5 items-center gap-3">
              <div className="h-px flex-1 bg-[var(--border-default)]" />

              <span className="text-[12px] font-medium text-[var(--text-tertiary)]">
                {t.auth.or}
              </span>

              <div className="h-px flex-1 bg-[var(--border-default)]" />
            </div>

            {/* Google */}
            <button
              type="button"
              className="flex h-12 w-full items-center justify-center gap-[10px] rounded-[10px] border border-[var(--border-default)] bg-[#fcfdfd]"
            >
              <Image
                src="/moneypilot/icon-google.svg"
                alt=""
                width={20}
                height={20}
              />

              <span className="text-[14px] font-medium text-[var(--text-secondary)]">
                {t.auth.google}
              </span>
            </button>

            {/* Login */}
            <button
              type="button"
              onClick={isLogin ? onSignup : onLogin}
              className="w-full text-center text-[13px] font-medium leading-5 text-[var(--text-secondary)]"
            >
              {isLogin ? t.auth.noAccount : t.auth.alreadyHaveAccount}{" "}
              <span className="text-[var(--brand-primary)]">
                {isLogin ? t.auth.createAccount : t.auth.login}
              </span>
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
