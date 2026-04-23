import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import type {
  ChatMessagesCursorPage,
  GetMessagesParams,
  IChatService,
  ListSessionsParams,
  PaginatedSessions,
} from "./interfaces/chat-service";

class ChatService implements IChatService {
  async listSessions(
    params?: ListSessionsParams,
  ): Promise<PaginatedSessions> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.search) searchParams.set("search", params.search);
    if (params?.handoff !== undefined) {
      searchParams.set("handoff", String(params.handoff));
    }
    if (params?.channel) searchParams.set("channel", params.channel);
    if (params?.leadStatus) searchParams.set("leadStatus", params.leadStatus);
    if (params?.createdAfter) {
      searchParams.set("createdAfter", params.createdAfter);
    }
    if (params?.createdBefore) {
      searchParams.set("createdBefore", params.createdBefore);
    }

    const query = searchParams.toString();
    const path = query ? `/chats?${query}` : "/chats";

    const response = await authFetch(path);
    return unwrapEnvelope<PaginatedSessions>(response);
  }

  async getMessages(
    chatId: string,
    params?: GetMessagesParams,
  ): Promise<ChatMessagesCursorPage> {
    const searchParams = new URLSearchParams();
    if (params?.before) searchParams.set("before", params.before);
    if (params?.limit) searchParams.set("limit", String(params.limit));

    const query = searchParams.toString();
    const path = query
      ? `/chats/${chatId}/messages?${query}`
      : `/chats/${chatId}/messages`;

    const response = await authFetch(path);
    return unwrapEnvelope<ChatMessagesCursorPage>(response);
  }

  async deleteSession(chatId: string): Promise<void> {
    const response = await authFetch(`/chats/${chatId}`, {
      method: "DELETE",
    });
    await unwrapEnvelope<unknown>(response);
  }

  async sendMessage(chatId: string, message: string): Promise<void> {
    const response = await authFetch("/chats", {
      method: "POST",
      body: JSON.stringify({ chatId: chatId, message }),
    });
    await unwrapEnvelope<unknown>(response);
  }

  async activateHandoff(chatId: string): Promise<void> {
    const response = await authFetch(`/chats/${chatId}/handoff`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    await unwrapEnvelope<unknown>(response);
  }

  async deactivateHandoff(chatId: string): Promise<void> {
    const response = await authFetch(`/chats/${chatId}/handoff`, {
      method: "DELETE",
    });
    await unwrapEnvelope<unknown>(response);
  }
}

export const chatService = new ChatService();
