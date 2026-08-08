import { useEffect, useState } from "react";
import NeoCard from "../ui/NeoCard.jsx";
import NeoButton from "../ui/NeoButton.jsx";
import Icon from "../ui/Icon.jsx";
import Field from "../ui/Field.jsx";
import Select from "../ui/Select.jsx";
import { getSettings, updateSettings } from "../../lib/api/settings.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";
import { useT } from "../../lib/i18n.jsx";

export default function LearningSettings() {
  const t = useT();
  const toast = useToast();
  const [settings, setSettings] = useState(null);
  const [dailyGoal, setDailyGoal] = useState(10);
  const [studyTime, setStudyTime] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getSettings().then((data) => {
      setSettings(data);
      setDailyGoal(data.daily_goal);
      setStudyTime(data.study_time || "");
      setDifficulty(data.difficulty);
    });
  }, []);

  async function onSave() {
    setSubmitting(true);
    try {
      const updated = await updateSettings({
        daily_goal: dailyGoal,
        study_time: studyTime || null,
        difficulty,
      });
      setSettings(updated);
      toast.success(t("settings.learning.saved"));
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (!settings) return null;

  return (
    <NeoCard>
      <div className="flex items-center gap-3 mb-6">
        <Icon name="school" className="text-secondary text-2xl" />
        <h3 className="font-headline text-headline-md">{t("settings.learning.title")}</h3>
      </div>
      <div className="border-t-2 border-tertiary mb-6" />

      <div className="space-y-6 max-w-md">
        <Field
          label={t("settings.learning.dailyGoalLabel")}
          type="number"
          min="1"
          value={dailyGoal}
          onChange={(e) => setDailyGoal(Number(e.target.value))}
        />
        <Field
          label={t("settings.learning.studyTimeLabel")}
          value={studyTime}
          onChange={(e) => setStudyTime(e.target.value)}
        />
        <Select label={t("settings.learning.difficultyLabel")} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="easy">{t("settings.learning.difficultyOptions.easy")}</option>
          <option value="medium">{t("settings.learning.difficultyOptions.medium")}</option>
          <option value="hard">{t("settings.learning.difficultyOptions.hard")}</option>
        </Select>
        <NeoButton size="md" loading={submitting} onClick={onSave}>
          {t("settings.learning.save")}
        </NeoButton>
      </div>
    </NeoCard>
  );
}
