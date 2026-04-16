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
 * Unwrap an API envelope response, throwing on failure.
 * @param response - Fetch Response from the backend
 * @returns The unwrapped data of type T
 * @throws Error with the first error message from the envelope
 */
export async function unwrapEnvelope<T>(response: Response): Promise<T> {
  const envelope: ApiEnvelope<T> = await response.json();

  if (!envelope.success || !envelope.data) {
    const message = envelope.error?.message;
    const errorText = Array.isArray(message) ? message[0] : message;
    throw new Error(errorText ?? "UNKNOWN_ERROR");
  }

  return envelope.data;
}
