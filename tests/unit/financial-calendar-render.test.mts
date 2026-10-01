import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { runInNewContext } from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import postcss from 'postcss';
import { formatMoney } from '../../src/i18n/config.ts';

const require = createRequire(import.meta.url);
function loadCalendar(language: string, money = (value: number) => `EUR ${value.toFixed(2)}`) {
  const cache = new Map<string, { exports: Record<string, unknown> }>();
  function load(path: string): Record<string, unknown> {
    const file = [path, `${path}.ts`, `${path}.tsx`].find(existsSync)!;
    const cached = cache.get(file); if (cached) return cached.exports;
    const loadedModule = { exports: {} as Record<string, unknown> }; cache.set(file, loadedModule);
    function localRequire(id: string): unknown {
      if (id.endsWith('.css')) return { __esModule: true, default: new Proxy({}, { get: (_, key) => String(key) }) };
      if (id.endsWith('/LanguageProvider')) return { useLanguage: () => ({ language }) };
      if (id.endsWith('/CurrencyProvider')) return { useCurrency: () => ({ formatMoney: money }) };
      if (id === 'next/link') return { __esModule: true, default: (props: Record<string, unknown>) => React.createElement('a', props) };
      if (id.startsWith('@/')) return load(resolve('src', id.slice(2)));
      if (id.startsWith('.')) return load(resolve(dirname(file), id));
      return require(id);
    }
    const output = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    runInNewContext(output, { module: loadedModule, exports: loadedModule.exports, require: localRequire, Date, Intl, console }, { filename: file });
    return loadedModule.exports;
  }
  return load(resolve('src/components/dashboard/FinancialCalendar.tsx')).FinancialCalendar as React.ComponentType<Record<string, unknown>>;
}

test('offline calendar integration renders all seven locales, selected day, real totals and budget destination', () => {
  for (const language of ['en', 'pt', 'es', 'de', 'fr', 'nl', 'it']) {
    const Calendar = loadCalendar(language);
    const markup = renderToStaticMarkup(React.createElement(Calendar, { month: '2026-09', today: '2026-09-19', selectedDay: '2026-09-19', onSelectDay: () => {}, events: [{ id: 'rent', title: 'Real expense', date: '2026-09-19', amount: 123.45, settled: true }] }));
    assert.match(markup, /Real expense/);
    assert.match(markup, /EUR 123.45/);
    assert.match(markup, /href="\/budgets\?month=2026-09"/);
    assert.equal((markup.match(/tabindex="0"/g) ?? []).length, 1);
    assert.equal((markup.match(/aria-current="date"/g) ?? []).length, 1);
    assert.equal((markup.match(/role="gridcell"/g) ?? []).length, 35);
    assert.doesNotMatch(markup, /undefined|NaN/);
  }
});

test('daily commitment amounts retain content width and cannot wrap beside long descriptions', () => {
  const Calendar = loadCalendar('en', value => formatMoney(value, { currency: 'EUR', language: 'en' }));
  const amounts = [32.86, 3.30, 2.40, 1015.98, 12450.00];
  const markup = renderToStaticMarkup(React.createElement(Calendar, {
    month: '2026-09', today: '2026-09-19', selectedDay: '2026-09-19', onSelectDay: () => {},
    events: amounts.map((amount, index) => ({ id: String(index), title: 'A long transaction description that must wrap without compressing its monetary value', date: '2026-09-19', amount, settled: true })),
  }));
  const daily = markup.match(/<aside\b[^>]*>([\s\S]*?)<\/aside>/)?.[1];
  assert.ok(daily);
  assert.match(daily, /<ul class="events">/);
  assert.deepEqual([...daily.matchAll(/<\/span><strong>([^<]+)<\/strong><\/li>/g)].map(match => match[1]), ['€32.86', '€3.30', '€2.40', '€1,015.98', '€12,450.00']);
  assert.match(daily, /<div class="total"><span>Daily total<\/span><strong>/);

  const css = postcss.parse(readFileSync('src/components/dashboard/FinancialCalendar.module.css', 'utf8'));
  const declarations = (selector: string) => {
    const rule = css.nodes.find(node => node.type === 'rule' && node.selector === selector);
    assert.ok(rule && rule.type === 'rule');
    return Object.fromEntries(rule.nodes.filter(node => node.type === 'decl').map(node => [node.prop, node.value]));
  };
  const row = declarations('.columns > aside .events > li');
  assert.equal(row.display, 'grid');
  assert.equal(row['grid-template-columns'], 'minmax(0, 1fr) max-content');
  assert.equal(declarations('.events li').gap, '12px');
  assert.equal(declarations('.events li')['align-items'], 'start');
  assert.equal(declarations('.columns > aside .events > li > span')['min-width'], '0');
  const amount = declarations('.columns > aside .events > li > strong');
  assert.equal(amount['white-space'], 'nowrap');
  assert.equal(amount['word-break'], 'normal');
  assert.equal(amount['overflow-wrap'], 'normal');
  assert.equal(amount['text-align'], 'right');
  assert.equal(amount['align-self'], 'start');
  assert.equal(amount.width, undefined);
  assert.equal(amount['font-size'], undefined);
});
