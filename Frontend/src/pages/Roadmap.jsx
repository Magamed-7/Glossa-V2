import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import { useApi } from "../lib/useApi.js";
import { useI18n } from "../lib/i18n.jsx";
import { useToast } from "../lib/toast.jsx";
import {
  getOnboardingStatus,
  submitOnboarding,
  getCourseProgress,
  getCourseUnits,
} from "../lib/api/learning.js";

const LEVELS = ["A1", "A2", "B1", "B2", "C1"];
const CHAPTER_NUMERALS = { A1: "I", A2: "II", B1: "III", B2: "IV", C1: "V" };
const MINUTE_OPTIONS = [15, 30, 60];

const LEVEL_NAMES = {
  en: { A1: "Beginner", A2: "Elementary", B1: "Pre-Intermediate", B2: "Intermediate", C1: "Upper-Intermediate" },
  ru: { A1: "Начальный", A2: "Элементарный", B1: "Предсредний", B2: "Средний", C1: "Выше среднего" },
  tg: { A1: "Ибтидоӣ", A2: "Оддӣ", B1: "Пеш аз миёна", B2: "Миёна", C1: "Аз миёна боло" },
};

const PAGE_TEXT = {
  en: {
    eyebrow: "Study Plan",
    titleLine1: "Your",
    titleLine2: "roadmap",
    sub: "The full path from your first word to fluent C1. Finish a chapter to open the next page of your story.",
    overall: "Overall progress",
    units: (n, total) => `${n}/${total} units`,
    target: "Target",
    changePace: "Change pace",
    savePace: "Save",
    chapters: "Chapters",
    chapter: "Chapter",
    progress: "Progress",
    start: "Start",
    continueLabel: "Continue",
    done: "Done",
    unit: "Unit",
    min: "min",
    locked: "Finish the units before this one to unlock it.",
    minuteQuestion: "Minutes per day?",
    testOut: "Confident in this level? Test out and skip to the next one",
  },
  ru: {
    eyebrow: "Учебный план",
    titleLine1: "Твой",
    titleLine2: "роадмап",
    sub: "Полный путь от первого слова до свободного C1. Заверши главу, чтобы открыть следующую страницу своей истории.",
    overall: "Общий прогресс",
    units: (n, total) => `${n}/${total} юнитов`,
    target: "Ориентир",
    changePace: "Изменить темп",
    savePace: "Сохранить",
    chapters: "Главы",
    chapter: "Глава",
    progress: "Прогресс",
    start: "Начать",
    continueLabel: "Продолжить",
    done: "Пройдено",
    unit: "Юнит",
    min: "мин",
    locked: "Заверши предыдущие юниты, чтобы открыть этот.",
    minuteQuestion: "Минут в день?",
    testOut: "Уверен в этом уровне? Сдай тест и перейди сразу к следующему",
  },
  tg: {
    eyebrow: "Нақшаи таълим",
    titleLine1: "Нақшаи",
    titleLine2: "роҳи ту",
    sub: "Роҳи пурра аз калимаи аввал то C1-и озод. Бобро ба итмом расонед, то саҳифаи навбатии таърихи худро кушоед.",
    overall: "Пешрафти умумӣ",
    units: (n, total) => `${n}/${total} воҳид`,
    target: "Ҳадаф",
    changePace: "Тағйири суръат",
    savePace: "Нигоҳ доштан",
    chapters: "Бобҳо",
    chapter: "Боби",
    progress: "Пешрафт",
    start: "Оғоз",
    continueLabel: "Идома",
    done: "Иҷро шуд",
    unit: "Воҳид",
    min: "дақ",
    locked: "Барои кушодани ин воҳид аввал воҳидҳои қаблиро ба итмом расонед.",
    minuteQuestion: "Дар як рӯз чанд дақиқа?",
    testOut: "Ба ин сатҳ бовариноӣ? Санҷишро супор ва ба сатҳи оянда гузар",
  },
};

const LAST_LEVEL = "C1";

function splitTitle(title) {
  const idx = title.indexOf(",");
  if (idx === -1 || idx === title.length - 1) return [title, ""];
  return [title.slice(0, idx + 1), title.slice(idx + 1).trim()];
}

function GlossaSeal() {
  return (
    <div className="hidden md:flex w-24 h-24 rounded-full border-2 border-dashed border-on-surface/40 items-center justify-center shrink-0">
      <div className="w-[86%] h-[86%] rounded-full border border-on-surface/25 flex flex-col items-center justify-center text-center">
        <span className="font-display italic text-base leading-none">Glossa</span>
        <span className="font-label text-[6px] uppercase tracking-[0.3em] text-on-surface-variant mt-1">Editorial</span>
      </div>
    </div>
  );
}

