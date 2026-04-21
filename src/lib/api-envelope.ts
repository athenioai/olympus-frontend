/**
 * Standard API response envelope from the backend.
 * All backend endpoints wrap responses in this format.
 */
export interface ApiEnvelope<T> {
  readonly success: boolean;
  readonly data: T | null;
  readonly error: {
    readonly code: string;
    readonly message: string | readonly string[];
  } | null;
  readonly meta: {
    readonly requestId: string;
  };
}

/**
 * Error thrown when the backend envelope reports a failure.
 * Carries the original error code and HTTP status so callers
 * can branch on specific backend conditions (e.g. 409, 410, 404).
 */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

/**
 * Unwrap an API envelope response, throwing on failure.
 *
 * When `success: true`, the payload is returned as-is — including `null`,
 * which is the normal confirmation shape for DELETE and other endpoints
 * that have nothing to return. Callers that need non-null data should
 * check or type the return as nullable; turning `data: null` into an
 * ApiError here broke every soft-delete flow in the app.
 *
 * @param response - Fetch Response from the backend
 * @returns The unwrapped data of type T (may be null when the endpoint
 * contract is `success: true, data: null`)
 * @throws ApiError with the code/status from the envelope when
 * `success: false`
 */
export async function unwrapEnvelope<T>(response: Response): Promise<T> {
  const envelope: ApiEnvelope<T> = await response.json();

  if (!envelope.success) {
    const message = envelope.error?.message;
    const errorText = Array.isArray(message) ? message[0] : message;
    throw new ApiError(
      errorText ?? "UNKNOWN_ERROR",
      envelope.error?.code ?? "UNKNOWN_ERROR",
      response.status,
    );
  }

  return envelope.data as T;
}
