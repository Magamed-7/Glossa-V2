import { Link } from "react-router-dom";
import AuthLayout from "../components/layout/AuthLayout.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";

// По Frontend/Plan/MISSING_API.md, пункт 2: POST /api/auth/password-reset не существует.
// Не рисуем нерабочую форму — честная страница вместо неё. Когда бэкенд отдаст
// POST /api/auth/password-reset {email} и /password-reset/confirm {email, code, new_password} —
// переделать в двухшаговую форму (email → код + новый пароль).
export default function PasswordReset() {
  return (
    <AuthLayout>
      <div className="w-full max-w-lg bg-surface border-2 border-navy p-8 md:p-12 text-center">
        <span className="font-display text-display-lg text-primary italic mb-2 tracking-tighter block">
          Glossa
        </span>
        <div className="h-[2px] w-12 bg-secondary mb-6 mx-auto" />
        <h1 className="font-headline text-headline-md text-navy uppercase tracking-widest mb-4">
          Password Recovery Unavailable
        </h1>
        <p className="font-body text-body-md text-on-surface-variant mb-8">
          Self-service password recovery isn't available yet. If you've lost access to your account,
          please contact support and we'll help you regain access.
        </p>
        <Link to="/login">
          <NeoButton variant="ghost">Back to Sign In</NeoButton>
        </Link>
      </div>
    </AuthLayout>
  );
}
