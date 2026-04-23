"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { chatService } from "@/lib/services";
import { ApiError } from "@/lib/api-envelope";
import { captureUnexpected } from "@/lib/observability/capture";
import type { ChatMessage } from "@/lib/services/interfaces/chat-service";

interface ActionResult {
  readonly success: boolean;
  readonly error?: string;
}

interface MessagesResult {
  readonly success: boolean;
  readonly data?: ChatMessage[];
  readonly nextCursor?: string | null;
  readonly hasMore?: boolean;
  readonly error?: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Delete a chat session and revalidate the conversations path.
 */
export async function deleteChatSession(
  chatId: string,
): Promise<ActionResult> {
  if (!UUID_RE.test(chatId)) {
    return { success: false, error: "Invalid chat ID." };
  }

  try {
    await chatService.deleteSession(chatId);
    revalidatePath("/conversations");
    return { success: true };
  } catch (err) {
    captureUnexpected(err);
    return { success: false, error: "Failed to delete conversation." };
  }
}

/**
 * Load older messages using cursor-based pagination. Pass the nextCursor
 * returned by the previous page (or omit for the very first page).
 */
export async function loadMoreMessages(
  chatId: string,
  beforeCursor?: string,
): Promise<MessagesResult> {
  if (!UUID_RE.test(chatId)) {
    return { success: false, error: "Invalid chat ID." };
  }

  try {
    const result = await chatService.getMessages(chatId, {
      limit: 50,
      ...(beforeCursor ? { before: beforeCursor } : {}),
    });
    return {
      success: true,
      data: [...result.items].reverse(),
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  } catch (err) {
    captureUnexpected(err);
    return { success: false, error: "Failed to load messages." };
  }
}

/**
 * Send a message to a lead in a chat session.
 */
export async function sendMessageToLead(
  chatId: string,
  message: string,
): Promise<ActionResult> {
  if (!UUID_RE.test(chatId)) {
    return { success: false, error: "Invalid chat ID." };
  }

  const trimmed = message.trim();
  if (!trimmed) {
    return { success: false, error: "Message cannot be empty." };
  }

  try {
    await chatService.sendMessage(chatId, trimmed);
    return { success: true };
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.code === "CHAT_SESSION_NOT_FOUND_001") {
        return { success: false, error: "Sessão de chat não encontrada." };
      }
      if (err.status === 429) {
        return {
          success: false,
          error: "Muitas mensagens em pouco tempo. Aguarde um momento.",
        };
      }
      if (err.status === 401) {
        return { success: false, error: "Sessão expirada. Faça login novamente." };
      }
    }
    captureUnexpected(err);
    return { success: false, error: "Falha ao enviar mensagem." };
  }
}

/**
 * Activate human handoff for a chat session.
 */
export async function activateHandoff(
  chatId: string,
): Promise<ActionResult> {
  if (!UUID_RE.test(chatId)) {
    return { success: false, error: "Invalid chat ID." };
  }

  try {
    await chatService.activateHandoff(chatId);
    return { success: true };
  } catch (err) {
    captureUnexpected(err);
    return { success: false, error: "Failed to activate handoff." };
  }
}

/**
 * Deactivate human handoff for a chat session.
 */
export async function deactivateHandoff(
  chatId: string,
): Promise<ActionResult> {
  if (!UUID_RE.test(chatId)) {
    return { success: false, error: "Invalid chat ID." };
  }

  try {
    await chatService.deactivateHandoff(chatId);
    return { success: true };
  } catch (err) {
    captureUnexpected(err);
    return { success: false, error: "Failed to deactivate handoff." };
  }
}

/**
 * Retrieve the access token from cookies for WebSocket authentication.
 */
export async function getWsToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("access_token")?.value ?? null;
}
