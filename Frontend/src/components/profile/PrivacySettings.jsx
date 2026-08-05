import { useEffect, useState } from "react";
import NeoCard from "../ui/NeoCard.jsx";
import NeoButton from "../ui/NeoButton.jsx";
import Toggle from "../ui/Toggle.jsx";
import { useApi } from "../../lib/useApi.js";
import { getPrivacy, updatePrivacy } from "../../lib/api/profile.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";
import { useT } from "../../lib/i18n.jsx";

const FIELD_KEYS = [
  { key: "show_stories_count", i18nKey: "storiesRead" },
  { key: "show_achievements", i18nKey: "achievements" },
  { key: "show_current_streak", i18nKey: "currentStreak" },
  { key: "show_best_streak", i18nKey: "bestStreak" },
  { key: "show_languages", i18nKey: "languages" },
  { key: "show_language_levels", i18nKey: "languageLevels" },
  { key: "show_followers", i18nKey: "followers" },
];

export default function PrivacySettings() {
  const t = useT();
  const { data: privacy, reload } = useApi(() => getPrivacy(), []);
  const toast = useToast();
  const [pending, setPending] = useState(null);
  const [committing, setCommitting] = useState(false);

  useEffect(() => {
    if (privacy) setPending(privacy);
  }, [privacy]);

  if (!pending) return null;

  const dirty = FIELD_KEYS.some((field) => pending[field.key] !== privacy[field.key]);

  async function onCommit() {
    setCommitting(true);
    try {
      await updatePrivacy(pending);
      reload();
      toast.success(t("profile.privacy.committed"));
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setCommitting(false);
    }
  }

  return (
    <NeoCard>
      <div className="flex items-start justify-between gap-6 mb-6">
        <div>
          <h3 className="inline-block font-headline text-headline-md text-secondary border-b-2 border-secondary pb-1 mb-4">
            {t("profile.privacy.title")}
          </h3>
          <p className="font-body text-body-md text-on-surface-variant max-w-lg">{t("profile.privacy.subtitle")}</p>
        </div>
        <div className="hidden sm:flex items-center justify-center shrink-0 w-24 h-24 rounded-full border-2 border-secondary rotate-[-8deg]">
          <span className="font-label text-[10px] font-bold uppercase leading-tight tracking-wide text-secondary text-center whitespace-pre-line">
            {t("profile.privacy.classifiedStamp")}
          </span>
        </div>
      </div>

      <div className="border-t-2 border-tertiary" />

      <div>
        {FIELD_KEYS.map((field, i) => (
          <div
            key={field.key}
            className={`flex items-center justify-between gap-6 py-5 ${
              i < FIELD_KEYS.length - 1 ? "border-b border-outline-variant" : ""
            }`}
          >
            <div>
              <span className="font-headline text-body-lg block">{t(`profile.privacy.${field.i18nKey}.label`)}</span>
              <span className="font-body text-body-md text-on-surface-variant text-sm">
                {t(`profile.privacy.${field.i18nKey}.description`)}
              </span>
            </div>
            <Toggle
              checked={pending[field.key]}
              onChange={(next) => setPending({ ...pending, [field.key]: next })}
              label={t(`profile.privacy.${field.i18nKey}.label`)}
            />
          </div>
        ))}
      </div>

      <div className="border-t-2 border-tertiary mt-2 pt-6 flex justify-end">
        <NeoButton variant="primary" size="md" loading={committing} disabled={!dirty} onClick={onCommit}>
          {t("profile.privacy.commit")}
        </NeoButton>
      </div>
    </NeoCard>
  );
}
