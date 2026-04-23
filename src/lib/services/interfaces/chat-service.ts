export interface ChatSessionLead {
  readonly id: string;
  readonly name: string;
  readonly phone: string | null;
  readonly channel: string | null;
  readonly status: string;
  readonly temperature: string;
  /** Optional — backend may or may not expose it; falls back to initials. */
  readonly avatarUrl?: string | null;
}

export interface ChatSessionLastMessage {
  readonly content: string;
  readonly sender: string;
  readonly createdAt: string;
}

export interface ChatSession {
  readonly id: string;
  readonly handoff: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lead: ChatSessionLead;
  readonly lastMessage: ChatSessionLastMessage | null;
}

export interface ChatMessage {
  readonly id: string;
  readonly chatId: string;
  readonly sender: string;
  readonly content: string;
  readonly createdAt: string;
  readonly deletedAt: string | null;
}

export interface PaginatedSessions {
  readonly items: ChatSession[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

/**
 * Cursor-paginated message page. `items` comes ordered by createdAt DESC
 * (newest first). `nextCursor` is the ISO datetime of the oldest message
 * on this page — pass it back as `before` to load older messages. `null`
 * when there is nothing older.
 */
export interface ChatMessagesCursorPage {
  readonly items: ChatMessage[];
  readonly nextCursor: string | null;
  readonly hasMore: boolean;
}

export type ChatChannelFilter = "whatsapp" | "telegram";

export type LeadStatusFilter =
  | "new"
  | "contacted"
  | "qualified"
  | "converted"
  | "lost";

export interface ListSessionsParams {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
  readonly handoff?: boolean;
  readonly channel?: ChatChannelFilter;
  readonly leadStatus?: LeadStatusFilter;
  /** YYYY-MM-DD — chat created on or after this date. */
  readonly createdAfter?: string;
  /** YYYY-MM-DD — chat created on or before this date. */
  readonly createdBefore?: string;
}

export interface GetMessagesParams {
  /** ISO 8601 timestamp — returns messages strictly older than this instant. */
  readonly before?: string;
  readonly limit?: number;
}

export interface IChatService {
  listSessions(
    params?: ListSessionsParams,
  ): Promise<PaginatedSessions>;
  getMessages(
    chatId: string,
    params?: GetMessagesParams,
  ): Promise<ChatMessagesCursorPage>;
  deleteSession(chatId: string): Promise<void>;
  sendMessage(chatId: string, message: string): Promise<void>;
  activateHandoff(chatId: string): Promise<void>;
  deactivateHandoff(chatId: string): Promise<void>;
}
