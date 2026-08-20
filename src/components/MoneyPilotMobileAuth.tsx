import Image from "next/image";
import { useState } from "react";

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
      ? "Fraca"
      : passwordLevel === 2
        ? "Média"
        : "Forte";

  return (
    <div className="w-[440px] bg-white">
      {/* Hero / Foto da casa */}
      <section className="relative h-[820px] w-[440px] overflow-hidden px-6 py-12">
        {/* Background */}
        <Image
            src={
            isResetPassword
                ? "/moneypilot/auth-reset-password-bg.png"
                : isVerifyEmail
                ? "/moneypilot/auth-verify-email-bg.png"
                : isForgotPassword
                    ? "/moneypilot/auth-forgot-password-bg.png"
                    : isLogin
                    ? "/moneypilot/auth-login-bg.png"
                    : "/moneypilot/auth-signup-bg.png"
            }
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="440px"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/25" />

        {/* Conteúdo */}
        <div className="relative z-10 flex h-full flex-col justify-between">
          {/* Logo */}
          <div className="flex h-12 items-center">
            <Image
                src="/moneypilot/moneypilot-logo-white.svg"
                alt="MoneyPilot"
                width={220}
                height={48}
                priority
                className="h-12 w-auto"
            />
            </div>

          {/* Conteúdo inferior */}
          <div className="flex flex-col gap-9">
            {/* Texto */}
            <div className="flex flex-col gap-3">
                <h1 className="text-[30px] font-semibold leading-[38px] text-white">
                {isResetPassword ? (
                    <>
                    <span className="block">
                        Invista hoje no futuro
                    </span>

                    <span className="block">
                        que você deseja.
                    </span>
                    </>
                ) : isVerifyEmail ? (
                    <>
                    <span className="block">
                        Um novo amor também
                    </span>

                    <span className="block">
                        merece um bom
                    </span>

                    <span className="block">
                        planejamento.
                    </span>
                    </>
                ) : isForgotPassword ? (
                    <>
                    <span className="block whitespace-nowrap">
                        O grande dia merece um
                    </span>

                    <span className="block whitespace-nowrap">
                        grande planejamento.
                    </span>
                    </>
                ) : isLogin ? (
                    <>
                    <span className="block whitespace-nowrap">
                        Seu próximo carro
                    </span>

                    <span className="block whitespace-nowrap">
                        começa com um plano.
                    </span>
                    </>
                ) : (
                    <>
                    <span className="block whitespace-nowrap">
                        A casa dos seus sonhos
                    </span>

                    <span className="block whitespace-nowrap">
                        começa com planejamento.
                    </span>
                    </>
                )}
                </h1>
              <p className="text-[18px] font-medium leading-6 text-[#c3cfcf]">
                {isResetPassword
                    ? "Crie uma meta para faculdade, cursos ou certificações e acompanhe seu progresso até alcançar seus objetivos."
                    : isVerifyEmail
                    ? "Organize suas finanças para a chegada do bebê e prepare-se com mais tranquilidade para cada momento dessa nova fase."
                    : isForgotPassword
                        ? "Organize sua meta para cerimônia, festa e lua de mel sem perder o controle das suas finanças."
                        : isLogin
                        ? "Defina quanto precisa guardar e acompanhe sua evolução até chegar ao valor ideal para a sua compra."
                        : "Organize seu dinheiro, acompanhe suas metas e construa passo a passo o caminho para o seu novo lar."}
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
                        Segurança em primeiro lugar
                        </h3>

                        <p className="text-[11px] leading-[18px] text-[var(--text-secondary)]">
                        Seus dados estão protegidos com criptografia e nunca compartilhamos suas
                        informações com terceiros.
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
                            Privacidade
                            <br />
                            protegida
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
                            Criptografia
                            <br />
                            de ponta
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
                            Você no
                            <br />
                            controle
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
                            Conexão
                            <br />
                            segura
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
                                CRIAR NOVA SENHA
                              </p>
                            </div>

                            {/* Título + descrição */}
                            <div className="flex flex-col gap-3">
                            <h2 className="text-[28px] font-semibold leading-[38px] text-[var(--text-primary)]">
                                Criar uma nova senha
                            </h2>

                            <p className="text-[14px] font-medium leading-5 text-[var(--text-secondary)]">
                                Escolha uma nova senha forte e segura para sua conta.
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
                                Nova Senha
                              </label>
                            </div>

                            <div className="relative">
                                <input
                                id="mobile-new-password"
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(event) => setNewPassword(event.target.value)}
                                placeholder="Digite sua nova senha"
                                className="h-12 w-full rounded-lg border border-[var(--border-default)] px-4 pr-12 text-[14px] outline-none placeholder:text-[var(--text-tertiary)]"
                                />

                                <button
                                type="button"
                                onClick={() => setShowNewPassword((value) => !value)}
                                className="absolute right-4 top-1/2 -translate-y-1/2"
                                aria-label={showNewPassword ? "Ocultar senha" : "Mostrar senha"}
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
                                Confirmar nova senha
                              </label>
                            </div>

                            <div className="relative">
                                <input
                                id="mobile-confirm-password"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Digite sua senha"
                                className="h-12 w-full rounded-lg border border-[var(--border-default)] px-4 pr-12 text-[14px] outline-none placeholder:text-[var(--text-tertiary)]"
                                />

                                <button
                                type="button"
                                onClick={() => setShowConfirmPassword((value) => !value)}
                                className="absolute right-4 top-1/2 -translate-y-1/2"
                                aria-label={
                                    showConfirmPassword ? "Ocultar senha" : "Mostrar senha"
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
                            Redefinir senha
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

                              <span>Voltar para o Login</span>
                            </button>
                        </div>
                        ) : isVerifyEmail ? (
                        /* Card / Verifique seu e-mail */
                        <div className="flex h-[690px] w-[392px] flex-col items-start justify-between rounded-[22px] border-2 border-[var(--brand-secondary)] bg-white p-10 shadow-[0_8px_24px_rgba(0,18,26,0.08)]">
                            {/* Eyebrow */}
                            <p className="w-full text-left text-[12px] font-semibold leading-[17px] tracking-[0.96px] text-[var(--brand-secondary)]">
                            VERIFIQUE SEU E-MAIL
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
                    Verifique seu e-mail
                    </h2>

                    {/* Mensagem + aviso */}
                    <div className="flex w-full flex-col gap-3">
                    <p className="w-full text-left text-[14px] font-medium leading-5 text-[var(--text-secondary)]">
                        Enviamos um link de recuperação para{" "}
                        <span className="font-semibold text-[var(--text-primary)]">
                        voce@exemplo.com
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
                        O link é{" "}
                        <span className="font-semibold text-[var(--text-primary)]">
                            válido por 1 hora.
                        </span>{" "}
                        Verifique também sua caixa de spam.
                        </p>
                    </div>
                    </div>

                    {/* Reenviar */}
                    <button
                      type="button"
                      className="flex h-12 w-full shrink-0 items-center justify-center rounded-lg bg-[var(--brand-primary)] text-[14px] font-semibold leading-5 text-white"
                    >
                      Enviar novamente
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

                    <span>Voltar para o Login</span>
                    </button>
                </div>
                ) : isForgotPassword ? (
          /* Card / Recuperar acesso */
          <div className="flex h-[690px] w-[392px] flex-col justify-between rounded-[20px] border-2 border-[#005f73] bg-white p-6 shadow-[0_8px_24px_rgba(0,18,26,0.08)]">
            {/* Eyebrow */}
            <p className="text-[12px] font-semibold leading-[17px] tracking-[0.96px] text-[#005f73]">
              RECUPERAR ACESSO
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
              Esqueci minha senha
            </h2>

            {/* Descrição */}
            <p className="text-[14px] font-medium leading-5 text-[var(--text-secondary)]">
              Informe o e-mail da sua conta que enviaremos um link para você
              redefinir sua senha.
            </p>

            {/* E-mail */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="mobile-forgot-email"
                className="text-[14px] font-medium leading-5 text-[var(--text-primary)]"
              >
                E-mail
              </label>

              <input
                id="mobile-forgot-email"
                type="email"
                placeholder="voce@exemplo.com"
                className="h-12 w-full rounded-lg border border-[var(--border-default)] px-4 text-[14px] font-medium outline-none placeholder:text-[var(--text-tertiary)]"
              />
            </div>

            {/* Enviar recuperação */}
            <button
            type="button"
            onClick={onVerifyEmail}
            className="flex h-12 w-full shrink-0 items-center justify-center rounded-lg bg-[var(--brand-primary)] text-[14px] font-semibold leading-5 text-white"
            >
            Enviar link de recuperação
            </button>

            {/* Divisor */}
            <div className="flex h-5 w-full items-center gap-3">
              <div className="h-px flex-1 bg-[var(--border-default)]" />

              <span className="text-[12px] font-medium leading-[17px] text-[var(--text-tertiary)]">
                ou
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
                Entrar com Google
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

              <span>Voltar para o Login</span>
            </button>
          </div>
        ) : (
          /* Card Login / Criar conta atual */
          <div className="flex w-[392px] flex-col gap-5 rounded-[20px] border-[1.6px] border-[var(--brand-secondary)] bg-white px-3 py-6 shadow-[0_8px_24px_rgba(0,18,26,0.08)]">
            {/* Eyebrow */}
            <p className="text-[12px] font-semibold leading-[17px] tracking-[0.96px] text-[var(--brand-secondary)]">
              BEM-VINDO AO MONEYPILOT
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
                Criar conta
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
                Entrar
              </button>
            </div>

            {/* E-mail */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="mobile-signup-email"
                className="text-[14px] font-medium text-[var(--text-primary)]"
              >
                E-mail
              </label>

              <input
                id="mobile-signup-email"
                type="email"
                placeholder="voce@exemplo.com"
                className="h-12 w-full rounded-lg border border-[var(--border-default)] px-4 text-[14px] outline-none placeholder:text-[var(--text-tertiary)]"
              />
            </div>

            {/* Senha */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="mobile-signup-password"
                className="text-[14px] font-medium text-[var(--text-primary)]"
              >
                Senha
              </label>

              <input
                id="mobile-signup-password"
                type="password"
                placeholder="Digite sua senha"
                className="h-12 w-full rounded-lg border border-[var(--border-default)] px-4 text-[14px] outline-none placeholder:text-[var(--text-tertiary)]"
              />
            </div>

            {/* Esqueci minha senha */}
            <button
              type="button"
              onClick={onForgotPassword}
              className="w-full text-right text-[13px] font-medium leading-5 text-[var(--brand-primary)]"
            >
              Esqueci minha senha
            </button>

            {/* Criar conta */}
            <button
              type="button"
              className="flex h-12 w-full items-center justify-center rounded-lg bg-[var(--brand-primary)] text-[14px] font-medium text-white"
            >
              Criar conta
            </button>

            {/* Divisor */}
            <div className="flex h-5 items-center gap-3">
              <div className="h-px flex-1 bg-[var(--border-default)]" />

              <span className="text-[12px] font-medium text-[var(--text-tertiary)]">
                ou
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
                Entrar com Google
              </span>
            </button>

            {/* Login */}
            <button
              type="button"
              className="w-full text-center text-[13px] font-medium leading-5 text-[var(--text-secondary)]"
            >
              Já tem uma conta?{" "}
              <span className="text-[var(--brand-primary)]">Entrar</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
}