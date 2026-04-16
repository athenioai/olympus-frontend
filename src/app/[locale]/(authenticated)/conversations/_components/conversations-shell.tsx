"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface ConversationsShellProps {
  readonly sidebar: ReactNode;
  readonly children: ReactNode;
}

/**
 * Split-panel shell for conversations: sidebar (320px) + detail (flex-1).
 * On mobile, toggles between sidebar and detail based on route.
 */
export function ConversationsShell({
  sidebar,
  children,
}: ConversationsShellProps) {
  const pathname = usePathname();
  const logicalPath = pathname.replace(/^\/(pt-BR|en-US|es)/, "");
  const isDetail =
    logicalPath.startsWith("/conversations/") &&
    logicalPath !== "/conversations";

  return (
    <div className="-m-6 -mt-16 flex h-screen p-6 pt-16 lg:-m-8 lg:p-8">
      {/* Left panel -- session list */}
      <div
        className={cn(
          "relative w-full flex-col overflow-hidden rounded-xl bg-surface-container-low lg:flex lg:w-[320px] lg:shrink-0",
          isDetail ? "hidden" : "flex",
        )}
      >
        {sidebar}
      </div>

      {/* Right panel -- message thread */}
      <div
        className={cn(
          "min-w-0 flex-1 flex-col overflow-hidden rounded-xl bg-surface-container-lowest lg:flex",
          isDetail ? "flex" : "hidden",
        )}
      >
        {children}
      </div>
    </div>
  );
}
