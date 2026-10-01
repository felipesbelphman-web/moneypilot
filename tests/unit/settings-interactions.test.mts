import assert from 'node:assert/strict';
import test from 'node:test';
import type React from 'react';
import { elements, settingsHarness, type Element } from './settings-render-harness.mts';

function find(node: React.ReactNode, predicate: (item: Element) => boolean) { const result = elements(node).find(predicate); assert.ok(result); return result; }
function section(node: React.ReactNode, name: string) { return find(node, item => typeof item.type === 'function' && item.type.name === name); }
function invoke(item: Element, event: string, ...args: unknown[]): unknown { return (item.props[event] as (...args: unknown[]) => unknown)(...args); }
function expand(item: Element) { return (item.type as (props: Record<string, unknown>) => React.ReactNode)(item.props); }
function saveButton(node: React.ReactNode) { return find(node, item => item.type === 'button' && item.props['aria-busy'] !== undefined); }

test('Settings renders four summaries, five local switches, existing avatar and links in seven languages', () => {
  for (const language of ['en', 'pt', 'es', 'de', 'fr', 'nl', 'it'] as const) {
    const harness = settingsHarness({ language });
    const node = harness.render(); const html = harness.html(node);
    assert.equal((html.match(/settings-summary-card/g) ?? []).length, 4);
    assert.equal((html.match(/role="switch"/g) ?? []).length, 5);
    assert.match(html, /data-test-avatar/);
    assert.match(html, /href="\/categories"/); assert.match(html, /href="\/help"/);
    assert.match(html, /id="settings-cycle"[^>]*disabled=""/);
    assert.equal(saveButton(node).props.disabled, true);
    assert.doesNotMatch(html, /undefined|NaN/);
    const copy = harness.copy();
    for (const key of ['pending', 'saving', 'savedPreferences', 'saveError', 'imageTypeError', 'notificationsLocal', 'deleteUnavailable']) assert.ok(typeof copy[key] === 'string' && copy[key]);
  }
});

test('currency and language stay pending until the existing save action confirms them', async () => {
  const harness = settingsHarness(); let node = harness.render();
  const preferences = expand(section(node, 'SettingsPreferences'));
  invoke(find(preferences, item => item.props.id === 'settings-currency'), 'onChange', { target: { value: 'GBP' } });
  invoke(find(preferences, item => item.props.id === 'settings-language'), 'onChange', { target: { value: 'pt' } });
  node = harness.render();
  assert.equal(harness.context.currency, 'EUR'); assert.equal(harness.context.language, 'en');
  assert.equal(harness.writes.length, 0); assert.equal(saveButton(node).props.disabled, false);
  assert.match(harness.html(node), /Unsaved changes/);
  await invoke(saveButton(node), 'onClick'); node = harness.render();
  assert.deepEqual(JSON.parse(JSON.stringify(harness.writes)), [{ locale: 'pt', currencyCode: 'GBP' }]);
  assert.equal(harness.context.currency, 'GBP'); assert.equal(harness.context.language, 'pt');
  assert.equal(saveButton(node).props.disabled, true);
  assert.match(harness.html(node), /Moeda e idioma salvos/);
});

test('saving blocks duplicate calls and field changes while processing', async () => {
  let resolveSave!: (input: { locale: 'pt'; currencyCode: 'EUR' }) => void;
  const harness = settingsHarness({ save: () => new Promise(resolve => { resolveSave = resolve; }) });
  let node = harness.render(); invoke(section(node, 'SettingsPreferences'), 'onLanguageChange', 'pt');
  node = harness.render(); const button = saveButton(node);
  const pending = invoke(button, 'onClick'); invoke(button, 'onClick');
  node = harness.render(); assert.equal(harness.writes.length, 1);
  assert.equal(saveButton(node).props.disabled, true); assert.equal(saveButton(node).props['aria-busy'], true);
  invoke(section(node, 'SettingsPreferences'), 'onLanguageChange', 'fr');
  assert.equal(section(harness.render(), 'SettingsPreferences').props.selectedLanguage, 'pt');
  resolveSave({ locale: 'pt', currencyCode: 'EUR' }); await pending;
  assert.equal(saveButton(harness.render()).props.disabled, true);
});

