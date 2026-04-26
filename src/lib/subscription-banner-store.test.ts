import { describe, it, expect, beforeEach } from "vitest";
import {
  getSuspended,
  setSuspended,
  subscribe,
} from "./subscription-banner-store";

describe("subscription-banner-store", () => {
  beforeEach(() => setSuspended(false));

  it("starts cleared", () => {
    expect(getSuspended()).toBe(false);
  });

  it("setSuspended(true) flips and notifies subscribers", () => {
    let calls = 0;
    const unsub = subscribe(() => { calls++; });
    setSuspended(true);
    expect(getSuspended()).toBe(true);
    expect(calls).toBe(1);
    unsub();
  });

  it("setSuspended is idempotent (no notify on equal state)", () => {
    let calls = 0;
    setSuspended(true);
    const unsub = subscribe(() => { calls++; });
    setSuspended(true);
    expect(calls).toBe(0);
    unsub();
  });
});
