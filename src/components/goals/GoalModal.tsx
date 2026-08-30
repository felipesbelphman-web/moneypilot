"use client";

import { useCurrency } from "@/components/CurrencyProvider";

import { useEffect, useId, useState } from "react";
import { IconTargetArrow } from "@tabler/icons-react";

import { useLanguage } from "@/components/LanguageProvider";
import { calculateGoal } from "@/components/goals/goal-calculations";
import type { Goal, GoalPriority } from "@/components/goals/goal-model";
import { isValidTargetMonth, normalizeGoalName } from "@/components/goals/goal-model";
import { localizeCopy } from "@/i18n/localize-copy";

type GoalModalProps = {
  mode: "create" | "edit";
  goal?: Goal;
  goals: Goal[];
  onClose: () => void;
  onSubmit: (goal: Omit<Goal, "id">) => void;
  onRequestDelete?: () => void;
};

type FormState = { name: string; targetAmount: string; savedAmount: string; targetDate: string; priority: GoalPriority };

const copy = {
  create: { title: "New goal", description: "Set a clear target and track your progress.", submit: "Create goal" },
  edit: { title: "Edit goal", description: "Update the target without losing its history.", submit: "Save changes" },
};

function toForm(goal?: Goal): FormState {
  return goal ? { name: goal.name, targetAmount: String(goal.targetAmount), savedAmount: String(goal.savedAmount), targetDate: goal.targetDate, priority: goal.priority } : { name: "", targetAmount: "", savedAmount: "0", targetDate: "", priority: "secondary" };
}

function parseAmount(value: string) {
  const cleaned = value.replace(/(?:R\$|€|£|\$|EUR|GBP|USD|BRL|\s)/gi, "");
  const normalized = cleaned.includes(",") && cleaned.includes(".")
    ? cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".") ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned.replace(/,/g, "")
    : cleaned.replace(",", ".");
  return Number(normalized);
}

