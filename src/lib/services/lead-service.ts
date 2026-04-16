import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import type {
  BoardColumnCount,
  CreateLeadPayload,
  ILeadService,
  LeadPublic,
  LeadStatus,
  ListLeadsParams,
  PaginatedColumnResponse,
  PaginatedLeadResponse,
  TimelineEntry,
  TimelineParams,
  UpdateLeadPayload,
} from "./interfaces/lead-service";

class LeadService implements ILeadService {
  /**
   * Get board column counters.
   * @returns Array of {status, count} for each kanban column
   * @throws Error if the request fails
   */
  async getBoard(): Promise<BoardColumnCount[]> {
    const response = await authFetch("/leads/board");
    return unwrapEnvelope<BoardColumnCount[]>(response);
  }

  /**
   * Get paginated leads for a specific board column.
   * @param status - The column status to fetch
   * @param params - Optional pagination: page, limit
   * @returns Paginated leads for the column
   * @throws Error if the request fails
   */
  async getColumnLeads(
    status: LeadStatus,
    params?: { page?: number; limit?: number },
  ): Promise<PaginatedColumnResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));

    const query = searchParams.toString();
    const path = query
      ? `/leads/board/${status}?${query}`
      : `/leads/board/${status}`;

    const response = await authFetch(path);
    return unwrapEnvelope<PaginatedColumnResponse>(response);
  }

  /**
   * List leads with optional filtering and pagination.
   * @param params - Optional filters: page, limit, status, search, temperature
   * @returns Paginated list of leads
   * @throws Error if the request fails
   */
  async listLeads(
    params?: ListLeadsParams,
  ): Promise<PaginatedLeadResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.status) searchParams.set("status", params.status);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.temperature) searchParams.set("temperature", params.temperature);

    const query = searchParams.toString();
    const path = query ? `/leads?${query}` : "/leads";

    const response = await authFetch(path);
    return unwrapEnvelope<PaginatedLeadResponse>(response);
  }

  /**
   * Get a single lead by ID.
   * @param id - The lead ID
   * @returns The lead data
   * @throws Error if the lead is not found or request fails
   */
  async getLead(id: string): Promise<LeadPublic> {
    const response = await authFetch(`/leads/${id}`);
    return unwrapEnvelope<LeadPublic>(response);
  }

  /**
   * Create a new lead.
   * @param payload - Lead data to create
   * @returns The created lead
   * @throws Error if validation fails or request fails
   */
  async createLead(payload: CreateLeadPayload): Promise<LeadPublic> {
    const response = await authFetch("/leads", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return unwrapEnvelope<LeadPublic>(response);
  }

  /**
   * Update an existing lead.
   * @param id - The lead ID to update
   * @param payload - Fields to update
   * @returns The updated lead
   * @throws Error if the lead is not found or request fails
   */
  async updateLead(
    id: string,
    payload: UpdateLeadPayload,
  ): Promise<LeadPublic> {
    const response = await authFetch(`/leads/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return unwrapEnvelope<LeadPublic>(response);
  }

  /**
   * Delete a lead by ID.
   * @param id - The lead ID to delete
   * @throws Error if the lead is not found or request fails
   */
  async deleteLead(id: string): Promise<void> {
    const response = await authFetch(`/leads/${id}`, {
      method: "DELETE",
    });
    await unwrapEnvelope<unknown>(response);
  }

  /**
   * Get the timeline of events for a lead.
   * @param id - The lead ID
   * @param params - Optional filters: limit, type
   * @returns List of timeline entries
   * @throws Error if the lead is not found or request fails
   */
  async getTimeline(
    id: string,
    params?: TimelineParams,
  ): Promise<{ data: TimelineEntry[] }> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.type) searchParams.set("type", params.type);

    const query = searchParams.toString();
    const path = query
      ? `/leads/${id}/timeline?${query}`
      : `/leads/${id}/timeline`;

    const response = await authFetch(path);
    return unwrapEnvelope<{ data: TimelineEntry[] }>(response);
  }
}

export const leadService = new LeadService();
