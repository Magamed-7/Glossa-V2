import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/layout/AuthLayout.jsx";
import Field from "../components/ui/Field.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";
import * as authApi from "../lib/api/auth.js";
import { errorText } from "../lib/api/errorText.js";
import { useAuth } from "../lib/auth/AuthContext.jsx";
import { useT } from "../lib/i18n.jsx";

export default function VerifyEmail() {
  const t = useT();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [code, setCode] = useState(location.state?.devCode || "");
  const [devCode, setDevCode] = useState(location.state?.devCode || null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await authApi.verifyEmail({ code });
      setSuccess(true);
      await refreshUser();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function onResend() {
    setError(null);
    setResending(true);

    try {
      const result = await authApi.resendVerification();
      setCooldown(60);
      if (result?.dev_verification_code) {
        setDevCode(result.dev_verification_code);
        setCode(result.dev_verification_code);
      }
    } catch (err) {
      if (err.status === 429 && err.message) {
        const match = /(\d+)/.exec(err.message);
        setCooldown(match ? Number(match[1]) : 60);
      }
      setError(errorText(err));
    } finally {
      setResending(false);
    }
  }

  if (success) {
    return (
      <AuthLayout>
        <div className="w-full max-w-lg bg-surface border-2 border-navy p-8 md:p-12 text-center">
          <h1 className="font-headline text-headline-md text-navy uppercase tracking-widest mb-4">
            {t("auth.verifyEmail.verifiedTitle")}
          </h1>
          <p className="font-body text-body-md text-on-surface-variant mb-8">
            {t("auth.verifyEmail.verifiedDescription")}
          </p>
          <NeoButton onClick={() => navigate("/dashboard")}>{t("auth.verifyEmail.continue")}</NeoButton>
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
            {t("auth.verifyEmail.title")}
          </h1>
          <p className="font-body text-body-md text-on-surface-variant mt-4 max-w-sm">
            {t("auth.verifyEmail.description")}
          </p>
        </div>

        <form className="space-y-8" onSubmit={onSubmit}>
          <Field
            label={t("auth.verifyEmail.codeLabel")}
            marker="bg-mustard"
            icon="pin"
            name="code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />

          {devCode && (
            <p className="font-label text-label-md text-outline-variant -mt-4">
              {t("auth.verifyEmail.devCodeHint", { code: devCode })}
            </p>
          )}

          {error && (
            <p role="alert" className="font-label text-label-md text-error">
              {error}
            </p>
          )}

          <NeoButton type="submit" className="w-full" loading={submitting}>
            {t("auth.verifyEmail.verify")}
          </NeoButton>

          <div className="flex justify-between items-center pt-4 border-t-2 border-surface-container-highest">
            <button
              type="button"
              className="font-label text-label-md text-outline hover:text-secondary transition-colors underline disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onResend}
              disabled={cooldown > 0 || resending}
            >
              {cooldown > 0 ? t("auth.verifyEmail.resendIn", { n: cooldown }) : t("auth.verifyEmail.resend")}
            </button>
            <button
              type="button"
              className="font-label text-label-md text-outline hover:text-secondary transition-colors underline"
              onClick={() => navigate("/dashboard")}
            >
              {t("auth.verifyEmail.skip")}
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
}
