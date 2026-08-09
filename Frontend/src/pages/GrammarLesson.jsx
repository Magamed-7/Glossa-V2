import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import Icon from "../components/ui/Icon.jsx";
import QuizCard from "../components/quiz/QuizCard.jsx";
import QuizResults from "../components/quiz/QuizResults.jsx";
import { useApi } from "../lib/useApi.js";
import { useAppData } from "../lib/AppDataContext.jsx";
import { errorText } from "../lib/api/errorText.js";
import { getLesson, submitLesson } from "../lib/api/grammar.js";
import { useI18n } from "../lib/i18n.jsx";

// ─────────────────────────────────────────────────────────────────────────────
// Dot-grid background shared style
const BG = {
  backgroundColor: "#fcf9f6",
  backgroundImage: "radial-gradient(#c6c6cd 1.5px, transparent 1.5px)",
  backgroundSize: "24px 24px",
};

// Level badge label helper
function levelLabel(code, lang) {
  const MAP = {
    en: { A1: "A1 Beginner", A2: "A2 Elementary", B1: "B1 Intermediate", B2: "B2 Upper-Int", C1: "C1 Advanced", C2: "C2 Mastery" },
    ru: { A1: "A1 Начинающий", A2: "A2 Элементарный", B1: "B1 Средний", B2: "B2 Выше среднего", C1: "C1 Продвинутый", C2: "C2 Мастер" },
    tg: { A1: "A1 Ибтидоӣ", A2: "A2 Оддӣ", B1: "B1 Миёна", B2: "B2 Аз миёна боло", C1: "C1 Пешрафта", C2: "C2 Олиӣ" },
  };
  return (MAP[lang] || MAP.en)[code] || code;
}

// ── Paperclip SVG ─────────────────────────────────────────────────────────────
function Paperclip() {
  return (
    <svg fill="none" height="80" stroke="currentColor" strokeLinecap="round"
      strokeLinejoin="round" strokeWidth="4" viewBox="-10 -10 50 90" width="40"
      className="text-on-surface/20">
      <path d="M14 0 C 6 0 0 6 0 14 L 0 50 C 0 58 6 64 14 64 C 22 64 28 58 28 50 L 28 20 C 28 16 25 12 21 12 C 17 12 14 16 14 20 L 14 44 C 14 46 16 48 18 48 C 20 48 22 46 22 44 L 22 24 L 26 24 L 26 44 C 26 48 22 52 18 52 C 14 52 10 48 10 44 L 10 20 C 10 14 15 9 21 9 C 27 9 32 14 32 20 L 32 50 C 32 60 24 68 14 68 C 4 68 -4 60 -4 50 L -4 14 C -4 4 4 -4 14 -4 Z" />
    </svg>
  );
}

