export type ExceptionType = "closed" | "special_hours";

export interface BusinessExceptionRange {
  readonly startTime: string;
  readonly endTime: string;
}

export interface BusinessException {
  readonly id: string;
  readonly date: string;
  readonly type: ExceptionType;
  readonly reason: string | null;
  readonly ranges: readonly BusinessExceptionRange[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateExceptionPayload {
  readonly date: string;
  readonly type: ExceptionType;
  readonly reason?: string;
  readonly ranges?: BusinessExceptionRange[];
}

export interface UpdateExceptionPayload {
  readonly date?: string;
  readonly type?: ExceptionType;
  readonly reason?: string | null;
  readonly ranges?: BusinessExceptionRange[];
}

export interface IBusinessExceptionService {
  list(params?: { from?: string; to?: string }): Promise<BusinessException[]>;
  create(payload: CreateExceptionPayload): Promise<BusinessException>;
  update(id: string, payload: UpdateExceptionPayload): Promise<BusinessException>;
  remove(id: string): Promise<void>;
}
