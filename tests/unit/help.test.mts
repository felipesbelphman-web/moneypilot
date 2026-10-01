import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, access } from 'node:fs/promises';
import postcss from 'postcss';
import { filterHelpContent, isHelpSearchShortcut, normalizeHelpSearch, toggleHelpCategory, toggleHelpArticle } from '../../src/components/help/help-model.ts';
import { getLocalHelpContent, helpShortcutRoutes } from '../../src/components/help/help-content.mock.ts';
import { helpCopy } from '../../src/i18n/help-copy.ts';
import { isNavigationActive, navigationItems } from '../../src/components/navigation/navigation-model.ts';
import type { Language } from '../../src/i18n/config.ts';

test('Help has one route, the existing sidebar link and unchanged seven main entries', async () => {
  const page = await readFile('src/app/help/page.tsx', 'utf8');
  assert.match(page, /export default function HelpPage/);
  assert.match(page, /<HelpPageContent/);
  assert.doesNotMatch(page, /DesktopSidebar|Supabase|Repository/);
  const sidebar = await readFile('src/components/navigation/DesktopSidebar.tsx', 'utf8');
  assert.match(sidebar, /<Link href="\/help" onClick=\{close\} className="floating-sidebar__item" aria-current=\{isNavigationActive\(pathname, "\/help"\)/);
  assert.match(sidebar, /pathname !== "\/help"/);
  assert.match(sidebar, /tooltipProps\(t.help\)/);
  assert.match(sidebar, /open && <span>\{t.help\}<\/span>/);
  assert.equal(isNavigationActive('/help', '/help'), true);
  assert.equal(isNavigationActive('/helper', '/help'), false);
  assert.equal(navigationItems.length, 7);
});

test('search ignores case, accents and repeated spaces across all three content collections', () => {
  const content = getLocalHelpContent('pt');
  assert.equal(normalizeHelpSearch('  TRANSAÇÕES   E METAS  '), 'transacoes e metas');
  const result = filterHelpContent(content, 'TRANSACOES', null);
  assert.ok(result.categories.some(item => item.id === 'transactions'));
  assert.ok(result.articles.some(item => item.id === 'import'));
  assert.ok(result.shortcuts.some(item => item.id === 'import'));
  assert.equal(filterHelpContent(content, 'inexistente-xyz', null).articles.length, 0);
  assert.equal(filterHelpContent(content, 'inexistente-xyz', null).categories.length, 0);
  assert.equal(filterHelpContent(content, 'inexistente-xyz', null).shortcuts.length, 0);
  assert.equal(filterHelpContent(content, '   ', null).articles.length, 6);
  assert.ok(filterHelpContent(content, 'IMPORTAR csv', null).articles.some(item => item.id === 'import'));
});

test('category filters combine with search and toggle off without mutating content', () => {
  const content = getLocalHelpContent('pt');
  assert.equal(toggleHelpCategory(null, 'planning'), 'planning');
  assert.equal(toggleHelpCategory('planning', 'planning'), null);
  assert.equal(toggleHelpCategory('planning', 'account'), 'account');
  assert.deepEqual(filterHelpContent(content, '', 'planning').articles.map(item => item.id), ['budget', 'goal']);
  assert.equal(filterHelpContent(content, 'CSV', 'planning').articles.length, 0);
  assert.equal(content.articles.length, 6);
});

test('accordion state opens questions independently and closes them again', () => {
  const open = toggleHelpArticle([], 'start');
  assert.deepEqual(toggleHelpArticle(open, 'import'), ['start', 'import']);
  assert.deepEqual(toggleHelpArticle(open, 'start'), []);
  assert.deepEqual(open, ['start']);
});

test('displayed keyboard shortcut matches Ctrl+K and Command+K', () => {
  assert.equal(isHelpSearchShortcut({ key: 'K', ctrlKey: true, metaKey: false, altKey: false }), true);
  assert.equal(isHelpSearchShortcut({ key: 'k', ctrlKey: false, metaKey: true, altKey: false }), true);
  assert.equal(isHelpSearchShortcut({ key: 'k', ctrlKey: false, metaKey: false, altKey: false }), false);
});

test('all seven locales provide complete typed temporary content and existing internal shortcuts', async () => {
  assert.equal(Object.keys(helpCopy).length, 7);
  for (const language of Object.keys(helpCopy) as Language[]) {
    const content = getLocalHelpContent(language);
    assert.equal(content.articles.length, 6);
    assert.equal(content.categories.length, 4);
    assert.equal(content.shortcuts.length, 4);
    for (const article of content.articles) { assert.ok(article.question.length > 10); assert.ok(article.answer.length > 40); assert.ok(content.categories.some(category => category.id === article.categoryId)); }
    for (const [key, value] of Object.entries(helpCopy.en)) {
      const localized = helpCopy[language][key as keyof typeof helpCopy.en];
      assert.equal(typeof localized, typeof value);
      if (typeof localized === 'string') assert.ok(localized.trim());
    }
  }
  assert.equal(helpShortcutRoutes.import, '/transactions?import=csv');
  for (const route of Object.values(helpShortcutRoutes)) { assert.ok(route.startsWith('/')); await access(`src/app${route.split('?')[0]}/page.tsx`); }
  assert.match(await readFile('src/app/transactions/page.tsx', 'utf8'), /searchParams.get\("import"\) === "csv"/);
});

test('Help styles use existing Day and Night tokens, local scopes and responsive/reduced-motion rules', async () => {
  const source = await readFile('src/app/help/help.css', 'utf8');
  assert.doesNotMatch(source, /#[a-f\d]{3,8}\b|rgba?\(|hsla?\(/i);
  const css = postcss.parse(source);
  css.walkRules(rule => { if (!rule.parent || rule.parent.type !== 'rule') assert.match(rule.selector, /data-help-page|data-help-theme/); });
  css.walkDecls(/^--/, declaration => { assert.match(declaration.prop, /^--help-/); assert.match(declaration.value, /^var\(--(day|night)-/); });
  assert.match(source, /prefers-reduced-motion: reduce/);
  for (const size of [1050, 767, 450]) assert.ok(source.includes(`max-width: ${size}px`));
  assert.match(source, /repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(source, /grid-template-columns: minmax\(0, 1fr\)/);
  const shell = await readFile('src/components/layout/AppShellFrame.tsx', 'utf8');
  assert.match(shell, /data-help-theme=\{pathname === "\/help" \|\| undefined\}/);
});

test('help components never send data or mount an external service', async () => {
  for (const name of ['HelpPageContent.tsx', 'HelpSections.tsx', 'HelpSupportDialog.tsx', 'help-content.mock.ts']) {
    const source = await readFile(`src/components/help/${name}`, 'utf8');
    assert.doesNotMatch(source, /fetch\(|supabase|Repository|mailto:|https?:\/\/|<form|type="submit"/i);
  }
});
