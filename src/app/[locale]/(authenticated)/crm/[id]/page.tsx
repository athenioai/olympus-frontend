import { notFound } from "next/navigation";
import { leadService } from "@/lib/services";
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

  try {
    const [lead, timelineResult] = await Promise.all([
      leadService.getLead(id),
      leadService.getTimeline(id, { limit: 50 }),
    ]);

    return <LeadDetailView lead={lead} timeline={timelineResult.data} />;
  } catch {
    notFound();
  }
}
