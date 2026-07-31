import { useNavigate } from "react-router-dom";
import NeoButton from "../ui/NeoButton.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import { useApi } from "../../lib/useApi.js";
import { useAuth } from "../../lib/auth/AuthContext.jsx";
import { getLessons } from "../../lib/api/grammar.js";
import { useT } from "../../lib/i18n.jsx";

export default function FeaturedLesson() {
  const t = useT();
  const { languages } = useAuth();
  const navigate = useNavigate();
  const targetLevel = languages?.find((l) => l.is_target)?.level || "A1";

  const { data: lessons, loading } = useApi(() => getLessons({ level: targetLevel, limit: 1 }), [targetLevel]);

  if (loading) return <Skeleton className="h-56 mb-section-gap" />;

  const lesson = lessons?.[0];
  if (!lesson) return null;

  return (
    <div className="neo-card-secondary p-8 md:p-12 mb-section-gap">
      <span className="font-label text-label-md uppercase tracking-widest text-secondary">
        {lesson.cefr_level} · {lesson.unit || t("grammar.defaultUnit")}
      </span>
      <h2 className="font-display text-headline-lg mt-4 mb-4">{lesson.topic}</h2>
      {lesson.structure && <p className="font-body text-body-lg text-on-surface-variant mb-2">{lesson.structure}</p>}
      {lesson.tip && <p className="font-body text-body-md italic opacity-70 mb-8">{lesson.tip}</p>}
      <NeoButton onClick={() => navigate(`/grammar/${lesson.id}`)}>{t("grammar.studyThisLesson")}</NeoButton>
    </div>
  );
}