test('failed saves retain the draft and never change confirmed providers', async () => {
  const harness = settingsHarness({ save: async () => { throw new Error('offline'); } });
  let node = harness.render(); invoke(section(node, 'SettingsPreferences'), 'onLanguageChange', 'fr');
  node = harness.render(); await invoke(saveButton(node), 'onClick'); node = harness.render();
  assert.equal(harness.context.language, 'en'); assert.equal(section(node, 'SettingsPreferences').props.selectedLanguage, 'fr');
  assert.equal(saveButton(node).props.disabled, false);
  assert.match(harness.html(node), /role="alert"/);
});

test('existing financial data blocks currency changes, while language remains editable', () => {
  for (const finance of [{ transactions: [{}] }, { accountBalanceSettings: {} }, { investments: [{}] }, { hydrationError: {} }, { isHydrating: true }]) {
    const harness = settingsHarness({ finance }); let node = harness.render();
    const preferences = section(node, 'SettingsPreferences');
    assert.equal(preferences.props.currencyDisabled, true);
    invoke(preferences, 'onCurrencyChange', 'USD'); node = harness.render();
    assert.equal(section(node, 'SettingsPreferences').props.currency, 'EUR');
    invoke(section(node, 'SettingsPreferences'), 'onLanguageChange', 'de');
    assert.equal(saveButton(harness.render()).props.disabled, false);
  }
});

test('theme changes immediately and local switches are interactive without dirtying remote preferences', () => {
  const harness = settingsHarness(); let node = harness.render();
  const preferences = expand(section(node, 'SettingsPreferences'));
  invoke(find(preferences, item => item.props.id === 'settings-theme'), 'onChange', { target: { value: 'dark' } });
  node = harness.render(); assert.equal(harness.context.theme, 'dark'); assert.equal(saveButton(node).props.disabled, true);
  const notifications = expand(section(node, 'SettingsNotifications'));
  invoke(find(notifications, item => item.props.role === 'switch'), 'onClick'); node = harness.render();
  assert.match(harness.html(node), /aria-checked="true"/); assert.match(harness.html(node), /1 of 5 enabled locally/);
  assert.equal(saveButton(node).props.disabled, true); assert.equal(harness.writes.length, 0);
});

test('security and deletion open information only, and profile keeps the existing identity action', async () => {
  const harness = settingsHarness(); let node = harness.render();
  invoke(section(node, 'SettingsSecurity'), 'onUnavailable', 1); node = harness.render();
  let dialog = section(node, 'SettingsDialog'); assert.match(harness.html(node), /Bank synchronization is not available yet/);
  invoke(dialog, 'onClose'); node = harness.render();
  invoke(section(node, 'SettingsDangerZone'), 'onOpen'); node = harness.render(); dialog = section(node, 'SettingsDialog');
  assert.match(harness.html(node), /Your account and data have not been changed/);
  assert.equal(harness.writes.length, 0); assert.equal(harness.identityWrites.length, 0);
  invoke(dialog, 'onClose'); node = harness.render();
  invoke(find(node, item => item.type === 'button' && item.props.className === 'settings-avatar'), 'onClick'); node = harness.render();
  await invoke(section(node, 'ProfileIdentityModal'), 'onSave', { displayName: 'Updated User', avatarMode: 'initials', avatarFile: null, removePhoto: false });
  assert.equal(harness.identityWrites[0].get('displayName'), 'Updated User');
  assert.equal(harness.identityWrites[0].get('avatarMode'), 'initials');
});

test('session background preview validates, replaces, restores and revokes every object URL', () => {
  const copy = settingsHarness().copy();
  const harness = settingsHarness({ entry: 'SettingsBackground', props: { copy } });
  let node = harness.render(); harness.effects();
  const choose = (type: string, size: number, name = 'photo.png') => {
    invoke(find(node, item => item.type === 'input'), 'onChange', { target: { files: [{ type, size, name }] }, currentTarget: { value: name } });
    node = harness.render(); harness.effects();
  };
  choose('image/svg+xml', 100); assert.equal(harness.urls.length, 0); assert.match(harness.html(node), /role="alert"/);
  choose('image/png', 100); assert.match(harness.html(node), /blob:preview-0/); assert.equal(harness.revoked.length, 0);
  choose('image/webp', 200); assert.deepEqual(harness.revoked, ['blob:preview-0']);
  const restore = find(node, item => item.type === 'button' && Array.isArray(item.props.children) && item.props.children.includes(copy.restoreDefault));
  invoke(restore, 'onClick'); node = harness.render(); harness.effects();
  assert.deepEqual(harness.revoked, ['blob:preview-0', 'blob:preview-1']); assert.doesNotMatch(harness.html(node), /blob:preview/);
  choose('image/jpeg', 300); harness.unmount(); assert.equal(harness.revoked.length, 3);
});

