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

const VALID_CHANNELS = ["whatsapp", "telegram"] as const;
type LeadFilterChannel = (typeof VALID_CHANNELS)[number];

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface LeadsPageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parseStatus(
  value: string | string[] | undefined,
): LeadStatus | undefined {
  if (typeof value !== "string") return undefined;
  return VALID_STATUSES.includes(value as LeadStatus)
    ? (value as LeadStatus)
    : undefined;
}

function parseTemperature(
  value: string | string[] | undefined,
): LeadTemperature | undefined {
  if (typeof value !== "string") return undefined;
  return VALID_TEMPERATURES.includes(value as LeadTemperature)
    ? (value as LeadTemperature)
    : undefined;
}

function parseChannel(
  value: string | string[] | undefined,
): LeadFilterChannel | undefined {
  if (typeof value !== "string") return undefined;
  return VALID_CHANNELS.includes(value as LeadFilterChannel)
    ? (value as LeadFilterChannel)
    : undefined;
}

function parseBool(
  value: string | string[] | undefined,
): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function parseDate(value: string | string[] | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  return ISO_DATE_RE.test(value) ? value : undefined;
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
  const channel = parseChannel(params.channel);
  const nameConfirmed = parseBool(params.nameConfirmed);
  const hasEmail = parseBool(params.hasEmail);
  const hasPhone = parseBool(params.hasPhone);
  const createdAfter = parseDate(params.createdAfter);
  const createdBefore = parseDate(params.createdBefore);
  const page = parsePage(params.page);

  let result: PaginatedLeadResponse;
  try {
    result = await leadService.listLeads({
      search,
      status,
      temperature,
      channel,
      nameConfirmed,
      hasEmail,
      hasPhone,
      createdAfter,
      createdBefore,
      page,
      limit: LIMIT,
    });
  } catch {
    result = { items: [], total: 0, page, limit: LIMIT };
  }

  return (
    <LeadsList
      filters={{
        search,
        status,
        temperature,
        channel,
        nameConfirmed,
        hasEmail,
        hasPhone,
        createdAfter,
        createdBefore,
      }}
      page={page}
      result={result}
    />
  );
}
