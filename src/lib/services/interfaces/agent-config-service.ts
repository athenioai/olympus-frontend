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
  getConfig(): Promise<AgentConfig>;
  updateConfig(params: UpdateAgentConfigParams): Promise<AgentConfig>;
}
