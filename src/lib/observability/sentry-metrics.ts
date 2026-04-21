import * as Sentry from "@sentry/nextjs";

type AttributeValue = string | number | boolean;
export type MetricAttributes = Readonly<Record<string, AttributeValue>>;

export type DistributionUnit =
  | "millisecond"
  | "second"
  | "byte"
  | "kilobyte"
  | "ratio"
  | "none";

export interface DistributionOptions {
  readonly unit: DistributionUnit;
  readonly attributes?: MetricAttributes;
}

export interface CounterOptions {
  readonly attributes?: MetricAttributes;
}

export interface GaugeOptions {
  readonly attributes?: MetricAttributes;
}

function toSnakeCase(key: string): string {
  return key
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase();
}

function normalizeAttributes(
  attributes: MetricAttributes | undefined,
): Record<string, AttributeValue> | undefined {
  if (!attributes) return undefined;
  const out: Record<string, AttributeValue> = {};
  for (const [key, value] of Object.entries(attributes)) {
    out[toSnakeCase(key)] = value;
  }
  return out;
}

function isEnabled(): boolean {
  return Sentry.getClient() !== undefined;
}

/**
 * Emit a counter metric. Values accumulate as discrete events.
 * No-op when the Sentry client is absent (missing DSN in dev/preview).
 * @param name - Metric name following `<module>.<action>` snake_case convention.
 * @param value - Increment amount (default 1).
 * @param options - Optional low-cardinality attributes.
 */
export function counter(
  name: string,
  value: number = 1,
  options: CounterOptions = {},
): void {
  if (!isEnabled()) return;
  try {
    Sentry.metrics.count(name, value, {
      attributes: normalizeAttributes(options.attributes),
    });
  } catch {
    // Metrics emission must never crash the app.
  }
}

/**
 * Emit a distribution metric for latencies, sizes, or other sampled values.
 * @param name - Metric name.
 * @param value - Sampled numeric value.
 * @param options - Unit (required) and optional attributes.
 */
export function distribution(
  name: string,
  value: number,
  options: DistributionOptions,
): void {
  if (!isEnabled()) return;
  try {
    Sentry.metrics.distribution(name, value, {
      unit: options.unit,
      attributes: normalizeAttributes(options.attributes),
    });
  } catch {
    // Swallow to preserve app stability.
  }
}

/**
 * Emit a gauge metric representing the current value of something.
 * @param name - Metric name.
 * @param value - Current value.
 * @param options - Optional attributes.
 */
export function gauge(
  name: string,
  value: number,
  options: GaugeOptions = {},
): void {
  if (!isEnabled()) return;
  try {
    Sentry.metrics.gauge(name, value, {
      attributes: normalizeAttributes(options.attributes),
    });
  } catch {
    // Swallow to preserve app stability.
  }
}
