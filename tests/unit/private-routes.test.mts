import assert from "node:assert/strict";
import test from "node:test";

import { isPrivateRoute, privateRoutes } from "../../src/lib/auth/private-routes.ts";

test("statements and future statement subroutes are private", () => {
  assert.equal(isPrivateRoute("/statements"), true);
  assert.equal(isPrivateRoute("/statements/example"), true);
});

test("public routes remain public", () => {
  assert.equal(isPrivateRoute("/"), false);
  assert.equal(isPrivateRoute("/auth"), false);
  assert.equal(isPrivateRoute("/statement"), false);
});

test("all previously protected routes and their subroutes remain private", () => {
  const previousRoutes = privateRoutes.filter((route) => route !== "/statements");
  for (const route of previousRoutes) {
    assert.equal(isPrivateRoute(route), true, route);
    assert.equal(isPrivateRoute(`${route}/example`), true, `${route}/example`);
  }
});
