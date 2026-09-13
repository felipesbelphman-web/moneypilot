export type AiChatRequest = {
  message: string;
};

export type AiChatSuccessResponse = {
  success: true;
  message: string;
};

export type AiChatErrorResponse = {
  success: false;
  error: string;
};

export type AiChatResponse = AiChatSuccessResponse | AiChatErrorResponse;

export const AI_CHAT_MAX_MESSAGE_LENGTH = 4_000;

export function parseAiChatRequest(value: unknown): AiChatRequest | null {
  if (typeof value !== "object" || value === null || !("message" in value)) {
    return null;
  }

  const message = value.message;
  if (typeof message !== "string") {
    return null;
  }

  const normalizedMessage = message.trim();
  if (!normalizedMessage || normalizedMessage.length > AI_CHAT_MAX_MESSAGE_LENGTH) {
    return null;
  }

  return { message: normalizedMessage };
}