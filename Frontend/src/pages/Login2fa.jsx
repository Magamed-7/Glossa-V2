import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/layout/AuthLayout.jsx";
import Field from "../components/ui/Field.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useAuth } from "../lib/auth/AuthContext.jsx";
import { errorText } from "../lib/api/errorText.js";

export default function Login2fa() {
  const { loginWith2fa } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pendingToken = location.state?.pending_token;

  const [code, setCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [error, setError] = useState(null);
  const [expired, setExpired] = useState(false);
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
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      // pending_token одноразовый и живёт 5 минут — при ошибке он уже недействителен,
      // повторная попытка тем же токеном не сработает, нужно начинать вход заново.
      setExpired(true);
      setError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (expired) {
    return (
      <AuthLayout>
        <div className="w-full max-w-lg bg-surface border-2 border-navy p-8 md:p-12 text-center">
          <h1 className="font-headline text-headline-md text-navy uppercase tracking-widest mb-4">
            Verification Failed
          </h1>
          <p className="font-body text-body-md text-on-surface-variant mb-8">{error}</p>
          <NeoButton onClick={() => navigate("/login")}>Start Over</NeoButton>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-lg bg-surface border-2 border-navy p-8 md:p-12">
        <div className="flex flex-col items-center mb-10 text-center">
          <span className="font-display text-display-lg text-primary italic mb-2 tracking-tighter">Glossa</span>
          <div className="h-[2px] w-12 bg-secondary mb-4" />
          <h1 className="font-headline text-headline-md text-navy uppercase tracking-widest">
            Two-Factor Verification
          </h1>
        </div>

        <form className="space-y-8" onSubmit={onSubmit}>
          <Field
            label={useBackupCode ? "Backup Code" : "Authenticator Code"}
            marker="bg-mustard"
            icon="pin"
            name="code"
            inputMode="text"
            maxLength={useBackupCode ? 8 : 6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />

          <button
            type="button"
            className="font-label text-label-md text-outline hover:text-secondary transition-colors underline"
            onClick={() => {
              setUseBackupCode((v) => !v);
              setCode("");
            }}
          >
            {useBackupCode ? "Use authenticator code instead" : "Use a backup code instead"}
          </button>

          <NeoButton type="submit" className="w-full flex items-center justify-center gap-3" loading={submitting}>
            <span>Verify</span>
            <Icon name="arrow_forward" />
          </NeoButton>
        </form>
      </div>
    </AuthLayout>
  );
}
