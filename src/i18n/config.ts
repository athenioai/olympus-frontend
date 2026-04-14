export const locales = ["pt-BR", "en-US", "es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "pt-BR";
