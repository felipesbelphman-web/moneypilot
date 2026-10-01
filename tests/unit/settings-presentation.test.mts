import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import postcss from 'postcss';
import { hasPendingSettings, validateBackgroundFile, maxBackgroundBytes, createLocalNotifications } from '../../src/components/settings/settings-presentation.ts';
import { navigationItems, isNavigationActive } from '../../src/components/navigation/navigation-model.ts';

test('only changed currency and language create a pending preference save', () => {
  assert.equal(hasPendingSettings({}, 'EUR', 'en'), false);
  assert.equal(hasPendingSettings({ currency: 'EUR', language: 'en' }, 'EUR', 'en'), false);
  assert.equal(hasPendingSettings({ currency: 'GBP' }, 'EUR', 'en'), true);
  assert.equal(hasPendingSettings({ language: 'pt' }, 'EUR', 'en'), true);
  assert.equal(hasPendingSettings({ currency: 'EUR' }, null, 'en'), true);
  const local = createLocalNotifications(); local.capture = true;
  assert.equal(createLocalNotifications().capture, false);
  assert.equal(hasPendingSettings({}, 'EUR', 'en'), false);
});

test('background accepts only bounded raster images and rejects SVG, empty and oversized files', () => {
  for (const type of ['image/jpeg', 'image/png', 'image/webp']) assert.equal(validateBackgroundFile({ type, size: maxBackgroundBytes }), null);
  for (const type of ['image/svg+xml', 'text/html', 'image/gif', '']) assert.equal(validateBackgroundFile({ type, size: 100 }), 'imageTypeError');
  for (const size of [0, maxBackgroundBytes + 1]) assert.equal(validateBackgroundFile({ type: 'image/png', size }), 'imageSizeError');
});

test('Settings stays active in shared navigation and Help keeps its internal link', async () => {
  assert.deepEqual(navigationItems.filter(item => isNavigationActive('/settings', item.href)).map(item => item.href), ['/settings']);
  const sidebar = await readFile('src/components/navigation/DesktopSidebar.tsx', 'utf8');
  assert.match(sidebar, /<Link href="\/help" onClick=\{close\}/);
  const page = await readFile('src/app/settings/page.tsx', 'utf8');
  assert.match(page, /export default function SettingsPage/);
  assert.doesNotMatch(page, /<main|DesktopSidebar|deleteUser|signOut|createClient/);
});

test('Settings uses scoped Day/Night aliases and responsive rules without fixed content widths', async () => {
  const source = await readFile('src/app/settings/settings.css', 'utf8');
  assert.doesNotMatch(source, /#[a-f\d]{3,8}\b|rgba?\(/i);
  const css = postcss.parse(source);
  css.walkRules(rule => assert.match(rule.selector, /data-settings-page|data-settings-theme/));
  css.walkDecls(/^--/, declaration => { assert.match(declaration.prop, /^--settings-/); assert.match(declaration.value, /^var\(--/); });
  for (const theme of ['day', 'night']) assert.match(source, new RegExp(`var\\(--${theme}-`));
  for (const width of [1050, 767, 450]) assert.ok(source.includes(`max-width: ${width}px`));
  assert.match(source, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(source, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(source, /grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(source, /word-break: normal; overflow-wrap: normal/);
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(source, /width: (543|700|1164)px/);
});

test('session previews and unavailable actions have no persistence or destructive APIs', async () => {
  for (const name of ['SettingsBackground', 'SettingsNotifications', 'SettingsAccountSections', 'SettingsDialog']) {
    const source = await readFile(`src/components/settings/${name}.tsx`, 'utf8');
    assert.doesNotMatch(source, /fetch\(|supabase|localStorage|sessionStorage|deleteUser|\.upload\(|createClient|mailto:/i);
  }
  const hook = await readFile('src/components/settings/useSettingsPreferences.ts', 'utf8');
  assert.match(hook, /updateProfilePreferences\(\{ locale: selectedLanguage, currencyCode: selectedCurrency \}\)/);
  assert.doesNotMatch(hook, /notifications|background|financialCycle/);
});
