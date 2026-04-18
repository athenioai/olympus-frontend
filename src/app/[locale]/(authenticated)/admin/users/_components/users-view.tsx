"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Calendar, Plus, UserCog } from "lucide-react";
import { toast } from "sonner";
import { PromptDialog } from "@/components/ui/prompt-dialog";
import type { AdminUserPublic, PlanPublic } from "@/lib/services";
import { AdminHeader } from "../../_components/admin-header";
import { formatDate } from "../../_lib/format";
import {
  createAdminUserAction,
  seedHolidaysAction,
  updateAdminUserAction,
} from "../actions";
import { UserFormModal, type UserFormValues } from "./user-form-modal";

interface UsersViewProps {
  readonly initialUsers: readonly AdminUserPublic[];
  readonly initialPlans: readonly PlanPublic[];
  readonly errorMessage: string | null;
}

export function UsersView({
  initialUsers,
  initialPlans,
  errorMessage,
}: UsersViewProps) {
  const t = useTranslations("admin.users");
  const tc = useTranslations("admin.common");
  const tCommon = useTranslations("common");

  const [users, setUsers] = useState<readonly AdminUserPublic[]>(initialUsers);
  const [formState, setFormState] = useState<
    | { mode: "create" }
    | { mode: "edit"; user: AdminUserPublic }
    | null
  >(null);
  const [seedPromptOpen, setSeedPromptOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCreateSubmit(values: UserFormValues) {
    startTransition(async () => {
      const result = await createAdminUserAction(values);
      if (!result.success || !result.data) {
        toast.error(result.error ?? tc("loadError"));
        return;
      }
      setUsers((prev) => [result.data as AdminUserPublic, ...prev]);
      setFormState(null);
      toast.success(t("created"));
    });
  }

  function handleEditSubmit(values: UserFormValues) {
    if (formState?.mode !== "edit") return;
    const id = formState.user.id;
    startTransition(async () => {
      const result = await updateAdminUserAction(id, values);
      if (!result.success || !result.data) {
        toast.error(result.error ?? tc("loadError"));
        return;
      }
      const updated = result.data;
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setFormState(null);
      toast.success(t("updated"));
    });
  }

  function handleSeedHolidays(years: string) {
    setSeedPromptOpen(false);
    startTransition(async () => {
      const result = await seedHolidaysAction(years);
      if (!result.success) {
        toast.error(result.error ?? tc("loadError"));
        return;
      }
      toast.success(t("seedHolidaysDone"));
    });
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        actions={
          <>
            <button
              className="flex h-10 items-center gap-2 rounded-xl bg-surface-container-high px-4 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-highest disabled:opacity-60"
              disabled={isPending}
              onClick={() => setSeedPromptOpen(true)}
              type="button"
            >
              <Calendar className="h-4 w-4" />
              {t("seedHolidays")}
            </button>
            <button
              className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-dim px-4 text-sm font-bold text-on-primary shadow-lg shadow-primary/10 disabled:opacity-60"
              disabled={isPending}
              onClick={() => setFormState({ mode: "create" })}
              type="button"
            >
              <Plus className="h-4 w-4" />
              {t("create")}
            </button>
          </>
        }
        subtitle={t("subtitle")}
        title={t("title")}
      />

      {errorMessage && (
        <div className="rounded-xl bg-danger-muted px-4 py-3 text-sm text-danger">
          {errorMessage}
        </div>
      )}

      {users.length === 0 ? (
        <div className="rounded-xl bg-surface-container-lowest p-8 text-center text-sm text-on-surface-variant">
          {t("empty")}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-ambient">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                <th className="px-5 py-3">{t("table.name")}</th>
                <th className="px-5 py-3">{t("table.email")}</th>
                <th className="px-5 py-3">{t("table.role")}</th>
                <th className="px-5 py-3">{t("table.workType")}</th>
                <th className="px-5 py-3">{t("table.createdAt")}</th>
                <th className="px-5 py-3">{t("table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  className="border-t border-surface-container-high"
                  key={user.id}
                >
                  <td className="px-5 py-3 font-medium text-on-surface">
                    {user.name ?? tc("noSelection")}
                  </td>
                  <td className="px-5 py-3 text-on-surface-variant">
                    {user.email}
                  </td>
                  <td className="px-5 py-3 text-on-surface-variant">
                    {user.role === "admin"
                      ? t("form.roleAdmin")
                      : t("form.roleUser")}
                  </td>
                  <td className="px-5 py-3 text-on-surface-variant">
                    {t(`form.workType${capitalize(user.workType)}`)}
                  </td>
                  <td className="px-5 py-3 text-on-surface-variant">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-3">
                      <Link
                        className="text-sm font-semibold text-primary hover:underline"
                        href={`/admin/users/${user.id}`}
                      >
                        {t("table.view")}
                      </Link>
                      <button
                        className="text-sm font-semibold text-on-surface-variant hover:text-on-surface"
                        onClick={() => setFormState({ mode: "edit", user })}
                        type="button"
                      >
                        <UserCog className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UserFormModal
        initialUser={formState?.mode === "edit" ? formState.user : null}
        isPending={isPending}
        mode={formState?.mode ?? "create"}
        onClose={() => setFormState(null)}
        onSubmit={
          formState?.mode === "edit" ? handleEditSubmit : handleCreateSubmit
        }
        open={formState !== null}
        plans={initialPlans}
      />

      <PromptDialog
        cancelLabel={tCommon("cancel")}
        confirmLabel={t("seedHolidays")}
        description={t("seedHolidaysPrompt")}
        isPending={isPending}
        onCancel={() => setSeedPromptOpen(false)}
        onConfirm={handleSeedHolidays}
        open={seedPromptOpen}
        placeholder="2026,2027"
        title={t("seedHolidays")}
      />
    </div>
  );
}

function capitalize(value: string): "Services" | "Sales" | "Hybrid" {
  return (value.charAt(0).toUpperCase() + value.slice(1)) as
    | "Services"
    | "Sales"
    | "Hybrid";
}
