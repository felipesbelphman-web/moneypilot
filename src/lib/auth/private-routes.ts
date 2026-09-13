export const privateRoutes = [
  "/dashboard",
  "/transactions",
  "/budgets",
  "/insights",
  "/goals",
  "/investments",
  "/settings",
  "/categories",
  "/statements",
] as const;

export function isPrivateRoute(pathname: string): boolean {
  return privateRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
