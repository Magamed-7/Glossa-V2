import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/layout/AuthLayout.jsx";
import Field from "../components/ui/Field.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useAuth } from "../lib/auth/AuthContext.jsx";
import { errorText } from "../lib/api/errorText.js";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const result = await login({ username, password });

      if (result.requires_2fa) {
        navigate("/login/2fa", { state: { pending_token: result.pending_token, from: location.state?.from } });
        return;
      }

      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-lg bg-surface border-2 border-navy p-8 md:p-12 relative overflow-hidden">
        <div className="flex flex-col items-center mb-10 text-center">
          <span className="font-display text-display-lg text-primary italic mb-2 tracking-tighter">Glossa</span>
          <div className="h-[2px] w-12 bg-secondary mb-4" />
          <h1 className="font-headline text-headline-md text-navy uppercase tracking-widest">
            Identity Verification
          </h1>
          <p className="font-label text-label-md text-outline mt-2 italic">
            EST. 1954 · DIGITAL CLEARANCE REQUIRED
          </p>
        </div>

        <form className="space-y-8" onSubmit={onSubmit}>
          <Field
            label="Agent Identifier"
            marker="bg-mustard"
            icon="fingerprint"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Field
            label="Encryption Key"
            marker="bg-mustard"
            icon="key"
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p role="alert" className="font-label text-label-md text-error">
              {error}
            </p>
          )}

          <NeoButton type="submit" className="w-full flex items-center justify-center gap-3" loading={submitting}>
            <span>Initialize Portal</span>
            <Icon name="arrow_forward" />
          </NeoButton>

          <div className="flex justify-between items-center pt-4 border-t-2 border-surface-container-highest">
            <Link
              className="font-label text-label-md text-outline hover:text-secondary transition-colors underline decoration-mustard decoration-2 underline-offset-4"
              to="/password-reset"
            >
              Forgot access
            </Link>
            <Link
              className="font-label text-label-md text-outline hover:text-secondary transition-colors underline decoration-mustard decoration-2 underline-offset-4"
              to="/register"
            >
              Request Clearance
            </Link>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
