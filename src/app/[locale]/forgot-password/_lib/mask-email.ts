/**
 * Masks the local part of an email for display in confirmation screens.
 * Keeps the first two characters visible, replaces up to 6 more with bullets,
 * preserves the domain in full.
 *
 * @example
 *   maskEmail("rafael@studioapice.com.br") // "ra••••@studioapice.com.br"
 *   maskEmail("a@b.co")                    // "a•@b.co"
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;

  const masked =
    local.length <= 2
      ? `${local[0]}\u2022`
      : `${local.slice(0, 2)}${"\u2022".repeat(Math.min(local.length - 2, 6))}`;

  return `${masked}@${domain}`;
}
