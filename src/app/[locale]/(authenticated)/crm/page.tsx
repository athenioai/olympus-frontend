import { redirect } from "next/navigation";
import { leadService } from "@/lib/services";
import type {
  LeadBoardItem,
  LeadStatus,
  LeadTemperature,
  LeadWithLastMessage,
  PaginatedColumnResponse,
} from "@/lib/services/interfaces/lead-service";
import { CrmBoard } from "./_components/crm-board";

const INITIAL_PAGE_SIZE = 20;

const COLUMN_STATUSES: readonly LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
];

const VALID_TEMPERATURES: readonly LeadTemperature[] = ["cold", "warm", "hot"];

export type InitialColumns = Record<LeadStatus, PaginatedColumnResponse>;

export interface CrmFilters {
  readonly search?: string;
  readonly temperature?: LeadTemperature;
}

interface CrmPageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parseTemperature(
  value: string | string[] | undefined,
): LeadTemperature | undefined {
  if (typeof value !== "string") return undefined;
  return VALID_TEMPERATURES.includes(value as LeadTemperature)
    ? (value as LeadTemperature)
    : undefined;
}

function parseSearch(value: string | string[] | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toBoardItem(lead: LeadWithLastMessage): LeadBoardItem {
  return {
    ...lead,
    metadata: lead.metadata,
    deletedAt: null,
    avatarUrl: lead.avatarUrl,
    lastMessage: lead.lastMessage,
    tags: lead.tags,
    customFields: [],
  };
}

/**
 * CRM Kanban board page.
 * Fetches all 5 columns in parallel server-side, honoring global filters
 * (search, temperature) from URL search params.
 */
export default async function CrmPage({ searchParams }: CrmPageProps) {
  const params = await searchParams;
  const filters: CrmFilters = {
    search: parseSearch(params.search),
    temperature: parseTemperature(params.temperature),
  };

  const hasFilters = Boolean(filters.search || filters.temperature);

  try {
    const columns = await Promise.all(
      COLUMN_STATUSES.map((status) =>
        hasFilters
          ? leadService
              .listLeads({
                status,
                search: filters.search,
                temperature: filters.temperature,
                page: 1,
                limit: INITIAL_PAGE_SIZE,
              })
              .then((r) => ({
                items: r.items.map(toBoardItem),
                total: r.total,
                page: r.page,
                limit: r.limit,
              }))
          : leadService.getColumnLeads(status, { page: 1, limit: INITIAL_PAGE_SIZE }),
      ),
    );

    const initialColumns = COLUMN_STATUSES.reduce<Partial<InitialColumns>>(
      (acc, status, idx) => {
        acc[status] = columns[idx];
        return acc;
      },
      {},
    ) as InitialColumns;

    const initialCounters = COLUMN_STATUSES.map((status, idx) => ({
      status,
      count: columns[idx]!.total,
    }));

    const filterKey = `${filters.search ?? ""}|${filters.temperature ?? ""}`;

    return (
      <CrmBoard
        key={filterKey}
        filters={filters}
        initialColumns={initialColumns}
        initialCounters={initialCounters}
      />
    );
  } catch {
    redirect("/dashboard");
  }
}
