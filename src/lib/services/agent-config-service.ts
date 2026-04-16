import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import type {
  AgentConfig,
  IAgentConfigService,
  UpdateAgentConfigParams,
} from "./interfaces/agent-config-service";

class AgentConfigService implements IAgentConfigService {
  /**
   * Get the current agent configuration.
   * @returns Agent configuration data
   * @throws Error if the request fails
   */
  async getConfig(): Promise<AgentConfig> {
    const response = await authFetch("/agent/config");
    return unwrapEnvelope<AgentConfig>(response);
  }

  /**
   * Update the agent configuration.
   * @param params - New configuration values
   * @returns Updated agent configuration
   * @throws Error if validation fails or request fails
   */
  async updateConfig(
    params: UpdateAgentConfigParams,
  ): Promise<AgentConfig> {
    const response = await authFetch("/agent/config", {
      method: "PUT",
      body: JSON.stringify(params),
    });
    return unwrapEnvelope<AgentConfig>(response);
  }
}

export const agentConfigService = new AgentConfigService();
