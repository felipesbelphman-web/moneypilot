import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import test from 'node:test';
import postcss from 'postcss';

test('Dashboard Day palette is shared only with Help and Settings, never Night', async () => {
  const css = postcss.parse(await readFile('src/app/dashboard/dashboard-day.css', 'utf8'));
  const rules = css.nodes.filter(node => node.type === 'rule');
  assert.equal(rules.length, 1);
  assert.deepEqual(rules[0].selectors, [':root[data-theme="light"] [data-shell-viewport][data-dashboard-fit="true"]', ':root[data-theme="light"] [data-shell-viewport][data-help-theme="true"]', ':root[data-theme="light"] [data-shell-viewport][data-settings-theme="true"]']);
  assert.equal(css.nodes.some(node => node.type === 'atrule'), false);
  const sidebarRules: string[] = [];
  css.walkRules(rule => { if (rule.selector.includes('sidebar')) sidebarRules.push(rule.selector); });
  assert.deepEqual(sidebarRules, [], 'shared navigation geometry stays owned by the shell');
});

test('Day semantic surfaces and reference dimensions remain explicit', async () => {
  const css = await readFile('src/app/dashboard/dashboard-day.css', 'utf8');
  for (const token of ['--day-app: #f3f3f3', '--day-panel: rgb(255 255 255 / .94)', '--day-card: rgb(255 255 255 / .82)', '--day-border: #dadada', '--day-text: #1a1a1a', '--day-blue: #348dfc']) assert.ok(css.includes(token), token);
  assert.match(css, /padding: 16px 32px; min-height: 810px/);
  assert.match(css, /height: 195px; min-height: 195px/);
  assert.match(css, /border-radius: 38px/);
  assert.doesNotMatch(css, /scrollTop|position: fixed|--shell-scale|grid-template-columns: var\(--shell-sidebar-width\)/);
});

test('Day assets are committed official exports with no temporary Figma URLs', async () => {
  for (const name of ['logomark', 'spending', 'insight', 'arrow-right']) {
    const path = `public/moneypilot/dashboard/day/${name}.svg`;
    await access(path);
    assert.match(await readFile(path, 'utf8'), /<svg/);
  }
  for (const path of ['src/app/dashboard/page.tsx', 'src/app/dashboard/dashboard-day.css']) {
    assert.doesNotMatch(await readFile(path, 'utf8'), /figma\.com\/api\/mcp\/asset/);
  }
});

test('Day presentation reuses real period handlers and financial status', async () => {
  const selector = await readFile('src/components/dashboard/DashboardMonthSelector.tsx', 'utf8');
  assert.match(selector, /onClick=\{\(\) => onMonthChange\(currentMonth\)\}/);
  assert.equal((selector.match(/onClick=\{toggleMonthSelector\}/g) ?? []).length, 1);
  assert.match(selector, /onClick=\{onOpenCalendar \? openCalendar : toggleMonthSelector\}/);
  assert.match(selector, /onMonthChange\(value\); setIsOpen\(false\)/);
  const page = await readFile('src/app/dashboard/page.tsx', 'utf8');
  assert.match(page, /netCashFlow=\{selectedPeriodSummary\?\.netCashFlow \?\? null\}/);
  assert.doesNotMatch(page, /demo=\{true\}/);
  const status = await readFile('src/components/dashboard/MonthlyStatusCard.tsx', 'utf8');
  assert.match(status, /usage.available && \(theme === "light" \|\| presentation === "verdict"\)/);
  assert.match(status, /\{content.label\}/);
  assert.match(status, /: usage.available \? <MonthlyBudgetRadialGauge/);
});
