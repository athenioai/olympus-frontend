import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api-envelope";

const captureException = vi.fn();

vi.mock("@sentry/nextjs", () => ({
  captureException: (...args: unknown[]) => captureException(...args),
}));

import { captureUnexpected } from "./capture";

describe("captureUnexpected", () => {
  beforeEach(() => {
    captureException.mockReset();
  });

  it("captures an arbitrary Error by default", () => {
    const err = new Error("boom");

    captureUnexpected(err);

    expect(captureException).toHaveBeenCalledTimes(1);
    expect(captureException).toHaveBeenCalledWith(err);
  });

  it("skips NOT_AUTHENTICATED errors unconditionally", () => {
    captureUnexpected(new Error("NOT_AUTHENTICATED"));

    expect(captureException).not.toHaveBeenCalled();
  });

  it("skips errors whose message is in expectedMessages", () => {
    captureUnexpected(new Error("INVALID_CREDENTIALS"), {
      expectedMessages: ["INVALID_CREDENTIALS"],
    });

    expect(captureException).not.toHaveBeenCalled();
  });

  it("skips ApiError with any 4xx status by default", () => {
    captureUnexpected(new ApiError("conflict", "DUPLICATE", 409));
    captureUnexpected(new ApiError("not found", "NOT_FOUND", 404));
    captureUnexpected(new ApiError("bad request", "INVALID", 400));

    expect(captureException).not.toHaveBeenCalled();
  });

  it("captures ApiError with 5xx status by default", () => {
    const err = new ApiError("server down", "INTERNAL", 500);

    captureUnexpected(err);

    expect(captureException).toHaveBeenCalledWith(err);
  });

  it("captures 4xx ApiError when captureClientErrors is true", () => {
    const err = new ApiError("bad request", "INVALID", 400);

    captureUnexpected(err, { captureClientErrors: true });

    expect(captureException).toHaveBeenCalledWith(err);
  });

  it("still skips expectedStatuses when captureClientErrors is true", () => {
    captureUnexpected(new ApiError("conflict", "DUPLICATE", 409), {
      captureClientErrors: true,
      expectedStatuses: [409],
    });

    expect(captureException).not.toHaveBeenCalled();
  });

  it("skips ApiError whose code is in expectedCodes", () => {
    captureUnexpected(new ApiError("oops", "LEAD_DUPLICATE", 400), {
      expectedCodes: ["LEAD_DUPLICATE"],
    });

    expect(captureException).not.toHaveBeenCalled();
  });

  it("captures non-Error values (strings, objects)", () => {
    captureUnexpected("something went wrong");

    expect(captureException).toHaveBeenCalledWith("something went wrong");
  });

  it("swallows SDK failures silently", () => {
    captureException.mockImplementation(() => {
      throw new Error("transport failed");
    });

    expect(() => captureUnexpected(new Error("x"))).not.toThrow();
  });
});
