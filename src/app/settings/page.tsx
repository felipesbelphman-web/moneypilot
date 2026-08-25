"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { DesktopScaleCanvas } from "@/components/DesktopScaleCanvas";

const iconRoot = "/moneypilot/settings/icons";
const card = "overflow-hidden rounded-[18px] border border-[#28313B] bg-[rgba(8,11,15,0.22)] shadow-[0_8px_18px_rgba(0,0,0,0.24)]";

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  if (name === "ai-insights") return <Image src="/moneypilot/investments/icons/sparkles-outline.svg" alt="" width={size} height={size} className="shrink-0" />;
  return <Image src={`${iconRoot}/${name}.svg`} alt="" width={size} height={size} className="shrink-0" />;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return <button type="button" role="switch" aria-label={label} aria-checked={checked} onClick={onChange} className={`relative h-[18px] w-[34px] shrink-0 rounded-full transition-colors ${checked ? "bg-[#22C55E]" : "bg-[#28313B]"}`}><span className={`absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white transition-[left] ${checked ? "left-[18px]" : "left-[2px]"}`} /></button>;
}

const preferences = [
  { key: "currency", label: "Moeda", detail: "Usada em relatórios, orçamentos e metas.", icon: "currency" },
  { key: "language", label: "Idioma", detail: "Idioma principal da interface.", icon: "locale" },
  { key: "theme", label: "Tema", detail: "Aparência aplicada ao aplicativo.", icon: "appearance" },
  { key: "financialCycleDay", label: "Dia do ciclo financeiro", detail: "Orçamentos renovados todo dia 7.", icon: "cycle" },
];

const notificationRows = [
  { label: "Captura de transações", icon: "transaction-capture" }, { label: "Alertas de orçamento", icon: "budget-alerts" },
  { label: "Lembretes de metas", icon: "goal-reminders" }, { label: "Insights da IA", icon: "ai-insights" },
  { label: "Resumo semanal", icon: "weekly-summary" },
];

const security = [
  { label: "Exportar dados", detail: "Baixe seus dados financeiros.", action: "CSV / PDF", icon: "export" },
  { label: "Sincronização bancária", detail: "Contas conectadas e atualizadas.", action: "Ativa", icon: "bank-sync" },
  { label: "Alterar senha", detail: "Atualize a senha da sua conta.", action: "Alterar", icon: "password" },
  { label: "Sessões conectadas", detail: "1 dispositivo ativo no momento.", action: "Gerenciar", icon: "sessions" },
  { label: "Categorias e classificação", detail: "92% automáticas · 3 para revisar.", action: "Gerenciar", icon: "categories", href: "/categories" },
];

type Preferences = { currency: string; language: string; theme: string; financialCycleDay: string };
const initialPreferences: Preferences = { currency: "Euro (€)", language: "Português", theme: "Escuro", financialCycleDay: "7" };
const initialNotifications = [true, true, true, true, false];

