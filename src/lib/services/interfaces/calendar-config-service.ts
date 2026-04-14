export interface BusinessHour {
  readonly day: string;
  readonly schedule: string;
}

export interface CalendarConfig {
  readonly id: string;
  readonly user_id: string;
  readonly business_hours: BusinessHour[];
  readonly slot_duration_minutes: number;
  readonly min_advance_hours: number;
  readonly min_cancel_advance_hours: number;
  readonly updated_at: string;
}

export interface UpdateCalendarConfigParams {
  readonly business_hours?: BusinessHour[];
  readonly slot_duration_minutes?: number;
  readonly min_advance_hours?: number;
  readonly min_cancel_advance_hours?: number;
}

export interface ICalendarConfigService {
  get(): Promise<CalendarConfig>;
  update(params: UpdateCalendarConfigParams): Promise<CalendarConfig>;
}
