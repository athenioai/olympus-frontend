import { validateResetTokenAction } from "./actions";
import { ResetPasswordView } from "./_components/reset-form";

interface ResetPasswordPageProps {
  readonly searchParams: Promise<{ token?: string | string[] }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const raw = params.token;
  const token = Array.isArray(raw) ? raw[0] : (raw ?? "");

  const validation = await validateResetTokenAction(token);

  return <ResetPasswordView token={token} tokenValid={validation.valid} />;
}
