import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

function luminance(hex: string) {
  const channels = hex.match(/[a-f\d]{2}/gi)?.map((value) => Number.parseInt(value, 16) / 255) ?? [];
  const linear = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(foreground: string, background: string) {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

test("Night sidebar uses an AA foreground while Day tokens remain unchanged", async () => {
  const css = await readFile("src/app/globals.css", "utf8");
  assert.match(css, /:root[\s\S]*?--background-sidebar:\s*#fafafa;[\s\S]*?--sidebar-icon:\s*#252526;/);
  assert.match(css, /\[data-theme="dark"\][\s\S]*?--background-sidebar:\s*#171717;[\s\S]*?--sidebar-icon:\s*#d9e0e7;/);
  assert.ok(contrast("#d9e0e7", "#171717") >= 4.5);
});

test("sidebar preserves active, hover, focus, disabled, dimensions and hidden overflow", async () => {
  const sidebar = await readFile("src/components/navigation/DesktopSidebar.tsx", "utf8");
  const css = await readFile("src/app/globals.css", "utf8");
  assert.match(sidebar, /sidebar-item-active-foreground/);
  assert.match(sidebar, /hover:bg-\[var\(--sidebar-item-hover\)\]/);
  assert.match(sidebar, /focus-visible:ring-\[var\(--focus-ring\)\]/);
  assert.match(sidebar, /disabled:opacity-60/);
  assert.match(sidebar, /bg-current/);
  assert.match(css, /flex:\s*0 0 264px;[\s\S]*?width:\s*264px;/);
  assert.match(css, /data-expanded="false"[\s\S]*?width:\s*80px;/);
  assert.match(css, /data-desktop-sidebar[\s\S]*?overflow:\s*clip;/);
});

test("mobile has one canonical overlay drawer and no desktop sidebar in document flow", async () => {
  const sidebar = await readFile("src/components/navigation/DesktopSidebar.tsx", "utf8");
  const css = await readFile("src/app/globals.css", "utf8");
  assert.equal((sidebar.match(/data-mobile-sidebar-drawer/g) ?? []).length, 1);
  assert.equal((sidebar.match(/data-mobile-sidebar-backdrop/g) ?? []).length, 1);
  assert.match(sidebar, /clientReady && mobileOpen \? createPortal/);
  assert.match(sidebar, /useSyncExternalStore\([\s\S]*?getServerClientReadySnapshot/);
  assert.doesNotMatch(sidebar, /setMounted\(true\)/);
  assert.match(sidebar, /data-mobile-sidebar-backdrop[^>]+onClick=\{\(\) => setMobileOpen\(false\)\}/);
  assert.match(sidebar, /event\.key === "Escape"/);
  assert.match(sidebar, /document\.body\.style\.overflow = "hidden"/);
  assert.match(sidebar, /document\.body\.style\.overflow = previousOverflow/);
  assert.match(css, /\[data-desktop-sidebar\]\s*\{\s*display:\s*none;/);
  assert.match(css, /@media \(min-width:\s*768px\)[\s\S]*?\[data-desktop-sidebar\][\s\S]*?display:\s*block;/);
});

test("mobile menu control has a reserved sticky header instead of a fixed overlay", async () => {
  const sidebar = await readFile("src/components/navigation/DesktopSidebar.tsx", "utf8");
  const shell = await readFile("src/components/layout/AppShellFrame.tsx", "utf8");
  const css = await readFile("src/app/globals.css", "utf8");
  const categories = await readFile("src/app/categories/page.tsx", "utf8");
  const transactions = await readFile("src/app/transactions/page.tsx", "utf8");
  assert.equal((sidebar.match(/data-mobile-navigation-bar/g) ?? []).length, 1);
  assert.match(sidebar, /data-mobile-navigation-bar className="sticky top-0[^\"]*h-16[^\"]*bg-\[var\(--background-sidebar\)\]/);
  assert.match(sidebar, /className="grid size-11[^\"]*focus-visible:ring-2[^\"]*"/);
  assert.doesNotMatch(sidebar, /className="fixed left-\[14px\] top-\[14px\]/);
  assert.match(shell, /data-shell-viewport[\s\S]*?\{fitsDashboard \?[\s\S]*?\{shell\}/);
  assert.match(shell, /data-app-shell[^>]*>[\s\S]*?\{sidebar\}[\s\S]*?<main data-app-scroll>/);
  assert.match(css, /@media \(max-width: 767px\)[\s\S]*?\[data-shell-viewport\]\[data-shell-size="app"\][\s\S]*?height:\s*100dvh;[\s\S]*?overflow-y:\s*auto;/);
  assert.match(sidebar, /querySelector<HTMLElement>\('\[data-shell-viewport\]\[data-shell-size="app"\]'\)/);
  assert.match(sidebar, /scrollViewport\.style\.overflow = "hidden"/);
  assert.match(sidebar, /scrollViewport\.style\.overflow = previousViewportOverflow/);
  assert.match(categories, /data-categories-mobile[^\n]+pt-\[16px\]/);
  assert.match(transactions, /data-transactions-mobile[^\n]+pt-4/);
});

test("theme bootstrap and shell hydration use deterministic Next markup", async () => {
  const layout = await readFile("src/app/layout.tsx", "utf8");
  const shell = await readFile("src/components/layout/AppShellFrame.tsx", "utf8");
  assert.match(layout, /import Script from "next\/script"/);
  assert.match(layout, /<Script id="moneypilot-theme-bootstrap" strategy="beforeInteractive">/);
  assert.doesNotMatch(layout, /<script\b/);
  assert.doesNotMatch(layout, /dangerouslySetInnerHTML/);
  assert.match(shell, /tabIndex=\{-1\} data-shell-viewport="true"/);
  assert.doesNotMatch(shell, /tabIndex=\{shellSize/);
});
