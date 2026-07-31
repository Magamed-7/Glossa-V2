import { Link } from "react-router-dom";
import Skeleton from "../ui/Skeleton.jsx";
import { useApi } from "../../lib/useApi.js";
import { useAuth } from "../../lib/auth/AuthContext.jsx";
import { getLessons } from "../../lib/api/grammar.js";
import { useT } from "../../lib/i18n.jsx";

export default function GrammarRoadmap() {
  const t = useT();
  const { languages } = useAuth();
  const targetLevel = languages?.find((l) => l.is_target)?.level || "A1";

  const { data: lessons, loading } = useApi(
    () => getLessons({ level: targetLevel, limit: 100 }),
    [targetLevel]
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-section-gap">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!lessons || lessons.length === 0) return null;

  const groups = new Map();
  lessons.forEach((lesson) => {
    const key = lesson.unit || t("grammar.otherUnit");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(lesson);
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-section-gap">
      {Array.from(groups.entries()).map(([unit, unitLessons]) => (
        <div key={unit} className="neo-card p-6">
          <h3 className="font-headline text-headline-md mb-4">{unit}</h3>
          <ul className="space-y-2">
            {unitLessons.map((lesson) => (
              <li key={lesson.id}>
                <Link
                  to={`/grammar/${lesson.id}`}
                  className="font-body text-body-md hover:text-secondary hover:underline underline-offset-4"
                >
                  {lesson.topic}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
