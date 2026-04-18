import type { AgentAvatarAdmin } from "./admin-types";

export interface CreateAgentAvatarPayload {
  readonly file: File;
  readonly name: string;
  readonly sortOrder?: number;
  readonly isActive?: boolean;
}

export interface UpdateAgentAvatarPayload {
  readonly name?: string;
  readonly sortOrder?: number;
  readonly isActive?: boolean;
}

export interface IAdminAgentAvatarService {
  create(payload: CreateAgentAvatarPayload): Promise<AgentAvatarAdmin>;
  list(): Promise<readonly AgentAvatarAdmin[]>;
  update(
    id: string,
    payload: UpdateAgentAvatarPayload,
  ): Promise<AgentAvatarAdmin>;
  remove(id: string): Promise<void>;
}
