export type HelpCategoryId = 'getting-started' | 'transactions' | 'planning' | 'account';
export type HelpArticleId = 'start' | 'import' | 'classify' | 'budget' | 'goal' | 'security';
export type HelpShortcutId = 'import' | 'categories' | 'security' | 'insights';
export type HelpCategory = { id: HelpCategoryId; title: string; description: string };
export type HelpArticle = { id: HelpArticleId; categoryId: HelpCategoryId; question: string; answer: string };
export type HelpShortcut = { id: HelpShortcutId; title: string; description: string; href: string };
export type HelpContent = { categories: readonly HelpCategory[]; articles: readonly HelpArticle[]; shortcuts: readonly HelpShortcut[] };

export function normalizeHelpSearch(value: string) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase().trim().replace(/\s+/g, ' ');
}

export function filterHelpContent(content: HelpContent, query: string, category: HelpCategoryId | null) {
  const words = normalizeHelpSearch(query).split(' ').filter(Boolean);
  const matches = (...values: string[]) => { const text = normalizeHelpSearch(values.join(' ')); return words.every(word => text.includes(word)); };
  return {
    categories: content.categories.filter(item => matches(item.title, item.description)),
    articles: content.articles.filter(item => (!category || item.categoryId === category) && matches(item.question, item.answer, content.categories.find(c => c.id === item.categoryId)?.title ?? '')),
    shortcuts: content.shortcuts.filter(item => matches(item.title, item.description)),
  };
}

export function toggleHelpCategory(current: HelpCategoryId | null, next: HelpCategoryId) { return current === next ? null : next; }
export function toggleHelpArticle(current: readonly HelpArticleId[], id: HelpArticleId): HelpArticleId[] { return current.includes(id) ? current.filter(item => item !== id) : [...current, id]; }
export function isHelpSearchShortcut(event: { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean }) { return event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey) && !event.altKey; }
