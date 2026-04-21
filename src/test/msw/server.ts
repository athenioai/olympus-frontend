import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/**
 * MSW node server. Boots when `MSW_ENABLED=1` via `instrumentation.ts`.
 * Intercepts all `fetch`/`http` requests from the Next.js server process
 * so specs never talk to a real backend.
 */
export const server = setupServer(...handlers);
