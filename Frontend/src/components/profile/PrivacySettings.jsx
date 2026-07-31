import NeoCard from "../ui/NeoCard.jsx";
import { useApi } from "../../lib/useApi.js";
import { getPrivacy, updatePrivacy } from "../../lib/api/profile.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";

const FIELDS = [
  { key: "show_stories_count", label: "Stories read count", description: "How many stories you've completed." },
  { key: "show_achievements", label: "Achievements", description: "Badges you've earned." },
  { key: "show_current_streak", label: "Current streak", description: "Your active daily streak." },
  { key: "show_best_streak", label: "Best streak", description: "Your all-time longest streak." },
  { key: "show_languages", label: "Languages", description: "Which languages you're learning." },
  { key: "show_language_levels", label: "Language levels", description: "Your CEFR level per language." },
  { key: "show_followers", label: "Followers", description: "Your follower and following counts." },
];

export default function PrivacySettings() {
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
      <h3 className="font-headline text-headline-md mb-4">Privacy</h3>
      <div className="space-y-4">
        {FIELDS.map((field) => (
          <label key={field.key} className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1"
              checked={privacy[field.key]}
              onChange={() => onToggle(field.key)}
            />
            <span>
              <span className="font-body text-body-md block">{field.label}</span>
              <span className="font-body text-body-md text-on-surface-variant text-sm">{field.description}</span>
            </span>
          </label>
        ))}
      </div>
    </NeoCard>
  );
}
