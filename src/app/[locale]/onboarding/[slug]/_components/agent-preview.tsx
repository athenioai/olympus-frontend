"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { MoreHorizontal, ArrowRight } from "lucide-react";
import type {
  BusinessProfileView,
  ServiceModality,
  WorkType,
} from "@/lib/services";
import type { WizardStep } from "../_lib/types";

interface AgentPreviewProps {
  readonly profileView: BusinessProfileView | null;
  readonly workType: WorkType | null;
  readonly currentStep: WizardStep;
}

/**
 * Live WhatsApp-style preview of the agent. Re-renders as the wizard state
 * changes so the user sees the agent "learning" in real time.
 *
 * Greet template + chat lines are PT-BR literals (matches handoff rationale —
 * culturally tied to local idioms). The structural labels around it are i18n.
 */
export function AgentPreview({
  profileView,
  workType,
  currentStep,
}: AgentPreviewProps) {
  const t = useTranslations("onboarding.bulletin");
  const profile = profileView?.profile ?? null;
  const verticalKey = profile?.businessVertical ?? null;
  const bizName = profile?.businessName ?? "";

  const greet = useMemo(
    () => buildGreet(bizName, verticalKey, workType),
    [bizName, verticalKey, workType],
  );
  const agentDisplayName = bizName ? `Agente ${bizName.split(" ")[0]}` : "Agente Olympus";

  const showHours = currentStep >= 5;
  const showPolicies = currentStep >= 6;
  const showTyping = currentStep === 7;

  return (
    <div className="onb-preview">
      <div className="onb-preview-head">
        <div className="flex items-center gap-2.5">
          <span className="onb-preview-dot" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-white/55">
            {t("previewLabel")}
          </span>
        </div>
      </div>

      <div className="onb-preview-main">
        <div className="onb-preview-device">
          <div className="onb-preview-topbar">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <div className="onb-preview-ava">
                {(bizName || "O").charAt(0).toUpperCase()}
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="truncate text-[13px] font-bold leading-tight text-on-surface">
                  {agentDisplayName}
                </div>
                <div className="flex items-center gap-1.5 text-[10.5px] leading-none text-emerald-700">
                  <span className="size-[5px] rounded-full bg-emerald-600" />
                  {t("online")}
                </div>
              </div>
            </div>
            <MoreHorizontal className="size-3.5 text-on-surface-variant" />
          </div>

          <div className="onb-preview-chat" key={`${verticalKey}|${bizName}|${workType}`}>
            <div className="onb-preview-msg them">{greet}</div>

            {workType && (
              <div className="onb-preview-msg us">Oi! Quanto custa?</div>
            )}

            {workType && (
              <div className="onb-preview-msg them">
                {workType === "sales"
                  ? "Depende do produto. Me diz qual te interessou?"
                  : "Depende do serviço. Te mando a tabela ou você já sabe o que quer?"}
              </div>
            )}

            {showHours && bizName && (
              <div className="onb-preview-msg them">
                Atendemos seg. a sex., 09:00 às 19:00. Quer que eu abra um horário?
              </div>
            )}

            {showPolicies && profile?.cancellationPolicy && (
              <div className="onb-preview-msg them">
                Se precisar cancelar, é só me avisar antes — sem taxa.
              </div>
            )}

            {showTyping && (
              <div className="onb-preview-typing">
                <span />
                <span />
                <span />
              </div>
            )}
          </div>

          <div className="onb-preview-footbar">
            <div className="onb-preview-inputfake">{t("inputPlaceholder")}</div>
            <ArrowRight className="size-3.5 opacity-30" />
          </div>
        </div>

        <AgentStatePanel
          profileView={profileView}
          workType={workType}
          currentStep={currentStep}
        />
      </div>

      <div className="onb-preview-foot">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-white/55">
          {currentStep < 7 ? t("statusConfiguring") : t("statusReady")}
        </div>
        <div className="onb-preview-scan" />
      </div>
    </div>
  );
}

interface AgentStatePanelProps {
  readonly profileView: BusinessProfileView | null;
  readonly workType: WorkType | null;
  readonly currentStep: WizardStep;
}

