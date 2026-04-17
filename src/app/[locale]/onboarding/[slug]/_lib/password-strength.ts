export type PasswordStrength = "weak" | "medium" | "strong";

/**
 * Lightweight strength scoring for the UI indicator.
 * Backend enforces the real minimum (>=8 chars, 1 letter, 1 number).
 */
export function scorePasswordStrength(password: string): PasswordStrength {
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  if (password.length < 8 || !hasLetter || !hasNumber) {
    return "weak";
  }
  if (password.length >= 12 || hasSymbol) {
    return "strong";
  }
  return "medium";
}

export function meetsBackendPolicy(password: string): boolean {
  return (
    password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password)
  );
}
