import {
  calendarConfigService,
  agentConfigService,
  financeService,
} from "@/lib/services";
import type {
  CalendarConfig,
  AgentConfig,
  PrepaymentSetting,
} from "@/lib/services";
import { SettingsHub } from "./_components/settings-hub";

/**
 * Settings page — Server Component that fetches calendar config,
 * agent config, and prepayment setting in parallel, then delegates
 * rendering to the client SettingsHub.
 */
export default async function SettingsPage() {
  let calendarConfig: CalendarConfig;
  let agentConfig: AgentConfig;
  let prepaymentSetting: PrepaymentSetting;

  try {
    [calendarConfig, agentConfig, prepaymentSetting] = await Promise.all([
      calendarConfigService.get(),
      agentConfigService.getConfig(),
      financeService.getPrepaymentSetting(),
    ]);
  } catch {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-on-surface-variant">
          Failed to load settings. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <SettingsHub
      agentConfig={agentConfig}
      calendarConfig={calendarConfig}
      prepaymentSetting={prepaymentSetting}
    />
  );
}
