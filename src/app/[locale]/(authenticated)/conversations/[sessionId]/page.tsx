import { notFound } from "next/navigation";
import { chatService } from "@/lib/services";
import { MessageThread } from "../_components/message-thread";
import type { ChatMessage } from "@/lib/services/interfaces/chat-service";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Fetch the last page of messages for a session.
 */
async function fetchMessages(sessionId: string): Promise<{
  messages: ChatMessage[];
  page: number;
  total: number;
  notFoundError: boolean;
}> {
  try {
    const probe = await chatService.getMessages(sessionId, {
      limit: 50,
      page: 1,
    });
    const lastPage = Math.ceil(probe.total / probe.limit) || 1;

    if (lastPage <= 1) {
      return {
        messages: probe.data,
        page: probe.page,
        total: probe.total,
        notFoundError: false,
      };
    }

    const latest = await chatService.getMessages(sessionId, {
      page: lastPage,
      limit: 50,
    });

    return {
      messages: latest.data,
      page: latest.page,
      total: latest.total,
      notFoundError: false,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return { messages: [], page: 1, total: 0, notFoundError: true };
    }
    return { messages: [], page: 1, total: 0, notFoundError: false };
  }
}

export default async function ChatDetailPage({
  params,
}: {
  readonly params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  if (!UUID_RE.test(sessionId)) {
    notFound();
  }

  const [{ messages, page, total, notFoundError }, sessionsResult] =
    await Promise.all([
      fetchMessages(sessionId),
      chatService.listSessions({ limit: 100 }).catch(() => ({ data: [] })),
    ]);

  if (notFoundError) {
    notFound();
  }

  const session = sessionsResult.data.find((s) => s.id === sessionId);

  return (
    <MessageThread
      sessionId={sessionId}
      leadName={session?.leadId ?? null}
      agent="horos"
      initialMessages={messages}
      initialPagination={{ page, limit: 50, total }}
      initialHandoff={session?.handoff ?? false}
    />
  );
}
