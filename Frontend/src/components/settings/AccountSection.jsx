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
  const [setupData, setSetupData] = useState(null);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState(null);
  const [disablePassword, setDisablePassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showDisable, setShowDisable] = useState(false);

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
      setShowDisable(false);
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

      {backupCodes ? (
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
      ) : setupData ? (
        <form className="space-y-4 max-w-sm" onSubmit={onConfirm}>
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
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <NeoButton size="md" loading={busy} onClick={onStartSetup}>
            <Icon name="shield" className="text-sm mr-1" />
            {t("settings.account.enable2fa")}
          </NeoButton>
          <NeoButton variant="ghost" size="md" onClick={() => setShowDisable((v) => !v)}>
            {t("settings.account.disable2faSummary")}
          </NeoButton>
        </div>
      )}

      {showDisable && !setupData && !backupCodes && (
        <form className="space-y-4 mt-6 pt-6 border-t border-dashed border-outline-variant max-w-sm" onSubmit={onDisable}>
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
