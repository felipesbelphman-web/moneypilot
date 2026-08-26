import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const code = searchParams.get("code");
  const flowId = searchParams.get("sb_flow_id");

  const redirectTo = request.nextUrl.clone();
  redirectTo.search = "";

  if (code) {
    const supabase = await createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined,
    );

    if (!error) {
      redirectTo.pathname = "/dashboard";

      return NextResponse.redirect(redirectTo);
    }
  }

  redirectTo.pathname = "/auth";
  redirectTo.searchParams.set("mode", "login");
  redirectTo.searchParams.set("error", "email-confirmation-failed");

  return NextResponse.redirect(redirectTo);
}