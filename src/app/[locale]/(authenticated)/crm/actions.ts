"use server";

import { revalidatePath } from "next/cache";
import { leadService } from "@/lib/services";
import { counter } from "@/lib/observability/sentry-metrics";
import type {
  BoardColumnCount,
  LeadBoardItem,
  LeadPublic,
  LeadStatus,
  LeadTemperature,
  PaginatedColumnResponse,
  TimelineEntry,
  TimelineEntryType,
} from "@/lib/services/interfaces/lead-service";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LEN = 255;
const MAX_EMAIL_LEN = 320;
const MAX_PHONE_LEN = 50;

const VALID_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
];

const VALID_TEMPERATURES: LeadTemperature[] = ["cold", "warm", "hot"];

const VALID_TIMELINE_TYPES: TimelineEntryType[] = [
  "message",
  "status_change",
];

function isValidId(id: unknown): id is string {
  return typeof id === "string" && UUID_RE.test(id);
}

function isValidStatus(s: unknown): s is LeadStatus {
  return typeof s === "string" && VALID_STATUSES.includes(s as LeadStatus);
}

function isValidTemperature(v: unknown): v is LeadTemperature {
  return typeof v === "string" && VALID_TEMPERATURES.includes(v as LeadTemperature);
}

/**
 * Upgrade a bare LeadPublic (returned by GET /leads when filters are applied)
 * into a LeadBoardItem with null/empty enrichment. The board card renders
 * gracefully when enrichment is absent.
 */
function toBoardItem(lead: LeadPublic): LeadBoardItem {
  return {
    ...lead,
    avatarUrl: null,
    lastMessage: null,
    tags: [],
    customFields: [],
  };
}

function isValidTimelineType(t: unknown): t is TimelineEntryType {
  return (
    typeof t === "string" &&
    VALID_TIMELINE_TYPES.includes(t as TimelineEntryType)
  );
}

const SAFE_ERRORS: Record<string, string> = {
  NOT_FOUND: "Lead nao encontrado.",
  CONFLICT: "Ja existe um lead com este email.",
  FORBIDDEN: "Voce nao tem permissao para acessar este lead.",
};

function safeError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message in SAFE_ERRORS) {
    return SAFE_ERRORS[error.message];
  }
  return fallback;
}

/**
 * Fetch board column counters.
 * @returns Array of {status, count} or error
 */
export async function fetchBoard(): Promise<{
  success: boolean;
  data?: BoardColumnCount[];
  error?: string;
}> {
  try {
    const data = await leadService.getBoard();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: safeError(error, "Erro ao carregar o board."),
    };
  }
}

/**
 * Fetch paginated leads for a specific board column, optionally applying
 * global filters (search, temperature).
 * @param status - The column status
 * @param page - Page number (default 1)
 * @param limit - Items per page (default 20)
 * @param filters - Optional global filters
 * @returns Paginated leads or error
 */
export async function fetchColumnLeads(
  status: LeadStatus,
  page = 1,
  limit = 20,
  filters?: { search?: string; temperature?: string },
): Promise<{
  success: boolean;
  data?: PaginatedColumnResponse;
  error?: string;
}> {
  if (!isValidStatus(status)) {
    return { success: false, error: "Status invalido." };
  }

  const search = filters?.search?.trim() || undefined;
  const temperature = isValidTemperature(filters?.temperature) ? filters.temperature : undefined;
  const hasFilters = Boolean(search || temperature);

  try {
    if (hasFilters) {
      const r = await leadService.listLeads({
        status,
        search,
        temperature,
        page,
        limit,
      });
      return {
        success: true,
        data: {
          data: r.data.map(toBoardItem),
          total: r.total,
          page: r.page,
          limit: r.limit,
        },
      };
    }
    const data = await leadService.getColumnLeads(status, { page, limit });
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: safeError(error, "Erro ao carregar leads."),
    };
  }
}

/**
 * Create a new lead with validation.
 * @param name - Lead name (1-255 chars)
 * @param email - Valid email address
 * @param phone - Optional phone (max 50 chars)
 * @returns Created lead or validation/server error
 */
