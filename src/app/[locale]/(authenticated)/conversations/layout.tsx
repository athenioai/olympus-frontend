import { chatService } from "@/lib/services";
import { ConversationsShell } from "./_components/conversations-shell";
import { SessionPanel } from "./_components/session-panel";
import type {
  ChatSession,
  Pagination,
} from "@/lib/services/interfaces/chat-service";
import type { ReactNode } from "react";

/**
 * Fetch all sessions with graceful fallback to empty list.
 */
async function fetchSessions(): Promise<{
  sessions: ChatSession[];
  pagination: Pagination;
}> {
  try {
    const result = await chatService.listSessions({ limit: 100 });
    return { sessions: result.data, pagination: result.pagination };
  } catch {
    return {
      sessions: [],
      pagination: { page: 1, limit: 100, total: 0 },
    };
  }
}

export default async function ConversationsLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const { sessions } = await fetchSessions();

  return (
    <ConversationsShell
      sidebar={<SessionPanel initialSessions={sessions} />}
    >
      {children}
    </ConversationsShell>
  );
}
