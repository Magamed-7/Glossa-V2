import { useEffect, useState } from "react";
import NeoButton from "../ui/NeoButton.jsx";
import Field from "../ui/Field.jsx";
import Select from "../ui/Select.jsx";
import { getSettings, updateSettings } from "../../lib/api/settings.js";
import { errorText } from "../../lib/api/errorText.js";
import { useToast } from "../../lib/toast.jsx";

export default function LearningSettings() {
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
      toast.success("Settings saved");
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (!settings) return null;

  return (
    <div className="space-y-6">
      <Field
        label="Daily word goal"
        type="number"
        min="1"
        value={dailyGoal}
        onChange={(e) => setDailyGoal(Number(e.target.value))}
      />
      <Field
        label="Preferred study time (e.g. 08:00)"
        value={studyTime}
        onChange={(e) => setStudyTime(e.target.value)}
      />
      <Select label="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </Select>
      <NeoButton loading={submitting} onClick={onSave}>
        Save
      </NeoButton>
    </div>
  );
}