export function GoalModal({ mode, goal, goals, onClose, onSubmit, onRequestDelete }: GoalModalProps) {
  const { language } = useLanguage();
  const { formatMoney: money } = useCurrency();
  const tr = (value: string) => localizeCopy(language, value);
  const [form, setForm] = useState<FormState>(() => toForm(goal));
  const [error, setError] = useState("");
  const titleId = useId();
  const fields = (key: keyof FormState, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const draftTarget = parseAmount(form.targetAmount);
  const draftSaved = parseAmount(form.savedAmount);
  const preview = calculateGoal({ targetAmount: Number.isFinite(draftTarget) ? draftTarget : 0, savedAmount: Number.isFinite(draftSaved) ? draftSaved : 0, targetDate: form.targetDate });
  const previewContribution = preview.requiredMonthlyContribution === null ? "—" : money(preview.requiredMonthlyContribution);
  const previewDetail = preview.isPastDue ? tr("Target date passed") : preview.isCompleted ? tr("Goal completed") : preview.isDueThisMonth ? tr("Needed to complete this month") : preview.monthsRemaining > 0 ? `${preview.monthsRemaining} ${tr("months remaining")}` : tr("Choose a future target month");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const name = form.name.trim();
    const targetAmount = parseAmount(form.targetAmount);
    const savedAmount = parseAmount(form.savedAmount);
    if (!name) return setError(tr("Enter a goal name."));
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) return setError(tr("Target amount must be greater than zero."));
    if (!Number.isFinite(savedAmount) || savedAmount < 0) return setError(tr("Saved amount cannot be negative."));
    if (savedAmount > targetAmount) return setError(tr("Saved amount cannot exceed the target amount."));
    if (!isValidTargetMonth(form.targetDate)) return setError(tr("Choose a valid target month."));
    if (form.priority !== "primary" && form.priority !== "secondary") return setError(tr("Choose a valid priority."));
    const duplicate = goals.some((item) => item.id !== goal?.id && normalizeGoalName(item.name) === normalizeGoalName(name));
    if (duplicate) return setError(tr("A goal with this name already exists."));
    onSubmit({ name, targetAmount, savedAmount, targetDate: form.targetDate, priority: form.priority });
  }

  const inputClass = "h-[44px] w-full rounded-[12px] border border-[var(--border-default)] bg-[var(--background-control)] px-[14px] text-[12px] text-[var(--text-primary)] outline-none transition focus:border-[#3B82F6]";
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,6,10,0.68)] backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby={titleId} className="relative h-[672px] w-[680px] rounded-[24px] border border-[var(--border-default)] bg-[var(--background-elevated)] p-[27px] text-[var(--text-primary)] shadow-[0_24px_24px_rgba(0,0,0,0.52)]">
      <div className="flex items-center gap-[16px]"><span className="flex size-[44px] items-center justify-center rounded-full bg-[#3B82F6]/15 text-[#60A5FA]"><IconTargetArrow size={23} /></span><div><h2 id={titleId} className="text-[20px] font-semibold">{tr(copy[mode].title)}</h2><p className="mt-[2px] text-[10px] text-[var(--text-secondary)]">{tr(copy[mode].description)}</p></div></div>
      <form onSubmit={submit} className="mt-[30px] grid grid-cols-2 gap-x-[24px] gap-y-[24px]">
        <label className="col-span-2 text-[11px] font-medium">{tr("Goal name")}<input autoFocus value={form.name} onChange={(e) => fields("name", e.target.value)} className={`${inputClass} mt-[7px]`} /></label>
        <label className="text-[11px] font-medium">{tr("Target amount")}<input inputMode="decimal" value={form.targetAmount} onChange={(e) => fields("targetAmount", e.target.value)} className={`${inputClass} mt-[7px]`} placeholder={money(0)} /></label>
        <label className="text-[11px] font-medium">{tr("Already saved")}<input inputMode="decimal" value={form.savedAmount} onChange={(e) => fields("savedAmount", e.target.value)} className={`${inputClass} mt-[7px]`} placeholder={money(0)} /></label>
        <label className="text-[11px] font-medium">{tr("Target date")}<input type="month" value={form.targetDate} onChange={(e) => fields("targetDate", e.target.value)} className={`${inputClass} mt-[7px]`} /></label>
        <label className="text-[11px] font-medium">{tr("Priority")}<select value={form.priority} onChange={(e) => fields("priority", e.target.value)} className={`${inputClass} mt-[7px]`}><option value="primary">{tr("Primary")}</option><option value="secondary">{tr("Secondary")}</option></select></label>
        <div className="col-span-2 mt-[4px] flex h-[92px] items-center justify-between rounded-[14px] border border-[#3B82F6]/25 bg-[#3B82F6]/8 p-[15px]"><div><strong className="text-[11px] text-[#60A5FA]">{tr("Plan preview")}</strong><p className="mt-[7px] text-[10px] leading-[15px] text-[var(--text-secondary)]">{previewDetail}</p></div><div className="text-right"><span className="block text-[9px] text-[var(--text-secondary)]">{tr("Estimated monthly contribution")}</span><strong className="mt-[5px] block text-[18px] text-[#60A5FA]">{previewContribution}</strong></div></div>
        <div aria-live="polite" className="col-span-2 h-[18px] text-[10px] text-[#F43F5E]">{error}</div>
        <div className="col-span-2 mt-[8px] flex items-center justify-between">{mode === "edit" && onRequestDelete ? <button type="button" onClick={onRequestDelete} className="h-[40px] rounded-[20px] px-[18px] text-[11px] font-semibold text-[#F43F5E]">{tr("Delete goal")}</button> : <span />}<div className="flex gap-[10px]"><button type="button" onClick={onClose} className="h-[40px] w-[116px] rounded-[20px] border border-[var(--border-default)] bg-[var(--background-control)] text-[11px] font-semibold text-[var(--text-secondary)]">{tr("Cancel")}</button><button type="submit" className="h-[40px] min-w-[128px] rounded-[20px] bg-[#3B82F6] px-[20px] text-[11px] font-semibold text-white">{tr(copy[mode].submit)}</button></div></div>
      </form>
    </section>
  </div>;
}
