import { authFetch } from "./auth-fetch";
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
    const response = await authFetch("/calendar-config");

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message ?? "Failed to fetch calendar config",
      );
    }

    return response.json();
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message ?? "Failed to update calendar config",
      );
    }

    return response.json();
  }
}

export const calendarConfigService = new CalendarConfigService();
