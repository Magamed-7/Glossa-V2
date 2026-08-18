import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/layout/AuthLayout.jsx";
import Field from "../components/ui/Field.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useAuth } from "../lib/auth/AuthContext.jsx";
import { errorText } from "../lib/api/errorText.js";
import { useToast } from "../lib/toast.jsx";
import { useT } from "../lib/i18n.jsx";

export default function Register() {
  const t = useT();
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: t("auth.register.passwordMismatch") });
      return;
    }

    setSubmitting(true);

    try {
      const result = await register({ username, email, password });

      if (result.email_sent === false) {
        toast.error(t("auth.register.verificationEmailFailed"));
      }

      // Signing in straight away is a convenience, not a requirement: the code is
      // confirmed by email address. A throttled or failed login must not strand a
      // freshly registered account on the sign-up form.
      await login({ username, password }).catch(() => {});
      navigate("/verify-email", { state: { devCode: result.dev_verification_code, email } });
    } catch (err) {
      if (err.field) {
        setFieldErrors({ [err.field]: err.message });
      } else {
        setError(errorText(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout cancelTo="/">
      <div className="w-full max-w-lg bg-surface border-2 border-navy p-8 md:p-12 relative overflow-hidden">
        <div className="flex flex-col items-center mb-10 text-center">
          <span className="font-display text-display-lg text-primary italic mb-2 tracking-tighter">Glossa</span>
          <div className="h-[2px] w-12 bg-secondary mb-4" />
          <h1 className="font-headline text-headline-md text-navy uppercase tracking-widest">
            {t("auth.register.title")}
          </h1>
          <p className="font-label text-label-md text-outline mt-2 italic">{t("auth.register.subtitle")}</p>
        </div>

        <form className="space-y-8" onSubmit={onSubmit}>
          <Field
            label={t("auth.register.identifierLabel")}
            marker="bg-mustard"
            icon="badge"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={fieldErrors.username}
            required
          />
          <Field
            label={t("auth.register.contactLabel")}
            marker="bg-mustard"
            icon="mail"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            required
          />
          <Field
            label={t("auth.register.keyLabel")}
            marker="bg-mustard"
            icon="key"
            type="password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            required
          />
          <Field
            label={t("auth.register.confirmKeyLabel")}
            marker="bg-mustard"
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={fieldErrors.confirmPassword}
            required
          />

          {error && (
            <p role="alert" className="font-label text-label-md text-error">
              {error}
            </p>
          )}

          <NeoButton type="submit" className="w-full flex items-center justify-center gap-3" loading={submitting}>
            <span>{t("auth.register.submit")}</span>
            <Icon name="arrow_forward" />
          </NeoButton>

          <div className="flex justify-center pt-4 border-t-2 border-surface-container-highest">
            <Link
              className="font-label text-label-md text-outline hover:text-secondary transition-colors underline decoration-mustard decoration-2 underline-offset-4"
              to="/login"
            >
              {t("auth.register.haveClearance")}
            </Link>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
