import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import test from "node:test";
import { navigationItems, navigationIconPath, isNavigationActive } from "../../src/components/navigation/navigation-model.ts";

function contrast(foreground: string, background: string) {
  const luminance = (hex: string) => {
    const channels = hex.match(/[a-f\d]{2}/gi)!.map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
  };
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + .05) / (values[1] + .05);
}

test("both theme palettes maintain readable labels, icons and active symbols", async () => {
  const css = await readFile("src/app/floating-sidebar.css", "utf8");
  const globals = await readFile("src/app/globals.css", "utf8");
  assert.match(css, /--floating-nav-surface: var\(--background-sidebar\)/);
  assert.match(css, /--floating-nav-surface: #202020/);
  assert.match(globals, /--background-sidebar: #fafafa/);
  assert.ok(contrast("#252526", "#fafafa") >= 4.5);
  assert.ok(contrast("#d9e0e7", "#202020") >= 4.5);
  assert.ok(contrast("#f5f7fa", "#202020") >= 4.5);
  assert.ok(contrast("#ffffff", "#3b82f6") >= 3, "white active icon needs non-text contrast");
});

test("one canonical route order is shared by desktop and mobile", () => {
  assert.deepEqual(navigationItems.map(item => item.href), ["/dashboard", "/transactions", "/budgets", "/insights", "/goals", "/investments", "/settings"]);
  assert.equal(new Set(navigationItems.map(item => item.href)).size, 7);
});

test("every route and subroute activates exactly its navigation item", () => {
  for (const item of navigationItems) {
    for (const path of [item.href, `${item.href}/`, `${item.href}/example/nested`]) {
      assert.deepEqual(navigationItems.filter(candidate => isNavigationActive(path, candidate.href)), [item]);
    }
    assert.equal(isNavigationActive(`${item.href}-other`, item.href), false);
  }
  assert.equal(navigationItems.some(item => isNavigationActive("/auth", item.href)), false);
});

test("all nine approved SVG assets exist and keep a 24px viewbox", async () => {
  for (const icon of [...navigationItems.map(item => item.icon), "help", "logout"] as const) {
    const file = `public${navigationIconPath(icon)}`;
    await access(file);
    assert.match(await readFile(file, "utf8"), /viewBox="0 0 24 24"/);
  }
});

test("one shared sidebar owns real logout and accessible close controls", async () => {
  const source = await readFile("src/components/navigation/DesktopSidebar.tsx", "utf8");
  const layout = await readFile("src/app/layout.tsx", "utf8");
  assert.equal((layout.match(/sidebar=\{<DesktopSidebar \/>\}/g) ?? []).length, 1);
  assert.equal((source.match(/<form action=\{signOut\}/g) ?? []).length, 1);
  assert.match(source, /aria-expanded=\{expanded\}/);
  assert.match(source, /aria-current=\{isNavigationActive/);
  assert.match(source, /event.key === "Escape"/);
  assert.match(source, /desktopRef.current\?\.contains\(event.target\)/);
  assert.match(source, /desktopTriggerRef.current\?\.focus/);
  assert.match(source, /role="tooltip"/);
  assert.doesNotMatch(source, /localStorage/, "a previous expanded state must not replace the initial rail");
  assert.doesNotMatch(source, /[☰×]/, "menu controls must use SVG icons");
});

test("mobile keeps one overlay, focus containment and shared scroll locking", async () => {
  const source = await readFile("src/components/navigation/DesktopSidebar.tsx", "utf8");
  assert.equal((source.match(/data-mobile-sidebar-drawer/g) ?? []).length, 1);
  assert.equal((source.match(/data-mobile-sidebar-backdrop/g) ?? []).length, 1);
  assert.match(source, /clientReady && mobileOpen \? createPortal/);
  assert.match(source, /role="dialog" aria-modal="true"/);
  assert.match(source, /event.key !== "Tab"/);
  assert.match(source, /scrollViewport.style.overflow = "hidden"/);
  assert.match(source, /scrollViewport.style.overflow = previousViewportOverflow/);
  assert.match(source, /document.body.style.overflow = previousOverflow/);
});

test("navigation reflows its grid column while retaining shared scroll and vertical scale", async () => {
  const source = await readFile("src/components/layout/AppShellFrame.tsx", "utf8");
  const css = await readFile("src/app/floating-sidebar.css", "utf8");
  const shellCss = await readFile("src/app/app-shell.css", "utf8");
  const desktopCss = css.split("@media (min-width: 768px)")[1].split("@media (max-width: 767px)")[0];
  assert.match(source, /data-shell-size=\{shellSize\}>\{sidebar\}<main data-app-scroll>/);
  assert.match(source, /const sidebarWidth = expanded \? 216 : 66/);
  assert.match(source, /Math.max\(DESIGN_WIDTH, compositionWidth \+ SAFE_MARGIN \* 2\)/);
  assert.doesNotMatch(source, /\[pathname, shellSize, expanded\]/, "expansion must not reset route scroll");
  assert.doesNotMatch(desktopCss, /position: (fixed|sticky|absolute)|overflow[^;]*: (auto|scroll)|fit-content/);
  assert.match(desktopCss, /height: clamp\(602px, calc\(100dvh \/ var\(--shell-scale\) - 214px\), 626px\)/);
  assert.doesNotMatch(desktopCss, /\[data-expanded="true"\][^{]*\{[^}]*\b(height|padding-block|border-radius: 33px)/);
  assert.match(shellCss, /grid-template-columns: var\(--shell-sidebar-width\) var\(--shell-panel-width\); column-gap: 24px/);
  assert.match(shellCss, /grid-column: 2; grid-row: 1/);
  assert.match(shellCss, /prefers-reduced-motion: reduce/);
  assert.match(shellCss, /transition: grid-template-columns 180ms ease, padding-inline 180ms ease/);
  assert.match(shellCss, /overflow-x: hidden; overflow-y: auto/);
  assert.match(css, /\[data-desktop-sidebar\] \{ display: none/);
});

test("desktop toggle is the first control inside the shared navigation surface", async () => {
  const source = await readFile("src/components/navigation/DesktopSidebar.tsx", "utf8");
  assert.match(source, /return <nav[^>]+>\s*\{!mobile && <button ref=\{desktopTriggerRef\}/);
  assert.match(source, /className="floating-sidebar__surface">\{nav\(expanded\)\}/);
  assert.equal((source.match(/data-sidebar-toggle/g) ?? []).length, 1);
});

test("theme bootstrap and shell hydration retain deterministic Next markup", async () => {
  const layout = await readFile("src/app/layout.tsx", "utf8");
  const shell = await readFile("src/components/layout/AppShellFrame.tsx", "utf8");
  assert.match(layout, /<Script id="moneypilot-theme-bootstrap" strategy="beforeInteractive">/);
  assert.match(shell, /tabIndex=\{-1\} data-shell-viewport="true"/);
  assert.doesNotMatch(shell, /tabIndex=\{shellSize/);
});
