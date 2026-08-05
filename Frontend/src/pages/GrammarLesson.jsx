import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useApi } from "../lib/useApi.js";
import { useAppData } from "../lib/AppDataContext.jsx";
import { errorText } from "../lib/api/errorText.js";
import { getLesson, submitLesson } from "../lib/api/grammar.js";
import { useT, useI18n } from "../lib/i18n.jsx";

// ── Paperclip SVG ────────────────────────────────────────────────────────────
function Paperclip() {
  return (
    <svg
      fill="none"
      height="80"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="4"
      viewBox="-10 -10 50 90"
      width="40"
      className="text-on-surface/20"
    >
      <path d="M14 0 C 6 0 0 6 0 14 L 0 50 C 0 58 6 64 14 64 C 22 64 28 58 28 50 L 28 20 C 28 16 25 12 21 12 C 17 12 14 16 14 20 L 14 44 C 14 46 16 48 18 48 C 20 48 22 46 22 44 L 22 24 L 26 24 L 26 44 C 26 48 22 52 18 52 C 14 52 10 48 10 44 L 10 20 C 10 14 15 9 21 9 C 27 9 32 14 32 20 L 32 50 C 32 60 24 68 14 68 C 4 68 -4 60 -4 50 L -4 14 C -4 4 4 -4 14 -4 Z" />
    </svg>
  );
}

