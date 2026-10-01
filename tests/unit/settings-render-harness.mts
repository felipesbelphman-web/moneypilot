// Offline component/effect harness. No authentication, repositories, browser or network.
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import type { Language, CurrencyCode } from '../../src/i18n/config.ts';

const require = createRequire(import.meta.url);
export type Element = React.ReactElement<Record<string, unknown>>;
export function elements(node: React.ReactNode): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!React.isValidElement<Record<string, unknown>>(node)) return [];
  return [node, ...elements(node.props.children as React.ReactNode)];
}
type PreferenceInput = { locale: Language; currencyCode: CurrencyCode };
type Options = { language?: Language; currency?: CurrencyCode | null; hasData?: boolean; entry?: 'page' | 'SettingsBackground' | 'SettingsDialog' | 'ProfileIdentityModal'; props?: Record<string, unknown>; save?: (input: PreferenceInput) => Promise<PreferenceInput>; finance?: Record<string, unknown> };
export function settingsHarness(options: Options = {}) {
  const entry = options.entry ?? 'page';
  const context = { language: options.language ?? 'en' as Language, currency: options.currency === undefined ? 'EUR' as CurrencyCode | null : options.currency, theme: 'light' };
  const writes: PreferenceInput[] = [];
  const identityWrites: FormData[] = [];
  const urls: string[] = [], revoked: string[] = [], focusCalls: string[] = [];
  const finance = { transactions: options.hasData ? [{}] : [], budgets: [], goals: [], budgetAdjustments: {}, goalContributionPlans: {}, accountBalanceSettings: null, investments: [], isHydrating: false, hydrationError: null, ...options.finance };
  let account: unknown = { email: 'test@example.com', avatarUrl: null, profile: { id: 'test', display_name: 'Test User', avatar_mode: 'initials', avatar_path: null } };
  let cursor = 0;
  const state: unknown[] = [];
  const effectState = new Map<number, { deps?: readonly unknown[]; cleanup?: () => void }>();
  let pendingEffects: (() => void)[] = [];
  const document = { activeElement: { isConnected: true, focus: () => focusCalls.push('return') } };
  const cache = new Map<string, { exports: Record<string, unknown> }>();
  function load(path: string): Record<string, unknown> {
    const file = [path, `${path}.ts`, `${path}.tsx`].find(existsSync)!;
    const cached = cache.get(file); if (cached) return cached.exports;
    const loadedModule = { exports: {} as Record<string, unknown> }; cache.set(file, loadedModule);
    const normal = file.replaceAll('\\', '/');
    const mockedHooks = normal.endsWith('/useSettingsPreferences.ts') || (entry === 'page' ? normal.endsWith('/settings/page.tsx') : normal.endsWith(`/${entry}.tsx`));
    function localRequire(id: string): unknown {
      if (id.endsWith('.css')) return {};
      if (id === 'react' && mockedHooks) return {
        ...React,
        useMemo: (fn: () => unknown) => fn(),
        useState: (initial: unknown) => { const index = cursor++; if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial; return [state[index], (next: unknown) => { state[index] = typeof next === 'function' ? next(state[index]) : next; }]; },
        useRef: (initial: unknown) => { const index = cursor++; if (!(index in state)) state[index] = { current: initial }; return state[index]; },
        useEffect: (fn: () => void | (() => void), deps?: readonly unknown[]) => {
          const index = cursor++; const previous = effectState.get(index);
          if (!previous || !deps || deps.some((value, i) => !Object.is(value, previous.deps?.[i]))) pendingEffects.push(() => { previous?.cleanup?.(); const cleanup = fn(); effectState.set(index, { deps, cleanup: typeof cleanup === 'function' ? cleanup : undefined }); });
        },
      };
      if (id.endsWith('/LanguageProvider')) return { useLanguage: () => ({ language: context.language, setLanguage: (language: Language) => { context.language = language; } }) };
      if (id.endsWith('/CurrencyProvider')) return { useCurrency: () => ({ currency: context.currency, isCurrencyHydrating: false, setConfirmedCurrency: (currency: CurrencyCode) => { context.currency = currency; } }) };
      if (id.endsWith('/ThemeProvider')) return { useTheme: () => ({ theme: context.theme, setTheme: (theme: string) => { context.theme = theme; } }) };
      if (id.endsWith('/FinanceDataProvider')) return { useFinanceData: () => finance };
      if (id.endsWith('/AccountProfileProvider')) return { useAccountProfile: () => ({ account, isReady: true, setAccount: (next: unknown) => { account = next; } }) };
      if (id.endsWith('/AccountAvatar')) return { AccountAvatar: () => React.createElement('span', { 'data-test-avatar': true }) };
      if (id.endsWith('/actions')) return {
        updateProfilePreferences: async (input: PreferenceInput) => { writes.push(input); return options.save ? options.save(input) : input; },
        updateProfileIdentity: async (input: FormData) => { identityWrites.push(input); return { displayName: input.get('displayName'), avatarMode: input.get('avatarMode'), avatarPath: null, avatarUrl: null }; },
      };
      if (id === 'next/image') return { __esModule: true, default: (imageProps: Record<string, unknown>) => { const clean = { ...imageProps }; delete clean.fill; delete clean.unoptimized; return React.createElement('img', clean); } };
      if (id === 'next/link') return { __esModule: true, default: (linkProps: Record<string, unknown>) => React.createElement('a', linkProps) };
      if (id.startsWith('@/')) return load(resolve('src', id.slice(2)));
      if (id.startsWith('.')) return load(resolve(dirname(file), id));
      return require(id);
    }
    const output = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    runInNewContext(output, { module: loadedModule, exports: loadedModule.exports, require: localRequire, document, console, Intl, FormData, URL: { createObjectURL: () => { const url = `blob:preview-${urls.length}`; urls.push(url); return url; }, revokeObjectURL: (url: string) => revoked.push(url) } }, { filename: file });
    return loadedModule.exports;
  }
  const path = entry === 'page' ? 'src/app/settings/page.tsx' : entry === 'ProfileIdentityModal' ? 'src/components/profile/ProfileIdentityModal.tsx' : `src/components/settings/${entry}.tsx`;
  const Entry = load(resolve(path))[entry === 'page' ? 'default' : entry] as (props: Record<string, unknown>) => React.ReactNode;
  return {
    context, writes, identityWrites, urls, revoked, focusCalls,
    copy: () => (load(resolve('src/i18n/settings-copy.ts')).getSettingsCopy as (language: Language) => Record<string, unknown>)(context.language),
    render: () => { cursor = 0; pendingEffects = []; return Entry(options.props ?? {}); },
    html: (node: React.ReactNode) => renderToStaticMarkup(node),
    effects: () => { pendingEffects.forEach(fn => fn()); pendingEffects = []; },
    unmount: () => { effectState.forEach(effect => effect.cleanup?.()); effectState.clear(); },
  };
}
