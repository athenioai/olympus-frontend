import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import type {
  ChatMessage,
  ChatSession,
  IChatService,
  ListMessagesParams,
  ListSessionsParams,
  PaginatedResponse,
} from "./interfaces/chat-service";

class ChatService implements IChatService {
  /**
   * List chat sessions with optional filtering and pagination.
   * @param params - Optional filters: page, limit, agent
   * @returns Paginated list of chat sessions
   * @throws Error if the request fails
   */
  async listSessions(
    params?: ListSessionsParams,
  ): Promise<PaginatedResponse<ChatSession>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.agent) searchParams.set("agent", params.agent);

    const query = searchParams.toString();
    const path = query ? `/chats?${query}` : "/chats";

    const response = await authFetch(path);
    return unwrapEnvelope<PaginatedResponse<ChatSession>>(response);
  }

  /**
   * Get messages for a specific chat session.
   * @param sessionId - The session ID to fetch messages for
   * @param params - Optional pagination: page, limit
   * @returns Paginated list of chat messages
   * @throws Error if the request fails
   */
  async getMessages(
    sessionId: string,
    params?: ListMessagesParams,
  ): Promise<PaginatedResponse<ChatMessage>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));

    const query = searchParams.toString();
    const path = query
      ? `/chats/${sessionId}/messages?${query}`
      : `/chats/${sessionId}/messages`;

    const response = await authFetch(path);
    return unwrapEnvelope<PaginatedResponse<ChatMessage>>(response);
  }

  /**
   * Delete a chat session by ID.
   * @param sessionId - The session ID to delete
   * @throws Error if the request fails
   */
  async deleteSession(sessionId: string): Promise<void> {
    const response = await authFetch(`/chats/${sessionId}`, {
      method: "DELETE",
    });
    await unwrapEnvelope<unknown>(response);
  }

  /**
   * Send a message to a chat session.
   * @param sessionId - The session ID to send the message to
   * @param message - The message content
   * @throws Error if the request fails
   */
  async sendMessage(sessionId: string, message: string): Promise<void> {
    const response = await authFetch("/chat", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, message }),
    });
    await unwrapEnvelope<unknown>(response);
  }

  /**
   * Activate human handoff for a chat session.
   * @param sessionId - The session ID to activate handoff for
   * @throws Error if the request fails
   */
  async activateHandoff(sessionId: string): Promise<void> {
    const response = await authFetch(`/chats/${sessionId}/handoff`, {
      method: "POST",
    });
    await unwrapEnvelope<unknown>(response);
  }

  /**
   * Deactivate human handoff for a chat session.
   * @param sessionId - The session ID to deactivate handoff for
   * @throws Error if the request fails
   */
  async deactivateHandoff(sessionId: string): Promise<void> {
    const response = await authFetch(`/chats/${sessionId}/handoff`, {
      method: "DELETE",
    });
    await unwrapEnvelope<unknown>(response);
  }
}

export const chatService = new ChatService();
