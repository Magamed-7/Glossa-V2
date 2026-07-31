import { useState } from "react";
import NeoCard from "../ui/NeoCard.jsx";
import Badge from "../ui/Badge.jsx";
import NeoButton from "../ui/NeoButton.jsx";
import Field from "../ui/Field.jsx";
import Select from "../ui/Select.jsx";
import { addLanguage } from "../../lib/api/profile.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function LanguagesSection({ languages, onAdded }) {
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [language, setLanguage] = useState("");
  const [level, setLevel] = useState("A1");
  const [submitting, setSubmitting] = useState(false);

  // Добавление уже существующего языка создаёт вторую запись is_target=true и ломает
  // проверку уровня писателя на бэкенде (MISSING_API.md, п. 11) — не даём создать дубль
  // из собственного интерфейса, пока бэкенд не делает upsert сам.
  const alreadyAdded = (languages || []).some(
    (l) => l.language.toLowerCase() === language.trim().toLowerCase()
  );

  async function onSubmit(e) {
    e.preventDefault();
    if (alreadyAdded) return;

    setSubmitting(true);
    try {
      await addLanguage({ language, level, is_target: true });
      setLanguage("");
      setAdding(false);
      onAdded();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <NeoCard>
      <h3 className="font-headline text-headline-md mb-4">Languages</h3>
      <div className="flex flex-wrap gap-3 mb-4">
        {(languages || []).map((lang) => (
          <span key={lang.id} className="flex items-center gap-2 border-2 border-tertiary px-3 py-1">
            <span className="font-body text-body-md">{lang.language}</span>
            <Badge level={lang.level} className="text-[10px] px-2 py-0.5" />
          </span>
        ))}
      </div>

      {adding ? (
        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label="Language" value={language} onChange={(e) => setLanguage(e.target.value)} required />
          <Select label="Level" value={level} onChange={(e) => setLevel(e.target.value)}>
            {CEFR_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
          {alreadyAdded && (
            <p className="font-label text-label-md text-error">
              You already have this language — remove it first to change its level.
            </p>
          )}
          <div className="flex gap-3">
            <NeoButton type="submit" size="md" loading={submitting} disabled={alreadyAdded}>
              Add
            </NeoButton>
            <NeoButton type="button" variant="ghost" size="md" onClick={() => setAdding(false)}>
              Cancel
            </NeoButton>
          </div>
        </form>
      ) : (
        <NeoButton variant="ghost" size="md" onClick={() => setAdding(true)}>
          Add Language
        </NeoButton>
      )}
    </NeoCard>
  );
}
