import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });

          Object.entries(headers).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();

const isAuthenticated = Boolean(data?.claims?.sub);

const privateRoutes = [
  "/dashboard",
  "/transactions",
  "/budgets",
  "/insights",
  "/goals",
  "/investments",
  "/settings",
  "/categories",
];

const isPrivateRoute = privateRoutes.some(
  (route) =>
    request.nextUrl.pathname === route ||
    request.nextUrl.pathname.startsWith(`${route}/`),
);

if (isPrivateRoute && !isAuthenticated) {
  const redirectUrl = request.nextUrl.clone();

  redirectUrl.pathname = "/auth";
  redirectUrl.searchParams.set("mode", "login");

  return NextResponse.redirect(redirectUrl);
}

return supabaseResponse;
}