import { notFound } from "next/navigation";
import { chatService, authService } from "@/lib/services";
import { MessageThread } from "../_components/message-thread";
import type {
  ChatMessage,
  PaginatedSessions,
} from "@/lib/services/interfaces/chat-service";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface FetchedMessages {
  readonly messages: ChatMessage[];
  readonly nextCursor: string | null;
  readonly hasMore: boolean;
  readonly notFoundError: boolean;
}

/**
 * Fetch the most recent messages for a session using cursor pagination.
 * Backend returns newest-first; we reverse to render chronologically.
 */
async function fetchMessages(chatId: string): Promise<FetchedMessages> {
  try {
    const page = await chatService.getMessages(chatId, { limit: 50 });
    return {
      messages: [...page.items].reverse(),
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
      notFoundError: false,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return {
        messages: [],
        nextCursor: null,
        hasMore: false,
        notFoundError: true,
      };
    }
    return {
      messages: [],
      nextCursor: null,
      hasMore: false,
      notFoundError: false,
    };
  }
}

const EMPTY_SESSIONS: PaginatedSessions = {
  items: [],
  total: 0,
  page: 1,
  limit: 0,
};

export default async function ChatDetailPage({
  params,
}: {
  readonly params: Promise<{ chatId: string }>;
}) {
  const { chatId } = await params;

  if (!UUID_RE.test(chatId)) {
    notFound();
  }

  const [
    { messages, nextCursor, hasMore, notFoundError },
    sessionsResult,
    currentUser,
  ] = await Promise.all([
    fetchMessages(chatId),
    chatService
      .listSessions({ limit: 100 })
      .catch<PaginatedSessions>(() => EMPTY_SESSIONS),
    authService.getSession(),
  ]);

  if (notFoundError) {
    notFound();
  }

  const session = sessionsResult.items.find((s) => s.id === chatId);

  return (
    <MessageThread
      chatId={chatId}
      leadId={session?.lead.id ?? null}
      leadName={session?.lead.name ?? null}
      leadAvatarUrl={session?.lead.avatarUrl ?? null}
      operatorName={currentUser?.name ?? null}
      agent="horos"
      initialMessages={messages}
      initialCursor={{ nextCursor, hasMore }}
      initialHandoff={session?.handoff ?? false}
    />
  );
}
