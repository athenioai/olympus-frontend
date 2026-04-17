import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import type {
  IChatService,
  ListMessagesParams,
  ListSessionsParams,
  PaginatedMessages,
  PaginatedSessions,
} from "./interfaces/chat-service";

class ChatService implements IChatService {
  async listSessions(
    params?: ListSessionsParams,
  ): Promise<PaginatedSessions> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));

    const query = searchParams.toString();
    const path = query ? `/chats?${query}` : "/chats";

    const response = await authFetch(path);
    return unwrapEnvelope<PaginatedSessions>(response);
  }

  async getMessages(
    sessionId: string,
    params?: ListMessagesParams,
  ): Promise<PaginatedMessages> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));

    const query = searchParams.toString();
    const path = query
      ? `/chats/${sessionId}/messages?${query}`
      : `/chats/${sessionId}/messages`;

    const response = await authFetch(path);
    return unwrapEnvelope<PaginatedMessages>(response);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const response = await authFetch(`/chats/${sessionId}`, {
      method: "DELETE",
    });
    await unwrapEnvelope<unknown>(response);
  }

  async sendMessage(sessionId: string, message: string): Promise<void> {
    const response = await authFetch("/chat", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, message }),
    });
    await unwrapEnvelope<unknown>(response);
  }

  async activateHandoff(sessionId: string): Promise<void> {
    const response = await authFetch(`/chats/${sessionId}/handoff`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    await unwrapEnvelope<unknown>(response);
  }

  async deactivateHandoff(sessionId: string): Promise<void> {
    const response = await authFetch(`/chats/${sessionId}/handoff`, {
      method: "DELETE",
    });
    await unwrapEnvelope<unknown>(response);
  }
}

export const chatService = new ChatService();
