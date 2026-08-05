import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Skeleton from "../components/ui/Skeleton.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useApi } from "../lib/useApi.js";
import { useAuth } from "../lib/auth/AuthContext.jsx";
import { getLessons, getWeakTopics, getGrammarProgress } from "../lib/api/grammar.js";
import { useI18n } from "../lib/i18n.jsx";

// ── Constant CEFR list ────────────────────────────────────────────────────────
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

const LEVEL_LABELS = {
  en: { A1: "A1 Beginner", A2: "A2 Elementary", B1: "B1 Intermediate", B2: "B2 Upper-Int", C1: "C1 Advanced", C2: "C2 Mastery" },
  ru: { A1: "A1 Начинающий", A2: "A2 Элементарный", B1: "B1 Средний", B2: "B2 Выше среднего", C1: "C1 Продвинутый", C2: "C2 Мастер" },
  tg: { A1: "A1 Ибтидоӣ", A2: "A2 Оддӣ", B1: "B1 Миёна", B2: "B2 Аз миёна боло", C1: "C1 Пешрафта", C2: "C2 Олиӣ" },
};

// Short labels so they fit in one row on small screens
const LEVEL_SHORT = { A1: "A1", A2: "A2", B1: "B1", B2: "B2", C1: "C1", C2: "C2" };