export default function SettingsPage() {
  const [preferencesState, setPreferencesState] = useState(initialPreferences);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [savedPreferences, setSavedPreferences] = useState(initialPreferences);
  const [savedNotifications, setSavedNotifications] = useState(initialNotifications);
  const [preview, setPreview] = useState<string | null>(null);
  const [savedPreview, setSavedPreview] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeNotifications = notifications.filter(Boolean).length;
  const hasChanges = JSON.stringify(preferencesState) !== JSON.stringify(savedPreferences) || JSON.stringify(notifications) !== JSON.stringify(savedNotifications) || preview !== savedPreview;
  const backgroundImage = preview ?? "/moneypilot/dashboard-racing-bg.png";

  const metrics = useMemo(() => [
    { label: "Moeda atual", value: preferencesState.currency, detail: "Usada em relatórios, orçamentos e metas.", icon: "cash", color: "#3B82F6", iconBackground: "rgba(59,130,246,0.14)" },
    { label: "Idioma", value: preferencesState.language, detail: "Idioma principal da interface.", icon: "language", color: "#22C55E", iconBackground: "rgba(34,197,94,0.14)" },
    { label: "Tema", value: preferencesState.theme, detail: "Experiência visual atual do MoneyPilot.", icon: "theme", color: "#F59E0B", iconBackground: "rgba(245,158,11,0.14)" },
    { label: "Notificações", value: "Ativas", detail: `${activeNotifications} de 5 notificações estão ligadas.`, icon: "notifications", color: "#8B5CF6", iconBackground: "rgba(139,92,246,0.14)" },
  ], [activeNotifications, preferencesState]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setSavedFeedback(false);
  }

  function restoreImage() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setSavedFeedback(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function cyclePreference(key: keyof Preferences) {
    const options: Record<keyof Preferences, string[]> = { currency: ["Euro (€)", "Dólar ($)"], language: ["Português", "English"], theme: ["Escuro", "Claro"], financialCycleDay: ["7", "1"] };
    setPreferencesState((current) => {
      const values = options[key];
      const next = values[(values.indexOf(current[key]) + 1) % values.length];
      return { ...current, [key]: next };
    });
    setSavedFeedback(false);
  }

  function saveChanges() {
    if (!hasChanges) return;
    setSavedPreferences(preferencesState);
    setSavedNotifications([...notifications]);
    setSavedPreview(preview);
    setSavedFeedback(true);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#080B0F] font-[Inter] text-[#F5F7FA]">
      <DesktopScaleCanvas>
        <div className="relative h-[1024px] w-[1536px] overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${backgroundImage})` }} />
          <div className="absolute inset-0 bg-[rgba(13,17,23,0.50)] mix-blend-hard-light" />
          <section className="absolute left-[231px] top-[107px] h-[810px] w-[1164px] overflow-hidden rounded-[38px] border border-[rgba(40,49,59,0.16)] bg-[rgba(13,17,23,0.50)] px-[32px] py-[16px] shadow-[0_22px_42px_rgba(0,0,0,0.45)] backdrop-blur-[20px]">
            <div className="flex h-[767.67px] w-[1098px] flex-col gap-[12px]">
              <div className="flex h-[36.75px] shrink-0 items-center gap-[18.375px]"><span className="h-[36.75px] w-[36.75px] shrink-0 overflow-hidden"><Image src="/moneypilot/moneypilot-logo.svg" alt="" width={180} height={40} priority className="h-[36.75px] w-auto max-w-none" /></span><span className="font-brand text-[21.44px] font-medium leading-[26.031px] tracking-[0.4288px]">MoneyPilot</span></div>
              <header className="flex h-[57.92px] shrink-0 items-center justify-between"><div className="flex h-[52px] w-[700px] flex-col justify-center gap-[4px]"><h1 className="text-[23.168px] font-semibold leading-none">Configurações</h1><p className="text-[13.2px] text-[#9CA6B2]">Gerencie preferências, aparência, notificações, dados e segurança da sua conta.</p></div><div className="flex h-[52px] items-center gap-[16px]"><div className="relative"><button type="button" onClick={saveChanges} disabled={!hasChanges} className="flex h-[38px] w-[146px] items-center justify-center gap-[7px] rounded-[19px] bg-[#3B82F6] text-[10px] font-semibold text-white disabled:pointer-events-none">Salvar alterações<Image src={`${iconRoot}/save.svg`} alt="" width={18.25} height={18.25} className="size-[18.25px]" /></button>{savedFeedback && <span className="absolute -bottom-[14px] left-0 w-full text-center text-[7.5px] text-[#22C55E]">Alterações salvas</span>}</div><div className="relative size-[52.128px]"><Image src="/moneypilot/dashboard-avatar.png" alt="Avatar do usuário" width={52} height={52} className="size-[52.128px] rounded-full" /><button type="button" aria-label="Alterar foto do perfil" className="absolute bottom-0 right-0 flex size-[20px] items-center justify-center rounded-full border border-[#28313B] bg-[#3B82F6]"><Image src={`${iconRoot}/camera-reverse.svg`} alt="" width={12} height={12} className="size-[12px]" /></button></div></div></header>
              <section aria-label="Resumo das configurações" className="flex h-[100px] shrink-0 gap-[12px]">{metrics.map((item) => <article key={item.label} className={`${card} relative h-[100px] w-[265.5px] shrink-0`}><span className="absolute left-[11px] top-[11px] flex h-[30px] w-[30px] items-center justify-center rounded-[9px] border" style={{ borderColor: item.color, backgroundColor: item.iconBackground }}><Icon name={item.icon} size={16} /></span><h2 className="absolute left-[51px] top-[16px] text-[11px] font-semibold">{item.label}</h2><strong className="absolute left-[11px] top-[45px] text-[23px] font-semibold">{item.value}</strong><p className="absolute left-[11px] top-[77px] text-[9.2px] text-[#9CA6B2]">{item.detail}</p></article>)}</section>
              <section className="flex h-[198px] shrink-0 gap-[12px]">
                <article className={`${card} h-[198px] w-[543px] shrink-0 px-[14px] py-[12px]`}><h2 className="mb-[7px] text-[14px] font-semibold">Preferências gerais</h2>{preferences.map((item) => <div key={item.label} className="flex h-[36px] items-center border-b border-[#28313B]/70 last:border-0"><span className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-transparent"><Icon name={item.icon} size={15} /></span><div className="ml-[9px] flex-1"><strong className="block text-[8.8px]">{item.label}</strong><span className="block text-[7.6px] text-[#9CA6B2]">{item.detail}</span></div><button type="button" onClick={() => cyclePreference(item.key as keyof Preferences)} className={`h-[24px] min-w-[62px] rounded-[12px] border px-[10px] text-[8px] font-semibold ${item.key === "theme" && preferencesState.theme === "Escuro" ? "border-[#3B82F6] bg-[#3B82F6]" : "border-[#28313B] bg-[rgba(13,17,23,0.55)]"}`}>{preferencesState[item.key as keyof Preferences]}</button></div>)}</article>
                <article className={`${card} h-[198px] w-[543px] shrink-0 px-[14px] py-[12px]`}><h2 className="mb-[7px] text-[14px] font-semibold">Notificações</h2>{notificationRows.map((item, index) => <div key={item.label} className="flex h-[29px] items-center border-b border-[#28313B]/70 last:border-0"><span className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] bg-transparent"><Icon name={item.icon} size={14} /></span><span className="ml-[9px] flex-1 text-[8.8px] font-semibold">{item.label}</span><Toggle label={`Alternar ${item.label}`} checked={notifications[index]} onChange={() => { setNotifications((values) => values.map((value, position) => position === index ? !value : value)); setSavedFeedback(false); }} /></div>)}</article>
              </section>
              <section className="flex h-[198px] shrink-0 gap-[12px]">
                <article className={`${card} relative h-[198px] w-[543px] shrink-0 px-[14px] py-[12px]`}><h2 className="flex items-center gap-[8px] text-[14px] font-semibold"><Icon name="background" size={17} />Personalização do fundo</h2><div className="absolute left-[14px] top-[47px] h-[108px] w-[178px] rounded-[12px] border border-[#28313B] bg-cover bg-center" style={{ backgroundImage: `linear-gradient(rgba(8,11,15,.5),rgba(8,11,15,.5)),url(${backgroundImage})` }} /><div className="absolute left-[207px] top-[45px] w-[318px]"><h3 className="text-[9.2px] font-semibold">Imagem de fundo atual</h3><p className="mt-[5px] text-[7.8px] leading-[12px] text-[#9CA6B2]">Use uma imagem personalizada mantendo o overlay escuro para preservar a leitura.</p><div className="mt-[13px] flex gap-[8px]"><button type="button" onClick={() => inputRef.current?.click()} className="h-[27px] rounded-[14px] bg-[#3B82F6] px-[13px] text-[8px] font-semibold">Trocar imagem</button><button type="button" onClick={restoreImage} className="h-[27px] rounded-[14px] border border-[#28313B] bg-[rgba(13,17,23,0.55)] px-[13px] text-[8px] font-semibold text-[#F5F7FA]">Restaurar padrão</button></div><p className="mt-[9px] text-[7.4px] text-[#7F8996]">JPG ou PNG · recomendado 1920 × 1080</p></div><input ref={inputRef} type="file" accept="image/jpeg,image/png" onChange={chooseImage} className="hidden" /><p className="absolute bottom-[10px] left-[14px] text-[7.7px] text-[#9CA6B2]">O background acompanha o scroll; a navegação lateral continua fixa.</p></article>
                <article className={`${card} h-[198px] w-[543px] shrink-0 px-[14px] py-[12px]`}><div className="mb-[3px] flex items-center justify-between"><h2 className="text-[13px] font-semibold">Dados, conta e segurança</h2><span className="text-[7.4px] font-medium text-[#64707D]">Perfil · nome@email.com</span></div>{security.map((item) => <div key={item.label} className="flex h-[29px] items-center"><Icon name={item.icon} size={14} /><div className="ml-[6px] flex-1"><strong className="block text-[8.9px] leading-none">{item.label}</strong><span className="mt-[2px] block text-[7.1px] leading-none text-[#9CA6B2]">{item.detail}</span></div>{item.href ? <Link href={item.href} className="rounded-[8px] border border-[#28313B] bg-[rgba(13,17,23,0.55)] px-[9px] py-[6px] text-[8.5px] font-semibold">{item.action}</Link> : <button type="button" className="rounded-[8px] border border-[#28313B] bg-[rgba(13,17,23,0.55)] px-[9px] py-[6px] text-[8.5px] font-semibold">{item.action}</button>}</div>)}</article>
              </section>
              <section className="flex h-[86px] shrink-0 gap-[12px]"><article className="relative h-[86px] w-[543px] shrink-0 rounded-[18px] border border-[rgba(244,63,93,0.60)] bg-[rgba(77,14,20,0.35)] px-[14px] py-[12px]"><h2 className="flex items-center gap-[8px] text-[13px] font-semibold text-[#F5F7FA]"><Icon name="delete" size={16} />Zona de perigo</h2><p className="mt-[9px] text-[8px] text-[#9CA6B2]">Exclua permanentemente sua conta e todos os dados associados.</p><button type="button" onClick={() => setDeleteConfirmation((value) => !value)} className="absolute right-[14px] top-[30px] h-[28px] rounded-[14px] border border-[#28313B] bg-[rgba(13,17,23,0.55)] px-[14px] text-[8px] font-semibold">{deleteConfirmation ? "Ação desativada" : "Excluir conta"}</button></article><article className={`${card} relative h-[86px] w-[543px] shrink-0 px-[14px] py-[12px]`}><h2 className="flex items-center gap-[8px] text-[13px] font-semibold"><Icon name="support" size={16} />Suporte e ajuda</h2><p className="mt-[9px] text-[8px] text-[#9CA6B2]">Encontre respostas ou fale com nossa equipe quando precisar.</p><button type="button" className="absolute right-[14px] top-[30px] h-[28px] rounded-[14px] bg-[#3B82F6] px-[14px] text-[8px] font-semibold">Falar com suporte</button></article></section>
            </div>
          </section>
        </div>
      </DesktopScaleCanvas>
    </main>
  );
}
