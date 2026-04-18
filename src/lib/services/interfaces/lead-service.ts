export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "converted"
  | "lost";

export type LeadTemperature = "cold" | "warm" | "hot";

export type LeadChannel = "whatsapp" | "telegram" | null;

export type TimelineEntryType = "message" | "status_change";

export interface LeadPublic {
  readonly id: string;
  readonly ownerId: string;
  readonly name: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly contactId: string | null;
  readonly channel: LeadChannel;
  readonly status: LeadStatus;
  readonly temperature: LeadTemperature;
  readonly nameConfirmed: boolean;
  readonly metadata: Record<string, unknown> | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deletedAt: null;
}

export interface BoardColumnCount {
  readonly status: LeadStatus;
  readonly count: number;
}

export type LeadCustomFieldType =
  | "text"
  | "number"
  | "date"
  | "select"
  | "boolean";

export interface LeadTag {
  readonly id: string;
  readonly name: string;
  /** Hex color string like "#F59E0B". */
  readonly color: string;
}

export interface LeadLastMessage {
  readonly content: string;
  /** Collapsed sender: branded agent name, "lead", "user" or "system". */
  readonly sender: string;
  readonly createdAt: string;
}

export interface LeadCustomFieldValue {
  readonly fieldId: string;
  readonly name: string;
  readonly fieldType: LeadCustomFieldType;
  /** Raw string value; null-valued entries are filtered out by the backend. */
  readonly value: string | null;
}

/**
 * Enriched lead item returned by GET /leads/board/:status.
 * Extends LeadPublic with projection fields used exclusively by the Kanban board.
 */
export interface LeadBoardItem extends LeadPublic {
  readonly avatarUrl: string | null;
  readonly lastMessage: LeadLastMessage | null;
  readonly tags: ReadonlyArray<LeadTag>;
  readonly customFields: ReadonlyArray<LeadCustomFieldValue>;
}

export interface PaginatedColumnResponse {
  readonly data: LeadBoardItem[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface CreateLeadPayload {
  readonly name: string;
  readonly email?: string;
  readonly phone?: string;
  readonly status?: LeadStatus;
  readonly metadata?: Record<string, unknown>;
}

export interface UpdateLeadPayload {
  readonly name?: string;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly status?: LeadStatus;
  readonly temperature?: LeadTemperature;
  readonly metadata?: Record<string, unknown> | null;
}

export interface ListLeadsParams {
  readonly page?: number;
  readonly limit?: number;
  readonly status?: LeadStatus;
  readonly search?: string;
  readonly temperature?: LeadTemperature;
}

export interface PaginatedLeadResponse {
  readonly data: LeadPublic[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface TimelineMessage {
  readonly id: string;
  readonly chatId: string;
  readonly sender: string;
  readonly content: string;
  readonly createdAt: string;
  readonly deletedAt?: string | null;
}

export interface TimelineStatusChange {
  readonly id: string;
  readonly oldStatus: string | null;
  readonly newStatus: string;
  readonly changedBy: string | null;
  readonly createdAt: string;
}

export interface TimelineEntry {
  readonly type: TimelineEntryType;
  readonly createdAt: string;
  readonly data: TimelineMessage | TimelineStatusChange;
}

export interface TimelineParams {
  readonly limit?: number;
  readonly type?: TimelineEntryType;
}

export interface ILeadService {
  getBoard(): Promise<BoardColumnCount[]>;
  getColumnLeads(
    status: LeadStatus,
    params?: { page?: number; limit?: number },
  ): Promise<PaginatedColumnResponse>;
  listLeads(params?: ListLeadsParams): Promise<PaginatedLeadResponse>;
  getLead(id: string): Promise<LeadPublic>;
  createLead(payload: CreateLeadPayload): Promise<LeadPublic>;
  updateLead(id: string, payload: UpdateLeadPayload): Promise<LeadPublic>;
  deleteLead(id: string): Promise<void>;
  getTimeline(
    id: string,
    params?: TimelineParams,
  ): Promise<TimelineEntry[]>;
}
