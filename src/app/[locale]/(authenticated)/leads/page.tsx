import { leadService } from "@/lib/services";
import type {
  LeadStatus,
  LeadTemperature,
  PaginatedLeadResponse,
} from "@/lib/services/interfaces/lead-service";
import { LeadsList } from "./_components/leads-list";

const LIMIT = 20;

const VALID_STATUSES: readonly LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
];

const VALID_TEMPERATURES: readonly LeadTemperature[] = ["cold", "warm", "hot"];

interface LeadsPageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parseStatus(value: string | string[] | undefined): LeadStatus | undefined {
  if (typeof value !== "string") return undefined;
  return VALID_STATUSES.includes(value as LeadStatus) ? (value as LeadStatus) : undefined;
}

function parseTemperature(
  value: string | string[] | undefined,
): LeadTemperature | undefined {
  if (typeof value !== "string") return undefined;
  return VALID_TEMPERATURES.includes(value as LeadTemperature)
    ? (value as LeadTemperature)
    : undefined;
}

function parsePage(value: string | string[] | undefined): number {
  if (typeof value !== "string") return 1;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

function parseSearch(value: string | string[] | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Leads list page — server-rendered table with search, status/temperature filters,
 * and pagination. All query state lives in URL search params so navigation and
 * router cache work naturally.
 */
export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const params = await searchParams;
  const search = parseSearch(params.search);
  const status = parseStatus(params.status);
  const temperature = parseTemperature(params.temperature);
  const page = parsePage(params.page);

  let result: PaginatedLeadResponse;
  try {
    result = await leadService.listLeads({
      search,
      status,
      temperature,
      page,
      limit: LIMIT,
    });
  } catch {
    result = { data: [], total: 0, page, limit: LIMIT };
  }

  return (
    <LeadsList
      filters={{ search, status, temperature }}
      page={page}
      result={result}
    />
  );
}
