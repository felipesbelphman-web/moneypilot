// Offline React harness: local state and effects only; no browser, services or auth.
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
export type Element = React.ReactElement<Record<string, unknown>>;
export function elements(node: React.ReactNode): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!React.isValidElement<Record<string, unknown>>(node)) return [];
  return [node, ...elements(node.props.children as React.ReactNode)];
}
export function helpHarness(language = 'pt', entry = 'HelpPageContent', props: Record<string, unknown> = {}) {
  let cursor = 0;
  const state: unknown[] = [];
  let effects: (() => void | (() => void))[] = [];
  let cleanups: (() => void)[] = [];
  const listeners = new Map<string, (event: unknown) => void>();
  const focusCalls: string[] = [];
  const document = { activeElement: { isConnected: true, focus: () => focusCalls.push('return') }, addEventListener: (name: string, fn: (event: unknown) => void) => listeners.set(name, fn), removeEventListener: (name: string) => listeners.delete(name) };
  const cache = new Map<string, { exports: Record<string, unknown> }>();
  function load(path: string): Record<string, unknown> {
    const file = [path, `${path}.ts`, `${path}.tsx`].find(existsSync)!;
    const cached = cache.get(file); if (cached) return cached.exports;
    const loadedModule = { exports: {} as Record<string, unknown> }; cache.set(file, loadedModule);
    function localRequire(id: string): unknown {
      if (id.endsWith('.css')) return {};
      if (id === 'react' && file.replaceAll('\\', '/').endsWith(`/${entry}.tsx`)) return {
        ...React,
        useMemo: (fn: () => unknown) => fn(),
        useState: (initial: unknown) => { const index = cursor++; if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial; return [state[index], (next: unknown) => { state[index] = typeof next === 'function' ? next(state[index]) : next; }]; },
        useRef: (initial: unknown) => { const index = cursor++; if (!(index in state)) state[index] = { current: initial }; return state[index]; },
        useId: () => `help-test-${cursor++}`,
        useEffect: (fn: () => void | (() => void)) => { effects.push(fn); },
      };
      if (id.endsWith('/LanguageProvider')) return { useLanguage: () => ({ language }) };
      if (id.endsWith('/AccountAvatar')) return { AccountAvatar: () => React.createElement('span', { 'data-test-avatar': true }) };
      if (id.endsWith('/ThemeControl')) return { ThemeControl: () => React.createElement('span', { 'data-test-theme': true }) };
      if (id === 'next/image') return { __esModule: true, default: (imageProps: Record<string, unknown>) => React.createElement('img', imageProps) };
      if (id === 'next/link') return { __esModule: true, default: (linkProps: Record<string, unknown>) => React.createElement('a', linkProps) };
      if (id.startsWith('@/')) return load(resolve('src', id.slice(2)));
      if (id.startsWith('.')) return load(resolve(dirname(file), id));
      return require(id);
    }
    const output = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    runInNewContext(output, { exports: loadedModule.exports, module: loadedModule, require: localRequire, document, console, Intl }, { filename: file });
    return loadedModule.exports;
  }
  const Entry = load(resolve(`src/components/help/${entry}.tsx`))[entry] as (props: Record<string, unknown>) => React.ReactNode;
  return {
    listeners, focusCalls,
    render: () => { cursor = 0; effects = []; return Entry(props); },
    html: (node: React.ReactNode) => renderToStaticMarkup(node),
    effects: () => { cleanups.forEach(fn => fn()); cleanups = effects.map(fn => fn()).filter((fn): fn is () => void => typeof fn === 'function'); },
    unmount: () => { cleanups.forEach(fn => fn()); },
  };
}