// ── Small lesson card ─────────────────────────────────────────────────────────
function LessonCard({ lesson, index }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/grammar/${lesson.id}`)}
      className="group text-left bg-surface border-2 border-on-surface p-5 shadow-[4px_4px_0px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all relative overflow-hidden min-h-[200px] flex flex-col w-full cursor-pointer"
    >
      <div className="absolute top-0 right-0 bg-on-surface text-surface font-label text-[10px] font-bold px-3 py-1 border-b-2 border-l-2 border-on-surface z-10">
        {String(index + 1).padStart(2, "0")}
      </div>
      {index % 3 === 1 && (
        <div className="absolute -right-5 -bottom-5 w-28 h-28 bg-secondary/10 rounded-full opacity-50 group-hover:scale-110 transition-transform pointer-events-none" />
      )}
      <h4 className="font-headline text-base font-bold text-on-surface mb-2 mt-4 relative z-10 leading-snug">
        {lesson.topic}
      </h4>
      {lesson.structure && (
        <p className="font-body text-xs text-on-surface-variant line-clamp-3 relative z-10 mb-3 flex-1">
          {lesson.structure}
        </p>
      )}
      <div className="flex items-center justify-between relative z-10 mt-auto pt-3 border-t border-on-surface/20">
        <span className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant font-bold truncate max-w-[70%]">
          {lesson.unit || "General"}
        </span>
        <Icon name="arrow_forward" className="text-on-surface text-base group-hover:translate-x-1 transition-transform shrink-0" />
      </div>
    </button>
  );
}

// ── Progress bar + stats panel ────────────────────────────────────────────────
function ProgressPanel({ progress, activeLevel, lang }) {
  if (!progress) {
    return (
      <div className="bg-secondary text-surface border-2 border-on-surface p-6 shadow-[4px_4px_0px_0px_#000]">
        <Skeleton className="h-8 w-1/2 mb-3 bg-surface/20" />
        <Skeleton className="h-12 w-1/3 mb-4 bg-surface/20" />
        <Skeleton className="h-4 bg-surface/20" />
      </div>
    );
  }

  // Find active level stats
  const lvlStats = progress.by_level?.find((b) => b.level === activeLevel);
  const pct = lvlStats?.percent ?? 0;
  const done = lvlStats?.completed_lessons ?? 0;
  const total = lvlStats?.total_lessons ?? 0;

  return (
    <div className="bg-secondary text-surface border-2 border-on-surface p-6 shadow-[4px_4px_0px_0px_#000]">
      <div className="flex items-start justify-between mb-1">
        <h3 className="font-headline text-xl font-bold leading-tight">
          {activeLevel}{" "}
          {lang === "ru" ? "Прогресс" : lang === "tg" ? "Пешрафт" : "Progress"}
        </h3>
        <span className="font-label text-[10px] uppercase font-bold opacity-70 mt-1">
          {done}/{total} {lang === "ru" ? "урок" : lang === "tg" ? "дарс" : "lessons"}
        </span>
      </div>
      <div className="flex items-end gap-1 mb-3">
        <span className="font-headline text-6xl font-bold leading-none">{Math.round(pct)}</span>
        <span className="font-headline text-2xl font-bold mb-1">%</span>
      </div>
      {/* Striped gauge */}
      <div className="w-full h-4 border-2 border-surface/50 bg-surface/20 p-[2px]">
        <div
          className="h-full bg-surface relative overflow-hidden transition-all duration-700"
          style={{ width: `${pct}%` }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "linear-gradient(45deg,rgba(255,255,255,.2) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.2) 50%,rgba(255,255,255,.2) 75%,transparent 75%,transparent)",
              backgroundSize: "0.75rem 0.75rem",
            }}
          />
        </div>
      </div>
      {/* All-level mini bars */}
      {progress.by_level && (
        <div className="mt-4 grid grid-cols-6 gap-1">
          {progress.by_level.map((b) => (
            <div key={b.level} className="flex flex-col items-center gap-1">
              <div className="w-full h-1 bg-surface/30 relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full bg-surface/80" style={{ width: `${b.percent}%` }} />
              </div>
              <span className="font-label text-[8px] font-bold opacity-60">{b.level}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GrammarHub() {
  const navigate = useNavigate();
  const { lang } = useI18n();
  const { languages } = useAuth();

  const rawLevel = languages?.find((l) => l.is_target)?.level || "A1";
  const targetLevel = rawLevel === "native" ? "C2" : rawLevel;
  const [activeLevel, setActiveLevel] = useState(targetLevel);

  const labels = LEVEL_LABELS[lang] || LEVEL_LABELS.en;

  // Data fetching
  const { data: lessons, loading: lessonsLoading } = useApi(
    () => getLessons({ level: activeLevel, limit: 100 }),
    [activeLevel]
  );
  const { data: progress, loading: progressLoading } = useApi(
    () => getGrammarProgress(),
    []
  );
  const { data: weakTopics } = useApi(() => getWeakTopics(), []);

  const featuredLesson = lessons?.[0];

  const weakestTopic = weakTopics?.length
    ? [...weakTopics].sort((a, b) => b.error_rate - a.error_rate)[0]
    : null;

  const weakLesson = weakestTopic && lessons
    ? lessons.find((l) => l.topic === weakestTopic.topic) || null
    : null;

  // Active level lesson count for spotlight
  const activeLvlProgress = progress?.by_level?.find((b) => b.level === activeLevel);

  return (
    <div
      className="min-h-screen text-on-surface relative overflow-x-hidden"
      style={{
        backgroundColor: "#fcf9f6",
        backgroundImage: "radial-gradient(#dcdad7 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[10%] -left-[10%] w-[40vw] h-[40vw] rounded-full border border-secondary opacity-10" />
        <div className="absolute bottom-[20%] right-[5%] w-[60vw] h-[60vw] rounded-full border border-on-surface opacity-5" />
        <div className="absolute top-[30%] right-[15%] w-32 h-32 bg-[#ffb95f] rounded-full mix-blend-multiply opacity-20 blur-3xl" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-16 py-16">

        {/* ── Page Header ── */}
        <div className="mb-10">
          <h1 className="font-headline text-5xl md:text-6xl font-bold text-on-surface tracking-tight leading-none">
            Syntactic{" "}
            <em
              className="font-normal text-secondary"
              style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
            >
              Registry
            </em>
          </h1>
          <p className="font-body text-base text-on-surface-variant max-w-2xl mt-3">
            {lang === "ru"
              ? "Изучайте архитектурные блоки языка. Выберите уровень для изучения грамматических структур."
              : lang === "tg"
                ? "Блокҳои меъмории забонро омӯзед. Сатҳро барои омӯзиши сохторҳои грамматикӣ интихоб кунед."
                : "Master the architectural blocks of language. Select a proficiency level to explore essential grammatical structures."}
          </p>
        </div>

        {/* ── CEFR Tabs — fit all 6 in one row without scroll ── */}
        <div className="mb-10 relative">
          {/* Bottom border line */}
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-on-surface z-0" />
          <div className="flex gap-1 relative z-10">
            {LEVELS.map((lv) => {
              const isActive = activeLevel === lv;
              const isLocked = lv !== targetLevel;
              return (
                <button
                  key={lv}
                  onClick={() => !isLocked && setActiveLevel(lv)}
                  title={labels[lv]}
                  className={`
                    flex-1 font-label text-[10px] md:text-[11px] uppercase tracking-wider font-bold
                    px-1 py-2.5 border-2 border-on-surface border-b-0 rounded-t-sm
                    whitespace-nowrap text-center transition-colors select-none
                    ${isActive
                      ? "bg-secondary text-surface -mb-[2px] pb-[calc(0.625rem+2px)]"
                      : isLocked
                        ? "bg-surface text-on-surface-variant opacity-40 cursor-not-allowed border-dashed"
                        : "bg-surface text-on-surface-variant hover:bg-surface-variant cursor-pointer"
                    }
                  `}
                >
                  {/* On mobile: show short code; on md+: show full label */}
                  <span className="md:hidden">{LEVEL_SHORT[lv]}</span>
                  <span className="hidden md:inline">{labels[lv]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 12-column grid ── */}
        <div className="grid grid-cols-12 gap-6">

          {/* Spotlight card — 7 cols */}
          <div className="col-span-12 lg:col-span-7 bg-surface border-2 border-on-surface p-6 md:p-8 shadow-[4px_4px_0px_0px_#000] relative">
            {/* File tab */}
            <div className="absolute -top-[28px] left-[-2px] border-2 border-on-surface border-b-0 bg-surface px-3 py-1 font-label text-[9px] uppercase tracking-widest font-bold text-on-surface">
              {lang === "ru" ? "В ФОКУСЕ" : lang === "tg" ? "ДИҚҚАТ" : "FOCUS"}
            </div>

            {lessonsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-16" />
                <Skeleton className="h-10 w-36" />
              </div>
            ) : featuredLesson ? (
              <div className="flex gap-6 h-full">
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-[#ffb95f] text-[#2a1700] px-2 py-0.5 font-label text-[9px] uppercase font-bold border border-on-surface">
                        {featuredLesson.cefr_level}
                      </span>
                      <span className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant font-bold truncate">
                        {lang === "ru" ? "СИНТАКСИЧЕСКИЙ УЗЕЛ" : lang === "tg" ? "ГИРЕҲИ СИНТАКСИС" : "SYNTAX NODE"}
                      </span>
                    </div>
                    <h2 className="font-headline text-2xl md:text-3xl font-bold text-on-surface mb-3 leading-tight">
                      {featuredLesson.topic}
                    </h2>
                    {featuredLesson.structure && (
                      <p className="font-body text-sm text-on-surface-variant mb-4 line-clamp-3">
                        {featuredLesson.structure}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 pt-4 border-t-2 border-dashed border-on-surface">
                    <button
                      onClick={() => navigate(`/grammar/${featuredLesson.id}`)}
                      className="bg-secondary text-surface border-2 border-on-surface font-label text-[10px] uppercase tracking-widest font-bold px-5 py-2.5 shadow-[4px_4px_0px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all cursor-pointer shrink-0"
                    >
                      {lang === "ru" ? "Учить сейчас" : lang === "tg" ? "Ҳоло омӯзед" : "Study Now"}
                    </button>
                    <span className="font-label text-[10px] uppercase text-on-surface flex items-center gap-1 font-bold">
                      <Icon name="schedule" className="text-sm" />
                      15 Min
                    </span>
                  </div>
                </div>
                {/* Image side */}
                <div className="hidden md:block w-40 border-2 border-on-surface relative shrink-0 bg-surface-container overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-on-surface/5 to-secondary/10 absolute inset-0" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon name="auto_stories" className="text-7xl text-on-surface/10" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-12 h-12 rounded-tl-full bg-[#ffb95f] border-l-2 border-t-2 border-on-surface" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <Icon name="auto_stories" className="text-4xl text-on-surface-variant/30 mb-2" />
                <p className="font-body text-sm text-on-surface-variant">
                  {lang === "ru" ? "Уроков для этого уровня ещё нет." : "No lessons for this level yet."}
                </p>
              </div>
            )}
          </div>

          {/* Right panel — 5 cols */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-5">
            {/* Progress card */}
            <ProgressPanel
              progress={progress}
              activeLevel={activeLevel}
              lang={lang}
            />

            {/* Weak topic / consistency card */}
            <div className="flex-1 border-2 border-on-surface p-5 bg-surface shadow-[4px_4px_0px_0px_#000] relative overflow-hidden">
              <div className="absolute w-28 h-28 rounded-full border-2 border-on-surface border-dashed opacity-20 -top-4 -left-4" />
              <div className="absolute w-56 h-56 rounded-full border-2 border-on-surface border-dashed opacity-10 -bottom-10 -right-10" />
              <div className="relative z-10">
                {weakestTopic ? (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon name="priority_high" className="text-secondary text-lg" />
                      <span className="font-label text-[9px] uppercase tracking-widest font-bold text-on-surface">
                        {lang === "ru" ? "СЛАБАЯ ТЕМА" : lang === "tg" ? "МАВЗӮИ СУСТ" : "WEAKEST TOPIC"}
                      </span>
                    </div>
                    <p className="font-headline text-lg font-bold text-on-surface mb-1 leading-tight">
                      {weakestTopic.topic}
                    </p>
                    <p className="font-body text-sm text-on-surface-variant mb-3">
                      {Math.round(weakestTopic.error_rate)}%{" "}
                      {lang === "ru" ? "ошибок" : lang === "tg" ? "хатогиҳо" : "error rate"}
                    </p>
                    {weakLesson && (
                      <button
                        onClick={() => navigate(`/grammar/${weakLesson.id}`)}
                        className="font-label text-[10px] uppercase tracking-widest font-bold text-secondary border-b-2 border-secondary hover:text-on-surface hover:border-on-surface transition-colors cursor-pointer"
                      >
                        {lang === "ru" ? "Практиковать →" : lang === "tg" ? "Машқ кунед →" : "Practice Now →"}
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-center">
                    <Icon name="auto_awesome" className="text-4xl text-on-surface mb-2" />
                    <p className="font-label text-[9px] uppercase tracking-widest font-bold text-on-surface">
                      {lang === "ru" ? "ПОСТОЯНСТВО — КЛЮЧ" : lang === "tg" ? "ДОИМӢ БУДАН КАЛИД АСТ" : "CONSISTENCY IS KEY"}
                    </p>
                    <p className="font-body text-sm text-on-surface-variant mt-2 max-w-[180px] mx-auto">
                      {lang === "ru"
                        ? "Практикуйте 3 концепции каждый день."
                        : lang === "tg"
                          ? "Ҳар рӯз 3 мафҳумро такрор кунед."
                          : "Review 3 concepts daily to solidify your foundation."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Syllabus header */}
          <div className="col-span-12 mt-8 mb-4 flex justify-between items-end border-b-2 border-on-surface pb-3">
            <h3 className="font-headline text-xl font-bold text-on-surface">
              {activeLevel}{" "}
              {lang === "ru" ? "Программа" : lang === "tg" ? "Барнома" : "Syllabus"}
            </h3>
            {activeLvlProgress && activeLvlProgress.total_lessons > 0 && (
              <span className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                {activeLvlProgress.completed_lessons}/{activeLvlProgress.total_lessons}{" "}
                {lang === "ru" ? "завершено" : lang === "tg" ? "ба итмом расид" : "completed"}
              </span>
            )}
          </div>

          {/* Lesson cards grid */}
          <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {lessonsLoading
              ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)
              : lessons && lessons.length > 0
                ? lessons.map((lesson, i) => (
                    <LessonCard key={lesson.id} lesson={lesson} index={i} />
                  ))
                : (
                  <div className="col-span-3 border-2 border-dashed border-on-surface p-10 text-center flex flex-col items-center gap-2">
                    <Icon name="auto_stories" className="text-4xl text-on-surface-variant/30" />
                    <p className="font-body text-sm text-on-surface-variant">
                      {lang === "ru"
                        ? "Уроки для этого уровня ещё не добавлены."
                        : lang === "tg"
                          ? "Дарсҳо барои ин сатҳ ҳанӯз илова нашудаанд."
                          : "No lessons available for this level yet."}
                    </p>
                  </div>
                )}
          </div>
        </div>
      </main>
    </div>
  );
}
