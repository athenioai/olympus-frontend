import type { PlanPublic } from "./admin-types";

export interface CreatePlanPayload {
  readonly name: string;
  readonly cost: number;
}

export interface UpdatePlanPayload {
  readonly name?: string;
  readonly cost?: number;
}

export interface IAdminPlanService {
  create(payload: CreatePlanPayload): Promise<PlanPublic>;
  list(): Promise<readonly PlanPublic[]>;
  getById(id: string): Promise<PlanPublic>;
  update(id: string, payload: UpdatePlanPayload): Promise<PlanPublic>;
  remove(id: string): Promise<void>;
}
