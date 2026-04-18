"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Plus, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import type { AgentAvatarAdmin } from "@/lib/services";
import { AdminHeader } from "../../_components/admin-header";
import { Modal } from "../../_components/modal";
import {
  deleteAgentAvatarAction,
  updateAgentAvatarAction,
  uploadAgentAvatarAction,
} from "../actions";

interface AvatarsViewProps {
  readonly initialAvatars: readonly AgentAvatarAdmin[];
  readonly errorMessage: string | null;
}

export function AvatarsView({ initialAvatars, errorMessage }: AvatarsViewProps) {
  const t = useTranslations("admin.avatars");
  const tc = useTranslations("common");
  const tCommon = useTranslations("admin.common");

  const [avatars, setAvatars] =
    useState<readonly AgentAvatarAdmin[]>(initialAvatars);
  const [editing, setEditing] = useState<AgentAvatarAdmin | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleUpload(formData: FormData) {
    startTransition(async () => {
      const result = await uploadAgentAvatarAction(formData);
      if (!result.success || !result.data) {
        toast.error(result.error ?? tCommon("loadError"));
        return;
      }
      setAvatars((prev) => [result.data as AgentAvatarAdmin, ...prev]);
      setUploadOpen(false);
      toast.success(t("uploaded"));
    });
  }

  function handleDelete(avatar: AgentAvatarAdmin) {
    if (!window.confirm(t("deleteConfirm"))) return;
    startTransition(async () => {
      const result = await deleteAgentAvatarAction(avatar.id);
      if (!result.success) {
        toast.error(result.error ?? tCommon("loadError"));
        return;
      }
      setAvatars((prev) => prev.filter((a) => a.id !== avatar.id));
      toast.success(t("deleted"));
    });
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        actions={
          <button
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-dim px-4 text-sm font-bold text-on-primary shadow-lg shadow-primary/10"
            onClick={() => setUploadOpen(true)}
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

      {avatars.length === 0 ? (
        <div className="rounded-xl bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">
          {t("empty")}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {avatars.map((avatar) => (
            <div
              className={`overflow-hidden rounded-2xl bg-surface-container-lowest shadow-ambient ${avatar.isActive ? "" : "opacity-50"}`}
              key={avatar.id}
            >
              <div className="relative aspect-square bg-surface-container-high">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={avatar.name}
                  className="absolute inset-0 h-full w-full object-cover"
                  src={avatar.imageUrl}
                />
              </div>
              <div className="space-y-2 p-3">
                <div>
                  <p className="truncate font-display text-sm font-bold text-on-surface">
                    {avatar.name}
                  </p>
                  <p className="text-[10px] text-on-surface-variant">
                    #{avatar.sortOrder}
                    {!avatar.isActive && ` · ${t("inactive")}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface"
                    onClick={() => setEditing(avatar)}
                    type="button"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant hover:text-danger"
                    disabled={isPending}
                    onClick={() => handleDelete(avatar)}
                    type="button"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
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

      {editing && (
        <EditAvatarModal
          avatar={editing}
          onClose={() => setEditing(null)}
          onUpdated={(updated) => {
            setAvatars((prev) =>
              prev.map((a) => (a.id === updated.id ? updated : a)),
            );
            setEditing(null);
            toast.success(t("updated"));
          }}
          tc={tc}
        />
      )}
    </div>
  );
}

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
  const tc = useTranslations("common");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(new FormData(event.currentTarget));
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block space-y-1">
        <span className="font-display text-xs font-semibold text-on-surface">
          {t("file")}
        </span>
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-surface-container-high px-4 py-6 text-sm text-on-surface-variant hover:border-primary/40 hover:text-on-surface">
          <UploadCloud className="h-5 w-5" />
          <input accept="image/*" className="sr-only" name="file" required type="file" />
          <span>PNG / JPEG</span>
        </label>
      </label>
      <label className="block space-y-1">
        <span className="font-display text-xs font-semibold text-on-surface">
          {t("name")}
        </span>
        <input
          className="h-10 w-full rounded-lg bg-surface-container-high px-3 text-sm text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
          name="name"
          required
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1">
          <span className="font-display text-xs font-semibold text-on-surface">
            {t("sortOrder")}
          </span>
          <input
            className="h-10 w-full rounded-lg bg-surface-container-high px-3 text-sm text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
            defaultValue="0"
            inputMode="numeric"
            name="sortOrder"
            type="text"
          />
        </label>
        <label className="flex cursor-pointer items-center gap-2 pt-6">
          <input defaultChecked name="isActive" type="checkbox" value="true" />
          <span className="font-display text-xs font-semibold text-on-surface">
            {t("isActive")}
          </span>
        </label>
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

function EditAvatarModal({
  avatar,
  onClose,
  onUpdated,
  tc,
}: {
  readonly avatar: AgentAvatarAdmin;
  readonly onClose: () => void;
  readonly onUpdated: (updated: AgentAvatarAdmin) => void;
  readonly tc: (key: string) => string;
}) {
  const t = useTranslations("admin.avatars.form");
  const tCommon = useTranslations("admin.common");
  const [name, setName] = useState(avatar.name);
  const [sortOrder, setSortOrder] = useState(String(avatar.sortOrder));
  const [isActive, setIsActive] = useState(avatar.isActive);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setName(avatar.name);
    setSortOrder(String(avatar.sortOrder));
    setIsActive(avatar.isActive);
  }, [avatar]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedSort = Number.parseInt(sortOrder, 10);
    startTransition(async () => {
      const result = await updateAgentAvatarAction(avatar.id, {
        name: name.trim(),
        sortOrder: Number.isFinite(parsedSort) ? parsedSort : 0,
        isActive,
      });
      if (!result.success || !result.data) {
        toast.error(result.error ?? tCommon("loadError"));
        return;
      }
      onUpdated(result.data);
    });
  }

  return (
    <Modal onClose={onClose} open title={t("editTitle")}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-1">
          <span className="font-display text-xs font-semibold text-on-surface">
            {t("name")}
          </span>
          <input
            className="h-10 w-full rounded-lg bg-surface-container-high px-3 text-sm text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
            onChange={(e) => setName(e.target.value)}
            required
            value={name}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="font-display text-xs font-semibold text-on-surface">
              {t("sortOrder")}
            </span>
            <input
              className="h-10 w-full rounded-lg bg-surface-container-high px-3 text-sm text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30"
              inputMode="numeric"
              onChange={(e) => setSortOrder(e.target.value.replace(/\D/g, ""))}
              type="text"
              value={sortOrder}
            />
          </label>
          <label className="flex cursor-pointer items-center gap-2 pt-6">
            <input
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              type="checkbox"
            />
            <span className="font-display text-xs font-semibold text-on-surface">
              {t("isActive")}
            </span>
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            className="h-10 rounded-xl px-4 text-sm font-semibold text-on-surface-variant hover:text-on-surface"
            onClick={onClose}
            type="button"
          >
            {tc("cancel")}
          </button>
          <button
            className="h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dim px-5 text-sm font-bold text-on-primary shadow-lg shadow-primary/10 disabled:opacity-60"
            disabled={isPending}
            type="submit"
          >
            {t("submitUpdate")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
