/**
 * Formats a number as Brazilian Real currency (e.g., "R$ 1.234").
 * Currency is always BRL (the platform operates in Brazil); only the
 * thousands/decimal separator follows the user's locale.
 */
export function fmtBRL(value: number, locale = "pt-BR"): string {
  return `R$\u00A0${Math.round(value).toLocaleString(locale)}`;
}
