"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { chatService } from "@/lib/services";
import type { ChatMessage } from "@/lib/services/interfaces/chat-service";

interface ActionResult {
  readonly success: boolean;
  readonly error?: string;
}

interface MessagesResult {
  readonly success: boolean;
  readonly data?: ChatMessage[];
  readonly page?: number;
  readonly total?: number;
  readonly error?: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Delete a chat session and revalidate the conversations path.
 */
export async function deleteChatSession(
  sessionId: string,
): Promise<ActionResult> {
  if (!UUID_RE.test(sessionId)) {
    return { success: false, error: "Invalid session ID." };
  }

  try {
    await chatService.deleteSession(sessionId);
    revalidatePath("/conversations");
    return { success: true };
  } catch {
    return { success: false, error: "Failed to delete conversation." };
  }
}

/**
 * Load a specific page of messages for pagination (scroll-up loading).
 */
export async function loadMoreMessages(
  sessionId: string,
  page: number,
): Promise<MessagesResult> {
  if (!UUID_RE.test(sessionId)) {
    return { success: false, error: "Invalid session ID." };
  }

  try {
    const result = await chatService.getMessages(sessionId, { page });
    return {
      success: true,
      data: [...result.data].reverse(),
      page: result.page,
      total: result.total,
    };
  } catch {
    return { success: false, error: "Failed to load messages." };
  }
}

/**
 * Send a message to a lead in a chat session.
 */
export async function sendMessageToLead(
  sessionId: string,
  message: string,
): Promise<ActionResult> {
  if (!UUID_RE.test(sessionId)) {
    return { success: false, error: "Invalid session ID." };
  }

  const trimmed = message.trim();
  if (!trimmed) {
    return { success: false, error: "Message cannot be empty." };
  }

  try {
    await chatService.sendMessage(sessionId, trimmed);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to send message." };
  }
}

/**
 * Activate human handoff for a chat session.
 */
export async function activateHandoff(
  sessionId: string,
): Promise<ActionResult> {
  if (!UUID_RE.test(sessionId)) {
    return { success: false, error: "Invalid session ID." };
  }

  try {
    await chatService.activateHandoff(sessionId);
    return { success: true };
  } catch {
    return { success: false, error: "Failed to activate handoff." };
  }
}

/**
 * Deactivate human handoff for a chat session.
 */
export async function deactivateHandoff(
  sessionId: string,
): Promise<ActionResult> {
  if (!UUID_RE.test(sessionId)) {
    return { success: false, error: "Invalid session ID." };
  }

  try {
    await chatService.deactivateHandoff(sessionId);
    return { success: true };
  } catch {
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
