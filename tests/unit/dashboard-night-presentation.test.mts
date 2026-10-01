import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import postcss from 'postcss';

test('Night V4 tokens belong only to Dashboard, Help and Settings dark viewports', async () => {
  const css = postcss.parse(await readFile('src/app/dashboard-dark.css', 'utf8'));
  const scope = ':root[data-theme="dark"] [data-shell-viewport][data-dashboard-fit="true"]';
  const night = css.nodes.find(node => node.type === 'rule' && node.selectors.includes(scope));
  assert.ok(night && night.type === 'rule');
  assert.deepEqual(night.selectors, [scope, ':root[data-theme="dark"] [data-shell-viewport][data-help-theme="true"]', ':root[data-theme="dark"] [data-shell-viewport][data-settings-theme="true"]']);
  css.walkDecls(/^--night-/, declaration => assert.equal(declaration.parent, night));
  for (const [name, value] of Object.entries({ '--night-app': '#202020', '--night-card': 'rgb(8 11 15 / .20)', '--night-border': '#28313b', '--night-blue': '#348dfc', '--night-income': '#00e7b9', '--night-expense': '#fd4873' })) {
    assert.ok(night.nodes.some(node => node.type === 'decl' && node.prop === name && node.value === value));
  }
  assert.doesNotMatch(night.toString(), /--day-|--shell-scale|scrollTop|position: sticky|position: fixed/);
});

test('Night uses shared real status and preserves chart color fallbacks outside its scope', async () => {
  const page = await readFile('src/app/dashboard/page.tsx', 'utf8');
  assert.match(page, /<MonthlyStatusCard presentation="verdict"/);
  assert.match(page, /netCashFlow=\{selectedPeriodSummary\?\.netCashFlow \?\? null\}/);
  const chart = await readFile('src/components/charts/SpendingRadialChart.tsx', 'utf8');
  assert.match(chart, /var\(--dashboard-category-2, var\(--dashboard-brand-accent\)\)/);
  assert.match(chart, /var\(--dashboard-category-4, #22C55E\)/);
  const flow = await readFile('src/components/financial-flow/FinancialFlow.tsx', 'utf8');
  assert.match(flow, /var\(--dashboard-income, #22C55E\)/);
  assert.match(flow, /var\(--dashboard-expense, #F43F5E\)/);
});

test('Night icons are local official assets and sidebar retains only its custom tooltip', async () => {
  for (const icon of ['income', 'expense', 'cash-flow', 'insight']) {
    assert.match(await readFile(`public/moneypilot/dashboard/night/${icon}.svg`, 'utf8'), /<svg/);
  }
  const sidebar = await readFile('src/components/navigation/DesktopSidebar.tsx', 'utf8');
  assert.doesNotMatch(sidebar, /title: text|title=\{/);
  assert.match(sidebar, /onMouseEnter:/);
  assert.match(sidebar, /onFocus:/);
  assert.match(sidebar, /tooltip && !expanded && createPortal/);
});
