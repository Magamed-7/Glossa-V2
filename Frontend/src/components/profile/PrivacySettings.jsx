import NeoCard from "../ui/NeoCard.jsx";
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

  async function onToggle(key) {
    const next = { [key]: !privacy[key] };
    try {
      await updatePrivacy(next);
      reload();
    } catch (err) {
      toast.error(errorText(err));
    }
  }

  if (!privacy) return null;

  return (
    <NeoCard>
      <h3 className="font-headline text-headline-md mb-4">{t("profile.privacy.title")}</h3>
      <div className="space-y-4">
        {FIELD_KEYS.map((field) => (
          <label key={field.key} className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1"
              checked={privacy[field.key]}
              onChange={() => onToggle(field.key)}
            />
            <span>
              <span className="font-body text-body-md block">{t(`profile.privacy.${field.i18nKey}.label`)}</span>
              <span className="font-body text-body-md text-on-surface-variant text-sm">
                {t(`profile.privacy.${field.i18nKey}.description`)}
              </span>
            </span>
          </label>
        ))}
      </div>
    </NeoCard>
  );
}
