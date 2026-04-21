/**
 * Fake JWT helper for e2e. The real backend signs tokens with a secret and
 * the frontend middleware (`proxy.ts`) only decodes the payload to read
 * `exp` — it never verifies the signature. So a token with any "signature"
 * segment works as long as the payload parses and `exp` is in the future.
 */

function base64url(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export interface FakeJwtPayload {
  readonly sub?: string;
  readonly exp?: number;
  readonly role?: "admin" | "user";
  readonly [key: string]: unknown;
}

/**
 * Mint a fake JWT with the given payload. `exp` defaults to one hour from
 * now (seconds). The signature segment is a constant placeholder.
 */
export function mintFakeJwt(payload: FakeJwtPayload = {}): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(
    JSON.stringify({
      sub: "user-admin",
      role: "admin",
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
      ...payload,
    }),
  );
  const signature = "mswfakesig";
  return `${header}.${body}.${signature}`;
}
