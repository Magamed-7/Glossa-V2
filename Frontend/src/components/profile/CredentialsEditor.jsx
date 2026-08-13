import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import NeoCard from "../ui/NeoCard.jsx";
import NeoButton from "../ui/NeoButton.jsx";
import Icon from "../ui/Icon.jsx";
import Field from "../ui/Field.jsx";
import * as authApi from "../../lib/api/auth.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";
import { useAuth } from "../../lib/auth/AuthContext.jsx";
import { useT } from "../../lib/i18n.jsx";

const CHANGE_COOLDOWN_DAYS = 40;
const DAY_MS = 24 * 60 * 60 * 1000;

function daysRemaining(lastChangedAt) {
  if (!lastChangedAt) return 0;
  const remainingMs = CHANGE_COOLDOWN_DAYS * DAY_MS - (Date.now() - new Date(lastChangedAt).getTime());
  return remainingMs > 0 ? Math.ceil(remainingMs / DAY_MS) : 0;
}

export default function CredentialsEditor() {
  const t = useT();
  const toast = useToast();
  const { user, refreshUser } = useAuth();

  // Username states
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameError, setUsernameError] = useState(null);
  const [usernameBusy, setUsernameBusy] = useState(false);

  // Email states
  const [emailStep, setEmailStep] = useState("idle"); // idle, emailForm, codeForm
  const [emailInput, setEmailInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [emailError, setEmailError] = useState(null);
  const [emailBusy, setEmailBusy] = useState(false);

  const usernameCooldown = daysRemaining(user?.last_username_change_at);
  const emailCooldown = daysRemaining(user?.last_email_change_at);

  // Username handlers
  function startEditingUsername() {
    setUsernameInput(user?.username || "");
    setUsernameError(null);
    setEditingUsername(true);
  }

  async function handleUsernameSubmit(e) {
    e.preventDefault();
    setUsernameError(null);
    setUsernameBusy(true);
    try {
      await authApi.updateMe({ username: usernameInput });
      toast.success(t("settings.account.usernameChanged"));
      await refreshUser();
      setEditingUsername(false);
    } catch (err) {
      setUsernameError(errorText(err));
    } finally {
      setUsernameBusy(false);
    }
  }

  // Email handlers
  function startEmailFlow() {
    setEmailStep("emailForm");
    setEmailInput("");
    setCodeInput("");
    setEmailError(null);
  }

  function cancelEmailFlow() {
    setEmailStep("idle");
    setEmailInput("");
    setCodeInput("");
    setEmailError(null);
  }

  async function handleEmailRequestCode(e) {
    e.preventDefault();
    setEmailError(null);
    setEmailBusy(true);
    try {
      await authApi.requestEmailChange({ new_email: emailInput });
      setEmailStep("codeForm");
    } catch (err) {
      setEmailError(errorText(err));
    } finally {
      setEmailBusy(false);
    }
  }

  async function handleEmailConfirmCode(e) {
    e.preventDefault();
    setEmailError(null);
    setEmailBusy(true);
    try {
      await authApi.confirmEmailChange({ code: codeInput });
      toast.success(t("settings.account.emailChanged"));
      await refreshUser();
      cancelEmailFlow();
    } catch (err) {
      setEmailError(errorText(err));
    } finally {
      setEmailBusy(false);
    }
  }

  return (
    <NeoCard className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-secondary text-on-secondary border-2 border-primary flex items-center justify-center">
          <Icon name="key" className="text-xl" />
        </div>
        <div>
          <h2 className="font-headline text-headline-md leading-none uppercase tracking-tight text-on-surface">
            {t("settings.tabs.account") || "Account"}
          </h2>
          <p className="font-body text-xs text-on-surface-variant mt-1">
            {t("settings.account.footerNote") || "Verify and update your network identity parameters."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Username Panel */}
        <div className="border-2 border-primary bg-surface-container-low p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 bg-mustard"></span>
              <h3 className="font-label text-label-md uppercase tracking-wider">
                {t("settings.account.usernameTitle")}
              </h3>
            </div>

            <AnimatePresence mode="wait">
              {!editingUsername ? (
                <motion.div
                  key="username-display"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="space-y-4"
                >
                  <div className="bg-surface border border-primary p-3 font-ledger text-lg text-secondary select-all">
                    {user?.username}
                  </div>

                  {usernameCooldown > 0 ? (
                    <div className="bg-primary/5 text-primary border-2 border-primary border-dashed p-3 font-body text-xs flex items-start gap-2.5">
                      <Icon name="lock" className="text-sm mt-0.5 text-secondary" />
                      <span>
                        {t("settings.account.changeAvailableIn", { days: usernameCooldown }) ||
                          `You can change this again in ${usernameCooldown} days.`}
                      </span>
                    </div>
                  ) : (
                    <p className="font-body text-xs text-on-surface-variant italic">
                      {t("profile.usernameChangeAllowed") || "Changeable once every 40 days."}
                    </p>
                  )}
                </motion.div>
              ) : (
                <motion.form
                  key="username-form"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  onSubmit={handleUsernameSubmit}
                  className="space-y-4"
                >
                  <Field
                    label={t("settings.account.newUsernameLabel")}
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    required
                    autoFocus
                  />
                  {usernameError && (
                    <div className="flex items-center gap-1.5 text-error font-label text-xs uppercase">
                      <Icon name="error" className="text-sm" />
                      <span>{usernameError}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <NeoButton type="submit" size="sm" loading={usernameBusy}>
                      {t("settings.account.save")}
                    </NeoButton>
                    <NeoButton type="button" variant="ghost" size="sm" onClick={() => setEditingUsername(false)}>
                      {t("settings.account.cancel")}
                    </NeoButton>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {!editingUsername && usernameCooldown === 0 && (
            <div className="mt-6 pt-4 border-t border-primary/10">
              <NeoButton variant="ghost" size="sm" className="w-full text-xs" onClick={startEditingUsername}>
                <Icon name="edit" className="text-xs mr-1" />
                {t("settings.account.changeUsername")}
              </NeoButton>
            </div>
          )}
        </div>

        {/* Email Panel */}
        <div className="border-2 border-primary bg-surface-container-low p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 bg-secondary"></span>
              <h3 className="font-label text-label-md uppercase tracking-wider">
                {t("settings.account.emailTitle")}
              </h3>
            </div>

            <AnimatePresence mode="wait">
              {emailStep === "idle" ? (
                <motion.div
                  key="email-display"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="space-y-4"
                >
                  <div className="bg-surface border border-primary p-3 font-ledger text-base text-secondary overflow-x-auto select-all">
                    {user?.email}
                  </div>

                  {emailCooldown > 0 ? (
                    <div className="bg-primary/5 text-primary border-2 border-primary border-dashed p-3 font-body text-xs flex items-start gap-2.5">
                      <Icon name="lock" className="text-sm mt-0.5 text-secondary" />
                      <span>
                        {t("settings.account.changeAvailableIn", { days: emailCooldown }) ||
                          `You can change this again in ${emailCooldown} days.`}
                      </span>
                    </div>
                  ) : (
                    <p className="font-body text-xs text-on-surface-variant italic">
                      {t("profile.emailChangeAllowed") || "Requires verification. Cooldown applies."}
                    </p>
                  )}
                </motion.div>
              ) : emailStep === "emailForm" ? (
                <motion.form
                  key="email-form"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  onSubmit={handleEmailRequestCode}
                  className="space-y-4"
                >
                  <Field
                    label={t("settings.account.newEmailLabel")}
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    autoFocus
                  />
                  {emailError && (
                    <div className="flex items-center gap-1.5 text-error font-label text-xs uppercase">
                      <Icon name="error" className="text-sm" />
                      <span>{emailError}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <NeoButton type="submit" size="sm" loading={emailBusy}>
                      {t("settings.account.sendCode")}
                    </NeoButton>
                    <NeoButton type="button" variant="ghost" size="sm" onClick={cancelEmailFlow}>
                      {t("settings.account.cancel")}
                    </NeoButton>
                  </div>
                </motion.form>
              ) : (
                <motion.form
                  key="email-code"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  onSubmit={handleEmailConfirmCode}
                  className="space-y-4"
                >
                  <div className="bg-secondary/5 border border-secondary p-3 text-xs font-body leading-relaxed">
                    {t("settings.account.checkNewEmailNotice", { email: emailInput })}
                  </div>
                  <Field
                    label={t("settings.account.codeLabel")}
                    maxLength={6}
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    required
                    autoFocus
                  />
                  {emailError && (
                    <div className="flex items-center gap-1.5 text-error font-label text-xs uppercase">
                      <Icon name="error" className="text-sm" />
                      <span>{emailError}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <NeoButton type="submit" size="sm" loading={emailBusy}>
                      {t("settings.account.confirm")}
                    </NeoButton>
                    <NeoButton type="button" variant="ghost" size="sm" onClick={cancelEmailFlow}>
                      {t("settings.account.cancel")}
                    </NeoButton>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {emailStep === "idle" && emailCooldown === 0 && (
            <div className="mt-6 pt-4 border-t border-primary/10">
              <NeoButton variant="ghost" size="sm" className="w-full text-xs" onClick={startEmailFlow}>
                <Icon name="edit" className="text-xs mr-1" />
                {t("settings.account.changeEmail")}
              </NeoButton>
            </div>
          )}
        </div>

      </div>
    </NeoCard>
  );
}
