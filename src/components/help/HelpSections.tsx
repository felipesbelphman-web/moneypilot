import Link from 'next/link';
import { ArrowUpRight, BookOpen, ChartNoAxesCombined, ChevronDown, Clock3, Headphones, ListFilter, Rocket, ShieldCheck, Target, Upload } from 'lucide-react';
import type { HelpCopy } from '@/i18n/help-copy';
import type { HelpArticle, HelpArticleId, HelpCategory, HelpCategoryId, HelpShortcut, HelpShortcutId } from './help-model';

const categoryIcons = { 'getting-started': Rocket, transactions: ListFilter, planning: Target, account: ShieldCheck };
const shortcutIcons: Record<HelpShortcutId, typeof Upload> = { import: Upload, categories: ListFilter, security: ShieldCheck, insights: ChartNoAxesCombined };

export function HelpCategories({ categories, selected, label, onSelect }: { categories: readonly HelpCategory[]; selected: HelpCategoryId | null; label: string; onSelect: (id: HelpCategoryId) => void }) {
  return <div className="help-categories" role="group" aria-label={label}>{categories.map(category => {
    const Icon = categoryIcons[category.id];
    return <button key={category.id} type="button" className="help-category" aria-pressed={selected === category.id} onClick={() => onSelect(category.id)}><span className="help-icon"><Icon size={21} aria-hidden="true" /></span><strong>{category.title}</strong><span>{category.description}</span></button>;
  })}</div>;
}

export function HelpFaq({ articles, openArticles, onToggle, title, count, notice, empty }: { articles: readonly HelpArticle[]; openArticles: readonly HelpArticleId[]; onToggle: (id: HelpArticleId) => void; title: string; count: string; notice: string; empty: string }) {
  return <section className="help-panel help-faq" aria-labelledby="help-faq-title">
    <div className="help-section-heading"><h2 id="help-faq-title"><BookOpen size={19} aria-hidden="true" />{title}</h2><span role="status">{count}</span></div>
    <p className="help-notice">{notice}</p>
    {articles.length ? articles.map(article => {
      const open = openArticles.includes(article.id);
      return <article className="help-faq-item" key={article.id}>
        <h3><button type="button" id={`help-question-${article.id}`} aria-expanded={open} aria-controls={`help-answer-${article.id}`} onClick={() => onToggle(article.id)}>{article.question}<ChevronDown size={18} aria-hidden="true" /></button></h3>
        <div id={`help-answer-${article.id}`} role="region" aria-labelledby={`help-question-${article.id}`} aria-hidden={!open} inert={!open} className="help-answer" data-open={open}><div><p>{article.answer}</p></div></div>
      </article>;
    }) : <p className="help-empty">{empty}</p>}
  </section>;
}

export function HelpSupportCard({ copy, onContact }: { copy: HelpCopy; onContact: () => void }) {
  return <section className="help-panel help-support" aria-labelledby="help-support-title"><span className="help-icon"><Headphones size={25} aria-hidden="true" /></span><h2 id="help-support-title">{copy.supportTitle}</h2><p>{copy.supportDescription}</p><button type="button" className="help-primary" aria-haspopup="dialog" onClick={onContact}>{copy.contact}<ArrowUpRight size={18} aria-hidden="true" /></button><small><Clock3 size={14} aria-hidden="true" />{copy.responseTime}</small></section>;
}

export function HelpShortcuts({ shortcuts, title, empty }: { shortcuts: readonly HelpShortcut[]; title: string; empty: string }) {
  return <section className="help-panel help-shortcuts" aria-labelledby="help-shortcuts-title"><h2 id="help-shortcuts-title">{title}</h2>{shortcuts.length ? <ul>{shortcuts.map(shortcut => {
    const Icon = shortcutIcons[shortcut.id];
    return <li key={shortcut.id}><Link href={shortcut.href}><Icon size={18} aria-hidden="true" /><span>{shortcut.title}</span><ArrowUpRight size={15} aria-hidden="true" /></Link></li>;
  })}</ul> : <p className="help-empty">{empty}</p>}</section>;
}
