export interface AgentConfig {
  readonly agentName: string;
  readonly tone: "friendly" | "formal" | "casual";
  readonly profession: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface UpdateAgentConfigParams {
  readonly agentName: string;
  readonly tone: "friendly" | "formal" | "casual";
  readonly profession?: string | null;
}

export interface IAgentConfigService {
  /**
   * Returns `null` when the tenant has not yet configured the agent (fresh
   * accounts whose backend record is empty). Callers must default to a
   * "first-time setup" UX instead of crashing.
   */
  getConfig(): Promise<AgentConfig | null>;
  updateConfig(params: UpdateAgentConfigParams): Promise<AgentConfig>;
}
