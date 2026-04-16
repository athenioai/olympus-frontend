export interface BusinessHour {
  readonly day: string;
  readonly schedule: string;
}

export interface CalendarConfig {
  readonly id: string;
  readonly userId: string;
  readonly businessHours: BusinessHour[];
  readonly slotDurationMinutes: number;
  readonly minAdvanceHours: number;
  readonly minCancelAdvanceHours: number;
  readonly updatedAt: string;
}

export interface UpdateCalendarConfigParams {
  readonly businessHours?: BusinessHour[];
  readonly slotDurationMinutes?: number;
  readonly minAdvanceHours?: number;
  readonly minCancelAdvanceHours?: number;
}

export interface ICalendarConfigService {
  get(): Promise<CalendarConfig>;
  update(params: UpdateCalendarConfigParams): Promise<CalendarConfig>;
}
