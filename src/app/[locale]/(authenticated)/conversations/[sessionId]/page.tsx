import { notFound } from "next/navigation";
import { chatService } from "@/lib/services";
import { MessageThread } from "../_components/message-thread";
import type {
  ChatMessage,
  Pagination,
} from "@/lib/services/interfaces/chat-service";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Fetch the last page of messages for a session.
 */
async function fetchMessages(sessionId: string): Promise<{
  messages: ChatMessage[];
  pagination: Pagination;
  notFoundError: boolean;
}> {
  try {
    const probe = await chatService.getMessages(sessionId, {
      limit: 50,
      page: 1,
    });
    const lastPage =
      Math.ceil(probe.pagination.total / probe.pagination.limit) || 1;

    if (lastPage <= 1) {
      return {
        messages: probe.data,
        pagination: probe.pagination,
        notFoundError: false,
      };
    }

    const latest = await chatService.getMessages(sessionId, {
      page: lastPage,
      limit: 50,
    });

    return {
      messages: latest.data,
      pagination: latest.pagination,
      notFoundError: false,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return {
        messages: [],
        pagination: { page: 1, limit: 50, total: 0 },
        notFoundError: true,
      };
    }
    return {
      messages: [],
      pagination: { page: 1, limit: 50, total: 0 },
      notFoundError: false,
    };
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

  const [{ messages, pagination, notFoundError }, sessionsResult] =
    await Promise.all([
      fetchMessages(sessionId),
      chatService.listSessions({ limit: 100 }).catch(() => ({ data: [] })),
    ]);

  if (notFoundError) {
    notFound();
  }

  const session = sessionsResult.data.find(
    (s) => s.sessionId === sessionId,
  );

  return (
    <MessageThread
      sessionId={sessionId}
      leadName={session?.leadName ?? null}
      agent={session?.agent ?? "horos"}
      initialMessages={messages}
      initialPagination={pagination}
      initialHandoff={session?.handoff ?? false}
    />
  );
}