// ── Punch-card progress sidebar ───────────────────────────────────────────────
function SessionProgress({ current, total }) {
  const pct = total > 0 ? current / total : 0;
  const TICK_COUNT = 9;

  return (
    <div className="bg-surface border-2 border-on-surface pr-4 flex shadow-[6px_6px_0px_0px_#131b2e] relative overflow-hidden">
      {/* Punch card edge */}
      <div className="w-8 border-r-2 border-dashed border-on-surface flex flex-col justify-between py-4 items-center bg-surface-container">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full border-2 border-on-surface ${
              i < Math.round(pct * 6) ? "bg-on-surface" : "bg-surface"
            }`}
          />
        ))}
      </div>
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-end mb-4">
          <h3 className="font-headline text-2xl font-bold text-on-surface leading-none">Session</h3>
          <span className="font-label text-[11px] font-bold text-on-surface-variant uppercase">
            {current} / {total}
          </span>
        </div>
        {/* Linear gauge */}
        <div className="w-full h-4 border-2 border-on-surface bg-surface relative">
          <div
            className="h-full bg-secondary border-r-2 border-on-surface absolute top-0 left-0 transition-all"
            style={{ width: `${pct * 100}%` }}
          />
          {/* Tick marks */}
          <div className="absolute inset-0 flex justify-between pointer-events-none px-1">
            {Array.from({ length: TICK_COUNT }).map((_, i) => (
              <div key={i} className="w-px h-full bg-on-surface/20" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Fill-in-the-blank sentence display ───────────────────────────────────────
function FillBlankDisplay({ text, answer, hint }) {
  // Try to detect a blank marker ____ or {blank} in the text
  const parts = text ? text.split(/_{3,}|\{blank\}/i) : null;

  if (!parts || parts.length < 2) {
    return (
      <div className="flex items-end justify-center mb-16 px-4 py-8 bg-surface-container border-2 border-on-surface shadow-[4px_4px_0px_0px_#000] overflow-x-auto">
        <span className="font-headline text-4xl md:text-6xl text-on-surface leading-none text-center">
          {text}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-end justify-center flex-wrap gap-2 mb-16 px-4 py-8 bg-surface-container border-2 border-on-surface shadow-[4px_4px_0px_0px_#000]">
      {parts.map((part, i) => (
        <span key={i} className="flex items-end gap-2">
          <span className="font-headline text-4xl md:text-6xl text-on-surface leading-none">{part.trim()}</span>
          {i < parts.length - 1 && (
            <div className="relative mx-2">
              <div className="font-headline text-4xl md:text-6xl text-secondary text-center border-b-4 border-dashed border-on-surface w-24 md:w-36 min-h-[1.2em]">
                {answer || ""}
              </div>
              {hint && (
                <span className="absolute -bottom-6 left-0 right-0 text-center font-label text-[10px] uppercase font-bold text-on-surface-variant">
                  ({hint})
                </span>
              )}
            </div>
          )}
        </span>
      ))}
    </div>
  );
}

// ── Results screen ────────────────────────────────────────────────────────────
function ResultsScreen({ result, lessonTopic, onRetry }) {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const pct = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#fcf9f6] flex items-center justify-center px-4 py-20"
      style={{ backgroundImage: "radial-gradient(#c6c6cd 1.5px, transparent 1.5px)", backgroundSize: "24px 24px" }}
    >
      <div className="w-full max-w-2xl">
        {/* Score card */}
        <div className="bg-surface border-2 border-on-surface shadow-[8px_8px_0px_0px_#b90538] p-8 md:p-12 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
              {lang === "ru" ? "Результаты" : lang === "tg" ? "Натиҷаҳо" : "RESULTS"}
            </span>
          </div>
          <h2 className="font-headline text-4xl font-bold text-on-surface mb-2">{lessonTopic}</h2>
          <div className="flex items-end gap-3 mt-6">
            <span className="font-headline text-8xl font-bold text-secondary leading-none">{pct}</span>
            <span className="font-headline text-4xl text-secondary font-bold mb-2">%</span>
          </div>
          <p className="font-label text-[11px] uppercase tracking-widest text-on-surface-variant font-bold mt-2">
            {result.correct} / {result.total}{" "}
            {lang === "ru" ? "верных ответов" : lang === "tg" ? "ҷавобҳои дуруст" : "correct"}
          </p>
          {/* Progress bar */}
          <div className="w-full h-4 border-2 border-on-surface bg-surface-container mt-6">
            <div
              className="h-full bg-secondary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Answers review */}
        <div className="space-y-4 mb-8">
          {result.results.map((q, i) => (
            <div key={q.id} className={`border-2 border-on-surface p-5 bg-surface shadow-[3px_3px_0px_0px_#000] border-l-4 ${q.is_correct ? "border-l-[#4caf50]" : "border-l-secondary"}`}>
              <div className="flex items-start gap-3 mb-2">
                <Icon
                  name={q.is_correct ? "check_circle" : "cancel"}
                  className={`text-xl mt-0.5 ${q.is_correct ? "text-[#4caf50]" : "text-secondary"}`}
                />
                <p className="font-body text-sm text-on-surface leading-relaxed">{q.text}</p>
              </div>
              <p className="font-label text-[11px] uppercase font-bold tracking-widest text-on-surface-variant ml-8">
                {lang === "ru" ? "Правильно: " : lang === "tg" ? "Дуруст: " : "Correct: "}
                <span className="text-on-surface">{q.answer}</span>
              </p>
              {q.explanation && (
                <p className="font-body text-sm text-on-surface-variant mt-2 ml-8 italic">{q.explanation}</p>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={onRetry}
            className="flex-1 bg-secondary text-surface border-2 border-on-surface py-4 font-label text-[11px] uppercase tracking-widest font-bold shadow-[4px_4px_0px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all"
          >
            {lang === "ru" ? "Попробовать снова" : lang === "tg" ? "Дубора кӯшиш кунед" : "Try Again"}
          </button>
          <button
            onClick={() => navigate("/grammar")}
            className="flex-1 bg-surface text-on-surface border-2 border-on-surface py-4 font-label text-[11px] uppercase tracking-widest font-bold shadow-[4px_4px_0px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all"
          >
            {lang === "ru" ? "Все уроки" : lang === "tg" ? "Ҳама дарсҳо" : "All Lessons"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main GrammarLesson page ───────────────────────────────────────────────────
export default function GrammarLesson() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang } = useI18n();
  const { refreshStreak } = useAppData();

  const { data: lesson, loading, error, reload } = useApi(() => getLesson(id), [id]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcf9f6] flex items-center justify-center"
        style={{ backgroundImage: "radial-gradient(#c6c6cd 1.5px, transparent 1.5px)", backgroundSize: "24px 24px" }}
      >
        <div className="w-full max-w-3xl px-4">
          <Skeleton className="h-8 w-1/3 mb-4" />
          <Skeleton className="h-64 mb-6" />
          <Skeleton className="h-16" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-12 px-4">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }

  if (result) {
    return (
      <ResultsScreen
        result={result}
        lessonTopic={lesson.topic}
        onRetry={() => { setResult(null); setAnswers({}); setCurrentQ(0); }}
      />
    );
  }

  const examples = [...(lesson.examples || [])].sort((a, b) => a.order - b.order);
  const questions = lesson.questions || [];
  const totalSteps = questions.length;
  const activeQuestion = questions[currentQ];

  function setAnswer(questionId, value) {
    setAnswers((cur) => ({ ...cur, [questionId]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const payload = questions.map((q) => ({
        question_id: q.id,
        answer: answers[q.id] || "",
      }));
      const outcome = await submitLesson(lesson.id, payload);
      setResult(outcome);
      refreshStreak();
    } catch (err) {
      setSubmitError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-[#fcf9f6] text-on-surface relative overflow-x-hidden"
      style={{ backgroundImage: "radial-gradient(#c6c6cd 1.5px, transparent 1.5px)", backgroundSize: "24px 24px" }}
    >
      {/* Decorative blobs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[10%] -left-[10%] w-[40vw] h-[40vw] rounded-full border border-secondary opacity-10" />
        <div className="absolute bottom-[20%] right-[5%] w-[60vw] h-[60vw] rounded-full border border-on-surface opacity-5" />
        <div className="absolute top-[30%] right-[15%] w-32 h-32 bg-[#ffb95f] rounded-full mix-blend-multiply opacity-20 filter blur-3xl" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-16 py-20">
        <div className="w-full flex flex-col lg:flex-row gap-6 md:gap-16 items-start justify-center">
          {/* ─── Left: The Task Card ─── */}
          <div className="w-full lg:w-2/3 max-w-3xl relative">
            <div className="bg-surface border-2 border-on-surface shadow-[8px_8px_0px_0px_#b90538] p-8 md:p-12 relative overflow-visible transform hover:rotate-0 transition-transform duration-500 -rotate-[0.5deg]">
              {/* Paperclip decoration */}
              <div className="absolute -top-3 -right-2 transform rotate-45 z-20 text-on-surface/20">
                <Paperclip />
              </div>

              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-on-surface pb-4 mb-8">
                <div>
                  <span className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface-variant block mb-1">
                    {lang === "ru" ? "Упражнение" : lang === "tg" ? "Машқ" : "Exercise No."}{" "}
                    {String(lesson.id).padStart(3, "0")}
                  </span>
                  <h2 className="font-headline text-3xl font-bold text-on-surface">
                    {lesson.topic}
                  </h2>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <span className="font-label text-[10px] font-bold uppercase tracking-widest text-secondary bg-[#ffdadb] px-2 py-1 border border-secondary shadow-[2px_2px_0px_0px_#b90538]">
                    {lesson.cefr_level}{" "}
                    {lesson.cefr_level === "A1" ? (lang === "ru" ? "Начинающий" : lang === "tg" ? "Ибтидоӣ" : "Beginner")
                      : lesson.cefr_level === "A2" ? (lang === "ru" ? "Элементарный" : "Elementary")
                      : lesson.cefr_level === "B1" ? (lang === "ru" ? "Средний" : "Intermediate")
                      : lesson.cefr_level === "B2" ? (lang === "ru" ? "Выше среднего" : "Upper-Int")
                      : lesson.cefr_level === "C1" ? (lang === "ru" ? "Продвинутый" : "Advanced")
                      : (lang === "ru" ? "Мастер" : "Mastery")}
                  </span>
                </div>
              </div>

              {/* Rule */}
              {lesson.rule && (
                <div className="mb-8 bg-surface-container border-2 border-on-surface p-5">
                  <p className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-2">
                    {lang === "ru" ? "Правило" : lang === "tg" ? "Қонун" : "Rule"}
                  </p>
                  <p className="font-body text-base text-on-surface leading-relaxed">{lesson.rule}</p>
                </div>
              )}

              {/* Examples */}
              {examples.length > 0 && (
                <div className="mb-8">
                  <p className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-4">
                    {lang === "ru" ? "Примеры" : lang === "tg" ? "Намунаҳо" : "Examples"}
                  </p>
                  <ul className="space-y-3 border-t-2 border-on-surface pt-4">
                    {examples.map((ex) => (
                      <li key={ex.id} className="font-body text-base pl-4 border-l-2 border-secondary text-on-surface">
                        {ex.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Practice section */}
              {questions.length > 0 && (
                <form onSubmit={onSubmit}>
                  <p className="font-body text-lg text-on-surface-variant mb-12 italic">
                    {lang === "ru"
                      ? "Задание: заполните пробел, чтобы дополнить предложение."
                      : lang === "tg"
                        ? "Вазифа: холиро пур кунед, то ҷумларо пурра кунед."
                        : "Task: Fill in the blank to complete the sentence."}
                  </p>

                  {activeQuestion && (
                    <div key={activeQuestion.id} className="mb-8">
                      {/* Sentence display */}
                      {activeQuestion.type === "fill_blank" || !activeQuestion.options ? (
                        <>
                          <FillBlankDisplay
                            text={activeQuestion.text}
                            answer={answers[activeQuestion.id] || ""}
                            hint={null}
                          />
                          <input
                            autoFocus
                            type="text"
                            value={answers[activeQuestion.id] || ""}
                            onChange={(e) => setAnswer(activeQuestion.id, e.target.value)}
                            placeholder="___"
                            className="w-full font-headline text-2xl text-secondary text-center bg-transparent border-0 border-b-4 border-dashed border-on-surface focus:ring-0 focus:border-secondary outline-none transition-colors py-2"
                          />
                        </>
                      ) : (
                        <>
                          {activeQuestion.text && (
                            <div className="flex items-end justify-center mb-16 px-4 py-8 bg-surface-container border-2 border-on-surface shadow-[4px_4px_0px_0px_#000]">
                              <span className="font-headline text-4xl md:text-6xl text-on-surface leading-none text-center">
                                {activeQuestion.text}
                              </span>
                            </div>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                            {activeQuestion.options.map((opt) => {
                              const selected = answers[activeQuestion.id] === opt;
                              return (
                                <label key={opt} className="cursor-pointer group relative">
                                  <input
                                    type="radio"
                                    name={`q-${activeQuestion.id}`}
                                    value={opt}
                                    checked={selected}
                                    onChange={() => setAnswer(activeQuestion.id, opt)}
                                    className="sr-only peer"
                                  />
                                  <div className={`border-2 border-on-surface bg-surface p-4 text-center transition-all
                                    ${selected
                                      ? "bg-on-surface/10 shadow-[4px_4px_0px_0px_#000]"
                                      : "group-hover:-translate-y-1 group-hover:-translate-x-1 group-hover:shadow-[4px_4px_0px_0px_#000]"
                                    }`}
                                  >
                                    <span className="font-headline text-2xl font-bold text-on-surface">{opt}</span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Navigation through questions */}
                  {totalSteps > 1 && (
                    <div className="flex gap-2 mb-6">
                      {questions.map((q, i) => (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setCurrentQ(i)}
                          className={`w-8 h-8 border-2 border-on-surface font-label text-[10px] font-bold transition-all
                            ${i === currentQ ? "bg-secondary text-surface" : answers[q.id] ? "bg-on-surface text-surface" : "bg-surface text-on-surface"}`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  )}

                  {submitError && (
                    <p role="alert" className="font-label text-[11px] text-secondary font-bold uppercase mb-4">
                      {submitError}
                    </p>
                  )}
                </form>
              )}

              {/* Sticky note hint */}
              {lesson.tip && (
                <div className="absolute -bottom-10 -right-4 md:-right-12 bg-[#ffb95f] text-[#2a1700] p-4 border-2 border-on-surface shadow-[4px_4px_0px_0px_#000] w-48 rotate-3 z-20">
                  <div className="flex items-center gap-2 mb-2 border-b-2 border-on-surface pb-1">
                    <Icon name="lightbulb" className="text-[18px]" />
                    <span className="font-label text-[10px] uppercase font-bold">
                      {lang === "ru" ? "Совет" : lang === "tg" ? "Маслиҳат" : "Hint"}
                    </span>
                  </div>
                  <p className="font-body text-sm leading-tight">{lesson.tip}</p>
                </div>
              )}
            </div>
          </div>

          {/* ─── Right: Session progress + Submit ─── */}
          <div className="w-full lg:w-1/3 flex flex-col gap-8 lg:sticky lg:top-32">
            <SessionProgress current={Object.keys(answers).length} total={totalSteps || 1} />

            {/* Submit button */}
            {questions.length > 0 && (
              <form onSubmit={onSubmit}>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-secondary text-surface border-2 border-on-surface py-6 px-8 font-label text-[13px] tracking-[0.1em] uppercase font-bold shadow-[6px_6px_0px_0px_#000] hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[8px_8px_0px_0px_#000] active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all duration-150 flex justify-between items-center group disabled:opacity-50 cursor-pointer"
                >
                  <span>
                    {submitting
                      ? (lang === "ru" ? "Отправка…" : lang === "tg" ? "Фиристодан…" : "Submitting…")
                      : (lang === "ru" ? "Отправить ответ" : lang === "tg" ? "Ҷавоб фиристед" : "Submit Response")}
                  </span>
                  <Icon name="arrow_forward" className="text-xl group-hover:translate-x-2 transition-transform" />
                </button>

                <div className="flex justify-center gap-6 mt-4">
                  <button
                    type="button"
                    onClick={() => navigate("/grammar")}
                    className="font-label text-[11px] text-on-surface-variant hover:text-secondary underline decoration-2 underline-offset-4 transition-colors cursor-pointer uppercase font-bold tracking-widest"
                  >
                    {lang === "ru" ? "Пропустить" : lang === "tg" ? "Гузаред" : "Skip"}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/grammar")}
                    className="font-label text-[11px] text-on-surface-variant hover:text-secondary underline decoration-2 underline-offset-4 transition-colors cursor-pointer uppercase font-bold tracking-widest"
                  >
                    {lang === "ru" ? "Сообщить о проблеме" : lang === "tg" ? "Хабар додан" : "Report Issue"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
