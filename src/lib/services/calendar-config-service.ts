import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import type {
  CalendarConfig,
  ICalendarConfigService,
  UpdateCalendarConfigParams,
} from "./interfaces/calendar-config-service";

class CalendarConfigService implements ICalendarConfigService {
  /**
   * Get the current calendar configuration. Bypasses the Data Cache so
   * edits via update() show up on the next reload without a TTL wait
   * (see business-profile-service for the full rationale).
   */
  async get(): Promise<CalendarConfig> {
    const response = await authFetch("/calendar-config", {
      cache: "no-store",
    });
    return unwrapEnvelope<CalendarConfig>(response);
  }

  /**
   * Update the calendar configuration.
   * @param params - Fields to update
   * @returns Updated calendar configuration
   * @throws Error if validation fails or request fails
   */
  async update(
    params: UpdateCalendarConfigParams,
  ): Promise<CalendarConfig> {
    const response = await authFetch("/calendar-config", {
      method: "PUT",
      body: JSON.stringify(params),
    });
    return unwrapEnvelope<CalendarConfig>(response);
  }
}

export const calendarConfigService = new CalendarConfigService();
