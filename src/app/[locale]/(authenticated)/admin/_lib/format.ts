const CURRENCY_FORMAT = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

const DATE_FORMAT = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

const DATETIME_FORMAT = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export function formatBRL(amount: number): string {
  return CURRENCY_FORMAT.format(amount);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return DATE_FORMAT.format(new Date(iso));
  } catch {
    return "—";
  }
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return DATETIME_FORMAT.format(new Date(iso));
  } catch {
    return "—";
  }
}
