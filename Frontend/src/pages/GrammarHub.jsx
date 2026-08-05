import { useNavigate } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader.jsx";
import DecorativeBackground from "../components/ui/DecorativeBackground.jsx";
import Fab from "../components/layout/Fab.jsx";
import FeaturedLesson from "../components/grammar/FeaturedLesson.jsx";
import GrammarRoadmap from "../components/grammar/GrammarRoadmap.jsx";
import WeakTopics from "../components/grammar/WeakTopics.jsx";
import { useApi } from "../lib/useApi.js";
import { useAuth } from "../lib/auth/AuthContext.jsx";
import { getLessons, getWeakTopics } from "../lib/api/grammar.js";
import { useT } from "../lib/i18n.jsx";

export default function GrammarHub() {
  const t = useT();
  const navigate = useNavigate();
  const { languages } = useAuth();
  const rawLevel = languages?.find((l) => l.is_target)?.level || "A1";
  // Контент существует только в диапазоне A1-C2 — у "native" нет своего контента,
  // ищем как для C2 (ближайший реальный уровень).
  const targetLevel = rawLevel === "native" ? "C2" : rawLevel;

  // Ищем реальный урок, соответствующий самой слабой теме, чтобы кнопка вела к настоящему
  // полезному действию, а не была декорацией.
  const { data: nextWeakLesson } = useApi(async () => {
    const [topics, lessons] = await Promise.all([
      getWeakTopics(),
      getLessons({ level: targetLevel, limit: 100 }),
    ]);
    if (topics.length === 0) return null;

    const worst = [...topics].sort((a, b) => b.error_rate - a.error_rate)[0];
    return lessons.find((l) => l.topic === worst.topic) || null;
  }, [targetLevel]);

  return (
    <div className="relative">
      <DecorativeBackground variant="rays" />
      <PageHeader
        eyebrow={t("grammar.eyebrow")}
        title={t("grammar.titleLead")}
        accent={t("grammar.titleAccent")}
        subtitle={t("grammar.subtitle")}
      />
      <FeaturedLesson />
      <GrammarRoadmap />
      <WeakTopics />

      {nextWeakLesson && (
        <Fab
          icon="priority_high"
          label={t("grammar.practiceWeakest")}
          onClick={() => navigate(`/grammar/${nextWeakLesson.id}`)}
        />
      )}
    </div>
  );
}