function OnboardingGate({ lang, onDone }) {
  const [minutes, setMinutes] = useState(30);
  const [saving, setSaving] = useState(false);
  const T = PAGE_TEXT[lang];

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await submitOnboarding({ daily_minutes_budget: minutes });
      onDone();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 ray-pattern pointer-events-none" aria-hidden="true" />
      <div className="max-w-xl mx-auto mt-16 border-2 border-on-surface bg-surface p-8 md:p-12 text-center">
        <span className="font-label text-[10px] uppercase tracking-[0.3em] text-secondary">{T.eyebrow}</span>
        <h1 className="font-display text-4xl md:text-5xl leading-none mt-3 mb-4">
          {T.titleLine1} <em className="italic text-secondary font-normal">{T.titleLine2}</em>
        </h1>
        <p className="font-body text-body-md text-on-surface-variant mb-10">{T.sub}</p>

        <p className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-3">
          {T.minuteQuestion}
        </p>
        <div className="flex gap-3 mb-10">
          {MINUTE_OPTIONS.map((m) => (
            <button
              key={m}
              onClick={() => setMinutes(m)}
              className={`flex-1 py-3 border-2 border-on-surface font-label text-sm font-bold transition-all ${
                minutes === m ? "bg-secondary text-white" : "bg-surface hover:bg-surface-container"
              }`}
            >
              {m} {PAGE_TEXT[lang].min}
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-4 bg-secondary text-white font-label text-xs uppercase tracking-[0.2em] hover:bg-on-surface transition-colors disabled:opacity-60"
        >
          {T.savePace}
        </button>
      </div>
    </div>
  );
}

function PaceEditor({ lang, current, onDone, onCancel }) {
  const [minutes, setMinutes] = useState(current || 30);
  const [saving, setSaving] = useState(false);
  const T = PAGE_TEXT[lang];

  const handleSave = async () => {
    setSaving(true);
    try {
      await submitOnboarding({ daily_minutes_budget: minutes });
      onDone();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 border-t border-dashed border-on-surface/25 pt-3">
      <div className="flex gap-1.5 mb-2">
        {MINUTE_OPTIONS.map((m) => (
          <button
            key={m}
            onClick={() => setMinutes(m)}
            className={`px-2 py-1 border font-label text-[9px] uppercase tracking-widest ${
              minutes === m ? "bg-secondary text-white border-secondary" : "border-on-surface/30 hover:bg-surface-container"
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="font-label text-[9px] uppercase tracking-widest text-secondary underline underline-offset-2 disabled:opacity-60"
        >
          {T.savePace}
        </button>
        <button onClick={onCancel} className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant">
          ×
        </button>
      </div>
    </div>
  );
}

function UnitRow({ index, unit, isLast, isCurrent, onClick, onLockedClick, T }) {
  const locked = unit.locked;
  const completed = unit.status === "completed";
  const [line1, line2] = splitTitle(unit.theme_title);

  const circleClasses = locked
    ? "border-on-surface/25 text-on-surface-variant/40 bg-transparent"
    : completed
      ? "border-secondary bg-secondary text-white"
      : "border-secondary text-secondary bg-surface";

  return (
    <div className="flex gap-4 md:gap-6">
      <div className="flex flex-col items-center shrink-0">
        <div className={`relative w-10 h-10 rounded-full border-2 flex items-center justify-center font-display text-sm ${circleClasses}`}>
          {locked ? (
            <Icon name="lock" className="text-sm" />
          ) : completed ? (
            <Icon name="check" className="text-base" />
          ) : (
            index
          )}
          {isCurrent && !completed && !locked && (
            <Icon name="auto_awesome" className="absolute -top-2 -right-2 text-secondary text-sm" />
          )}
        </div>
        {!isLast && <div className="flex-1 w-0 border-l-2 border-dotted border-on-surface/25 my-1" />}
      </div>

      <div className={`flex-1 min-w-0 ${isLast ? "" : "pb-5 md:pb-4"}`}>
        <button
          onClick={locked ? onLockedClick : onClick}
          className={`relative w-full text-left transition-all ${
            locked
              ? "border-2 border-on-surface/15 bg-transparent px-5 py-4 cursor-not-allowed"
              : isCurrent
                ? "border-2 border-on-surface border-l-[6px] border-l-secondary bg-surface px-5 py-5 md:px-6 md:py-6 hard-shadow hover:-translate-y-0.5 hover:shadow-none transition-transform"
                : "border-2 border-on-surface bg-surface px-5 py-4 hover:bg-surface-container transition-colors"
          }`}
        >
          {!locked && (
            <span
              className={`absolute top-4 right-4 md:top-5 md:right-5 font-label text-[9px] uppercase tracking-[0.2em] px-2.5 py-1 ${
                completed ? "bg-on-surface text-surface" : "bg-secondary text-white"
              }`}
            >
              {completed ? T.done : unit.status === "in_progress" ? T.continueLabel : T.start}
            </span>
          )}
          {locked && <Icon name="lock" className="absolute top-4 right-4 text-on-surface-variant/30 text-lg" />}

          <p className={`font-display text-xl md:text-2xl leading-snug pr-16 ${locked ? "text-on-surface-variant/50" : "text-on-surface"}`}>
            {line1}
            {line2 && (
              <>
                <br />
                <em className="italic font-normal">{line2}</em>
              </>
            )}
          </p>

          {!locked && (
            <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mt-3 flex items-center gap-1.5">
              {T.unit} {unit.unit_code} · {unit.estimated_minutes} {T.min}
              {unit.is_level_midpoint && <Icon name="flag" className="text-xs text-secondary" />}
              {unit.is_level_final && <Icon name="military_tech" className="text-xs text-secondary" />}
            </p>
          )}
        </button>
      </div>
    </div>
  );
}

export default function Roadmap() {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const toast = useToast();
  const T = PAGE_TEXT[lang] || PAGE_TEXT.en;
  const levelNames = LEVEL_NAMES[lang] || LEVEL_NAMES.en;

  const [activeLevel, setActiveLevel] = useState(null);
  const [editingPace, setEditingPace] = useState(false);

  const { data: onboarding, loading: onboardingLoading, reload: reloadOnboarding } = useApi(
    () => getOnboardingStatus(),
    []
  );

  const onboarded = onboarding?.onboarded;

  const { data: progress, loading: progressLoading, error: progressError, reload: reloadProgress } = useApi(
    () => (onboarded ? getCourseProgress() : Promise.resolve(null)),
    [onboarded]
  );

  const { data: units, loading: unitsLoading, error: unitsError } = useApi(
    () => (onboarded ? getCourseUnits(undefined, { locale: lang }) : Promise.resolve(null)),
    [onboarded, lang]
  );

  const unitsByLevel = useMemo(() => {
    if (!units) return {};
    const grouped = {};
    for (const u of units) {
      grouped[u.cefr_level] = grouped[u.cefr_level] || [];
      grouped[u.cefr_level].push(u);
    }
    return grouped;
  }, [units]);

  const levelStatsByLevel = useMemo(() => {
    const result = {};
    for (const s of progress?.level_breakdown || []) {
      result[s.cefr_level] = s;
    }
    return result;
  }, [progress]);

  if (onboardingLoading) {
    return (
      <div className="max-w-3xl mx-auto mt-16 space-y-4">
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!onboarded) {
    return <OnboardingGate lang={lang} onDone={reloadOnboarding} />;
  }

  if (progressError || unitsError) {
    return (
      <div className="max-w-3xl mx-auto mt-16">
        <ErrorState error={progressError || unitsError} onRetry={() => reloadProgress()} />
      </div>
    );
  }

  const overallPct = progress ? Math.round((progress.completed_units / Math.max(progress.total_units, 1)) * 100) : 0;
  const effectiveLevel = activeLevel || progress?.current_level || "A1";
  const chapterUnits = unitsByLevel[effectiveLevel] || [];
  const chapterStats = levelStatsByLevel[effectiveLevel];

  const handleLockedClick = () => toast.info(T.locked);

  let finishYear = null;
  let finishRest = null;
  if (progress?.projected_finish_date) {
    const [y, m, d] = progress.projected_finish_date.split("-");
    finishYear = y;
    finishRest = `/${m}/${d}`;
  }

  return (
    <div className="pb-24">
      <div className="relative overflow-hidden -mx-4 px-4 md:-mx-8 md:px-8">
        <div className="absolute inset-0 -z-10 ray-pattern pointer-events-none" aria-hidden="true" />

        <div className="max-w-5xl mx-auto pt-2">
          <div className="flex items-start justify-between gap-6 mb-8">
            <div>
              <span className="font-label text-[10px] uppercase tracking-[0.3em] text-secondary">{T.eyebrow}</span>
              <h1 className="font-display text-5xl md:text-6xl leading-[0.95] mt-2">
                {T.titleLine1}
                <br />
                <em className="italic text-secondary font-normal">{T.titleLine2}</em>
              </h1>
              <p className="font-body text-body-md text-on-surface-variant max-w-md mt-4">{T.sub}</p>
            </div>
            <GlossaSeal />
          </div>

          <div className="border-t-2 border-on-surface" />

          {progressLoading ? (
            <Skeleton className="h-24 my-6" />
          ) : progress ? (
            <div className="flex flex-col md:flex-row gap-6 md:gap-10 py-6 md:items-stretch">
              <div className="flex-1">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="font-body italic text-sm text-on-surface-variant">{T.overall}</span>
                  <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                    {T.units(progress.completed_units, progress.total_units)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-display italic text-6xl text-secondary leading-none">{overallPct}%</span>
                  <span className="font-display text-3xl text-on-surface-variant/30">—</span>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="font-label text-[9px] text-on-surface-variant/60">0</span>
                    <div className="flex-1 h-px bg-on-surface/15 relative">
                      <div className="absolute inset-y-0 left-0 bg-secondary" style={{ width: `${overallPct}%` }} />
                    </div>
                    <span className="font-label text-[9px] text-on-surface-variant/60">{progress.total_units}</span>
                  </div>
                </div>
              </div>

              <div className="border-2 border-on-surface px-6 py-4 shrink-0 md:w-48 text-center md:text-left">
                <p className="font-label text-[9px] uppercase tracking-[0.25em] text-on-surface-variant mb-1">{T.target}</p>
                {finishYear ? (
                  <>
                    <p className="font-display text-3xl leading-none">{finishYear}</p>
                    <p className="font-label text-xs text-on-surface-variant mt-0.5">{finishRest}</p>
                  </>
                ) : (
                  <p className="font-body text-sm text-on-surface-variant">—</p>
                )}
                {editingPace ? (
                  <PaceEditor
                    lang={lang}
                    current={progress.daily_minutes_budget}
                    onDone={() => {
                      setEditingPace(false);
                      reloadProgress();
                    }}
                    onCancel={() => setEditingPace(false)}
                  />
                ) : (
                  <button
                    onClick={() => setEditingPace(true)}
                    className="font-label text-[10px] uppercase tracking-widest text-secondary underline underline-offset-2 mt-2 block hover:text-on-surface transition-colors"
                  >
                    {T.changePace}
                  </button>
                )}
              </div>
            </div>
          ) : null}

          <div className="border-t-2 border-on-surface" />

          <div className="flex items-center gap-6 py-5 flex-wrap">
            <span className="font-label text-[10px] uppercase tracking-[0.25em] text-on-surface-variant">{T.chapters}</span>
            <div className="flex items-center gap-5">
              {LEVELS.map((lv) => (
                <button
                  key={lv}
                  onClick={() => setActiveLevel(lv)}
                  className={`font-display text-lg transition-colors ${
                    lv === effectiveLevel
                      ? "italic text-secondary underline underline-offset-[6px] decoration-2 decoration-secondary"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {lv}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <span className="font-label text-[10px] uppercase tracking-[0.25em] text-on-surface-variant">
            {levelNames[effectiveLevel]}
          </span>
          <h2 className="font-display text-4xl md:text-5xl leading-none mt-1">
            {T.chapter} {CHAPTER_NUMERALS[effectiveLevel]}
          </h2>
          <span className="font-label text-[10px] uppercase tracking-[0.25em] text-on-surface-variant mt-2 block">
            {T.progress}: {chapterStats?.completed ?? 0} / {chapterStats?.total ?? chapterUnits.length}
          </span>

          {effectiveLevel === progress?.current_level && effectiveLevel !== LAST_LEVEL && (
            <button
              onClick={() => navigate(`/roadmap/level-test/${effectiveLevel}/placement`)}
              className="mt-4 font-label text-[10px] uppercase tracking-widest font-bold text-secondary underline underline-offset-4 hover:text-on-surface transition-colors"
            >
              {T.testOut}
            </button>
          )}
        </div>

        {unitsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : (
          <div>
            {chapterUnits.map((unit, i) => (
              <UnitRow
                key={unit.id}
                index={i + 1}
                unit={unit}
                isLast={i === chapterUnits.length - 1}
                isCurrent={unit.id === progress?.current_unit_id}
                onClick={() => navigate(`/roadmap/units/${unit.id}`)}
                onLockedClick={handleLockedClick}
                T={T}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
