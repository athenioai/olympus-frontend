import { describe, it, expect } from "vitest";

describe("Middleware — Token Expiry Check", () => {
  // Test the JWT expiry detection logic in isolation
  function isTokenExpired(token: string, bufferMs: number): boolean {
    try {
      const payload = token.split(".")[1];
      const decoded = JSON.parse(
        Buffer.from(payload, "base64url").toString(),
      );
      return decoded.exp * 1000 - Date.now() < bufferMs;
    } catch {
      return true;
    }
  }

  function createJwt(expInSeconds: number): string {
    const header = Buffer.from(JSON.stringify({ alg: "HS256" })).toString(
      "base64url",
    );
    const payload = Buffer.from(
      JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expInSeconds }),
    ).toString("base64url");
    return `${header}.${payload}.signature`;
  }

  it("should detect expired token", () => {
    const token = createJwt(-60); // expired 60s ago
    expect(isTokenExpired(token, 30_000)).toBe(true);
  });

  it("should detect token within buffer zone", () => {
    const token = createJwt(20); // expires in 20s, buffer is 30s
    expect(isTokenExpired(token, 30_000)).toBe(true);
  });

  it("should detect valid token outside buffer zone", () => {
    const token = createJwt(120); // expires in 2 minutes
    expect(isTokenExpired(token, 30_000)).toBe(false);
  });

  it("should treat malformed token as expired", () => {
    expect(isTokenExpired("not-a-jwt", 30_000)).toBe(true);
  });
});
