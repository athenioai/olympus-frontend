export interface TimeRange {
  readonly start: string;
  readonly end: string;
}

export interface BusinessHourEntry {
  readonly day: string;
  readonly ranges: TimeRange[];
}

export interface CalendarConfig {
  readonly id: string;
  readonly userId: string;
  readonly businessHours: BusinessHourEntry[];
  readonly slotDurationMinutes: number;
  readonly minAdvanceMinutes: number;
  readonly minCancelAdvanceMinutes: number;
  readonly updatedAt: string;
}

export interface UpdateCalendarConfigParams {
  readonly businessHours?: BusinessHourEntry[];
  readonly slotDurationMinutes?: number;
  readonly minAdvanceMinutes?: number;
  readonly minCancelAdvanceMinutes?: number;
}

export interface ICalendarConfigService {
  get(): Promise<CalendarConfig>;
  update(params: UpdateCalendarConfigParams): Promise<CalendarConfig>;
}
