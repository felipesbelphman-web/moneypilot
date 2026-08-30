"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import MobileScaleCanvas from "@/components/MobileScaleCanvas";
import MoneyPilotMobileAuth from "@/components/MoneyPilotMobileAuth";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/i18n/translations";
import { signIn, signUp } from "./actions";

type AuthMode =
  | "signup"
  | "login"
  | "forgot-password"
  | "verify-email"
  | "reset-password";

type LoginErrorCode =
  | "invalid-credentials"
  | "auth-unavailable"
  | "auth-error";

function isLoginErrorCode(value: string | null): value is LoginErrorCode {
  return value === "invalid-credentials" || value === "auth-unavailable" || value === "auth-error";
}

export default function AuthPage() {
  const { language } = useLanguage();
  const t = translations[language];
  const [mode, setMode] = useState<AuthMode>("signup");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [loginError, setLoginError] = useState<LoginErrorCode | null>(null);

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

  const isLogin = mode === "login";
  const isForgotPassword = mode === "forgot-password";
  const isVerifyEmail = mode === "verify-email";
  const isResetPassword = mode === "reset-password";
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
  const loginErrorMessage = loginError
    ? {
        en: {
          "invalid-credentials": "Email or password is incorrect.",
          "auth-unavailable": "We couldn't reach the authentication service. Please try again in a moment.",
          "auth-error": "We couldn't sign you in. Please try again.",
        },
        pt: {
          "invalid-credentials": "O email ou a palavra-passe está incorreto.",
          "auth-unavailable": "Não foi possível contactar o serviço de autenticação. Tente novamente dentro de alguns instantes.",
          "auth-error": "Não foi possível iniciar sessão. Tente novamente.",
        },
        es: {
          "invalid-credentials": "El correo electrónico o la contraseña son incorrectos.",
          "auth-unavailable": "No pudimos contactar con el servicio de autenticación. Inténtalo de nuevo en unos instantes.",
          "auth-error": "No pudimos iniciar sesión. Inténtalo de nuevo.",
        },
        de: { "invalid-credentials": "E-Mail oder Passwort ist falsch.", "auth-unavailable": "Der Authentifizierungsdienst ist nicht erreichbar. Bitte versuche es gleich noch einmal.", "auth-error": "Die Anmeldung ist fehlgeschlagen. Bitte versuche es erneut." },
        fr: { "invalid-credentials": "L’adresse e-mail ou le mot de passe est incorrect.", "auth-unavailable": "Le service d’authentification est inaccessible. Veuillez réessayer dans un instant.", "auth-error": "La connexion a échoué. Veuillez réessayer." },
        nl: { "invalid-credentials": "E-mailadres of wachtwoord is onjuist.", "auth-unavailable": "De authenticatieservice is niet bereikbaar. Probeer het zo opnieuw.", "auth-error": "Inloggen is mislukt. Probeer het opnieuw." },
        it: { "invalid-credentials": "L’e-mail o la password non è corretta.", "auth-unavailable": "Il servizio di autenticazione non è raggiungibile. Riprova tra poco.", "auth-error": "Accesso non riuscito. Riprova." },
      }[language][loginError]
    : null;
  useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const modeParam = params.get("mode");
  const errorParam = params.get("error");

  const nextMode =
    modeParam === "signup" ||
    modeParam === "login" ||
    modeParam === "forgot-password" ||
    modeParam === "verify-email" ||
    modeParam === "reset-password"
      ? modeParam
      : null;
  const nextLoginError = isLoginErrorCode(errorParam) ? errorParam : null;

  const frame = requestAnimationFrame(() => {
    if (nextMode) setMode(nextMode);
    setLoginError(nextLoginError);
  });

  return () => cancelAnimationFrame(frame);
}, []);

  return (
  <main className="public-identity min-h-screen bg-white md:h-screen md:overflow-hidden">
    {/* Mobile */}
    <div className="md:hidden">
      <MobileScaleCanvas>
        <MoneyPilotMobileAuth
          isLogin={isLogin}
          isForgotPassword={isForgotPassword}
          isVerifyEmail={isVerifyEmail}
          isResetPassword={isResetPassword}
          onLogin={() => setMode("login")}
          onSignup={() => setMode("signup")}
          onForgotPassword={() => setMode("forgot-password")}
          onVerifyEmail={() => setMode("verify-email")}
        />
      </MobileScaleCanvas>
    </div>

    {/* Desktop */}
    <section className="hidden h-full w-full md:flex">
        {/* Painel da marca */}
        <div className="relative h-full w-[44.7917%] overflow-hidden">
          <Image
            src={
              isResetPassword
                ? "/moneypilot/auth-reset-password-bg.png"
                : isVerifyEmail
                  ? "/moneypilot/auth-verify-email-bg.png"
                  : isForgotPassword
                    ? "/moneypilot/auth-forgot-password-bg.png"
                    : isLogin
                      ? "/moneypilot/auth-login-bg.jpg"
                      : "/moneypilot/auth-signup-bg.png"
            }
            alt=""
            fill
            priority
            className="object-cover"
            sizes="45vw"
          />
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-between py-[64px]">
            <div className="w-[715px] origin-top-center scale-[0.84]">
              <Image
                src="/moneypilot/moneypilot-logo-white.svg"
                alt="MoneyPilot"
                width={232}
                height={48}
                priority
                className="origin-top-left"
              />
            </div>

            <div className="w-[715px] origin-bottom-center scale-[0.84]">
              <div className="flex flex-col gap-6">
                <h1
                  className={`text-[40px] font-semibold leading-[52px] text-white ${
                    isVerifyEmail ? "max-w-[715px]" : "max-w-[560px]"
                  }`}
                >
                  {hero.titleLines.map((line) => (
                    <span key={line} className="block whitespace-nowrap">{line}</span>
                  ))}
                </h1>

                <p
                  className={`max-w-[560px] text-[18px] font-medium leading-6 ${
                    isResetPassword ? "text-[#c3cfcf]" : "text-white"
                  }`}
                >
                  {hero.description}
                </p>
              </div>

                            {/* Security card */}
              <div className="mt-9 flex w-[715px] items-start rounded-[20px] border border-[#D4D4D4] bg-white p-6">
                <div className="flex items-start gap-3">
                  <Image
                    src="/moneypilot/security-shield-lock.svg"
                    alt=""
                    width={24}
                    height={24}
                    className="shrink-0"
                  />

                  <div className="flex flex-col gap-3">
                    <h2 className="text-[18px] font-semibold leading-6 text-[#0A0A0A]">
                      {t.auth.security.title}
                    </h2>

                    <p className="w-[572px] text-[12px] font-medium leading-5 text-[#525252]">
                      {t.auth.security.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Painel do formulário */}
        <div className="relative h-full w-[55.2083%] bg-white">
          <div
            className="absolute left-1/2 top-1/2 h-[690px] w-[560px] origin-center -translate-x-1/2 -translate-y-1/2 scale-[0.84] rounded-[24px] border-2 border-[#38BDF8] bg-white p-10 shadow-[0_8px_24px_rgba(0,18,26,0.08)]"
          >
            <div
              className={`flex h-full flex-col ${
                isResetPassword || isForgotPassword || isVerifyEmail
                  ? "justify-between"
                  : "gap-5"
              }`}
            >
              <div className="flex items-center gap-3">
                {isResetPassword && (
                  <Image
                    src="/moneypilot/icon-keypad.svg"
                    alt=""
                    width={24}
                    height={24}
                    className="h-6 w-6 shrink-0"
                  />
                )}

                <p
                  className={`font-semibold leading-[17px] text-[var(--brand-secondary)] ${
                    isResetPassword
                      ? "text-[14px] tracking-[1.12px]"
                      : "text-[12px] tracking-[0.96px]"
                  }`}
                >
                  {isResetPassword
                    ? t.auth.eyebrow.newPassword
                    : isVerifyEmail
                      ? t.auth.eyebrow.verifyEmail
                      : isForgotPassword
                        ? t.auth.eyebrow.recoverAccess
                        : t.auth.eyebrow.welcome}
                        
                </p>
              </div>
                  {isVerifyEmail && (
                    <div className="flex w-full justify-center">
                      <Image
                        src="/moneypilot/auth-verify-email-icon.svg"
                        alt=""
                        width={65}
                        height={65}
                      />
                    </div>
                  )}
              <div
                className={`flex flex-col ${
                  isResetPassword ? "gap-6" : "gap-5"
                }`}
              >
                <h1 className="text-[32px] font-semibold leading-[42px] text-[var(--text-primary)]">
                  {isResetPassword
                    ? t.auth.title.resetPassword
                    : isVerifyEmail
                      ? t.auth.title.verifyEmail
                      : isForgotPassword
                        ? t.auth.title.forgotPassword
                        : isLogin
                          ? t.auth.title.login
                          : t.auth.title.signup}
                </h1>

                <p className="text-[14px] font-medium leading-5 text-[var(--text-secondary)]">
                  {isResetPassword
                    ? t.auth.description.resetPassword
                    : isVerifyEmail
                      ? `${t.auth.description.verifyEmail} ${t.auth.emailPlaceholder}`
                      : isForgotPassword
                        ? t.auth.description.forgotPassword
                        : isLogin
                          ? t.auth.description.login
                          : t.auth.description.signup}
                </p>
              </div>
              
              {isForgotPassword && (
                <div className="flex w-full justify-center">
                  <Image
                    src="/moneypilot/auth-forgot-password-icon.svg"
                    alt=""
                    width={65}
                    height={65}
                  />
                </div>
              )}

              {isVerifyEmail && (
                <div className="flex w-full items-start gap-3">
                  <Image
                    src="/moneypilot/icon-alert-circle.svg"
                    alt=""
                    width={24}
                    height={24}
                    className="shrink-0"
                  />

                  <div className="text-[16px] font-medium leading-5 text-[#0A9396]">
                    <p>
                      {t.auth.linkValidPrefix}{" "}
                      <span className="font-semibold text-[var(--text-primary)]">
                        {t.auth.linkValidDuration}{" "}
                      </span>
                    </p>

                    <p>{t.auth.checkSpam}</p>
                  </div>
                </div>
              )}

              {!isForgotPassword && !isVerifyEmail && !isResetPassword && (
  <>
                          {/* Abas */}
                          <div className="flex h-11 w-full gap-1 rounded-xl bg-[#fcfdfd] p-1">
                            <button
                              type="button"
                              onClick={() => setMode("signup")}
                              className={`flex h-9 flex-1 items-center justify-center rounded-[9px] text-[14px] font-medium ${
                                !isLogin
                                  ? "bg-[#3B82F6] text-white"
                                  : "text-[var(--text-secondary)]"
                              }`}
                            >
                              {t.auth.createAccount}
                            </button>

                            <button
                              type="button"
                              onClick={() => setMode("login")}
                              className={`flex h-9 flex-1 items-center justify-center rounded-[9px] text-[14px] font-medium ${
                                isLogin
                                  ? "bg-[#3B82F6] text-white"
                                  : "text-[var(--text-secondary)]"
                              }`}
                            >
                              {t.auth.login}
                            </button>
                          </div>
                        </>
                      )}

                                    {!isForgotPassword && !isVerifyEmail && !isResetPassword && (
                                      <form
                                        id="auth-credentials-form"
                                        action={isLogin ? signIn : signUp}
                                      />
                                    )}
                                    {!isVerifyEmail && !isResetPassword && (
                                      <>
                                        {mode === "signup" && (
                        <div className="grid grid-cols-2 gap-3">
                          {/* Nome */}
                          <div className="flex flex-col gap-2">
                            <label
                              htmlFor="firstName"
                              className="text-[14px] font-medium text-[var(--text-primary)]"
                            >
                              {t.auth.firstName}
                            </label>

                            <input
                              id="firstName"
                              name="firstName"
                              type="text"
                              form="auth-credentials-form"
                              required
                              autoComplete="given-name"
                              placeholder={t.auth.firstNamePlaceholder}
                              className="h-12 w-full rounded-lg border border-[var(--border-default)] px-4 text-[14px] outline-none placeholder:text-[var(--text-tertiary)]"
                            />
                          </div>

                          {/* Sobrenome */}
                          <div className="flex flex-col gap-2">
                            <label
                              htmlFor="lastName"
                              className="text-[14px] font-medium text-[var(--text-primary)]"
                            >
                              {t.auth.lastName}
                            </label>

                            <input
                              id="lastName"
                              name="lastName"
                              type="text"
                              form="auth-credentials-form"
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
                              htmlFor="email"
                              className="text-[14px] font-medium text-[var(--text-primary)]"
                            >
                              {t.auth.email}
                            </label>

                            <input
                              id="email"
                              name="email"
                              type="email"
                              form={
                                !isForgotPassword && !isVerifyEmail && !isResetPassword
                                  ? "auth-credentials-form"
                                  : undefined
                              }
                              required={!isForgotPassword && !isVerifyEmail && !isResetPassword}
                              autoComplete="email"
                              placeholder={t.auth.emailPlaceholder}
                              className="h-12 w-full rounded-lg border border-[var(--border-default)] px-4 text-[14px] outline-none placeholder:text-[var(--text-tertiary)]"
                            />
                          </div>
                        </>
                      )}

              {!isForgotPassword && !isVerifyEmail && !isResetPassword && (
  <>
    {/* Senha */}
    <div className="flex flex-col gap-2">
      <label
        htmlFor="password"
        className="text-[14px] font-medium text-[var(--text-primary)]"
      >
        {t.auth.password}
      </label>

      <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            form="auth-credentials-form"
            required
            autoComplete={isLogin ? "current-password" : "new-password"}
            placeholder={t.auth.passwordPlaceholder}
            className="h-12 w-full rounded-lg border border-[var(--border-default)] px-4 pr-12 text-[14px] outline-none placeholder:text-[var(--text-tertiary)]"
          />

  <button
    type="button"
    onClick={() => setShowPassword((value) => !value)}
    className="absolute right-4 top-1/2 -translate-y-1/2"
    aria-label={showPassword ? t.common.hidePassword : t.common.showPassword}
  >
    <Image
      src={
        showPassword
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

    {isLogin && loginErrorMessage && (
      <p role="alert" className="rounded-lg border border-[#F43F5E]/30 bg-[#F43F5E]/10 px-3 py-2 text-[12px] font-medium leading-5 text-[#C53030]">
        {loginErrorMessage}
      </p>
    )}

    <button
      type="button"
      onClick={() => setMode("forgot-password")}
      className="text-right text-[13px] font-medium leading-5 text-[var(--brand-primary)]"
    >
      {t.auth.forgotPassword}
    </button>
  </>
)}
              {isResetPassword && (
                <>
                  {/* Nova Senha */}
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
                        htmlFor="new-password"
                        className="text-[14px] font-medium text-[var(--text-primary)]"
                      >
                        {t.auth.newPassword}
                      </label>
                    </div>

                    <div className="relative">
                      <input
                      id="new-password"
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
                        htmlFor="confirm-password"
                        className="text-[14px] font-medium text-[var(--text-primary)]"
                      >
                        {t.auth.confirmPassword}
                      </label>
                    </div>

                    <div className="relative">
                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder={t.auth.passwordPlaceholder}
                        className="h-12 w-full rounded-lg border border-[var(--border-default)] px-4 pr-12 text-[14px] outline-none placeholder:text-[var(--text-tertiary)]"
                      />

                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((value) => !value)}
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                        aria-label={showConfirmPassword ? t.common.hidePassword : t.common.showPassword}
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
                </>
              )}

              {/* Ação principal */}
              <button
                type={
                  !isForgotPassword && !isVerifyEmail && !isResetPassword
                    ? "submit"
                    : "button"
                }
                form={
                  !isForgotPassword && !isVerifyEmail && !isResetPassword
                    ? "auth-credentials-form"
                    : undefined
                }
                onClick={() => {
                  if (isResetPassword) {
                    setMode("login");
                    return;
                  }

                  if (isForgotPassword) {
                    setMode("verify-email");
                  }
                }}
                className={`flex shrink-0 items-center justify-center bg-[#3B82F6] font-medium text-white ${
                  isResetPassword
                    ? "h-[56px] w-[480px] rounded-[8px] text-[16px] leading-5"
                    : "h-12 w-full rounded-lg text-[14px] leading-5"
                }`}
              >
                {isResetPassword
                  ? t.auth.resetPassword
                  : isVerifyEmail
                    ? t.auth.resend
                    : isForgotPassword
                      ? t.auth.sendRecoveryLink
                      : isLogin
                        ? t.auth.login
                        : t.auth.createAccount}
              </button>

              {!isResetPassword && !isVerifyEmail && (
                <>
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

                    {!isForgotPassword && !isVerifyEmail && !isResetPassword && (
                      <span className="text-[10px] font-semibold tracking-[0.5px] text-[var(--text-tertiary)]">
                        {t.auth.comingSoon}
                      </span>
                    )}
                  </button>
                </>
              )}

              {/* Link inferior */}
              <button
                type="button"
                onClick={() => {
                  if (isForgotPassword || isVerifyEmail || isResetPassword) {
                    setMode("login");
                  } else {
                    setMode(isLogin ? "signup" : "login");
                  }
                }}
                className="text-center text-[13px] font-medium text-[var(--text-secondary)]"
              >
                {isForgotPassword || isVerifyEmail || isResetPassword ? (
                  <span className="flex items-center justify-center gap-3 text-[var(--brand-primary)]">
                    <Image
                      src="/moneypilot/icon-arrow-left.svg"
                      alt=""
                      width={24}
                      height={24}
                    />

                    <span>{t.auth.backToLogin}</span>
                  </span>
                ) : isLogin ? (
                  <>
                    {t.auth.noAccount}{" "}
                    <span className="text-[var(--brand-primary)]">
                      {t.auth.createAccount}
                    </span>
                  </>
                ) : (
                  <>
                    {t.auth.alreadyHaveAccount}{" "}
                    <span className="text-[var(--brand-primary)]">
                      {t.auth.login}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
