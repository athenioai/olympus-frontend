import { authFetch } from "./auth-fetch";
import { unwrapEnvelope } from "@/lib/api-envelope";
import { CACHE_TIMES, CACHE_TAGS } from "@/lib/cache-config";
import type {
  CalendarConfig,
  ICalendarConfigService,
  UpdateCalendarConfigParams,
} from "./interfaces/calendar-config-service";

class CalendarConfigService implements ICalendarConfigService {
  /**
   * Get the current calendar configuration.
   * @returns Calendar configuration data
   * @throws Error if the request fails
   */
  async get(): Promise<CalendarConfig> {
    const response = await authFetch("/calendar-config", {
      revalidate: CACHE_TIMES.settings,
      tags: [CACHE_TAGS.calendarConfig],
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
