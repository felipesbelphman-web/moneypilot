import { NextResponse } from "next/server";

import { runMoneyPilotAssistant } from "@/ai/gateway";
import {
  parseAiChatRequest,
  type AiChatErrorResponse,
  type AiChatSuccessResponse,
} from "@/ai/contracts";
import { getOptionalCurrentAccount } from "@/lib/auth/profile";

export const runtime = "nodejs";

const unauthorizedResponse: AiChatErrorResponse = {
  success: false,
  error: "Authentication required.",
};

export async function POST(request: Request) {
  let account;
  try {
    account = await getOptionalCurrentAccount();
  } catch {
    return NextResponse.json<AiChatErrorResponse>(
      { success: false, error: "Unable to process AI request." },
      { status: 503 },
    );
  }

  if (!account) {
    return NextResponse.json(unauthorizedResponse, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<AiChatErrorResponse>(
      { success: false, error: "Invalid request payload." },
      { status: 400 },
    );
  }

  const input = parseAiChatRequest(body);
  if (!input) {
    return NextResponse.json<AiChatErrorResponse>(
      { success: false, error: "Invalid request payload." },
      { status: 400 },
    );
  }

  try {
    const message = await runMoneyPilotAssistant(input.message, account.profile.id);
    const response: AiChatSuccessResponse = { success: true, message };
    return NextResponse.json(response);
  } catch {
    return NextResponse.json<AiChatErrorResponse>(
      { success: false, error: "Unable to process AI request." },
      { status: 503 },
    );
  }
}