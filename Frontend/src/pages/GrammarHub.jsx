import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Skeleton from "../components/ui/Skeleton.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useApi } from "../lib/useApi.js";
import { useAuth } from "../lib/auth/AuthContext.jsx";
import { getLessons, getWeakTopics } from "../lib/api/grammar.js";
import { useT, useI18n } from "../lib/i18n.jsx";

const CEFR_LEVELS = [
  { code: "A1", label: "A1 Beginner" },
  { code: "A2", label: "A2 Elementary" },
  { code: "B1", label: "B1 Intermediate" },
  { code: "B2", label: "B2 Upper-Int" },
  { code: "C1", label: "C1 Advanced" },
  { code: "C2", label: "C2 Mastery" },
];

function LessonStatusBadge({ lesson }) {
  // We don't track per-lesson status yet, so derive from attempts later
  return null;
}

function LessonCard({ lesson, index }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/grammar/${lesson.id}`)}
      className="group text-left bg-surface border-2 border-on-surface p-6 shadow-[4px_4px_0px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all relative overflow-hidden min-h-[220px] flex flex-col w-full"
    >
      {/* Index number */}
      <div className="absolute top-0 right-0 bg-on-surface text-surface font-label text-[11px] font-bold px-3 py-1 border-b-2 border-l-2 border-on-surface z-10">
        {String(index + 1).padStart(2, "0")}
      </div>

      {/* Background decoration on even cards */}
      {index % 3 === 1 && (
        <div className="absolute -right-5 -bottom-5 w-32 h-32 bg-secondary/10 rounded-full opacity-50 group-hover:scale-110 transition-transform pointer-events-none" />
      )}

      <h4 className="font-headline text-lg font-bold text-on-surface mb-2 mt-4 relative z-10 leading-tight">
        {lesson.topic}
      </h4>
      {lesson.structure && (
        <p className="font-body text-sm text-on-surface-variant line-clamp-3 relative z-10 mb-4 flex-1">
          {lesson.structure}
        </p>
      )}

      <div className="flex items-center justify-between relative z-10 mt-auto pt-4 border-t border-on-surface/20">
        <span className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">
          {lesson.unit || "General"}
        </span>
        <Icon
          name="arrow_forward"
          className="text-on-surface text-lg group-hover:translate-x-1 transition-transform"
        />
      </div>
    </button>
  );
}

export default function GrammarHub() {
  const t = useT();
  const { lang } = useI18n();
  const navigate = useNavigate();
  const { languages } = useAuth();

  const rawLevel = languages?.find((l) => l.is_target)?.level || "A1";
  const targetLevel = rawLevel === "native" ? "C2" : rawLevel;
  const [activeLevel, setActiveLevel] = useState(targetLevel);

  const { data: lessons, loading: lessonsLoading } = useApi(
    () => getLessons({ level: activeLevel, limit: 100 }),
    [activeLevel]
  );

  const { data: weakTopics, loading: weakLoading } = useApi(
    () => getWeakTopics(),
    []
  );

  // Featured spotlight lesson: first lesson of this level
  const featuredLesson = lessons?.[0];

  // Weakest topic lesson
  const weakestTopic = weakTopics?.length
    ? [...weakTopics].sort((a, b) => b.error_rate - a.error_rate)[0]
    : null;

  const weakLesson = weakestTopic && lessons
    ? lessons.find((l) => l.topic === weakestTopic.topic) || null
    : null;

  // Progress: count lessons with results (no API yet, show 0 gracefully)
  const totalLessons = lessons?.length || 0;

  const LEVEL_LABELS = {
    en: { A1: "A1 Beginner", A2: "A2 Elementary", B1: "B1 Intermediate", B2: "B2 Upper-Int", C1: "C1 Advanced", C2: "C2 Mastery" },
    ru: { A1: "A1 Начинающий", A2: "A2 Элементарный", B1: "B1 Средний", B2: "B2 Выше среднего", C1: "C1 Продвинутый", C2: "C2 Мастер" },
    tg: { A1: "A1 Ибтидоӣ", A2: "A2 Оддӣ", B1: "B1 Миёна", B2: "B2 Аз миёна боло", C1: "C1 Пешрафта", C2: "C2 Олиӣ" },
  };
  const levelLabels = LEVEL_LABELS[lang] || LEVEL_LABELS.en;

  return (
    <div className="min-h-screen bg-[#fcf9f6] text-on-surface relative overflow-x-hidden" style={{ backgroundImage: "radial-gradient(#dcdad7 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
      {/* Decorative circles */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[10%] -left-[10%] w-[40vw] h-[40vw] rounded-full border border-secondary opacity-10" />
        <div className="absolute bottom-[20%] right-[5%] w-[60vw] h-[60vw] rounded-full border border-on-surface opacity-5" />
        <div className="absolute top-[30%] right-[15%] w-32 h-32 bg-[#ffb95f] rounded-full mix-blend-multiply opacity-20 filter blur-3xl" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-16 py-20">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="font-headline text-5xl md:text-7xl font-bold text-on-surface tracking-tight">
            Syntactic{" "}
            <em className="not-italic font-normal text-secondary" style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
              Registry
            </em>
          </h1>
          <p className="font-body text-lg text-on-surface-variant max-w-2xl mt-4">
            {lang === "ru"
              ? "Изучайте архитектурные блоки языка. Выберите уровень владения для изучения грамматических структур."
              : lang === "tg"
                ? "Блокҳои меъмории забонро омӯзед. Сатҳи малакаро барои омӯзиши сохторҳои грамматикӣ интихоб кунед."
                : "Master the architectural blocks of language. Select a proficiency level to explore essential grammatical structures."}
          </p>
        </div>

        {/* CEFR Level Tabs */}
        <div className="mb-12 relative">
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-on-surface z-0" />
          <div className="flex overflow-x-auto gap-2 pb-[2px] relative z-10 no-scrollbar">
            {CEFR_LEVELS.map((lv) => {
              const isActive = activeLevel === lv.code;
              const isLocked = lv.code !== targetLevel;
              return (
                <button
                  key={lv.code}
                  onClick={() => !isLocked && setActiveLevel(lv.code)}
                  className={`font-label text-[11px] uppercase tracking-widest font-bold px-6 py-3 border-2 border-on-surface border-b-0 rounded-t-sm whitespace-nowrap transition-colors select-none
                    ${isActive
                      ? "bg-secondary text-surface -mb-[2px] pb-[calc(0.75rem+2px)]"
                      : isLocked
                        ? "bg-surface text-on-surface-variant opacity-50 cursor-not-allowed border-dashed"
                        : "bg-surface text-on-surface-variant hover:bg-surface-variant cursor-pointer"
                    }`}
                >
                  {isLocked && <Icon name="lock" className="text-xs mr-1 inline" />}
                  {levelLabels[lv.code] || lv.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main 12-col grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Spotlight / Focus Card — 7 cols */}
          <div className="col-span-12 lg:col-span-7 bg-surface border-2 border-on-surface p-8 shadow-[4px_4px_0px_0px_#000] relative mb-8 lg:mb-0">
            {/* File Tab */}
            <div className="absolute -top-[30px] left-[-2px] border-2 border-on-surface border-b-0 bg-surface px-4 py-1 font-label text-[10px] uppercase tracking-widest font-bold text-on-surface">
              {lang === "ru" ? "В ФОКУСЕ" : lang === "tg" ? "ДИҚҚАТ" : "FOCUS"}
            </div>

            {lessonsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-20" />
                <Skeleton className="h-12 w-40" />
              </div>
            ) : featuredLesson ? (
              <div className="flex flex-col md:flex-row gap-8 h-full">
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-[#ffb95f] text-[#2a1700] px-2 py-1 font-label text-[10px] uppercase font-bold border border-on-surface">
                        {featuredLesson.cefr_level}
                      </span>
                      <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                        {lang === "ru" ? "СИНТАКСИЧЕСКИЙ УЗЕЛ" : lang === "tg" ? "ГИРЕҲИ СИНТАКСИС" : "SYNTAX NODE"}
                      </span>
                    </div>
                    <h2 className="font-headline text-3xl font-bold text-on-surface mb-4 leading-tight">
                      {featuredLesson.topic}
                    </h2>
                    {featuredLesson.structure && (
                      <p className="font-body text-sm text-on-surface-variant mb-6">
                        {featuredLesson.structure}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-auto pt-6 border-t-2 border-dashed border-on-surface">
                    <button
                      onClick={() => navigate(`/grammar/${featuredLesson.id}`)}
                      className="bg-secondary text-surface border-2 border-on-surface font-label text-[11px] uppercase tracking-widest font-bold px-6 py-3 shadow-[4px_4px_0px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all cursor-pointer"
                    >
                      {lang === "ru" ? "Учить сейчас" : lang === "tg" ? "Ҳоло омӯзед" : "Study Now"}
                    </button>
                    <span className="font-label text-[11px] uppercase text-on-surface flex items-center gap-1 font-bold">
                      <Icon name="schedule" className="text-sm" />
                      {featuredLesson.unit || "15 Min"}
                    </span>
                  </div>
                </div>
                {/* Image side */}
                <div className="w-full md:w-2/5 border-2 border-on-surface relative h-48 md:h-auto shrink-0 bg-surface-container overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-on-surface/10 to-secondary/10 absolute inset-0" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon name="auto_stories" className="text-8xl text-on-surface/10" />
                  </div>
                  <div className="absolute inset-0 bg-secondary/5 mix-blend-overlay pointer-events-none" />
                  <div className="absolute bottom-0 right-0 w-16 h-16 rounded-tl-full bg-[#ffb95f] border-l-2 border-t-2 border-on-surface" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <Icon name="auto_stories" className="text-4xl text-on-surface-variant/30 mb-3" />
                <p className="font-body text-sm text-on-surface-variant">
                  {lang === "ru" ? "Уроки для этого уровня ещё не добавлены." : "No lessons found for this level yet."}
                </p>
              </div>
            )}
          </div>

          {/* Right Panel — 5 cols */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
            {/* Progress Card */}
            <div className="bg-secondary text-surface border-2 border-on-surface p-6 shadow-[4px_4px_0px_0px_#000]">
              <h3 className="font-headline text-2xl font-bold mb-2">
                {activeLevel}{" "}
                {lang === "ru" ? "Прогресс" : lang === "tg" ? "Пешрафт" : "Progress"}
              </h3>
              <div className="flex items-end gap-2 mb-4">
                <span className="font-headline text-6xl font-bold leading-none">
                  {totalLessons}
                </span>
                <span className="font-label text-sm font-bold mb-2">
                  {lang === "ru" ? "уроков" : lang === "tg" ? "дарс" : "lessons"}
                </span>
              </div>
              <div className="w-full h-4 border-2 border-on-surface bg-surface/30 p-[2px]">
                <div
                  className="h-full bg-surface relative overflow-hidden"
                  style={{ width: `${Math.min(100, (totalLessons / 10) * 100)}%` }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: "linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)",
                      backgroundSize: "1rem 1rem",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Consistency card / Weak topics */}
            <div className="flex-1 border-2 border-on-surface p-6 bg-surface shadow-[4px_4px_0px_0px_#000] relative overflow-hidden">
              <div className="absolute w-32 h-32 rounded-full border-2 border-on-surface border-dashed opacity-20 -top-5 -left-5" />
              <div className="absolute w-64 h-64 rounded-full border-2 border-on-surface border-dashed opacity-10 -bottom-12 -right-12" />
              <div className="relative z-10">
                {weakLoading ? (
                  <Skeleton className="h-32" />
                ) : weakestTopic ? (
                  <>
                    <div className="flex items-center gap-2 mb-4">
                      <Icon name="priority_high" className="text-secondary text-xl" />
                      <span className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface">
                        {lang === "ru" ? "СЛАБАЯ ТЕМА" : lang === "tg" ? "МАВЗӮИ СУСТ" : "WEAKEST TOPIC"}
                      </span>
                    </div>
                    <p className="font-headline text-xl font-bold text-on-surface mb-2">
                      {weakestTopic.topic}
                    </p>
                    <p className="font-body text-sm text-on-surface-variant mb-4">
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
                    <p className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface">
                      {lang === "ru" ? "ПОСТОЯНСТВО — КЛЮЧ" : lang === "tg" ? "ДОИМӢ БУДАН КАЛИД АСТ" : "CONSISTENCY IS KEY"}
                    </p>
                    <p className="font-body text-sm text-on-surface-variant mt-2 max-w-[200px] mx-auto">
                      {lang === "ru"
                        ? "Практикуйте 3 концепции ежедневно."
                        : lang === "tg"
                          ? "Ҳар рӯз 3 мафҳумро такрор кунед."
                          : "Review 3 concepts daily to solidify your foundation."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Syllabus Header */}
          <div className="col-span-12 mt-12 mb-6 flex justify-between items-end border-b-2 border-on-surface pb-4">
            <h3 className="font-headline text-2xl font-bold text-on-surface">
              {activeLevel}{" "}
              {lang === "ru" ? "Программа" : lang === "tg" ? "Барнома" : "Syllabus"}
            </h3>
          </div>

          {/* Lessons Grid */}
          <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessonsLoading
              ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56" />)
              : lessons && lessons.length > 0
                ? lessons.map((lesson, i) => (
                    <LessonCard key={lesson.id} lesson={lesson} index={i} />
                  ))
                : (
                  <div className="col-span-3 border-2 border-dashed border-on-surface p-12 text-center flex flex-col items-center gap-3">
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
