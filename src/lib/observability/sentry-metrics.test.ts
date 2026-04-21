import { beforeEach, describe, expect, it, vi } from "vitest";

const count = vi.fn();
const dist = vi.fn();
const gaugeFn = vi.fn();
const getClient = vi.fn();

vi.mock("@sentry/nextjs", () => ({
  getClient: () => getClient(),
  metrics: {
    count: (...args: unknown[]) => count(...args),
    distribution: (...args: unknown[]) => dist(...args),
    gauge: (...args: unknown[]) => gaugeFn(...args),
  },
}));

import {
  counter,
  distribution,
  gauge,
} from "./sentry-metrics";

describe("sentry-metrics facade", () => {
  beforeEach(() => {
    count.mockReset();
    dist.mockReset();
    gaugeFn.mockReset();
    getClient.mockReset();
  });

  describe("when client is absent", () => {
    beforeEach(() => {
      getClient.mockReturnValue(undefined);
    });

    it("should not call Sentry.metrics.count", () => {
      counter("auth.login_attempt", 1, { attributes: { result: "success" } });

      expect(count).not.toHaveBeenCalled();
    });

    it("should not call Sentry.metrics.distribution", () => {
      distribution("api.fetch", 123, { unit: "millisecond" });

      expect(dist).not.toHaveBeenCalled();
    });

    it("should not call Sentry.metrics.gauge", () => {
      gauge("board.card_count", 42);

      expect(gaugeFn).not.toHaveBeenCalled();
    });
  });

  describe("when client is present", () => {
    beforeEach(() => {
      getClient.mockReturnValue({});
    });

    it("should delegate counter to Sentry.metrics.count with normalized attributes", () => {
      counter("cta.click", 1, {
        attributes: { targetName: "create_lead", isPrimary: true },
      });

      expect(count).toHaveBeenCalledTimes(1);
      expect(count).toHaveBeenCalledWith("cta.click", 1, {
        attributes: { target_name: "create_lead", is_primary: true },
      });
    });

    it("should default counter value to 1", () => {
      counter("auth.login_attempt");

      expect(count).toHaveBeenCalledWith("auth.login_attempt", 1, {
        attributes: undefined,
      });
    });

    it("should delegate distribution with unit and normalized attributes", () => {
      distribution("api.fetch", 250, {
        unit: "millisecond",
        attributes: { endpointName: "leads_list", ok: true },
      });

      expect(dist).toHaveBeenCalledTimes(1);
      expect(dist).toHaveBeenCalledWith("api.fetch", 250, {
        unit: "millisecond",
        attributes: { endpoint_name: "leads_list", ok: true },
      });
    });

    it("should delegate gauge with normalized attributes", () => {
      gauge("board.card_count", 42, { attributes: { columnName: "new" } });

      expect(gaugeFn).toHaveBeenCalledTimes(1);
      expect(gaugeFn).toHaveBeenCalledWith("board.card_count", 42, {
        attributes: { column_name: "new" },
      });
    });

    it("should pass undefined attributes through as undefined", () => {
      counter("chat.ws_state_change", 1);

      expect(count).toHaveBeenCalledWith("chat.ws_state_change", 1, {
        attributes: undefined,
      });
    });

    it("should convert camelCase keys to snake_case, leaving snake_case untouched", () => {
      counter("lead.created", 1, {
        attributes: {
          alreadySnake: "x",
          camelCase: "y",
          ABBRHelper: "z",
        },
      });

      const call = count.mock.calls[0][2] as {
        attributes: Record<string, unknown>;
      };
      expect(call.attributes).toEqual({
        already_snake: "x",
        camel_case: "y",
        abbr_helper: "z",
      });
    });

    it("should swallow SDK errors silently", () => {
      count.mockImplementation(() => {
        throw new Error("transport failed");
      });

      expect(() =>
        counter("auth.login_attempt", 1, { attributes: { result: "error" } }),
      ).not.toThrow();
    });
  });
});
