"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { agentConfigService } from "@/lib/services";
import { captureUnexpected } from "@/lib/observability/capture";
import type { AgentConfig } from "@/lib/services";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActionResult<T = undefined> {
  readonly success: boolean;
  readonly error?: string;
  readonly data?: T;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const agentConfigSchema = z.object({
  agentName: z
    .string()
    .min(1, "Nome do agente é obrigatório.")
    .max(100, "Nome do agente deve ter no máximo 100 caracteres."),
  tone: z.enum(["friendly", "formal", "casual"], {
    message: "Tom de voz inválido.",
  }),
  profession: z
    .string()
    .max(100, "Profissão deve ter no máximo 100 caracteres.")
    .nullable()
    .optional(),
});

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

/**
 * Update the agent configuration.
 * @param params - Agent config fields
 * @returns Action result with updated config or error
 */
export async function updateAgentConfig(
  params: unknown,
): Promise<ActionResult<AgentConfig>> {
  const parsed = agentConfigSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  try {
    const data = await agentConfigService.updateConfig(parsed.data);
    revalidatePath("/settings");
    return { success: true, data };
  } catch (err) {
    captureUnexpected(err);
    return { success: false, error: "Não foi possível salvar a configuração. Tente novamente." };
  }
}
