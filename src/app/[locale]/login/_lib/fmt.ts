/**
 * Formats a number as Brazilian Real currency (e.g., "R$ 1.234").
 * Rounds to nearest integer; uses non-breaking space between symbol and value.
 */
export function fmtBRL(value: number): string {
  return `R$\u00A0${Math.round(value).toLocaleString("pt-BR")}`;
}
