"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { agentConfigService } from "@/lib/services";
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
  agentName: z.string().min(1).max(100),
  tone: z.enum(["friendly", "formal", "casual"]),
  customInstructions: z.string().max(2000).nullable(),
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
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
