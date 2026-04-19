import { LiveBulletin } from "./_components/live-bulletin";
import { LoginForm } from "./_components/login-form";

export default function LoginPage() {
  return (
    <div className="auth-editorial">
      <LiveBulletin />
      <LoginForm />
    </div>
  );
}
