/**
 * Format a date string as relative time (e.g., "<1min", "10min", "2h", "3d", "Jan 15").
 * @param dateStr - ISO 8601 date string
 * @returns Formatted relative time string
 */
export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;

  const MINUTE = 60_000;
  const HOUR = 3_600_000;
  const DAY = 86_400_000;

  if (diffMs < MINUTE) return "<1min";
  if (diffMs < HOUR) return `${Math.floor(diffMs / MINUTE)}min`;
  if (diffMs < DAY) return `${Math.floor(diffMs / HOUR)}h`;
  if (diffMs < DAY * 30) return `${Math.floor(diffMs / DAY)}d`;

  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a date string with locale-aware formatting.
 * @param dateStr - ISO 8601 date string
 * @param locale - BCP 47 locale string (e.g., "pt-BR")
 * @returns Formatted date string (e.g., "15 jan 2026")
 */
export function formatDate(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format a date string as locale-aware time.
 * @param dateStr - ISO 8601 date string
 * @param locale - BCP 47 locale string
 * @returns Formatted time string (e.g., "14:30")
 */
export function formatTime(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get Monday of the week for a given date.
 * @param date - Reference date
 * @returns Date object representing Monday of that week
 */
export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Add days to a date.
 * @param date - Base date
 * @param days - Number of days to add (can be negative)
 * @returns New date with days added
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Format a Brazilian CNPJ number.
 * @param cnpj - Raw CNPJ string (14 digits)
 * @returns Formatted CNPJ (e.g., "12.345.678/0001-90")
 */
export function formatCNPJ(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return cnpj;
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5",
  );
}

/**
 * Format a date as ISO date string (YYYY-MM-DD).
 * @param date - Date object
 * @returns ISO date string
 */
export function formatISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}
