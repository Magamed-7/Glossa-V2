import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NeoCard from "../ui/NeoCard.jsx";
import NeoButton from "../ui/NeoButton.jsx";
import Field from "../ui/Field.jsx";
import Modal from "../ui/Modal.jsx";
import DataExport from "./DataExport.jsx";
import * as authApi from "../../lib/api/auth.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";
import { useAuth } from "../../lib/auth/AuthContext.jsx";
import { useT } from "../../lib/i18n.jsx";

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
    <form className="space-y-4" onSubmit={onSubmit}>
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
  );
}

function TwoFactor() {
  const t = useT();
  const toast = useToast();
  const [setupData, setSetupData] = useState(null);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState(null);
  const [disablePassword, setDisablePassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function onStartSetup() {
    setBusy(true);
    try {
      const data = await authApi.setup2fa();
      setSetupData(data);
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function onConfirm(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { backup_codes } = await authApi.confirm2fa({ code });
      setBackupCodes(backup_codes);
      setSetupData(null);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function onDisable(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await authApi.disable2fa({ password: disablePassword });
      toast.success(t("settings.account.twoFactorDisabled"));
      setDisablePassword("");
      setBackupCodes(null);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  if (backupCodes) {
    return (
      <div className="space-y-4">
        <p className="font-body text-body-md">{t("settings.account.backupCodesNotice")}</p>
        <div className="grid grid-cols-2 gap-2 font-ledger">
          {backupCodes.map((c) => (
            <span key={c} className="border-2 border-tertiary px-3 py-2">
              {c}
            </span>
          ))}
        </div>
        <NeoButton variant="ghost" size="md" onClick={() => setBackupCodes(null)}>
          {t("settings.account.done")}
        </NeoButton>
      </div>
    );
  }

  if (setupData) {
    return (
      <form className="space-y-4" onSubmit={onConfirm}>
        <p className="font-body text-body-md">{t("settings.account.addSecretNotice")}</p>
        <p className="font-ledger border-2 border-tertiary px-4 py-3 break-all">{setupData.secret}</p>
        <Field label={t("settings.account.codeLabel")} maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} />
        {error && (
          <p role="alert" className="font-label text-label-md text-error">
            {error}
          </p>
        )}
        <NeoButton type="submit" size="md" loading={busy}>
          {t("settings.account.confirm")}
        </NeoButton>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <NeoButton size="md" loading={busy} onClick={onStartSetup}>
        {t("settings.account.enable2fa")}
      </NeoButton>
      <details>
        <summary className="font-label text-label-md uppercase cursor-pointer">{t("settings.account.disable2faSummary")}</summary>
        <form className="space-y-4 mt-4" onSubmit={onDisable}>
          <Field
            label={t("settings.account.passwordLabel")}
            type="password"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            required
          />
          {error && (
            <p role="alert" className="font-label text-label-md text-error">
              {error}
            </p>
          )}
          <NeoButton type="submit" variant="ghost" size="md" loading={busy}>
            {t("settings.account.disable")}
          </NeoButton>
        </form>
      </details>
    </div>
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
      navigate("/login", { replace: true });
    } catch (err) {
      setError(errorText(err));
      setSubmitting(false);
    }
  }

  return (
    <>
      <NeoButton variant="ghost" size="md" onClick={() => setOpen(true)}>
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
    </>
  );
}

export default function AccountSection() {
  const t = useT();
  return (
    <div className="space-y-8">
      <NeoCard>
        <h3 className="font-headline text-headline-md mb-4">{t("settings.account.passwordTitle")}</h3>
        <ChangePassword />
      </NeoCard>
      <NeoCard>
        <h3 className="font-headline text-headline-md mb-4">{t("settings.account.twoFactorTitle")}</h3>
        <TwoFactor />
      </NeoCard>
      <DataExport />
      <NeoCard variant="accent">
        <h3 className="font-headline text-headline-md mb-4">{t("settings.account.dangerZone")}</h3>
        <DeleteAccount />
      </NeoCard>
    </div>
  );
}
