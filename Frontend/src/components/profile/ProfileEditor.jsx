import { useState } from "react";
import NeoCard from "../ui/NeoCard.jsx";
import TextArea from "../ui/TextArea.jsx";
import NeoButton from "../ui/NeoButton.jsx";
import Icon from "../ui/Icon.jsx";
import { updateMyProfile } from "../../lib/api/profile.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";
import { useT } from "../../lib/i18n.jsx";

export default function ProfileEditor({ profile, onUpdated }) {
  const t = useT();
  const toast = useToast();
  const [bio, setBio] = useState(profile.bio || "");
  const [interests, setInterests] = useState(profile.interests || []);
  const [interestInput, setInterestInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [savingInterests, setSavingInterests] = useState(false);

  // Интересы сохраняются сразу при добавлении/удалении плашки, а не только по клику на
  // "Сохранить изменения" — иначе Enter (добавляет плашку локально) легко принять за
  // сохранение и потерять список при обновлении страницы, так и не нажав кнопку ниже.
  async function persistInterests(previous, next) {
    setSavingInterests(true);
    try {
      const updated = await updateMyProfile({ bio, interests: next });
      onUpdated(updated);
    } catch (err) {
      setInterests(previous);
      toast.error(errorText(err));
    } finally {
      setSavingInterests(false);
    }
  }

  function addInterest(e) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const value = interestInput.trim();
    if (!value || interests.includes(value)) return;
    const next = [...interests, value];
    setInterests(next);
    setInterestInput("");
    persistInterests(interests, next);
  }

  function removeInterest(value) {
    const next = interests.filter((i) => i !== value);
    setInterests(next);
    persistInterests(interests, next);
  }

  async function onSave() {
    setSubmitting(true);
    try {
      const updated = await updateMyProfile({ bio, interests });
      onUpdated(updated);
      toast.success(t("profile.updated"));
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <NeoCard>
      <h3 className="font-headline text-headline-md mb-4">{t("profile.editTitle")}</h3>
      <TextArea label={t("profile.bioLabel")} value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="mb-4" />

      <label className="block font-label text-label-md uppercase mb-2">{t("profile.interests")}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {interests.map((interest) => (
          <span
            key={interest}
            className="flex items-center gap-1 bg-secondary-container text-on-secondary-container border-2 border-tertiary px-3 py-1 font-label text-label-md"
          >
            {interest}
            <button type="button" onClick={() => removeInterest(interest)} aria-label={t("profile.removeInterest", { interest })}>
              <Icon name="close" className="text-sm" />
            </button>
          </span>
        ))}
      </div>
      <input
        className="w-full bg-surface-container-low border-2 border-tertiary px-4 py-2 font-body text-body-md outline-none focus:border-secondary mb-4"
        placeholder={t("profile.interestsPlaceholder")}
        value={interestInput}
        onChange={(e) => setInterestInput(e.target.value)}
        onKeyDown={addInterest}
      />

      <NeoButton onClick={onSave} loading={submitting}>
        {t("profile.saveChanges")}
      </NeoButton>
    </NeoCard>
  );
}
