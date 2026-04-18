import { getTranslations } from "next-intl/server";
import { adminAgentAvatarService } from "@/lib/services";
import type { AgentAvatarAdmin } from "@/lib/services";
import { AvatarsView } from "./_components/avatars-view";

export default async function AdminAvatarsPage() {
  const tc = await getTranslations("admin.common");

  let avatars: readonly AgentAvatarAdmin[] = [];
  let errorMessage: string | null = null;

  try {
    avatars = await adminAgentAvatarService.list();
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : tc("loadError");
  }

  return <AvatarsView errorMessage={errorMessage} initialAvatars={avatars} />;
}
