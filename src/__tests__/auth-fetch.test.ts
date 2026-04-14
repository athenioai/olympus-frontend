import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

// Must import after mock
const { cookies } = await import("next/headers");
const mockCookies = vi.mocked(cookies);

describe("authFetch", () => {
  const API_URL = "http://localhost:8000";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("NEXT_PUBLIC_API_URL", API_URL);
    // Reset module cache to pick up new env
    vi.resetModules();
  });

  it("should add Authorization header with access token", async () => {
    const mockGet = vi.fn((name: string) => {
      if (name === "access_token") return { value: "test-token" };
      if (name === "refresh_token") return { value: "refresh-token" };
      return undefined;
    });
    mockCookies.mockResolvedValue({ get: mockGet } as never);

    const mockFetch = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", mockFetch);

    const { authFetch } = await import("@/lib/services/auth-fetch");
    await authFetch("/test");

    expect(mockFetch).toHaveBeenCalledWith(
      `${API_URL}/test`,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
  });

  it("should throw NOT_AUTHENTICATED when no access token", async () => {
    const mockGet = vi.fn().mockReturnValue(undefined);
    mockCookies.mockResolvedValue({ get: mockGet } as never);

    const { authFetch } = await import("@/lib/services/auth-fetch");

    await expect(authFetch("/test")).rejects.toThrow("NOT_AUTHENTICATED");
  });

  it("should retry with refreshed token on 401 response", async () => {
    const mockGet = vi.fn((name: string) => {
      if (name === "access_token") return { value: "expired-token" };
      if (name === "refresh_token") return { value: "valid-refresh" };
      return undefined;
    });
    const mockSet = vi.fn();
    mockCookies.mockResolvedValue({
      get: mockGet,
      set: mockSet,
    } as never);

    const refreshResponse = {
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
    };

    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      // Refresh endpoint
      if (url.includes("/auth/refresh")) {
        return Promise.resolve(
          new Response(JSON.stringify(refreshResponse), { status: 200 }),
        );
      }
      // First call returns 401, second succeeds
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(new Response("Unauthorized", { status: 401 }));
      }
      return Promise.resolve(new Response("{}", { status: 200 }));
    });
    vi.stubGlobal("fetch", mockFetch);

    const { authFetch } = await import("@/lib/services/auth-fetch");
    const response = await authFetch("/test");

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(3); // original + refresh + retry
  });
});
