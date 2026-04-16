import { redirect } from "next/navigation";
import { leadService } from "@/lib/services";
import { CrmBoard } from "./_components/crm-board";

/**
 * CRM Kanban board page.
 * Fetches board counters server-side and passes them to the interactive client component.
 */
export default async function CrmPage() {
  try {
    const counters = await leadService.getBoard();
    return <CrmBoard initialCounters={counters} />;
  } catch {
    redirect("/dashboard");
  }
}
