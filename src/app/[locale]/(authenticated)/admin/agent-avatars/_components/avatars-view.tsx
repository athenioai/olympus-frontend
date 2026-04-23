"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ImageOff, Plus, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { safeUrl } from "@/lib/safe-url";
import { ACTIVE_AVATAR_LIMIT } from "@/lib/services/interfaces/admin-types";
import type { AgentAvatarAdmin } from "@/lib/services";
import { AdminHeader } from "../../_components/admin-header";
import { Modal } from "../../_components/modal";
import {
  deleteAgentAvatarAction,
  uploadAgentAvatarAction,
} from "../actions";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const MAGIC_BYTES: Record<string, ReadonlyArray<number>> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
};

async function hasValidImageMagicBytes(file: File): Promise<boolean> {
  const buffer = await file.slice(0, 8).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  return Object.values(MAGIC_BYTES).some((magic) =>
    magic.every((byte, i) => bytes[i] === byte),
  );
}

interface AvatarsViewProps {
  readonly initialAvatars: readonly AgentAvatarAdmin[];
  readonly errorMessage: string | null;
}

export function AvatarsView({
  initialAvatars,
  errorMessage,
}: AvatarsViewProps) {
  const t = useTranslations("admin.avatars");
  const tc = useTranslations("common");
  const tCommon = useTranslations("admin.common");

  const router = useRouter();

  const [toDelete, setToDelete] = useState<AgentAvatarAdmin | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const activeCount = initialAvatars.filter((a) => !a.deletedAt).length;
  const limitReached = activeCount >= ACTIVE_AVATAR_LIMIT;

  function handleUpload(formData: FormData) {
    startTransition(async () => {
      const result = await uploadAgentAvatarAction(formData);
      if (!result.success || !result.data) {
        toast.error(result.error ?? tCommon("loadError"));
        return;
      }
      setUploadOpen(false);
      toast.success(t("uploaded"));
      router.refresh();
    });
  }

  function confirmDelete() {
    if (!toDelete) return;
    const avatar = toDelete;
    startTransition(async () => {
      const result = await deleteAgentAvatarAction(avatar.id);
      if (!result.success) {
        toast.error(result.error ?? tCommon("loadError"));
        return;
      }
      setToDelete(null);
      toast.success(t("deleted"));
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        actions={
          <button
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-dim px-4 text-sm font-bold text-on-primary shadow-lg shadow-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending || limitReached}
            onClick={() => setUploadOpen(true)}
            title={limitReached ? t("limitReached") : undefined}
            type="button"
          >
            <Plus className="h-4 w-4" />
            {t("upload")}
          </button>
        }
        subtitle={t("subtitle")}
        title={t("title")}
      />

      {errorMessage && (
        <div className="rounded-xl bg-danger-muted px-4 py-3 text-sm text-danger">
          {errorMessage}
        </div>
      )}

      {limitReached && (
        <div className="rounded-xl bg-warning-muted px-4 py-3 text-sm text-warning">
          {t("limitReached")}
        </div>
      )}

      {initialAvatars.length === 0 ? (
        <div className="rounded-xl bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">
          {t("empty")}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {initialAvatars.map((avatar) => (
            <div
              className="group overflow-hidden rounded-2xl bg-surface-container-lowest shadow-ambient"
              key={avatar.id}
            >
              <div className="relative aspect-square bg-surface-container-high">
                {(() => {
                  const src = safeUrl(avatar.imageUrl);
                  if (!src) {
                    return (
                      <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant">
                        <ImageOff className="h-8 w-8" />
                      </div>
                    );
                  }
                  return (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      alt={t("avatarAlt", { sortOrder: avatar.sortOrder })}
                      className="absolute inset-0 h-full w-full object-cover"
                      src={src}
                    />
                  );
                })()}
              </div>
              <div className="flex items-center justify-end p-3">
                <button
                  aria-label={tc("delete")}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant transition-colors hover:bg-danger-muted hover:text-danger disabled:opacity-40"
                  disabled={isPending}
                  onClick={() => setToDelete(avatar)}
                  type="button"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        onClose={() => setUploadOpen(false)}
        open={uploadOpen}
        title={t("form.createTitle")}
      >
        <UploadForm
          isPending={isPending}
          onCancel={() => setUploadOpen(false)}
          onSubmit={handleUpload}
        />
      </Modal>

      <ConfirmDialog
        cancelLabel={tc("cancel")}
        confirmLabel={tc("delete")}
        description={t("deleteConfirm")}
        isPending={isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
        open={toDelete !== null}
        title={tc("confirm")}
        variant="danger"
      />
    </div>
  );
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function UploadForm({
  onSubmit,
  onCancel,
  isPending,
}: {
  readonly onSubmit: (formData: FormData) => void;
  readonly onCancel: () => void;
  readonly isPending: boolean;
}) {
  const t = useTranslations("admin.avatars.form");
  const tAvatars = useTranslations("admin.avatars");
  const tc = useTranslations("common");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const previewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : null),
    [selectedFile],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      toast.error(tAvatars("invalidImage"));
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(tAvatars("fileTooLarge"));
      return;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
      toast.error(tAvatars("invalidImage"));
      return;
    }
    if (!(await hasValidImageMagicBytes(file))) {
      toast.error(tAvatars("invalidImage"));
      return;
    }
    onSubmit(formData);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <span className="font-display text-xs font-semibold text-on-surface">
          {t("file")}
        </span>
        <label className="relative mx-auto flex aspect-square w-full max-w-xs cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-surface-container-high bg-surface-container-high/30 text-on-surface-variant transition-colors hover:border-primary/40 hover:text-on-surface">
          {previewUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              alt={tAvatars("selectedFile")}
              className="absolute inset-0 h-full w-full object-cover"
              src={previewUrl}
            />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <UploadCloud className="h-8 w-8" />
              <span className="text-xs">PNG / JPEG / WebP</span>
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/70">
                512 × 512
              </span>
            </div>
          )}
          <input
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            className="sr-only"
            name="file"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            ref={fileInputRef}
            required
            type="file"
          />
        </label>
        {selectedFile ? (
          <p className="truncate text-center text-xs text-on-surface-variant">
            {selectedFile.name}
          </p>
        ) : null}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          className="h-10 rounded-xl px-4 text-sm font-semibold text-on-surface-variant hover:text-on-surface"
          onClick={onCancel}
          type="button"
        >
          {tc("cancel")}
        </button>
        <button
          className="h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dim px-5 text-sm font-bold text-on-primary shadow-lg shadow-primary/10 disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {t("submitUpload")}
        </button>
      </div>
    </form>
  );
}
