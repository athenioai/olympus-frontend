import { chatService } from "@/lib/services";
import { ConversationsShell } from "./_components/conversations-shell";
import { SessionPanel } from "./_components/session-panel";
import type { ChatSession } from "@/lib/services/interfaces/chat-service";
import type { ReactNode } from "react";

/**
 * Fetch all sessions with graceful fallback to empty list.
 */
async function fetchSessions(): Promise<ChatSession[]> {
  try {
    const result = await chatService.listSessions({ limit: 100 });
    return [...result.items];
  } catch {
    return [];
  }
}

export default async function ConversationsLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  const sessions = await fetchSessions();

  return (
    <ConversationsShell
      sidebar={<SessionPanel initialSessions={sessions} />}
    >
      {children}
    </ConversationsShell>
  );
}