// ── Card 1: Lesson theory ─────────────────────────────────────────────────────
function TheoryCard({ lesson, examples, lang, onStartPractice, hasQuestions }) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-surface border-2 border-on-surface shadow-[8px_8px_0px_0px_#b90538] p-8 md:p-12 relative overflow-visible -rotate-[0.3deg] hover:rotate-0 transition-transform duration-500">
        {/* Paperclip */}
        <div className="absolute -top-3 -right-2 rotate-45 z-20">
          <Paperclip />
        </div>

        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-on-surface pb-4 mb-8">
          <div>
            <span className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface-variant block mb-1">
              {lang === "ru" ? "Урок" : lang === "tg" ? "Дарс" : "Lesson"}{" "}
              {String(lesson.id).padStart(3, "0")}
            </span>
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-on-surface leading-tight">
              {lesson.topic}
            </h1>
            {lesson.structure && (
              <p className="font-body text-sm text-on-surface-variant mt-1 italic">
                {lesson.structure}
              </p>
            )}
          </div>
          <div className="shrink-0 ml-4 text-right">
            <span className="font-label text-[10px] font-bold uppercase tracking-widest text-secondary bg-[#ffdadb] px-2 py-1 border border-secondary shadow-[2px_2px_0px_0px_#b90538] whitespace-nowrap">
              {levelLabel(lesson.cefr_level, lang)}
            </span>
          </div>
        </div>

        {/* Rule */}
        {lesson.rule && (
          <div className="mb-8 bg-surface-container border-2 border-on-surface p-5">
            <p className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-3">
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
                <li key={ex.id} className="font-body text-base pl-4 border-l-2 border-secondary text-on-surface leading-relaxed">
                  {ex.text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tip */}
        {lesson.tip && (
          <div className="mb-8 bg-[#ffb95f]/30 border-2 border-[#ffb95f] p-5 flex gap-3">
            <Icon name="lightbulb" className="text-[#653e00] text-xl shrink-0 mt-0.5" />
            <p className="font-body text-sm text-[#2a1700] leading-relaxed">{lesson.tip}</p>
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center gap-4 pt-6 border-t-2 border-dashed border-on-surface">
          {hasQuestions ? (
            <button
              onClick={onStartPractice}
              className="bg-secondary text-surface border-2 border-on-surface font-label text-[11px] uppercase tracking-widest font-bold px-8 py-4 shadow-[4px_4px_0px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all flex items-center gap-3 cursor-pointer"
            >
              <span>
                {lang === "ru" ? "Перейти к заданиям" : lang === "tg" ? "Ба вазифаҳо гузаред" : "Start Practice"}
              </span>
              <Icon name="arrow_forward" className="text-base" />
            </button>
          ) : (
            <button
              onClick={() => window.history.back()}
              className="bg-surface text-on-surface border-2 border-on-surface font-label text-[11px] uppercase tracking-widest font-bold px-8 py-4 shadow-[4px_4px_0px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all cursor-pointer"
            >
              {lang === "ru" ? "Назад" : lang === "tg" ? "Бозгашт" : "Back"}
            </button>
          )}
          <span className="font-label text-[10px] uppercase font-bold text-on-surface-variant flex items-center gap-1">
            <Icon name="schedule" className="text-sm" /> 15 Min
          </span>
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function GrammarLesson() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang } = useI18n();
  const { refreshStreak } = useAppData();

  const { data: lesson, loading, error, reload } = useApi(() => getLesson(id), [id]);

  // "theory" → "quiz" → "results"
  const [phase, setPhase] = useState("theory");
  const [result, setResult] = useState(null);
  const [submitErr, setSubmitErr] = useState(null);

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={BG}>
        <div className="w-full max-w-3xl px-4 space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-64" />
          <Skeleton className="h-14 w-48" />
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-12 px-4">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }

  const examples = [...(lesson.examples || [])].sort((a, b) => a.order - b.order);
  const questions = lesson.questions || [];

  // ── Quiz submit handler (passed into QuizCard) ──
  async function handleFinish(answers) {
    try {
      const payload = questions.map((question) => ({
        question_id: question.id,
        answer: answers[question.id] || "",
      }));
      const outcome = await submitLesson(lesson.id, payload);
      setResult(outcome);
      setPhase("results");
      refreshStreak();
    } catch (err) {
      setSubmitErr(errorText(err));
      throw err;
    }
  }

  // ── Results phase ──
  if (phase === "results" && result) {
    return (
      <QuizResults
        result={result}
        title={lesson.topic}
        lang={lang}
        onRetry={() => { setPhase("quiz"); setResult(null); }}
        onBack={() => navigate("/grammar")}
      />
    );
  }

  // ── Shared page shell ──
  return (
    <div className="min-h-screen text-on-surface relative overflow-x-hidden" style={BG}>
      {/* Decorative blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[10%] -left-[10%] w-[40vw] h-[40vw] rounded-full border border-secondary opacity-10" />
        <div className="absolute bottom-[20%] right-[5%] w-[60vw] h-[60vw] rounded-full border border-on-surface opacity-5" />
        <div className="absolute top-[30%] right-[15%] w-32 h-32 bg-[#ffb95f] rounded-full mix-blend-multiply opacity-20 blur-3xl" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-4 md:px-12 py-16 pb-24">
        {/* ── Phase indicator ── */}
        <div className="flex items-center gap-3 mb-10">
          {["theory", "quiz"].map((ph, i) => {
            const isDone = ph === "theory" && phase === "quiz";
            const isActive = ph === phase;
            return (
              <div key={ph} className="flex items-center gap-3">
                <div className={`flex items-center gap-2 font-label text-[10px] uppercase tracking-widest font-bold
                  ${isActive ? "text-on-surface" : isDone ? "text-secondary" : "text-on-surface-variant/40"}`}>
                  <div className={`w-6 h-6 border-2 flex items-center justify-center text-[10px] font-bold
                    ${isActive ? "bg-on-surface text-surface border-on-surface"
                    : isDone ? "bg-secondary text-surface border-secondary"
                    : "bg-surface border-on-surface/30 text-on-surface/30"}`}>
                    {isDone ? "✓" : i + 1}
                  </div>
                  <span>
                    {ph === "theory"
                      ? (lang === "ru" ? "Теория" : lang === "tg" ? "Назария" : "Theory")
                      : (lang === "ru" ? "Практика" : lang === "tg" ? "Амалия" : "Practice")}
                  </span>
                </div>
                {i < 1 && <div className={`h-px w-8 ${phase === "quiz" ? "bg-secondary" : "bg-on-surface/20"}`} />}
              </div>
            );
          })}
        </div>

        {/* ── Theory card ── */}
        {phase === "theory" && (
          <TheoryCard
            lesson={lesson}
            examples={examples}
            lang={lang}
            hasQuestions={questions.length > 0}
            onStartPractice={() => setPhase("quiz")}
          />
        )}

        {/* ── Quiz card ── */}
        {phase === "quiz" && questions.length > 0 && (
          <QuizCard
            questions={questions}
            lang={lang}
            onFinish={handleFinish}
          />
        )}

        {submitErr && (
          <p role="alert" className="font-label text-[11px] text-secondary font-bold uppercase mt-4 text-center">
            {submitErr}
          </p>
        )}
      </main>
    </div>
  );
}
