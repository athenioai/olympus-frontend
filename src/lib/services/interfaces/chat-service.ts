export interface ChatSessionLead {
  readonly id: string;
  readonly name: string;
  readonly phone: string | null;
  readonly channel: string | null;
  readonly status: string;
  readonly temperature: string;
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
  readonly data: ChatSession[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface PaginatedMessages {
  readonly data: ChatMessage[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface ListSessionsParams {
  readonly page?: number;
  readonly limit?: number;
}

export interface ListMessagesParams {
  readonly page?: number;
  readonly limit?: number;
}

export interface IChatService {
  listSessions(
    params?: ListSessionsParams,
  ): Promise<PaginatedSessions>;
  getMessages(
    sessionId: string,
    params?: ListMessagesParams,
  ): Promise<PaginatedMessages>;
  deleteSession(sessionId: string): Promise<void>;
  sendMessage(sessionId: string, message: string): Promise<void>;
  activateHandoff(sessionId: string): Promise<void>;
  deactivateHandoff(sessionId: string): Promise<void>;
}
