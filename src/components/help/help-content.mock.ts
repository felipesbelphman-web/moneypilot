// Temporary, local demonstration content only. No requests, persistence or support service.
import type { Language } from '../../i18n/config.ts';
import { helpCopy } from '../../i18n/help-copy.ts';
import type { HelpArticleId, HelpCategoryId, HelpContent, HelpShortcutId } from './help-model.ts';

const categoryIds: readonly HelpCategoryId[] = ['getting-started', 'transactions', 'planning', 'account'];
const articles: readonly { id: HelpArticleId; categoryId: HelpCategoryId }[] = [
  { id: 'start', categoryId: 'getting-started' },
  { id: 'import', categoryId: 'transactions' },
  { id: 'classify', categoryId: 'transactions' },
  { id: 'budget', categoryId: 'planning' },
  { id: 'goal', categoryId: 'planning' },
  { id: 'security', categoryId: 'account' },
];
export const helpShortcutRoutes: Record<HelpShortcutId, string> = {
  import: '/transactions?import=csv', categories: '/categories', security: '/settings', insights: '/insights',
};
export function getLocalHelpContent(language: Language): HelpContent {
  const copy = helpCopy[language];
  return {
    categories: categoryIds.map(id => ({ id, ...copy.categories[id] })),
    articles: articles.map(item => ({ ...item, ...copy.articles[item.id] })),
    shortcuts: (Object.keys(helpShortcutRoutes) as HelpShortcutId[]).map(id => ({ id, href: helpShortcutRoutes[id], ...copy.shortcuts[id] })),
  };
}
