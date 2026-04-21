import * as Sentry from "@sentry/nextjs";
import {
  ENVIRONMENT,
  IGNORE_ERRORS,
  RELEASE,
  SENTRY_DSN,
  TRACES_SAMPLE_RATE,
  TRACE_PROPAGATION_TARGETS,
  scrubEvent,
} from "@/lib/observability/sentry-init";

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    release: RELEASE,
    tracesSampleRate: TRACES_SAMPLE_RATE,
    tracePropagationTargets: [...TRACE_PROPAGATION_TARGETS],
    sendDefaultPii: false,
    ignoreErrors: [...IGNORE_ERRORS],
    beforeSend: (event) => scrubEvent(event),
    beforeSendTransaction: (event) => scrubEvent(event),
  });
}
