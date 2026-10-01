"use client";

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import { AccountAvatar } from '@/components/profile/AccountAvatar';
import { ThemeControl } from '@/components/navigation/ThemeControl';
import { helpCopy } from '@/i18n/help-copy';
import { languageLocales } from '@/i18n/config';
import { getLocalHelpContent } from './help-content.mock';
import { filterHelpContent, isHelpSearchShortcut, toggleHelpArticle, toggleHelpCategory, type HelpArticleId, type HelpCategoryId } from './help-model';
import { HelpCategories, HelpFaq, HelpShortcuts, HelpSupportCard } from './HelpSections';
import { HelpSupportDialog } from './HelpSupportDialog';

export function HelpPageContent() {
  const { language } = useLanguage();
  const copy = helpCopy[language];
  const content = useMemo(() => getLocalHelpContent(language), [language]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<HelpCategoryId | null>(null);
  const [openArticles, setOpenArticles] = useState<HelpArticleId[]>([]);
  const [supportOpen, setSupportOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const filtered = filterHelpContent(content, query, category);
  const noResults = !filtered.categories.length && !filtered.articles.length && !filtered.shortcuts.length;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (supportOpen || event.isComposing || !isHelpSearchShortcut(event)) return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [supportOpen]);

  function clearFilters() { setQuery(''); setCategory(null); searchRef.current?.focus(); }

  return <div data-help-page>
    <div className="help-brand-row">
      <div className="help-brand"><Image src="/moneypilot/dashboard/day/logomark.svg" alt="" width={37} height={37} /><span>{copy.brand}</span></div>
      <ThemeControl orientation="horizontal" />
    </div>
    <header className="help-header"><div><h1>{copy.title}</h1><p>{copy.description}</p></div><AccountAvatar size={48} /></header>

    <section className="help-search-panel" aria-labelledby="help-search-title">
      <span className="help-search-emblem" aria-hidden="true"><Search size={24} /></span>
      <h2 id="help-search-title">{copy.searchTitle}</h2><p>{copy.searchDescription}</p>
      <div role="search" className="help-search"><Search size={19} aria-hidden="true" /><input ref={searchRef} id="help-search" type="search" value={query} onChange={event => setQuery(event.target.value)} aria-label={copy.searchLabel} placeholder={copy.searchPlaceholder} aria-keyshortcuts="Control+k Meta+k" /><kbd aria-hidden="true">{copy.shortcut}</kbd></div>
    </section>

    <HelpCategories categories={filtered.categories} selected={category} label={copy.categoriesLabel} onSelect={id => setCategory(current => toggleHelpCategory(current, id))} />
    {(query || category) && <div className="help-filter-bar"><span>{category ? copy.categories[category].title : copy.searchLabel}</span><button type="button" onClick={clearFilters}>{copy.clear}</button></div>}
    {noResults && <p role="status" className="help-empty">{copy.empty}</p>}

    <div className="help-columns">
      <HelpFaq articles={filtered.articles} openArticles={openArticles} onToggle={id => setOpenArticles(current => toggleHelpArticle(current, id))} title={copy.faqTitle} count={copy.articleCount.replace('{count}', new Intl.NumberFormat(languageLocales[language]).format(filtered.articles.length))} notice={copy.localNotice} empty={copy.empty} />
      <aside className="help-aside">
        <HelpSupportCard copy={copy} onContact={() => setSupportOpen(true)} />
        <HelpShortcuts shortcuts={filtered.shortcuts} title={copy.shortcutsTitle} empty={copy.empty} />
      </aside>
    </div>
    {supportOpen && <HelpSupportDialog copy={copy} onClose={() => setSupportOpen(false)} />}
  </div>;
}
