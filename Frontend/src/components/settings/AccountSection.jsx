import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NeoCard from "../ui/NeoCard.jsx";
import NeoButton from "../ui/NeoButton.jsx";
import Icon from "../ui/Icon.jsx";
import Field from "../ui/Field.jsx";
import Modal from "../ui/Modal.jsx";
import DataExport from "./DataExport.jsx";
import * as authApi from "../../lib/api/auth.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";
import { useAuth } from "../../lib/auth/AuthContext.jsx";
import { useT } from "../../lib/i18n.jsx";

function CardHeading({ icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon name={icon} className="text-secondary text-xl" />
      <h3 className="font-headline text-headline-md">{children}</h3>
    </div>
  );
}

const CHANGE_COOLDOWN_DAYS = 40;
const DAY_MS = 24 * 60 * 60 * 1000;

function daysRemaining(lastChangedAt) {
  if (!lastChangedAt) return 0;
  const remainingMs = CHANGE_COOLDOWN_DAYS * DAY_MS - (Date.now() - new Date(lastChangedAt).getTime());
  return remainingMs > 0 ? Math.ceil(remainingMs / DAY_MS) : 0;
}

function ChangeUsername() {
  const t = useT();
  const toast = useToast();
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const remaining = daysRemaining(user?.last_username_change_at);

  function startEditing() {
    setUsername(user?.username || "");
    setError(null);
    setEditing(true);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await authApi.updateMe({ username });
      toast.success(t("settings.account.usernameChanged"));
      await refreshUser();
      setEditing(false);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <NeoCard>
      <CardHeading icon="badge">{t("settings.account.usernameTitle")}</CardHeading>
      {!editing ? (
        <div className="space-y-3">
          <p className="font-ledger text-xl">{user?.username}</p>
          {remaining > 0 ? (
            <p className="font-body text-body-md text-on-surface-variant">
              {t("settings.account.changeAvailableIn", { days: remaining })}
            </p>
          ) : (
            <NeoButton variant="ghost" size="md" onClick={startEditing}>
              {t("settings.account.changeUsername")}
            </NeoButton>
          )}
        </div>
      ) : (
        <form className="space-y-4 max-w-sm" onSubmit={onSubmit}>
          <Field
            label={t("settings.account.newUsernameLabel")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          {error && (
            <p role="alert" className="font-label text-label-md text-error">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <NeoButton type="submit" size="md" loading={busy}>
              {t("settings.account.save")}
            </NeoButton>
            <NeoButton type="button" variant="ghost" size="md" onClick={() => setEditing(false)}>
              {t("settings.account.cancel")}
            </NeoButton>
          </div>
        </form>
      )}
    </NeoCard>
  );
}

function ChangeEmail() {
  const t = useT();
  const toast = useToast();
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState("idle");
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const remaining = daysRemaining(user?.last_email_change_at);

  function start() {
    setStep("email");
    setNewEmail("");
    setCode("");
    setError(null);
  }

  function cancel() {
    setStep("idle");
    setNewEmail("");
    setCode("");
    setError(null);
  }

  async function onRequestCode(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await authApi.requestEmailChange({ new_email: newEmail });
      setStep("code");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function onConfirmCode(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await authApi.confirmEmailChange({ code });
      toast.success(t("settings.account.emailChanged"));
      await refreshUser();
      cancel();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <NeoCard>
      <CardHeading icon="mail">{t("settings.account.emailTitle")}</CardHeading>
      {step === "idle" ? (
        <div className="space-y-3">
          <p className="font-ledger text-xl">{user?.email}</p>
          {remaining > 0 ? (
            <p className="font-body text-body-md text-on-surface-variant">
              {t("settings.account.changeAvailableIn", { days: remaining })}
            </p>
          ) : (
            <NeoButton variant="ghost" size="md" onClick={start}>
              {t("settings.account.changeEmail")}
            </NeoButton>
          )}
        </div>
      ) : step === "email" ? (
        <form className="space-y-4 max-w-sm" onSubmit={onRequestCode}>
          <Field
            label={t("settings.account.newEmailLabel")}
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />
          {error && (
            <p role="alert" className="font-label text-label-md text-error">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <NeoButton type="submit" size="md" loading={busy}>
              {t("settings.account.sendCode")}
            </NeoButton>
            <NeoButton type="button" variant="ghost" size="md" onClick={cancel}>
              {t("settings.account.cancel")}
            </NeoButton>
          </div>
        </form>
      ) : (
        <form className="space-y-4 max-w-sm" onSubmit={onConfirmCode}>
          <p className="font-body text-body-md">{t("settings.account.checkNewEmailNotice", { email: newEmail })}</p>
          <Field label={t("settings.account.codeLabel")} maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} required />
          {error && (
            <p role="alert" className="font-label text-label-md text-error">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <NeoButton type="submit" size="md" loading={busy}>
              {t("settings.account.confirm")}
            </NeoButton>
            <NeoButton type="button" variant="ghost" size="md" onClick={cancel}>
              {t("settings.account.cancel")}
            </NeoButton>
          </div>
        </form>
      )}
    </NeoCard>
  );
}

function ChangePassword() {
  const t = useT();
  const toast = useToast();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authApi.changePassword({ old_password: oldPassword, new_password: newPassword });
      toast.success(t("settings.account.passwordChanged"));
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <NeoCard>
      <CardHeading icon="lock">{t("settings.account.passwordTitle")}</CardHeading>
      <form className="space-y-4 max-w-sm" onSubmit={onSubmit}>
        <Field
          label={t("settings.account.currentPasswordLabel")}
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          required
        />
        <Field
          label={t("settings.account.newPasswordLabel")}
          type="password"
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        {error && (
          <p role="alert" className="font-label text-label-md text-error">
            {error}
          </p>
        )}
        <NeoButton type="submit" size="md" loading={submitting}>
          {t("settings.account.changePassword")}
        </NeoButton>
      </form>
    </NeoCard>
  );
}

function TwoFactor() {
  const t = useT();
  const toast = useToast();
  const { user, refreshUser } = useAuth();
  const [mode, setMode] = useState(null);
  const [step, setStep] = useState("password");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  function startFlow(nextMode) {
    setMode(nextMode);
    setStep("password");
    setPassword("");
    setCode("");
    setError(null);
  }

  function cancel() {
    setMode(null);
    setStep("password");
    setPassword("");
    setCode("");
    setError(null);
  }

  async function onRequestCode(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "enable") await authApi.requestEnable2fa({ password });
      else await authApi.requestDisable2fa({ password });
      setStep("code");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function onConfirmCode(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "enable") await authApi.confirmEnable2fa({ code });
      else await authApi.confirmDisable2fa({ code });
      toast.success(mode === "enable" ? t("settings.account.twoFactorEnabled") : t("settings.account.twoFactorDisabled"));
      await refreshUser();
      cancel();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <NeoCard>
      <CardHeading icon="verified_user">{t("settings.account.twoFactorTitle")}</CardHeading>
      <p className="font-body text-body-md text-on-surface-variant mb-6 max-w-md">
        {t("settings.account.twoFactorDescription")}
      </p>

      {!mode ? (
        user?.is_2fa_enabled ? (
          <NeoButton variant="ghost" size="md" onClick={() => startFlow("disable")}>
            {t("settings.account.disable2faSummary")}
          </NeoButton>
        ) : (
          <NeoButton size="md" onClick={() => startFlow("enable")}>
            <Icon name="shield" className="text-sm mr-1" />
            {t("settings.account.enable2fa")}
          </NeoButton>
        )
      ) : step === "password" ? (
        <form className="space-y-4 max-w-sm" onSubmit={onRequestCode}>
          <Field
            label={t("settings.account.passwordLabel")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && (
            <p role="alert" className="font-label text-label-md text-error">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <NeoButton type="submit" size="md" loading={busy}>
              {t("settings.account.sendCode")}
            </NeoButton>
            <NeoButton type="button" variant="ghost" size="md" onClick={cancel}>
              {t("settings.account.cancel")}
            </NeoButton>
          </div>
        </form>
      ) : (
        <form className="space-y-4 max-w-sm" onSubmit={onConfirmCode}>
          <p className="font-body text-body-md">{t("settings.account.checkEmailNotice")}</p>
          <Field label={t("settings.account.codeLabel")} maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} required />
          {error && (
            <p role="alert" className="font-label text-label-md text-error">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <NeoButton type="submit" size="md" loading={busy}>
              {t("settings.account.confirm")}
            </NeoButton>
            <NeoButton type="button" variant="ghost" size="md" onClick={cancel}>
              {t("settings.account.cancel")}
            </NeoButton>
          </div>
        </form>
      )}
    </NeoCard>
  );
}

function SessionCard() {
  const t = useT();
  const navigate = useNavigate();
  const { logout } = useAuth();

  function onLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <NeoCard>
      <CardHeading icon="devices">{t("settings.account.sessionTitle")}</CardHeading>
      <p className="font-body text-body-md text-on-surface-variant mb-6">{t("settings.account.sessionDescription")}</p>
      <NeoButton variant="ghost" size="md" className="w-full" onClick={onLogout}>
        {t("settings.account.logOut")}
      </NeoButton>
    </NeoCard>
  );
}

function DeleteAccount() {
  const t = useT();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function onDelete(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authApi.deleteMe({ password });
      logout();
      navigate("/", { replace: true });
    } catch (err) {
      setError(errorText(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="border-2 border-secondary bg-secondary/5 p-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon name="warning" className="text-secondary text-xl" />
        <h3 className="font-headline text-headline-md text-secondary">{t("settings.account.dangerZone")}</h3>
      </div>
      <p className="font-body text-body-md text-on-surface-variant mb-6">{t("settings.account.dangerZoneDescription")}</p>
      <NeoButton variant="ghost" size="md" className="w-full border-secondary text-secondary" onClick={() => setOpen(true)}>
        {t("settings.account.deleteAccount")}
      </NeoButton>

      <Modal open={open} onClose={() => setOpen(false)} title={t("settings.account.deleteAccount")}>
        <form className="space-y-4" onSubmit={onDelete}>
          <p className="font-body text-body-md">{t("settings.account.deleteAccountBody")}</p>
          <Field
            label={t("settings.account.confirmPasswordLabel")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && (
            <p role="alert" className="font-label text-label-md text-error">
              {error}
            </p>
          )}
          <NeoButton type="submit" loading={submitting}>
            {t("settings.account.confirmDeletion")}
          </NeoButton>
        </form>
      </Modal>
    </div>
  );
}

export default function AccountSection() {
  const t = useT();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="lg:col-span-2 space-y-6">
        <ChangeUsername />
        <ChangeEmail />
        <ChangePassword />
        <TwoFactor />
        <DataExport />
      </div>
      <div className="space-y-6">
        <SessionCard />
        <DeleteAccount />
        <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant leading-relaxed">
          {t("settings.account.footerNote")}
        </p>
      </div>
    </div>
  );
}
