import { MessagesSquare } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function ConversationsPage() {
  const t = await getTranslations("conversations");

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container-high">
        <MessagesSquare className="h-8 w-8 text-on-surface-variant/50" />
      </div>
      <p className="mt-4 text-lg font-semibold text-on-surface">
        {t("selectConversation")}
      </p>
      <p className="mt-1 text-sm text-on-surface-variant">
        {t("selectConversationSubtitle")}
      </p>
    </div>
  );
}
