import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/layout/AuthLayout.jsx";
import Field from "../components/ui/Field.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";
import Icon from "../components/ui/Icon.jsx";
import { errorText } from "../lib/api/errorText.js";
import { useT } from "../lib/i18n.jsx";
import * as authApi from "../lib/api/auth.js";

export default function PasswordReset() {
  const t = useT();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Request Code, 2: Verify Code, 3: Reset Password
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [cooldown, setCooldown] = useState(77);
  const [resendTrigger, setResendTrigger] = useState(0);

  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Timer cooldown effect for Step 2
  useEffect(() => {
    if (step !== 2) return;
    setCooldown(77);
    const interval = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step, resendTrigger]);

  async function onRequestSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await authApi.requestPasswordReset({ email });
      setStep(2);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function onResendCode() {
    setError(null);
    setSubmitting(true);
    try {
      await authApi.requestPasswordReset({ email });
      setResendTrigger((prev) => prev + 1);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function onVerifySubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await authApi.verifyPasswordReset({ email, code });
      setStep(3);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function onResetSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (password !== passwordConfirm) {
      setError(t("auth.register.passwordMismatch"));
      setSubmitting(false);
      return;
    }

    try {
      await authApi.confirmPasswordReset({
        email,
        code,
        password,
        password_confirm: passwordConfirm
      });
      setSuccessMessage(t("auth.passwordReset.resetSuccess"));
      setTimeout(() => {
        navigate("/login");
      }, 2500);
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
          <span className="font-display text-display-lg text-primary italic mb-2 tracking-tighter block">
            {t("auth.passwordReset.brand")}
          </span>
          <div className="h-[2px] w-12 bg-secondary mb-4 mx-auto" />
          <h1 className="font-headline text-headline-md text-navy uppercase tracking-widest">
            {t("auth.passwordReset.title")}
          </h1>
          <p className="font-label text-label-md text-outline mt-2 italic">
            {step === 1
              ? t("auth.passwordReset.description")
              : step === 2
              ? `${t("auth.verifyEmail.description")} (${email})`
              : t("auth.passwordReset.newPasswordLabel")}
          </p>
        </div>

        {successMessage ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-on-surface shadow-[2px_2px_0_0_#000]">
              <Icon name="check" className="text-2xl" />
            </div>
            <p className="font-headline text-lg font-bold text-[#065f46]">
              {successMessage}
            </p>
          </div>
        ) : step === 1 ? (
          /* Step 1: Request Code */
          <form className="space-y-8" onSubmit={onRequestSubmit}>
            <Field
              label={t("auth.passwordReset.emailLabel")}
              marker="bg-mustard"
              icon="mail"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {error && (
              <p role="alert" className="font-label text-label-md text-error">
                {error}
              </p>
            )}

            <NeoButton type="submit" className="w-full flex items-center justify-center gap-3" loading={submitting}>
              <span>{t("auth.passwordReset.sendRequest")}</span>
              <Icon name="arrow_forward" />
            </NeoButton>

            <div className="flex justify-center pt-4 border-t-2 border-surface-container-highest">
              <Link
                className="font-label text-label-md text-outline hover:text-secondary transition-colors underline decoration-mustard decoration-2 underline-offset-4"
                to="/login"
              >
                {t("auth.passwordReset.back")}
              </Link>
            </div>
          </form>
        ) : step === 2 ? (
          /* Step 2: Verify Code */
          <form className="space-y-8" onSubmit={onVerifySubmit}>
            <Field
              label={t("auth.passwordReset.codeLabel")}
              marker="bg-mustard"
              icon="sms"
              type="text"
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />

            {error && (
              <p role="alert" className="font-label text-label-md text-error">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-4">
              <NeoButton type="submit" className="w-full flex items-center justify-center gap-3" loading={submitting}>
                <span>{t("auth.verifyEmail.verify")}</span>
                <Icon name="arrow_forward" />
              </NeoButton>

              <div className="flex justify-between items-center text-xs font-label">
                {cooldown > 0 ? (
                  <span className="text-outline">
                    {t("auth.verifyEmail.resendIn").replace("{n}", cooldown)}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={onResendCode}
                    disabled={submitting}
                    className="text-secondary hover:underline cursor-pointer font-bold"
                  >
                    {t("auth.verifyEmail.resend")}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError(null);
                  }}
                  className="text-outline hover:text-secondary underline decoration-mustard underline-offset-2 cursor-pointer"
                >
                  {t("auth.verifyEmail.resend").toLowerCase() === "resend code" ? "Change Email" : "Изменить почту"}
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Step 3: Enter New Password */
          <form className="space-y-8" onSubmit={onResetSubmit}>
            <Field
              label={t("auth.passwordReset.newPasswordLabel")}
              marker="bg-mustard"
              icon="key"
              type="password"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Field
              label={t("auth.passwordReset.confirmPasswordLabel")}
              marker="bg-mustard"
              icon="key"
              type="password"
              name="password_confirm"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
            />

            {error && (
              <p role="alert" className="font-label text-label-md text-error">
                {error}
              </p>
            )}

            <NeoButton type="submit" className="w-full flex items-center justify-center gap-3" loading={submitting}>
              <span>{t("common.save")}</span>
              <Icon name="check" />
            </NeoButton>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
