export interface ChatSession {
  readonly sessionId: string;
  readonly agent: string;
  readonly channel: string | null;
  readonly leadName: string | null;
  readonly handoff: boolean;
  readonly lastMessage: string;
  readonly lastRole: "lead" | "assistant";
  readonly messageCount: number;
  readonly startedAt: string;
  readonly lastMessageAt: string;
}

export interface ChatMessage {
  readonly id: string;
  readonly sessionId: string;
  readonly agent: string;
  readonly role: "lead" | "assistant";
  readonly content: string;
  readonly appointmentId: string | null;
  readonly createdAt: string;
}

export interface Pagination {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
}

export interface PaginatedResponse<T> {
  readonly data: T[];
  readonly pagination: Pagination;
}

export interface ListSessionsParams {
  readonly page?: number;
  readonly limit?: number;
  readonly agent?: string;
}

export interface ListMessagesParams {
  readonly page?: number;
  readonly limit?: number;
}

export interface IChatService {
  listSessions(
    params?: ListSessionsParams,
  ): Promise<PaginatedResponse<ChatSession>>;
  getMessages(
    sessionId: string,
    params?: ListMessagesParams,
  ): Promise<PaginatedResponse<ChatMessage>>;
  deleteSession(sessionId: string): Promise<void>;
  sendMessage(sessionId: string, message: string): Promise<void>;
  activateHandoff(sessionId: string): Promise<void>;
  deactivateHandoff(sessionId: string): Promise<void>;
}