function AgentStatePanel({
  profileView,
  workType,
  currentStep,
}: AgentStatePanelProps) {
  const t = useTranslations("onboarding.bulletin");
  const tw = useTranslations("admin.users.form");
  const profile = profileView?.profile ?? null;

  const workTypeLabel = workType
    ? workType === "services"
      ? tw("workTypeServices")
      : workType === "sales"
        ? tw("workTypeSales")
        : tw("workTypeHybrid")
    : null;
  const verticalLabel = profile?.businessVertical || null;
  const nameLabel = profile?.businessName || null;
  const modalityLabel =
    currentStep >= 6 && profile?.serviceModality
      ? labelForModality(profile.serviceModality)
      : null;
  const policiesLabel =
    currentStep >= 7 &&
    (profile?.cancellationPolicy || profile?.paymentPolicy)
      ? "definidas"
      : null;
  const extrasLabel =
    currentStep >= 8 &&
    (profileView?.address ||
      profile?.cnpj ||
      (profileView?.socialLinks.length ?? 0) > 0)
      ? "completos"
      : null;

  const filledCount = [
    workTypeLabel,
    verticalLabel,
    nameLabel,
    modalityLabel,
    policiesLabel,
    extrasLabel,
  ].filter(Boolean).length;

  return (
    <div className="onb-agent-state">
      <div className="onb-agent-state-head">
        <span className="onb-preview-dot" style={{ background: "oklch(0.72 0.16 55)" }} />
        <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-white/50">
          {t("contextLabel")}
        </span>
        <span className="ml-auto font-mono text-[9.5px] text-white/35">
          {filledCount}/6
        </span>
      </div>
      <div className="onb-agent-state-rows">
        <Row label={t("ctxType")} value={workTypeLabel} />
        <Row label={t("ctxVertical")} value={verticalLabel} />
        <Row label={t("ctxName")} value={nameLabel} />
        <Row label={t("ctxModality")} value={modalityLabel} />
        <Row label={t("ctxPolicies")} value={policiesLabel} />
        <Row label={t("ctxExtras")} value={extrasLabel} />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string | null;
}) {
  const known = value != null && value !== "";
  return (
    <div className={`onb-agent-state-row${known ? " known" : ""}`}>
      <span className="onb-agent-state-label">{label}</span>
      <span className="onb-agent-state-val">
        {known ? value : <span className="onb-agent-state-dash">—</span>}
      </span>
    </div>
  );
}

function buildGreet(
  bizName: string,
  vertical: string | null,
  workType: WorkType | null,
): string {
  const name = bizName || "aqui";
  const verticalGreets: Record<string, string> = {
    beauty: `Oi! Sou da ${name}. Quer agendar um horário ou tem alguma dúvida?`,
    health: `Olá, aqui é a ${name}. Posso te ajudar a marcar uma consulta?`,
    fitness: `E aí! ${name} na área. Primeira aula, renovação, ou dúvida?`,
    pet: `Oi! Fala com a ${name}. Banho, tosa, ou consulta veterinária?`,
    education: `Olá! Aqui é da ${name}. Quer info sobre turmas, valores, ou uma aula experimental?`,
    services: `Oi, aqui é da ${name}. Como posso ajudar hoje?`,
  };

  if (vertical && verticalGreets[vertical]) {
    return verticalGreets[vertical];
  }

  if (workType === "sales") return `Oi! ${name} aqui. Quer ver produtos ou tirar uma dúvida de pedido?`;
  if (workType === "services") return `Olá! ${name}. Como posso ajudar — agendamento, dúvida ou preço?`;
  if (workType === "hybrid") return `Oi! Aqui é da ${name}. Precisa de um agendamento, um produto, ou outra coisa?`;
  return "Oi! Sou o agente do seu negócio — me conte mais pra eu me configurar.";
}

function labelForModality(modality: ServiceModality): string {
  const map: Record<ServiceModality, string> = {
    presencial: "Presencial",
    remoto: "Remoto",
    domicilio: "A domicílio",
    hibrido: "Híbrido",
  };
  return map[modality] || modality;
}