export async function createLead(
  name: string,
  email: string,
  phone?: string,
): Promise<{ success: boolean; data?: LeadPublic; error?: string }> {
  const emit = (
    result: "success" | "validation_error" | "conflict" | "error",
  ): void => {
    counter("lead.created", 1, { attributes: { result } });
  };

  if (typeof name !== "string" || !name.trim()) {
    emit("validation_error");
    return { success: false, error: "Nome e obrigatorio." };
  }
  if (name.trim().length > MAX_NAME_LEN) {
    emit("validation_error");
    return {
      success: false,
      error: "Nome deve ter no maximo 255 caracteres.",
    };
  }

  if (typeof email !== "string" || !email.trim()) {
    emit("validation_error");
    return { success: false, error: "Email e obrigatorio." };
  }
  if (email.trim().length > MAX_EMAIL_LEN) {
    emit("validation_error");
    return {
      success: false,
      error: "Email deve ter no maximo 320 caracteres.",
    };
  }
  if (!EMAIL_RE.test(email.trim())) {
    emit("validation_error");
    return { success: false, error: "Email invalido." };
  }

  if (
    phone !== undefined &&
    typeof phone === "string" &&
    phone.length > MAX_PHONE_LEN
  ) {
    emit("validation_error");
    return {
      success: false,
      error: "Telefone deve ter no maximo 50 caracteres.",
    };
  }

  try {
    const data = await leadService.createLead({
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || undefined,
    });
    revalidatePath("/crm");
    emit("success");
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    emit(message === "CONFLICT" ? "conflict" : "error");
    return {
      success: false,
      error: safeError(error, "Erro ao criar lead."),
    };
  }
}

/**
 * Update a lead's status (used for drag-and-drop).
 * @param id - UUID of the lead
 * @param status - Target LeadStatus
 * @returns Updated lead or error
 */
export async function updateLeadStatus(
  id: string,
  status: LeadStatus,
): Promise<{ success: boolean; data?: LeadPublic; error?: string }> {
  if (!isValidId(id)) return { success: false, error: "ID invalido." };
  if (!isValidStatus(status))
    return { success: false, error: "Status invalido." };

  try {
    const data = await leadService.updateLead(id, { status });
    revalidatePath("/crm");
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: safeError(error, "Erro ao mover lead."),
    };
  }
}

/**
 * Delete a lead by ID.
 * @param id - UUID of the lead
 * @returns Success or error
 */
export async function deleteLead(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  if (!isValidId(id)) return { success: false, error: "ID invalido." };

  try {
    await leadService.deleteLead(id);
    revalidatePath("/crm");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: safeError(error, "Erro ao deletar lead."),
    };
  }
}

/**
 * Quick search used by the global command palette.
 * Trimmed query; returns up to `limit` leads matching the search string.
 * @param query - Free-form search string (name/email/phone)
 * @param limit - Max results (default 8)
 */
export async function searchLeadsQuick(
  query: string,
  limit = 8,
): Promise<{ success: boolean; data?: LeadPublic[]; error?: string }> {
  const q = typeof query === "string" ? query.trim() : "";
  if (q.length === 0) return { success: true, data: [] };

  if (!Number.isInteger(limit) || limit < 1 || limit > 20) {
    return { success: false, error: "Limite invalido." };
  }

  try {
    const r = await leadService.listLeads({ search: q, limit });
    return { success: true, data: r.data };
  } catch (error) {
    return {
      success: false,
      error: safeError(error, "Erro ao buscar leads."),
    };
  }
}

/**
 * Fetch the timeline entries for a lead.
 * @param id - UUID of the lead
 * @param limit - Max entries to return (1-200)
 * @param type - Optional filter by entry type
 * @returns Timeline entries or error
 */
export async function fetchTimeline(
  id: string,
  limit?: number,
  type?: TimelineEntryType,
): Promise<{ success: boolean; data?: TimelineEntry[]; error?: string }> {
  if (!isValidId(id)) return { success: false, error: "ID invalido." };

  if (limit !== undefined) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
      return {
        success: false,
        error: "Limite deve ser entre 1 e 200.",
      };
    }
  }

  if (type !== undefined && !isValidTimelineType(type)) {
    return { success: false, error: "Tipo de timeline invalido." };
  }

  try {
    const data = await leadService.getTimeline(id, { limit, type });
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: safeError(error, "Erro ao carregar timeline."),
    };
  }
}
