import { redirect } from "next/navigation";
import { leadService } from "@/lib/services";
import { CrmBoard } from "./_components/crm-board";

/**
 * CRM Kanban board page.
 * Fetches the board data server-side and passes it to the interactive client component.
 */
export default async function CrmPage() {
  try {
    const board = await leadService.getBoard();
    return <CrmBoard initialBoard={board} />;
  } catch {
    redirect("/dashboard");
  }
}
