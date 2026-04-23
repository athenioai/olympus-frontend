import type { AgentAvatarAdmin } from "./admin-types";

export interface CreateAgentAvatarPayload {
  readonly file: File;
  readonly sortOrder?: number;
}

export interface ListAdminAgentAvatarsParams {
  readonly includeDeleted?: boolean;
}

export interface IAdminAgentAvatarService {
  create(payload: CreateAgentAvatarPayload): Promise<AgentAvatarAdmin>;
  list(
    params?: ListAdminAgentAvatarsParams,
  ): Promise<readonly AgentAvatarAdmin[]>;
  remove(id: string): Promise<void>;
}
