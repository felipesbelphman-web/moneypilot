import assert from 'node:assert/strict';
import test from 'node:test';
import type React from 'react';
import { elements, helpHarness, type Element } from './help-render-harness.mts';
import { helpCopy } from '../../src/i18n/help-copy.ts';

function find(node: React.ReactNode, predicate: (element: Element) => boolean) {
  const result = elements(node).find(predicate); assert.ok(result); return result;
}
function section(node: React.ReactNode, name: string) { return find(node, item => typeof item.type === 'function' && item.type.name === name); }
function invoke(element: Element, name: string, ...args: unknown[]) { (element.props[name] as (...args: unknown[]) => void)(...args); }

test('page renders all locales with six accessible accordion controls and four real links', () => {
  for (const language of ['en', 'pt', 'es', 'de', 'fr', 'nl', 'it']) {
    const harness = helpHarness(language);
    const html = harness.html(harness.render());
    assert.match(html, /data-help-page/);
    assert.equal((html.match(/aria-expanded="false"/g) ?? []).length, 6);
    assert.equal((html.match(/aria-pressed="false"/g) ?? []).length, 4);
    assert.match(html, /role="search"/);
    assert.match(html, /aria-keyshortcuts="Control\+k Meta\+k"/);
    assert.match(html, /href="\/transactions\?import=csv"/);
    assert.match(html, /href="\/categories"/);
    assert.match(html, /href="\/settings"/);
    assert.match(html, /href="\/insights"/);
    assert.match(html, /data-test-avatar/);
    assert.doesNotMatch(html, /undefined|NaN/);
  }
});

test('typing, category selection, clearing and accordion callbacks update the rendered page', () => {
  const harness = helpHarness();
  let node = harness.render();
  invoke(find(node, item => item.type === 'input'), 'onChange', { target: { value: 'CSV' } });
  node = harness.render();
  assert.match(harness.html(node), /Artigos: 1/);
  invoke(section(node, 'HelpFaq'), 'onToggle', 'import');
  node = harness.render();
  assert.equal((harness.html(node).match(/aria-expanded="true"/g) ?? []).length, 1);
  invoke(section(node, 'HelpFaq'), 'onToggle', 'import');
  node = harness.render();
  assert.equal((harness.html(node).match(/aria-expanded="true"/g) ?? []).length, 0);

  invoke(find(node, item => item.type === 'input'), 'onChange', { target: { value: '' } });
  node = harness.render();
  invoke(section(node, 'HelpCategories'), 'onSelect', 'planning');
  node = harness.render();
  assert.match(harness.html(node), /Artigos: 2/);
  assert.equal((harness.html(node).match(/aria-pressed="true"/g) ?? []).length, 1);
  invoke(find(node, item => item.type === 'input'), 'onChange', { target: { value: 'nothing-xyz' } });
  node = harness.render();
  assert.match(harness.html(node), /Nenhum resultado encontrado/);
  invoke(find(node, item => item.type === 'button' && item.props.children === helpCopy.pt.clear), 'onClick');
  assert.match(harness.html(harness.render()), /Artigos: 6/);
});

test('keyboard shortcut focuses search, pauses for modal and removes its listener on unmount', () => {
  const harness = helpHarness();
  let node = harness.render();
  const input = find(node, item => item.type === 'input');
  let focus = 0;
  (input.props.ref as { current: unknown }).current = { focus: () => focus++ };
  harness.effects();
  let prevented = 0;
  const event = { key: 'k', ctrlKey: true, metaKey: false, altKey: false, preventDefault: () => prevented++ };
  harness.listeners.get('keydown')!(event);
  assert.equal(focus, 1); assert.equal(prevented, 1);
  invoke(section(node, 'HelpSupportCard'), 'onContact');
  node = harness.render(); harness.effects();
  section(node, 'HelpSupportDialog');
  harness.listeners.get('keydown')!(event);
  assert.equal(focus, 1);
  invoke(section(node, 'HelpSupportDialog'), 'onClose');
  node = harness.render(); harness.effects();
  assert.equal(elements(node).some(item => typeof item.type === 'function' && item.type.name === 'HelpSupportDialog'), false);
  harness.unmount(); assert.equal(harness.listeners.size, 0);
});

test('local native dialog focuses its close control, handles Escape/backdrop/button and restores focus', () => {
  let closed = 0; let shown = 0; let dismissed = 0; let initialFocus = 0;
  const harness = helpHarness('pt', 'HelpSupportDialog', { copy: helpCopy.pt, onClose: () => closed++ });
  const node = harness.render();
  const dialog = find(node, item => item.type === 'dialog');
  const button = find(node, item => item.type === 'button');
  (dialog.props.ref as { current: unknown }).current = { showModal: () => shown++, close: () => dismissed++ };
  (button.props.ref as { current: unknown }).current = { focus: () => initialFocus++ };
  harness.effects();
  assert.equal(shown, 1); assert.equal(initialFocus, 1);
  assert.equal(dialog.props['aria-modal'], 'true');
  let prevented = false;
  invoke(dialog, 'onCancel', { preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true); assert.equal(closed, 1);
  const target = { getBoundingClientRect: () => ({ left: 10, right: 100, top: 10, bottom: 100 }) };
  invoke(dialog, 'onClick', { target, currentTarget: target, clientX: 50, clientY: 50 });
  assert.equal(closed, 1, 'inside dialog padding is not backdrop');
  invoke(dialog, 'onClick', { target, currentTarget: target, clientX: 0, clientY: 0 });
  assert.equal(closed, 2);
  invoke(button, 'onClick'); assert.equal(closed, 3);
  harness.unmount(); assert.equal(dismissed, 1); assert.deepEqual(harness.focusCalls, ['return']);
});
