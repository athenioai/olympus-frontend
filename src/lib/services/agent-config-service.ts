import { authFetch } from "./auth-fetch";
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message ?? "Failed to fetch agent config",
      );
    }

    return response.json();
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message ?? "Failed to update agent config",
      );
    }

    return response.json();
  }
}

export const agentConfigService = new AgentConfigService();
