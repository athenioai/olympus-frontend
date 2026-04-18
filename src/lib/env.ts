/**
 * Environment-derived constants.
 * Centralizes access to NEXT_PUBLIC_API_URL so we have a single place to
 * document defaults and (eventually) validate with Zod.
 */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const IS_PRODUCTION = process.env.NODE_ENV === "production";