test('native settings dialog handles focus, Escape, backdrop and busy state', () => {
  let closed = 0, shown = 0, focused = 0;
  const props = { label: 'Information', children: 'Details', busy: false, onClose: () => closed++ };
  const harness = settingsHarness({ entry: 'SettingsDialog', props });
  let node = harness.render(); let dialog = find(node, item => item.type === 'dialog');
  (dialog.props.ref as { current: unknown }).current = { showModal: () => shown++, close: () => {}, querySelector: () => ({ focus: () => focused++ }) };
  harness.effects(); assert.equal(shown, 1); assert.equal(focused, 1);
  invoke(dialog, 'onCancel', { preventDefault() {} }); assert.equal(closed, 1);
  const bounds = { getBoundingClientRect: () => ({ left: 10, right: 100, top: 10, bottom: 100 }) };
  invoke(dialog, 'onClick', { target: bounds, currentTarget: bounds, clientX: 50, clientY: 50 }); assert.equal(closed, 1);
  invoke(dialog, 'onClick', { target: bounds, currentTarget: bounds, clientX: 0, clientY: 0 }); assert.equal(closed, 2);
  props.busy = true; node = harness.render(); dialog = find(node, item => item.type === 'dialog');
  invoke(dialog, 'onCancel', { preventDefault() {} }); assert.equal(closed, 2);
  harness.unmount(); assert.deepEqual(harness.focusCalls, ['return']);
});

test('profile editor keeps localized name, photo, initials and save behavior', async () => {
  for (const language of ['en', 'pt', 'es', 'de', 'fr', 'nl', 'it'] as const) {
    const writes: Record<string, unknown>[] = [];
    const harness = settingsHarness({ language, entry: 'ProfileIdentityModal', props: { open: true, displayName: 'Test User', email: 'test@example.com', avatarMode: 'initials', avatarPath: null, avatarUrl: null, onClose() {}, onSave: async (input: Record<string, unknown>) => { writes.push(input); } } });
    let node = harness.render(); harness.effects();
    assert.doesNotMatch(harness.html(node), /undefined|NaN/);
    invoke(find(node, item => item.props.id === 'profile-first-name'), 'onChange', { target: { value: 'Updated' } });
    node = harness.render();
    await invoke(find(node, item => item.type === 'form'), 'onSubmit', { preventDefault() {} });
    assert.equal(writes[0].displayName, 'Updated User'); assert.equal(writes[0].avatarMode, 'initials');
    assert.equal(writes[0].avatarFile, null); assert.equal(writes[0].removePhoto, false);
    harness.unmount();
  }
});

test('profile photo validation and removal preserve the existing save input', async () => {
  const writes: Record<string, unknown>[] = [];
  const harness = settingsHarness({ entry: 'ProfileIdentityModal', props: { open: true, displayName: 'Test User', email: 'test@example.com', avatarMode: 'photo', avatarPath: 'test/avatar.png', avatarUrl: '/existing.png', onClose() {}, onSave: async (input: Record<string, unknown>) => { writes.push(input); } } });
  let node = harness.render(); harness.effects();
  const selectPhoto = (type: string, size: number) => {
    invoke(find(node, item => item.type === 'input' && item.props.type === 'file'), 'onChange', { target: { files: [{ type, size }] }, currentTarget: { value: 'photo' } });
    node = harness.render(); harness.effects();
  };
  selectPhoto('image/svg+xml', 100); assert.match(harness.html(node), /role="alert"/); assert.equal(harness.urls.length, 0);
  selectPhoto('image/png', 6 * 1024 * 1024); assert.equal(harness.urls.length, 0);
  selectPhoto('image/png', 100); assert.equal(harness.urls.length, 1);
  invoke(find(node, item => item.type === 'button' && item.props.children === 'Remove photo'), 'onClick');
  node = harness.render(); harness.effects(); assert.deepEqual(harness.revoked, ['blob:preview-0']);
  await invoke(find(node, item => item.type === 'form'), 'onSubmit', { preventDefault() {} });
  assert.equal(writes[0].removePhoto, true); assert.equal(writes[0].avatarMode, 'initials'); assert.equal(writes[0].avatarFile, null);
});
