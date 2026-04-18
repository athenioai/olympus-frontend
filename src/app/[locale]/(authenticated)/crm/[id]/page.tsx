import { permanentRedirect } from "next/navigation";

interface LegacyLeadPageProps {
  readonly params: Promise<{ id: string }>;
}

/**
 * Legacy route — the canonical lead detail page is now /leads/[id].
 * Permanently redirects (308) so bookmarks and cached links keep working.
 */
export default async function LegacyLeadPage({ params }: LegacyLeadPageProps) {
  const { id } = await params;
  permanentRedirect(`/leads/${id}`);
}
