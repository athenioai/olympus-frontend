"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type {
  AdminUserPublic,
  PlanPublic,
  UserRole,
  WorkType,
} from "@/lib/services";
import { Modal } from "../../_components/modal";

export interface UserFormValues {
  readonly name: string;
  readonly email: string;
  readonly workType: WorkType;
  readonly role?: UserRole;
  readonly planId?: string;
}

interface UserFormModalProps {
  readonly open: boolean;
  readonly mode: "create" | "edit";
  readonly initialUser: AdminUserPublic | null;
  readonly plans: readonly PlanPublic[];
  readonly isPending: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (values: UserFormValues) => void;
}

const WORK_TYPES: readonly WorkType[] = ["services", "sales", "hybrid"];
const ROLES: readonly UserRole[] = ["user", "admin"];

export function UserFormModal({
  open,
  mode,
  initialUser,
  plans,
  isPending,
  onClose,
  onSubmit,
}: UserFormModalProps) {
  const t = useTranslations("admin.users.form");
  const tc = useTranslations("common");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [workType, setWorkType] = useState<WorkType>("services");
  const [role, setRole] = useState<UserRole>("user");
  const [planId, setPlanId] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initialUser) {
      setName(initialUser.name ?? "");
      setEmail(initialUser.email);
      setWorkType(initialUser.workType);
      setRole(initialUser.role);
      setPlanId(initialUser.planId ?? "");
    } else {
      setName("");
      setEmail("");
      setWorkType("services");
      setRole("user");
      setPlanId("");
    }
  }, [open, mode, initialUser]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values: UserFormValues = {
      name: name.trim(),
      email: email.trim(),
      workType,
      ...(mode === "edit" ? { role } : {}),
      ...(planId ? { planId } : {}),
    };
    onSubmit(values);
  }

  return (
    <Modal
      onClose={onClose}
      open={open}
      title={mode === "create" ? t("createTitle") : t("editTitle")}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Field label={t("name")}>
          <input
            className={INPUT_CLASS}
            onChange={(e) => setName(e.target.value)}
            required
            value={name}
          />
        </Field>
        <Field label={t("email")}>
          <input
            className={INPUT_CLASS}
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
            value={email}
          />
        </Field>
        <Field label={t("workType")}>
          <select
            className={INPUT_CLASS}
            onChange={(e) => setWorkType(e.target.value as WorkType)}
            value={workType}
          >
            {WORK_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`workType${type.charAt(0).toUpperCase()}${type.slice(1)}`)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("plan")}>
          <select
            className={INPUT_CLASS}
            onChange={(e) => setPlanId(e.target.value)}
            value={planId}
          >
            <option value="">{t("noPlan")}</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
        </Field>
        {mode === "edit" && (
          <Field label={t("role")}>
            <select
              className={INPUT_CLASS}
              onChange={(e) => setRole(e.target.value as UserRole)}
              value={role}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r === "admin" ? t("roleAdmin") : t("roleUser")}
                </option>
              ))}
            </select>
          </Field>
        )}

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
            {mode === "create" ? t("submitCreate") : t("submitUpdate")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

const INPUT_CLASS =
  "h-10 w-full rounded-lg bg-surface-container-high px-3 text-sm text-on-surface outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary/30";

function Field({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="font-display text-xs font-semibold text-on-surface">
        {label}
      </span>
      {children}
    </label>
  );
}
