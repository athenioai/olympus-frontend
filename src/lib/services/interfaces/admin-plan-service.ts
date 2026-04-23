import type { PlanPublic } from "./admin-types";

export interface PlanOption {
  readonly id: string;
  readonly name: string;
}

export interface ListAdminPlansParams {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
}

export interface PaginatedAdminPlans {
  readonly items: readonly PlanPublic[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

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
  list(params?: ListAdminPlansParams): Promise<PaginatedAdminPlans>;
  listOptions(): Promise<readonly PlanOption[]>;
  getById(id: string): Promise<PlanPublic>;
  update(id: string, payload: UpdatePlanPayload): Promise<PlanPublic>;
  remove(id: string): Promise<void>;
}
