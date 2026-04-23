/**
 * Standard API response envelope from the backend.
 * All backend endpoints wrap responses in this format.
 */
export interface ApiEnvelopeDetail {
  readonly field: string;
  readonly message: string;
}

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
  readonly details?: readonly ApiEnvelopeDetail[];
}

/**
 * Error thrown when the backend envelope reports a failure.
 * Carries the original error code, HTTP status, and optional per-field
 * validation details so callers can either map the code to a friendly
 * message or surface inline field errors on a form.
 */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: readonly ApiEnvelopeDetail[];

  constructor(
    message: string,
    code: string,
    status: number,
    details: readonly ApiEnvelopeDetail[] = [],
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
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
 * On `success: false`, any `details` array carried alongside the error is
 * attached to the thrown ApiError so form-aware callers can project the
 * validation messages onto the offending inputs.
 *
 * @param response - Fetch Response from the backend
 * @returns The unwrapped data of type T (may be null when the endpoint
 * contract is `success: true, data: null`)
 * @throws ApiError with the code/status/details from the envelope when
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
      envelope.details ?? [],
    );
  }

  return envelope.data as T;
}
