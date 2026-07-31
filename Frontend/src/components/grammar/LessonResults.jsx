import NeoCard from "../ui/NeoCard.jsx";
import Icon from "../ui/Icon.jsx";
import { useT } from "../../lib/i18n.jsx";

export default function LessonResults({ result }) {
  const t = useT();
  return (
    <div className="space-y-6">
      <NeoCard variant="accent">
        <h3 className="font-headline text-headline-md">
          {t("grammar.scoreOf", { correct: result.correct, total: result.total })}
        </h3>
      </NeoCard>

      {result.results.map((q) => (
        <div key={q.id} className="border-l-2 pl-4 border-secondary">
          {q.text && <p className="font-body text-body-md mb-2">{q.text}</p>}
          <p className="font-label text-label-md uppercase flex items-center gap-2">
            <Icon name="check_circle" className="text-secondary" />
            {t("grammar.correctAnswerPrefix")}{q.answer}
          </p>
          {q.explanation && <p className="font-body text-body-md opacity-70 mt-1">{q.explanation}</p>}
        </div>
      ))}
    </div>
  );
}
