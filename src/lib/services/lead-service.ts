import { authFetch } from "./auth-fetch";
import type {
  CreateLeadPayload,
  ILeadService,
  LeadBoard,
  LeadPublic,
  ListLeadsParams,
  PaginatedLeadResponse,
  TimelineEntry,
  TimelineParams,
  UpdateLeadPayload,
} from "./interfaces/lead-service";

class LeadService implements ILeadService {
  /**
   * Get the Kanban board with leads grouped by status.
   * @returns Board with leads organized by status columns
   * @throws Error if the request fails
   */
  async getBoard(): Promise<LeadBoard> {
    const response = await authFetch("/leads/board");

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message ?? "Failed to fetch lead board",
      );
    }

    return response.json();
  }

  /**
   * List leads with optional filtering and pagination.
   * @param params - Optional filters: page, limit, status, search
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

    const query = searchParams.toString();
    const path = query ? `/leads?${query}` : "/leads";

    const response = await authFetch(path);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message ?? "Failed to list leads",
      );
    }

    return response.json();
  }

  /**
   * Get a single lead by ID.
   * @param id - The lead ID
   * @returns The lead data
   * @throws Error if the lead is not found or request fails
   */
  async getLead(id: string): Promise<LeadPublic> {
    const response = await authFetch(`/leads/${id}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message ?? "Failed to fetch lead",
      );
    }

    return response.json();
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message ?? "Failed to create lead",
      );
    }

    return response.json();
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message ?? "Failed to update lead",
      );
    }

    return response.json();
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message ?? "Failed to delete lead",
      );
    }
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message ?? "Failed to fetch lead timeline",
      );
    }

    return response.json();
  }
}

export const leadService = new LeadService();
