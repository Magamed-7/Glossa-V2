import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/layout/AuthLayout.jsx";
import Field from "../components/ui/Field.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useAuth } from "../lib/auth/AuthContext.jsx";
import { errorText } from "../lib/api/errorText.js";
import { useT } from "../lib/i18n.jsx";

export default function Login2fa() {
  const t = useT();
  const { loginWith2fa } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pendingToken = location.state?.pending_token;

  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!pendingToken) {
    return <Navigate to="/login" replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await loginWith2fa({ pending_token: pendingToken, code });
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (err) {
      // Неверный код больше не сжигает pending_token (Backend/auth_service/users/two_factor.py:
      // verify_login_code удаляет запись только при совпадении) — можно просто дать попробовать
      // снова, пока не истёк 5-минутный TTL, вместо принудительного рестарта логина.
      setError(errorText(err));
      setCode("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-lg bg-surface border-2 border-navy p-8 md:p-12">
        <div className="flex flex-col items-center mb-10 text-center">
          <span className="font-display text-display-lg text-primary italic mb-2 tracking-tighter">Glossa</span>
          <div className="h-[2px] w-12 bg-secondary mb-4" />
          <h1 className="font-headline text-headline-md text-navy uppercase tracking-widest">
            {t("auth.login2fa.title")}
          </h1>
        </div>

        <p className="font-body text-body-md text-on-surface-variant text-center -mt-4 mb-2">
          {t("auth.login2fa.checkEmailNotice")}
        </p>

        <form className="space-y-8" onSubmit={onSubmit}>
          <Field
            label={t("auth.login2fa.codeLabel")}
            marker="bg-mustard"
            icon="pin"
            name="code"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />

          {error && (
            <p role="alert" className="font-label text-label-md text-error text-center">
              {error}
            </p>
          )}

          <NeoButton type="submit" className="w-full flex items-center justify-center gap-3" loading={submitting}>
            <span>{t("auth.login2fa.verify")}</span>
            <Icon name="arrow_forward" />
          </NeoButton>
        </form>
      </div>
    </AuthLayout>
  );
}
