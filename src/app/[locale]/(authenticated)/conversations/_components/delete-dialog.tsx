"use client";

import { AlertDialog } from "radix-ui";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface DeleteDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly isDeleting: boolean;
}

/**
 * Confirmation dialog for deleting a chat session.
 */
export function DeleteDialog({
  open,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteDialogProps) {
  const t = useTranslations("conversations");
  const tc = useTranslations("common");

  return (
    <AlertDialog.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !isDeleting) onClose();
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-on-surface/20 backdrop-blur-sm" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface-container-lowest p-6 shadow-ambient-strong outline-none">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger/10">
              <AlertTriangle className="h-5 w-5 text-danger" />
            </div>
            <div>
              <AlertDialog.Title className="text-base font-semibold text-on-surface">
                {t("deleteSession")}
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-1 text-sm text-on-surface-variant">
                {t("deleteDescription")}
              </AlertDialog.Description>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isDeleting}
              >
                {tc("cancel")}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button
                variant="destructive"
                size="sm"
                onClick={onConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {tc("loading")}
                  </span>
                ) : (
                  tc("delete")
                )}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
