import Icon from "../ui/Icon.jsx";

const BG = {
  backgroundColor: "#fcf9f6",
  backgroundImage: "radial-gradient(#c6c6cd 1.5px, transparent 1.5px)",
  backgroundSize: "24px 24px",
};

export default function QuizResults({ result, title, passed, lang, onRetry, onBack, retryLabel, backLabel }) {
  const pct = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
  const perfect = pct === 100;
  const showPassFail = passed !== undefined;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20" style={BG}>
      <div className="w-full max-w-2xl">
        <div className="bg-surface border-2 border-on-surface shadow-[8px_8px_0px_0px_#b90538] p-8 md:p-12 mb-6">
          <span className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface-variant block mb-4">
            {lang === "ru" ? "Результаты" : lang === "tg" ? "Натиҷаҳо" : "Results"}
          </span>
          <h2 className="font-headline text-3xl font-bold text-on-surface mb-6 leading-tight">
            {title}
          </h2>

          <div className="flex items-end gap-2 mb-2">
            <span className="font-headline text-[96px] leading-none font-bold text-secondary">{pct}</span>
            <span className="font-headline text-5xl font-bold text-secondary mb-2">%</span>
          </div>
          <p className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant font-bold mb-4">
            {result.correct} / {result.total}{" "}
            {lang === "ru" ? "верных ответов" : lang === "tg" ? "ҷавобҳои дуруст" : "correct"}
          </p>

          <div className="w-full h-4 border-2 border-on-surface bg-surface-container">
            <div className="h-full bg-secondary transition-all" style={{ width: `${pct}%` }} />
          </div>

          {showPassFail && (
            <p className={`font-label text-[11px] uppercase tracking-widest font-bold mt-4 flex items-center gap-2 ${passed ? "text-secondary" : "text-on-surface-variant"}`}>
              <Icon name={passed ? "verified" : "cancel"} className="text-base" />
              {passed
                ? (lang === "ru" ? "Тест пройден" : lang === "tg" ? "Имтиҳон супорида шуд" : "Test passed")
                : (lang === "ru" ? "Нужно 75% для прохождения — попробуй ещё раз" : lang === "tg" ? "Барои гузаштан 75% лозим аст — бори дигар кӯшиш кун" : "75% needed to pass — try again")}
            </p>
          )}

          {!showPassFail && perfect && (
            <p className="font-label text-[10px] uppercase tracking-widest font-bold text-secondary mt-3 flex items-center gap-2">
              <Icon name="star" className="text-base" />
              {lang === "ru" ? "Идеально!" : lang === "tg" ? "Олиҷаноб!" : "Perfect score!"}
            </p>
          )}
        </div>

        <div className="space-y-3 mb-6">
          {result.results.map((q) => (
            <div
              key={q.id}
              className={`border-2 border-on-surface p-5 bg-surface shadow-[3px_3px_0px_0px_#000] flex gap-4 items-start border-l-4 ${
                q.is_correct ? "border-l-[#4caf50]" : "border-l-secondary"
              }`}
            >
              <Icon
                name={q.is_correct ? "check_circle" : "cancel"}
                className={`text-xl mt-0.5 shrink-0 ${q.is_correct ? "text-[#4caf50]" : "text-secondary"}`}
              />
              <div className="min-w-0">
                <p className="font-body text-sm text-on-surface leading-relaxed mb-1">{q.text}</p>
                <p className="font-label text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">
                  {lang === "ru" ? "Правильно: " : lang === "tg" ? "Дуруст: " : "Correct: "}
                  <span className="text-on-surface normal-case">{q.answer}</span>
                </p>
                {q.explanation && (
                  <p className="font-body text-xs text-on-surface-variant mt-1 italic">{q.explanation}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 bg-secondary text-surface border-2 border-on-surface py-4 font-label text-[11px] uppercase tracking-widest font-bold shadow-[4px_4px_0px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Icon name="refresh" className="text-base" />
              {retryLabel || (lang === "ru" ? "Ещё раз" : lang === "tg" ? "Такрор" : "Try Again")}
            </button>
          )}
          <button
            onClick={onBack}
            className="flex-1 bg-surface text-on-surface border-2 border-on-surface py-4 font-label text-[11px] uppercase tracking-widest font-bold shadow-[4px_4px_0px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Icon name="grid_view" className="text-base" />
            {backLabel || (lang === "ru" ? "Назад" : lang === "tg" ? "Бозгашт" : "Back")}
          </button>
        </div>
      </div>
    </div>
  );
}
