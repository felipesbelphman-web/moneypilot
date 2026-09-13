"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { DesktopInternalPagePanel, DesktopScaleCanvas } from "@/components/DesktopScaleCanvas";
import { useFinanceData } from "@/components/FinanceDataProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { buildCategoryCreateInput, buildCategoryUpdateInput, getCategoryBenefits, getCategoryColorOptions, getCategoryFutureCopy, getCategoryIconOptions, getCategoryPageCopy, type CategoryDraft, type CategoryFriendlyOption } from "@/components/categories/category-page-contract";
import { localizeCopy } from "@/i18n/localize-copy";
import type { Category } from "@/lib/domain/category";
import { FinanceError } from "@/lib/domain/finance-error";

const iconRoot = "/moneypilot/icons/categories";
function Glyph({ name, size = 16, color = "#9CA6B2" }: { name: string; size?: number; color?: string }) {
  const mask = `url(${iconRoot}/${name}.svg)`;
  return <span aria-hidden="true" className="block shrink-0" style={{ width: size, height: size, backgroundColor: color, WebkitMaskImage: mask, maskImage: mask, WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center", WebkitMaskSize: "contain", maskSize: "contain" }} />;
}

const colorValues: Record<string, string> = { "blue-500": "#3B82F6", "green-500": "#22C55E", "amber-500": "#F59E0B", "violet-500": "#8B5CF6", "teal-500": "#14B8A6", "rose-500": "#F43F5E", "slate-400": "#9CA6B2" };
const emptyDraft: CategoryDraft = { name: "", type: "expense", iconKey: "tag", colorToken: "blue-500" };
const cardClass = "overflow-hidden rounded-[18px] border border-[#28313B] bg-[rgba(8,11,15,0.22)] shadow-[0_8px_18px_rgba(0,0,0,0.24)]";
type EditorState = { mode: "create"; draft: CategoryDraft } | { mode: "edit"; category: Category; draft: CategoryDraft } | { mode: "confirm"; category: Category } | null;
const categoryColor = (token: string) => colorValues[token] ?? "#9CA6B2";

export default function CategoriesPage() {
  const { language } = useLanguage();
  const finance = useFinanceData();
  const tr = (value: string) => localizeCopy(language, value);
  const copy = getCategoryPageCopy(language);
  const futureCopy = getCategoryFutureCopy(language);
  const iconOptions = getCategoryIconOptions(language);
  const colorOptions = getCategoryColorOptions(language);
  const metrics = [
    { label: futureCopy.activeMetricLabel, value: String(finance.activeCategories.length), detail: futureCopy.activeMetricDetail, icon: "tag", color: "#3B82F6" },
    { label: futureCopy.rulesMetricLabel, value: futureCopy.comingSoon, detail: futureCopy.unavailableDetail, icon: "rules", color: "#F59E0B" },
    { label: futureCopy.merchantsMetricLabel, value: futureCopy.comingSoon, detail: futureCopy.unavailableDetail, icon: "store", color: "#22C55E" },
    { label: futureCopy.classificationMetricLabel, value: futureCopy.comingSoon, detail: futureCopy.unavailableDetail, icon: "automation", color: "#8B5CF6" },
  ];
  const benefits = getCategoryBenefits(language);
  const [showArchived, setShowArchived] = useState(false);
  const [editor, setEditor] = useState<EditorState>(null);
  const [feedback, setFeedback] = useState<{ tone: "error" | "success"; message: string } | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);
  const visible = useMemo(() => showArchived ? finance.categories.filter((item) => item.archivedAt) : finance.activeCategories, [finance.activeCategories, finance.categories, showArchived]);
  const pending = finance.mutationState.status === "saving" && ["createCategory", "updateCategory", "archiveCategory", "restoreCategory"].includes(finance.mutationState.operation ?? "");

  useEffect(() => {
    if (editor?.mode === "create" || editor?.mode === "edit") {
      const target = window.matchMedia("(min-width: 768px)").matches ? nameRef.current : document.querySelector<HTMLInputElement>("[aria-labelledby='category-mobile-dialog-title'] input");
      target?.focus();
    }
    const close = (event: KeyboardEvent) => { if (event.key === "Escape" && !pending) setEditor(null); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [editor?.mode, pending]);

  function openCreate() { setFeedback(null); setEditor({ mode: "create", draft: emptyDraft }); }
  function openEdit(category: Category) { setFeedback(null); setEditor({ mode: "edit", category, draft: { name: category.name, type: category.type, iconKey: category.iconKey, colorToken: category.colorToken } }); }
  function setDraft(patch: Partial<CategoryDraft>) { setFeedback(null); setEditor((current) => current && current.mode !== "confirm" ? { ...current, draft: { ...current.draft, ...patch } } : current); }
  function safeError(error: unknown) {
    const code = error instanceof FinanceError ? error.code : null;
    if (code === "duplicate_record") return copy.duplicateError;
    if (code === "validation_error" || code === "constraint_violation") return copy.validationError;
    if (code === "authentication_required") return copy.authError;
    if (code === "ownership_denied") return copy.ownershipError;
    if (code === "repository_unavailable") return copy.unavailableError;
    return copy.genericError;
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!editor || editor.mode === "confirm" || submittingRef.current) return;
    submittingRef.current = true; setFeedback(null);
    try {
      if (editor.mode === "create") { await finance.createCategory(buildCategoryCreateInput(editor.draft)); setFeedback({ tone: "success", message: copy.successCreated }); }
      else { await finance.updateCategory(editor.category.id, buildCategoryUpdateInput(editor.draft)); setFeedback({ tone: "success", message: copy.successUpdated }); }
      setEditor(null);
    } catch (error) { setFeedback({ tone: "error", message: safeError(error) }); }
    finally { submittingRef.current = false; }
  }
  async function confirmArchiveOrRestore() {
    if (!editor || editor.mode !== "confirm" || submittingRef.current) return;
    submittingRef.current = true; setFeedback(null);
    try {
      if (editor.category.archivedAt) { await finance.restoreCategory(editor.category.id); setFeedback({ tone: "success", message: copy.successRestored }); }
      else { await finance.archiveCategory(editor.category.id, new Date().toISOString()); setFeedback({ tone: "success", message: copy.successArchived }); }
      setEditor(null);
    } catch (error) { setFeedback({ tone: "error", message: safeError(error) }); }
    finally { submittingRef.current = false; }
  }

  return <main className="min-h-screen max-w-full overflow-x-hidden bg-[#080B0F] font-[Inter] text-[#F5F7FA]"><MobileCategories copy={copy} visible={visible} activeCount={finance.activeCategories.length} allCount={finance.categories.length} isHydrating={finance.isHydrating} hasLoadError={Boolean(finance.hydrationError)} showArchived={showArchived} setShowArchived={setShowArchived} editor={editor} pending={pending} feedback={feedback} iconOptions={iconOptions} colorOptions={colorOptions} openCreate={openCreate} openEdit={openEdit} setDraft={setDraft} setEditor={setEditor} submit={submit} confirm={confirmArchiveOrRestore} /><div className="hidden min-[768px]:block"><DesktopScaleCanvas><div className="relative h-[1024px] w-[1536px] overflow-hidden"><DesktopInternalPagePanel><div className="flex h-[767.67px] w-[1098px] flex-col gap-[12px]">
    <header className="flex h-[57.92px] shrink-0 items-center justify-between"><div className="flex h-[52px] w-[700px] flex-col justify-center gap-[4px]"><h1 className="text-[23.168px] font-semibold leading-none">{tr("Categorias")}</h1><p className="text-[13.2px] text-[#9CA6B2]">{tr("Gerencie categorias, cores e regras automáticas para seus gastos.")}</p></div><button type="button" onClick={openCreate} className="h-[38px] w-[146px] rounded-[19px] bg-[#3B82F6] text-[10px] font-semibold">{tr("+ Nova categoria")}</button></header>
    <section aria-label={tr("Resumo das categorias")} className="flex h-[100px] shrink-0 gap-[12px]">{metrics.map((metric) => <article key={metric.label} className={`${cardClass} relative h-[100px] w-[265.5px] shrink-0`}><span className="absolute left-[11px] top-[11px] flex h-[30px] w-[30px] items-center justify-center rounded-[9px] border" style={{ borderColor: metric.color, backgroundColor: `${metric.color}24` }}><Glyph name={metric.icon} size={16} color={metric.color} /></span><h2 className="absolute left-[51px] top-[16px] text-[11px] font-semibold">{metric.label}</h2><strong className="absolute left-[11px] top-[45px] text-[23px] font-semibold">{metric.value}</strong><p className="absolute left-[11px] top-[77px] text-[9.2px] text-[#9CA6B2]">{metric.detail}</p></article>)}</section>
    <section className="flex h-[260px] shrink-0 gap-[12px]"><article className={`${cardClass} relative h-[260px] w-[677px] shrink-0`}><h2 className="absolute left-[11px] top-[9px] text-[15px] font-semibold">{tr("Lista de categorias")}</h2><div className="absolute right-[10px] top-[7px] flex gap-[5px]"><button type="button" aria-pressed={!showArchived} onClick={() => setShowArchived(false)} className={`h-[24px] rounded-[12px] px-[9px] text-[8px] font-semibold ${!showArchived ? "bg-[#3B82F6]" : "border border-[#28313B] text-[#9CA6B2]"}`}>{copy.showActive}</button><button type="button" aria-pressed={showArchived} onClick={() => setShowArchived(true)} className={`h-[24px] rounded-[12px] px-[9px] text-[8px] font-semibold ${showArchived ? "bg-[#3B82F6]" : "border border-[#28313B] text-[#9CA6B2]"}`}>{copy.showArchived}</button></div>
      {finance.hydrationError && <p role="alert" className="absolute left-[11px] top-[35px] w-[653px] truncate text-[8px] text-[#F59E0B]">{copy.loadError}</p>}
      <div className={`absolute left-[11px] grid h-[22px] w-[653px] grid-cols-[228px_46px_321px_58px] items-center rounded-[7px] bg-[rgba(25,33,44,0.78)] px-[8px] text-[8.2px] font-semibold text-[#7F8996] ${finance.hydrationError ? "top-[50px]" : "top-[39px]"}`}><span>{tr("Categoria")}</span><span>{tr("Cor")}</span><span>{copy.type}</span><span>{futureCopy.actions}</span></div>
      <div className={`absolute left-[11px] max-h-[184px] w-[653px] overflow-y-auto ${finance.hydrationError ? "top-[72px] max-h-[173px]" : "top-[61px]"}`}>{finance.isHydrating && finance.categories.length === 0 ? <p role="status" className="py-[36px] text-center text-[9px] text-[#9CA6B2]">{copy.loading}</p> : visible.length === 0 ? <div className="py-[29px] text-center"><p className="text-[9px] text-[#9CA6B2]">{showArchived ? copy.emptyArchived : copy.emptyActive}</p>{!showArchived && <button type="button" onClick={openCreate} className="mt-[10px] h-[25px] rounded-[13px] bg-[#3B82F6] px-[14px] text-[8px] font-semibold">{tr("+ Nova categoria")}</button>}</div> : visible.map((category) => { const color = categoryColor(category.colorToken); return <div key={category.id} className="grid h-[23px] grid-cols-[228px_46px_321px_58px] items-center border-b border-[#28313B]/70 px-[6px] text-[8px]"><span className="flex items-center gap-[7px] text-[8.8px] font-semibold"><i className="flex h-[18px] w-[18px] items-center justify-center rounded-[6px]" style={{ backgroundColor: `${color}24` }}><Glyph name={category.iconKey} size={12} color={color} /></i><span className="truncate">{category.name}</span></span><i className="h-[7px] w-[7px] rounded-full" style={{ backgroundColor: color }} /><span className="text-[#9CA6B2]">{category.type === "income" ? copy.income : copy.expense} · {category.archivedAt ? copy.archived : copy.active}</span><span className="flex items-center justify-end gap-[8px]"><button type="button" onClick={() => openEdit(category)} aria-label={`${copy.edit} ${category.name}`}><Glyph name="edit" size={11} color="#64707D" /></button><button type="button" onClick={() => { setFeedback(null); setEditor({ mode: "confirm", category }); }} aria-label={`${category.archivedAt ? copy.restore : copy.archive} ${category.name}`}><Glyph name={category.archivedAt ? "arrow-right" : "more"} size={12} color="#64707D" /></button></span></div>; })}</div>
    </article><RulesCard copy={futureCopy} /></section>
    <section className={`${cardClass} flex h-[78px] shrink-0 items-center px-[10px]`}><h2 className="w-[170px] shrink-0 text-[13px] font-semibold">{tr("Como isso ajuda")}</h2>{benefits.map((benefit) => <div key={benefit.title} className="flex h-[48px] w-[227px] items-center gap-[8px] border-l border-[#28313B] px-[10px]"><i className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[7px] bg-[#3B82F6]/12"><Glyph name={benefit.icon} size={13} color="#60A5FA" /></i><div><strong className="block text-[8.4px]">{benefit.title}</strong><span className="mt-[3px] block text-[7.8px] text-[#9CA6B2]">{benefit.copy}</span></div></div>)}</section>
    {(editor || feedback) && <EditorPanel editor={editor} pending={pending} feedback={feedback} copy={copy} nameRef={nameRef} iconOptions={iconOptions} colorOptions={colorOptions} setDraft={setDraft} setEditor={setEditor} submit={submit} confirm={confirmArchiveOrRestore} openCreate={openCreate} />}
  </div></DesktopInternalPagePanel></div></DesktopScaleCanvas></div></main>;
}

function RulesCard({ copy }: { copy: ReturnType<typeof getCategoryFutureCopy> }) {
  return <article className={`${cardClass} relative h-[260px] w-[409px] shrink-0`}><h2 className="absolute left-[10px] top-[9px] text-[15px] font-semibold">{copy.rulesSectionTitle}</h2><span className="absolute right-[10px] top-[9px] rounded-[12px] border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-[9px] py-[5px] text-[8px] font-semibold text-[#F59E0B]">{copy.comingSoon}</span><div className="absolute inset-x-[24px] top-[72px] flex flex-col items-center text-center"><span className="flex h-[40px] w-[40px] items-center justify-center rounded-[12px] bg-[#F59E0B]/10"><Glyph name="rules" size={20} color="#F59E0B" /></span><strong className="mt-[14px] text-[11px]">{copy.rulesEmptyTitle}</strong><p className="mt-[7px] max-w-[310px] text-[9px] leading-[1.5] text-[#9CA6B2]">{copy.rulesEmptyDescription}</p></div></article>;
}

type Copy = ReturnType<typeof getCategoryPageCopy>;
function EditorPanel({ editor, pending, feedback, copy, nameRef, iconOptions, colorOptions, setDraft, setEditor, submit, confirm, openCreate }: { editor: EditorState; pending: boolean; feedback: { tone: "error" | "success"; message: string } | null; copy: Copy; nameRef: React.RefObject<HTMLInputElement | null>; iconOptions: CategoryFriendlyOption[]; colorOptions: CategoryFriendlyOption[]; setDraft: (patch: Partial<CategoryDraft>) => void; setEditor: (value: EditorState) => void; submit: (event: FormEvent) => Promise<void>; confirm: () => Promise<void>; openCreate: () => void }) {
  return <section className={`${cardClass} relative h-[163px] shrink-0`} aria-live="polite">{editor?.mode === "confirm" ? <div className="px-[22px] py-[24px]"><h2 className="text-[15px] font-semibold">{editor.category.archivedAt ? copy.restoreTitle : copy.archiveTitle}</h2><p className="mt-[9px] text-[10px] text-[#9CA6B2]">{editor.category.archivedAt ? copy.restoreDescription : copy.archiveDescription}</p><strong className="mt-[12px] block text-[11px]">{editor.category.name}</strong><div className="absolute bottom-[20px] right-[18px] flex gap-[10px]"><button type="button" disabled={pending} onClick={() => setEditor(null)} className="h-[30px] rounded-[15px] border border-[#28313B] px-[18px] text-[9px] font-semibold text-[#9CA6B2]">{copy.cancel}</button><button type="button" disabled={pending} onClick={() => void confirm()} className="h-[30px] rounded-[15px] bg-[#F59E0B] px-[18px] text-[9px] font-semibold disabled:opacity-60">{pending ? editor.category.archivedAt ? copy.restoring : copy.archiving : editor.category.archivedAt ? copy.confirmRestore : copy.confirmArchive}</button></div></div> : editor ? <form onSubmit={(event) => void submit(event)} className="relative h-full"><h2 className="absolute left-[11px] top-[9px] text-[13px] font-semibold">{editor.mode === "create" ? copy.createTitle : copy.editTitle}</h2><button type="button" disabled={pending} onClick={() => setEditor(null)} aria-label={copy.close} className="absolute right-[14px] top-[8px]"><Glyph name="close" size={13} /></button>
    <label className="absolute left-[11px] top-[34px] w-[260px] text-[7.8px] font-semibold text-[#7F8996]">{copy.name}<input ref={nameRef} required maxLength={100} value={editor.draft.name} onChange={(event) => setDraft({ name: event.target.value })} className="mt-[4px] block h-[34px] w-full rounded-[9px] border border-[#28313B] bg-[#080B0F]/34 px-[9px] text-[9px] font-normal text-[#F5F7FA] outline-none" /></label>
    <CategorySelect kind="icon" label={copy.icon} left={281} value={editor.draft.iconKey} options={iconOptions} onChange={(iconKey) => setDraft({ iconKey })} /><CategorySelect kind="color" label={copy.color} left={451} value={editor.draft.colorToken} options={colorOptions} onChange={(colorToken) => setDraft({ colorToken })} />
    <label className="absolute left-[621px] top-[34px] w-[180px] text-[7.8px] font-semibold text-[#7F8996]">{copy.categoryType}<select disabled={editor.mode === "edit"} value={editor.draft.type} onChange={(event) => setDraft({ type: event.target.value as CategoryDraft["type"] })} className="mt-[4px] block h-[34px] w-full rounded-[9px] border border-[#28313B] bg-[#080B0F] px-[9px] text-[9px] font-normal text-[#F5F7FA] disabled:opacity-60"><option value="expense">{copy.expense}</option><option value="income">{copy.income}</option></select></label>
    <p className="absolute left-[11px] top-[90px] text-[8px] text-[#9CA6B2]">{copy.formHint}</p><div className="absolute right-[13px] top-[113px] flex gap-[10px]"><button type="button" disabled={pending} onClick={() => setEditor(null)} className="h-[30px] rounded-[15px] border border-[#28313B] px-[18px] text-[8.4px] font-semibold text-[#9CA6B2]">{copy.cancel}</button><button type="submit" disabled={pending} className="h-[30px] rounded-[15px] bg-[#3B82F6] px-[20px] text-[8.4px] font-semibold disabled:opacity-60">{pending ? editor.mode === "create" ? copy.creating : copy.saving : editor.mode === "create" ? copy.create : copy.save}</button></div></form> : <div className="flex h-full items-center justify-center"><button type="button" onClick={openCreate} className="h-[34px] rounded-[17px] border border-[#3B82F6] px-[20px] text-[9px] font-semibold text-[#60A5FA]">{copy.createTitle}</button></div>}{feedback && <p role={feedback.tone === "error" ? "alert" : "status"} className={`absolute bottom-[16px] left-[11px] text-[8.5px] ${feedback.tone === "error" ? "text-[#F43F5E]" : "text-[#22C55E]"}`}>{feedback.message}</p>}</section>;
}

function CategorySelect({ kind, label, left, value, options, onChange }: { kind: "icon" | "color"; label: string; left: number; value: string; options: CategoryFriendlyOption[]; onChange: (value: string) => void }) {
  return <label className="absolute top-[34px] w-[160px] text-[7.8px] font-semibold text-[#7F8996]" style={{ left }}>{label}<span className="relative mt-[4px] block"><span className="pointer-events-none absolute left-[9px] top-[10px] z-10">{kind === "icon" ? <Glyph name={value} size={13} color="#60A5FA" /> : <i className="block size-[12px] rounded-full" style={{ backgroundColor: categoryColor(value) }} />}</span><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="block h-[34px] w-full rounded-[9px] border border-[#28313B] bg-[#080B0F] pl-[30px] pr-[8px] text-[9px] font-normal text-[#F5F7FA]">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></span></label>;
}

type MobileCategoriesProps = {
  copy: Copy; visible: Category[]; activeCount: number; allCount: number; isHydrating: boolean; hasLoadError: boolean;
  showArchived: boolean; setShowArchived: (value: boolean) => void; editor: EditorState; pending: boolean;
  feedback: { tone: "error" | "success"; message: string } | null; iconOptions: CategoryFriendlyOption[]; colorOptions: CategoryFriendlyOption[];
  openCreate: () => void; openEdit: (category: Category) => void; setDraft: (patch: Partial<CategoryDraft>) => void;
  setEditor: (value: EditorState) => void; submit: (event: FormEvent) => Promise<void>; confirm: () => Promise<void>;
};

function MobileCategories(props: MobileCategoriesProps) {
  const { language } = useLanguage();
  const { copy, visible, activeCount, allCount, isHydrating, hasLoadError, showArchived, setShowArchived, editor, pending, feedback, iconOptions, colorOptions, openCreate, openEdit, setDraft, setEditor, submit, confirm } = props;
  const tr = (value: string) => localizeCopy(language, value);
  return <div data-categories-mobile className="min-h-screen w-full max-w-full overflow-x-hidden bg-[var(--background-elevated)] px-[16px] pb-[32px] pt-[16px] text-[var(--text-primary)] min-[768px]:hidden">
    <header className="flex flex-wrap items-start justify-between gap-[12px]"><div className="min-w-0 flex-1"><h1 className="text-[24px] font-semibold">{tr("Categorias")}</h1><p className="mt-[4px] text-[13px] text-[var(--text-secondary)]">{tr("Gerencie categorias, cores e regras automáticas para seus gastos.")}</p></div><button type="button" onClick={openCreate} className="h-[38px] shrink-0 rounded-[19px] bg-[#3B82F6] px-[16px] text-[11px] font-semibold text-white">{copy.createTitle}</button></header>
    <section className="mt-[18px] grid grid-cols-2 gap-[10px]" aria-label={tr("Resumo das categorias")}><MobileMetric label={copy.showActive} value={activeCount} /><MobileMetric label={copy.showArchived} value={Math.max(0, allCount - activeCount)} /></section>
    <section className="mt-[12px] rounded-[18px] border border-[var(--border-default)] bg-[var(--background-subtle)] p-[12px]"><div className="flex flex-wrap items-center justify-between gap-[10px]"><h2 className="text-[16px] font-semibold">{tr("Lista de categorias")}</h2><div className="flex gap-[6px]"><MobileFilter active={!showArchived} onClick={() => setShowArchived(false)}>{copy.showActive}</MobileFilter><MobileFilter active={showArchived} onClick={() => setShowArchived(true)}>{copy.showArchived}</MobileFilter></div></div>
      {hasLoadError && <p role="alert" className="mt-[10px] text-[11px] text-[#F59E0B]">{copy.loadError}</p>}{isHydrating && allCount === 0 ? <p role="status" className="py-[36px] text-center text-[12px] text-[var(--text-secondary)]">{copy.loading}</p> : visible.length === 0 ? <div className="py-[32px] text-center"><p className="text-[12px] text-[var(--text-secondary)]">{showArchived ? copy.emptyArchived : copy.emptyActive}</p>{!showArchived && <button type="button" onClick={openCreate} className="mt-[12px] rounded-[16px] bg-[#3B82F6] px-[15px] py-[8px] text-[10px] font-semibold text-white">{copy.createTitle}</button>}</div> : <div className="mt-[10px] grid gap-[8px]">{visible.map((category) => <MobileCategoryRow key={category.id} category={category} copy={copy} openEdit={openEdit} setEditor={setEditor} />)}</div>}</section>
    {feedback && !editor && <p role={feedback.tone === "error" ? "alert" : "status"} className={`mt-[12px] text-[11px] ${feedback.tone === "error" ? "text-[#F43F5E]" : "text-[#22C55E]"}`}>{feedback.message}</p>}
    {editor && <MobileCategoryDialog editor={editor} pending={pending} feedback={feedback} copy={copy} iconOptions={iconOptions} colorOptions={colorOptions} setDraft={setDraft} setEditor={setEditor} submit={submit} confirm={confirm} />}
  </div>;
}

function MobileMetric({ label, value }: { label: string; value: number }) { return <article className="rounded-[16px] border border-[var(--border-default)] bg-[var(--background-subtle)] p-[14px]"><span className="text-[11px] text-[var(--text-secondary)]">{label}</span><strong className="mt-[7px] block text-[24px]">{value}</strong></article>; }
function MobileFilter({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" aria-pressed={active} onClick={onClick} className={`h-[30px] rounded-[15px] px-[12px] text-[10px] font-semibold ${active ? "bg-[#3B82F6] text-white" : "border border-[var(--border-default)] text-[var(--text-secondary)]"}`}>{children}</button>; }

function MobileCategoryRow({ category, copy, openEdit, setEditor }: { category: Category; copy: Copy; openEdit: (category: Category) => void; setEditor: (value: EditorState) => void }) {
  const color = categoryColor(category.colorToken);
  return <article className="flex min-w-0 items-center gap-[8px] rounded-[13px] border border-[var(--border-default)] p-[9px]"><i className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px]" style={{ backgroundColor: `${color}24` }}><Glyph name={category.iconKey} size={18} color={color} /></i><div className="min-w-0 flex-1"><strong className="block truncate text-[12px]">{category.name}</strong><span className="text-[10px] text-[var(--text-secondary)]">{category.type === "income" ? copy.income : copy.expense} · {category.archivedAt ? copy.archived : copy.active}</span></div><button type="button" onClick={() => openEdit(category)} aria-label={`${copy.edit} ${category.name}`} className="grid size-[34px] shrink-0 place-items-center"><Glyph name="edit" size={15} /></button><button type="button" onClick={() => setEditor({ mode: "confirm", category })} aria-label={`${category.archivedAt ? copy.restore : copy.archive} ${category.name}`} className="grid size-[34px] shrink-0 place-items-center"><Glyph name="more" size={15} /></button></article>;
}

function MobileCategoryDialog({ editor, pending, feedback, copy, iconOptions, colorOptions, setDraft, setEditor, submit, confirm }: { editor: Exclude<EditorState, null>; pending: boolean; feedback: { tone: "error" | "success"; message: string } | null; copy: Copy; iconOptions: CategoryFriendlyOption[]; colorOptions: CategoryFriendlyOption[]; setDraft: (patch: Partial<CategoryDraft>) => void; setEditor: (value: EditorState) => void; submit: (event: FormEvent) => Promise<void>; confirm: () => Promise<void> }) {
  return <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-[#080B0F]/70 p-[16px] backdrop-blur-sm"><section role="dialog" aria-modal="true" aria-labelledby="category-mobile-dialog-title" className="relative my-auto max-h-[calc(100dvh-32px)] w-[calc(100vw-32px)] max-w-[420px] overflow-y-auto rounded-[22px] border border-[var(--border-default)] bg-[var(--background-elevated)] p-[20px] shadow-2xl">{editor.mode === "confirm" ? <><h2 id="category-mobile-dialog-title" className="pr-[32px] text-[19px] font-semibold">{editor.category.archivedAt ? copy.restoreTitle : copy.archiveTitle}</h2><p className="mt-[10px] text-[12px] text-[var(--text-secondary)]">{editor.category.archivedAt ? copy.restoreDescription : copy.archiveDescription}</p><strong className="mt-[14px] block text-[13px]">{editor.category.name}</strong><MobileDialogActions pending={pending} cancel={copy.cancel} submitLabel={pending ? editor.category.archivedAt ? copy.restoring : copy.archiving : editor.category.archivedAt ? copy.confirmRestore : copy.confirmArchive} onCancel={() => setEditor(null)} onConfirm={() => void confirm()} /></> : <form onSubmit={(event) => void submit(event)}><h2 id="category-mobile-dialog-title" className="pr-[32px] text-[19px] font-semibold">{editor.mode === "create" ? copy.createTitle : copy.editTitle}</h2><div className="mt-[18px] grid gap-[13px]"><MobileField label={copy.name}><input required maxLength={100} value={editor.draft.name} onChange={(event) => setDraft({ name: event.target.value })} className="h-[42px] w-full rounded-[12px] border border-[var(--border-default)] bg-[var(--background-subtle)] px-[12px] text-[13px]" /></MobileField><MobileSelect label={copy.icon} value={editor.draft.iconKey} options={iconOptions} onChange={(iconKey) => setDraft({ iconKey })} /><MobileSelect label={copy.color} value={editor.draft.colorToken} options={colorOptions} onChange={(colorToken) => setDraft({ colorToken })} /><MobileField label={copy.categoryType}><select disabled={editor.mode === "edit"} value={editor.draft.type} onChange={(event) => setDraft({ type: event.target.value as CategoryDraft["type"] })} className="h-[42px] w-full rounded-[12px] border border-[var(--border-default)] bg-[var(--background-subtle)] px-[12px] text-[13px] disabled:opacity-60"><option value="expense">{copy.expense}</option><option value="income">{copy.income}</option></select></MobileField></div><p className="mt-[12px] text-[10px] text-[var(--text-secondary)]">{copy.formHint}</p><MobileDialogActions pending={pending} cancel={copy.cancel} submitLabel={pending ? editor.mode === "create" ? copy.creating : copy.saving : editor.mode === "create" ? copy.create : copy.save} onCancel={() => setEditor(null)} /></form>}<button type="button" disabled={pending} onClick={() => setEditor(null)} aria-label={copy.close} className="absolute right-[16px] top-[16px] grid size-[30px] place-items-center"><Glyph name="close" size={15} /></button>{feedback?.tone === "error" && <p role="alert" className="mt-[12px] text-[11px] text-[#F43F5E]">{feedback.message}</p>}</section></div>;
}

function MobileDialogActions({ pending, cancel, submitLabel, onCancel, onConfirm }: { pending: boolean; cancel: string; submitLabel: string; onCancel: () => void; onConfirm?: () => void }) { return <div className="mt-[20px] grid grid-cols-2 gap-[10px]"><button type="button" disabled={pending} onClick={onCancel} className="h-[42px] rounded-[21px] border border-[var(--border-default)] text-[11px] font-semibold">{cancel}</button><button type={onConfirm ? "button" : "submit"} disabled={pending} onClick={onConfirm} className="h-[42px] rounded-[21px] bg-[#3B82F6] px-[8px] text-[11px] font-semibold text-white disabled:opacity-60">{submitLabel}</button></div>; }
function MobileField({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-[5px] text-[11px] font-semibold text-[var(--text-secondary)]"><span>{label}</span>{children}</label>; }
function MobileSelect({ label, value, options, onChange }: { label: string; value: string; options: CategoryFriendlyOption[]; onChange: (value: string) => void }) { return <MobileField label={label}><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="h-[42px] w-full rounded-[12px] border border-[var(--border-default)] bg-[var(--background-subtle)] px-[12px] text-[13px]">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></MobileField>; }
