import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import React from 'react';
import ts from 'typescript';
import postcss from 'postcss';

const require = createRequire(import.meta.url);
const source = readFileSync('src/components/layout/AppShellFrame.tsx', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
type Node = React.ReactElement<Record<string, unknown>>;

// Execute the real shell's sizing effect offline, without a browser or DOM layout.
function renderShell(pathname: string, width: number, expanded: boolean, contentHeight: number) {
  let stage = { scale: 1, height: 1024 };
  let refIndex = 0;
  const effects: (() => void)[] = [];
  const loaded = { exports: {} as { AppShellFrame: (props: Record<string, unknown>) => Node } };
  runInNewContext(compiled, {
    exports: loaded.exports,
    require: (id: string) => {
      if (id === 'react') return {
        useState: () => [stage, (update: (previous: typeof stage) => typeof stage) => { stage = update(stage); }],
        useRef: () => ({ current: refIndex++ === 0 ? null : { offsetHeight: contentHeight } }),
        useEffect: (effect: () => void) => effects.push(effect),
      };
      if (id === 'next/navigation') return { usePathname: () => pathname };
      if (id.endsWith('/DesktopSidebar')) return { useSidebarLayout: () => ({ expanded }) };
      return require(id);
    },
    window: { innerWidth: width, addEventListener() {}, removeEventListener() {} },
    ResizeObserver: class { observe() {} disconnect() {} },
  });
  const props = { sidebar: React.createElement('aside', { 'data-test-sidebar': true }), children: React.createElement('div', { 'data-settings-page': true }) };
  loaded.exports.AppShellFrame(props);
  effects[0]();
  refIndex = 0;
  return loaded.exports.AppShellFrame(props);
}

for (const [width, height] of [[1440, 1024], [1366, 768], [390, 844]]) {
  for (const expanded of [false, true]) {
    test(`Settings shares shell sizing at ${width}x${height}, expanded=${expanded}`, () => {
      for (const contentHeight of [1024, 1600]) {
        const settings = renderShell('/settings', width, expanded, contentHeight);
        const stage = settings.props.children as Node;
        const shell = stage.props.children as Node;
        const children = shell.props.children as Node[];
        assert.equal(settings.props['data-shell-viewport'], 'true');
        assert.equal(settings.props['data-shell-size'], 'app');
        assert.equal(stage.props['data-dashboard-appearance'], true);
        assert.equal(children[0].type, 'aside');
        assert.equal(children[1].type, 'main');
        assert.equal(children[1].props['data-app-scroll'], true);
        const scale = width < 768 ? 1 : Math.min(1, width / 1440);
        assert.equal((stage.props.style as React.CSSProperties).height, contentHeight * scale);
        assert.equal((stage.props.style as React.CSSProperties).width, 1440 * scale);
        for (const route of ['/dashboard', '/transactions', '/goals', '/investments']) {
          const reference = renderShell(route, width, expanded, contentHeight);
          assert.deepEqual({ ...settings.props.style as React.CSSProperties }, { ...reference.props.style as React.CSSProperties });
          assert.deepEqual({ ...stage.props.style as React.CSSProperties }, { ...(reference.props.children as Node).props.style as React.CSSProperties });
        }
      }
    });
  }
}

test('Settings inherits desktop geometry and keeps a single shared scrolling viewport', () => {
  const page = readFileSync('src/app/settings/page.tsx', 'utf8');
  assert.match(page, /return <div data-settings-page>/);
  assert.doesNotMatch(page, /AppShellFrame|DesktopSidebar|<main|data-shell-viewport|settings-frame|settings-content|style=|max-w-/);
  const css = postcss.parse(readFileSync('src/app/settings/settings.css', 'utf8'));
  css.walkRules(rule => {
    if (!rule.selector.includes('[data-app-scroll]') && rule.selector !== '[data-settings-page]') return;
    rule.walkDecls(decl => {
      assert.ok(!['width', 'max-width', 'height', 'max-height', 'margin', 'margin-inline', 'transform', 'overflow', 'overflow-y', 'justify-content', 'align-items'].includes(decl.prop), `${rule.selector}: ${decl.prop} must stay owned by the shell`);
      if (decl.prop === 'padding') {
        assert.equal(rule.parent?.type, 'atrule');
        assert.equal((rule.parent as postcss.AtRule).params, '(max-width: 767px)');
        assert.equal(decl.value, '20px 16px');
      }
    });
  });
  const shared = readFileSync('src/app/app-shell.css', 'utf8');
  assert.match(shared, /width: var\(--shell-panel-width\); min-width: 0/);
  assert.match(shared, /min-height: var\(--shell-panel-height\); height: auto/);
  assert.match(shared, /border-radius: var\(--shell-panel-radius\)/);
  assert.match(shared, /overflow-x: hidden; overflow-y: auto/);
  assert.match(shared, /column-gap: 24px/);
  assert.match(shared, /\[data-shell-stage\] \{ width: 100% !important; height: auto !important; \}/);
  const settings = css.toString();
  assert.match(settings, /gap: 12px; min-width: 0/);
  assert.match(settings, /\.settings-header \{ min-height: 58px; \}/);
  assert.match(settings, /> \* \{ min-width: 0; \}/);
  assert.match(settings, /padding: 20px 16px; border-radius: 0/);
});
