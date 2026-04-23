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
  /** True when the row was seeded from the national-holiday dataset. */
  readonly isDefault: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PaginatedBusinessExceptions {
  readonly items: BusinessException[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

export interface ListBusinessExceptionsParams {
  readonly page?: number;
  readonly limit?: number;
  readonly type?: ExceptionType;
  /** YYYY-MM-DD. */
  readonly dateFrom?: string;
  readonly dateTo?: string;
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
  list(
    params?: ListBusinessExceptionsParams,
  ): Promise<PaginatedBusinessExceptions>;
  create(payload: CreateExceptionPayload): Promise<BusinessException>;
  update(id: string, payload: UpdateExceptionPayload): Promise<BusinessException>;
  remove(id: string): Promise<void>;
}
