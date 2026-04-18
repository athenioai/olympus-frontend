import { notFound } from "next/navigation";
import { leadService } from "@/lib/services";
import type {
  LeadPublic,
  TimelineEntry,
} from "@/lib/services/interfaces/lead-service";
import { LeadDetailView } from "./_components/lead-detail-view";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface LeadPageProps {
  readonly params: Promise<{ id: string }>;
}

/**
 * Lead detail page with timeline.
 * Validates the UUID param, fetches lead and timeline in parallel.
 */
export default async function LeadPage({ params }: LeadPageProps) {
  const { id } = await params;

  if (!UUID_RE.test(id)) notFound();

  let lead: LeadPublic;
  try {
    lead = await leadService.getLead(id);
  } catch (err) {
    console.error("[leads/[id]] getLead failed:", err);
    notFound();
  }

  let timeline: TimelineEntry[];
  try {
    timeline = await leadService.getTimeline(id, { limit: 50 });
  } catch (err) {
    console.error("[leads/[id]] getTimeline failed:", err);
    timeline = [];
  }

  return <LeadDetailView lead={lead} timeline={timeline} />;
}
