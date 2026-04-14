export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "converted"
  | "lost";

export type TimelineEntryType = "message" | "appointment" | "status_change";

export interface LeadPublic {
  readonly id: string;
  readonly owner_id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly status: LeadStatus;
  readonly metadata: Record<string, unknown>;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface LeadBoard {
  readonly new: LeadPublic[];
  readonly contacted: LeadPublic[];
  readonly qualified: LeadPublic[];
  readonly converted: LeadPublic[];
  readonly lost: LeadPublic[];
}

export interface CreateLeadPayload {
  readonly name: string;
  readonly email: string;
  readonly phone?: string;
  readonly status?: LeadStatus;
  readonly metadata?: Record<string, unknown>;
}

export interface UpdateLeadPayload {
  readonly name?: string;
  readonly email?: string;
  readonly phone?: string | null;
  readonly status?: LeadStatus;
  readonly metadata?: Record<string, unknown> | null;
}

export interface ListLeadsParams {
  readonly page?: number;
  readonly limit?: number;
  readonly status?: LeadStatus;
  readonly search?: string;
}

export interface PaginatedLeadResponse {
  readonly data: LeadPublic[];
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
  };
}

export interface TimelineMessage {
  readonly id: string;
  readonly session_id: string;
  readonly agent: "horos" | "kairos" | "human";
  readonly role: "lead" | "assistant";
  readonly content: string;
  readonly appointment_id: string | null;
  readonly created_at: string;
}

export interface TimelineAppointment {
  readonly id: string;
  readonly session_id: string;
  readonly lead_name: string;
  readonly service_type: string;
  readonly date: string;
  readonly start_time: string;
  readonly end_time: string;
  readonly status: "confirmed" | "cancelled";
  readonly created_at: string;
}

export interface TimelineStatusChange {
  readonly id: string;
  readonly old_status: string;
  readonly new_status: string;
  readonly changed_at: string;
}

export interface TimelineEntry {
  readonly type: TimelineEntryType;
  readonly timestamp: string;
  readonly data: TimelineMessage | TimelineAppointment | TimelineStatusChange;
}

export interface TimelineParams {
  readonly limit?: number;
  readonly type?: TimelineEntryType;
}

export interface ILeadService {
  getBoard(): Promise<LeadBoard>;
  listLeads(params?: ListLeadsParams): Promise<PaginatedLeadResponse>;
  getLead(id: string): Promise<LeadPublic>;
  createLead(payload: CreateLeadPayload): Promise<LeadPublic>;
  updateLead(id: string, payload: UpdateLeadPayload): Promise<LeadPublic>;
  deleteLead(id: string): Promise<void>;
  getTimeline(
    id: string,
    params?: TimelineParams,
  ): Promise<{ data: TimelineEntry[] }>;
}
