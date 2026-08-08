import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import ProgressBar from "../components/ui/ProgressBar.jsx";
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

const LEVEL_LABELS = {
  en: { A1: "A1 · Beginner", A2: "A2 · Elementary", B1: "B1 · Pre-Intermediate", B2: "B2 · Intermediate", C1: "C1 · Upper-Intermediate" },
  ru: { A1: "A1 · Начальный", A2: "A2 · Элементарный", B1: "B1 · Предсредний", B2: "B2 · Средний", C1: "C1 · Выше среднего" },
  tg: { A1: "A1 · Ибтидоӣ", A2: "A2 · Оддӣ", B1: "B1 · Пеш аз миёна", B2: "B2 · Миёна", C1: "C1 · Аз миёна боло" },
};

const MINUTE_OPTIONS = [15, 30, 60];

function OnboardingGate({ lang, onDone }) {
  const [minutes, setMinutes] = useState(30);
  const [saving, setSaving] = useState(false);

  const T = {
    en: {
      title: "Set your pace",
      sub: "This only shapes your daily plan — your streak is what keeps you coming back every day.",
      q1: "Minutes per day you can realistically give English?",
      cta: "Build my roadmap",
    },
    ru: {
      title: "Задай свой темп",
      sub: "Это только для дневного плана — приходить каждый день тебя держит стрик.",
      q1: "Сколько минут в день ты реально готов уделять английскому?",
      cta: "Построить мой роадмап",
    },
    tg: {
      title: "Суръати худро танзим кунед",
      sub: "Ин танҳо барои нақшаи рӯзонаст — ҳар рӯз омаданатонро стрик нигоҳ медорад.",
      q1: "Дар як рӯз чанд дақиқа ба забони англисӣ вақт медиҳед?",
      cta: "Роадмапи маро бисоз",
    },
  }[lang];

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
    <div className="max-w-xl mx-auto mt-16 neo-card p-8 md:p-10">
      <h1 className="font-headline text-headline-lg mb-2">{T.title}</h1>
      <p className="font-body text-body-md opacity-70 mb-8">{T.sub}</p>

      <div className="mb-8">
        <p className="font-label text-label-md uppercase tracking-wider mb-3">{T.q1}</p>
        <div className="flex gap-3">
          {MINUTE_OPTIONS.map((m) => (
            <button
              key={m}
              onClick={() => setMinutes(m)}
              className={`flex-1 py-3 border-2 border-on-surface font-label text-sm font-bold transition-all ${
                minutes === m ? "bg-secondary text-white shadow-[3px_3px_0px_0px_#000]" : "bg-surface hover:bg-surface-container"
              }`}
            >
              {m} {lang === "ru" ? "мин" : lang === "tg" ? "дақ" : "min"}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="btn-primary-neo w-full py-4 font-label-md uppercase tracking-wider disabled:opacity-60"
      >
        {T.cta}
      </button>
    </div>
  );
}

function statusStyle(status, isCurrent, locked) {
  if (locked) {
    return "bg-surface border-on-surface/20 text-on-surface-variant/50";
  }
  if (status === "completed") {
    return "bg-secondary border-secondary text-white";
  }
  if (isCurrent || status === "in_progress") {
    return "bg-[#ffb95f] border-on-surface text-on-surface ring-4 ring-[#ffb95f]/30";
  }
  return "bg-surface border-on-surface text-on-surface-variant";
}

function UnitNode({ unit, side, isCurrent, onClick, onLockedClick }) {
  const locked = unit.locked;
  const handleClick = locked ? onLockedClick : onClick;

  return (
    <div className={`flex items-center gap-4 ${side === "right" ? "flex-row" : "flex-row-reverse text-right"} ${locked ? "opacity-60" : ""}`}>
      <div
        className={`shrink-0 w-14 h-14 rounded-full border-2 flex items-center justify-center font-label text-xs font-black transition-transform ${!locked ? "hover:scale-110 cursor-pointer" : "cursor-not-allowed"} ${statusStyle(unit.status, isCurrent, locked)}`}
        title={locked ? undefined : unit.theme_title}
        onClick={handleClick}
      >
        {locked ? (
          <Icon name="lock" className="text-lg" />
        ) : unit.status === "completed" ? (
          <Icon name="check" className="text-xl" />
        ) : (
          unit.unit_code
        )}
      </div>
      <div
        className={`flex-1 min-w-0 ${side === "right" ? "text-left" : "text-right"} group ${!locked ? "cursor-pointer" : "cursor-not-allowed"}`}
        onClick={handleClick}
      >
        <p className={`font-body text-sm font-bold transition-colors line-clamp-1 ${locked ? "text-on-surface-variant" : "text-on-surface group-hover:text-secondary"}`}>
          {unit.theme_title}
        </p>
        {!locked && (
          <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant flex items-center gap-1 mt-0.5">
            {unit.unit_code} · {unit.estimated_minutes} {"min"}
            {unit.is_level_midpoint && <Icon name="flag" className="text-sm text-secondary" />}
            {unit.is_level_final && <Icon name="military_tech" className="text-sm text-secondary" />}
          </p>
        )}
      </div>
    </div>
  );
}

function LevelSection({ level, label, units, levelStats, currentUnitId, navigate, onLockedClick }) {
  const pct = levelStats ? Math.round((levelStats.completed / Math.max(levelStats.total, 1)) * 100) : 0;

  return (
    <section id={`level-${level}`} className="scroll-mt-24 mb-16">
      <div className="flex items-center justify-between mb-6 border-b-2 border-on-surface pb-3">
        <h2 className="font-headline text-headline-md">{label}</h2>
        <span className="font-label text-xs uppercase tracking-widest font-bold text-on-surface-variant">
          {levelStats?.completed ?? 0}/{levelStats?.total ?? units.length} · {pct}%
        </span>
      </div>
      <div className="relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-on-surface/15 -translate-x-1/2 hidden md:block" />
        <div className="flex flex-col gap-6 md:gap-4">
          {units.map((unit, i) => (
            <div key={unit.id} className="md:grid md:grid-cols-2 md:gap-8 items-center">
              <div className={i % 2 === 0 ? "md:col-start-1" : "md:col-start-2 md:row-start-1"}>
                {i % 2 === 0 && (
                  <UnitNode
                    unit={unit}
                    side="right"
                    isCurrent={unit.id === currentUnitId}
                    onClick={() => navigate(`/roadmap/units/${unit.id}`)}
                    onLockedClick={onLockedClick}
                  />
                )}
              </div>
              <div className={i % 2 === 1 ? "md:col-start-2" : "md:col-start-1 md:row-start-1"}>
                {i % 2 === 1 && (
                  <UnitNode
                    unit={unit}
                    side="left"
                    isCurrent={unit.id === currentUnitId}
                    onClick={() => navigate(`/roadmap/units/${unit.id}`)}
                    onLockedClick={onLockedClick}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Roadmap() {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const labels = LEVEL_LABELS[lang] || LEVEL_LABELS.en;
  const toast = useToast();

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
    () => (onboarded ? getCourseUnits() : Promise.resolve(null)),
    [onboarded]
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
        <ErrorState error={progressError || unitsError} onRetry={() => { reloadProgress(); }} />
      </div>
    );
  }

  const overallPct = progress ? Math.round((progress.completed_units / Math.max(progress.total_units, 1)) * 100) : 0;

  const T = {
    en: {
      title: "Your Roadmap",
      sub: "The full path from your first word to fluent C1 — finish a unit to unlock the next one.",
      overall: "Overall progress",
      finish: "Projected finish",
      jump: "Jump to level",
      locked: "Finish the units before this one to unlock it.",
    },
    ru: {
      title: "Твой роадмап",
      sub: "Полный путь от первого слова до свободного C1 — заверши юнит, чтобы открыть следующий.",
      overall: "Общий прогресс",
      finish: "Ожидаемое завершение",
      jump: "Перейти к уровню",
      locked: "Заверши предыдущие юниты, чтобы открыть этот.",
    },
    tg: {
      title: "Нақшаи роҳи ту",
      sub: "Роҳи пурра аз калимаи аввал то C1-и озод — воҳидро ба итмом расонед, то навбатӣ кушода шавад.",
      overall: "Пешрафти умумӣ",
      finish: "Санаи тахминии анҷом",
      jump: "Гузариш ба сатҳ",
      locked: "Барои кушодани ин воҳид аввал воҳидҳои қаблиро ба итмом расонед.",
    },
  }[lang];

  const handleLockedClick = () => toast.info(T.locked);

  return (
    <div className="relative">
      <div className="absolute inset-0 -z-10 ray-pattern pointer-events-none" aria-hidden="true" />
      <div className="max-w-5xl mx-auto pb-24">
        <div className="mb-10">
          <h1 className="font-headline text-5xl md:text-6xl font-bold leading-none tracking-tight mb-3">
            {T.title}
          </h1>
          <p className="font-body text-body-md opacity-70 max-w-2xl">{T.sub}</p>
        </div>

      {progressLoading ? (
        <Skeleton className="h-32 mb-10" />
      ) : progress ? (
        <div className="neo-card-secondary p-6 md:p-8 mb-10 flex flex-col md:flex-row md:items-center gap-6 justify-between">
          <div>
            <p className="font-label text-label-md uppercase tracking-widest opacity-70 mb-1">{T.overall}</p>
            <div className="flex items-end gap-2">
              <span className="font-display text-5xl">{overallPct}%</span>
              <span className="font-body text-sm opacity-70 mb-1">
                {progress.completed_units}/{progress.total_units}
              </span>
            </div>
            <ProgressBar value={overallPct} max={100} className="mt-3 w-64 max-w-full" />
          </div>
          {progress.projected_finish_date && (
            <div className="text-right">
              <p className="font-label text-label-md uppercase tracking-widest opacity-70 mb-1">{T.finish}</p>
              <p className="font-headline text-2xl">{progress.projected_finish_date}</p>
            </div>
          )}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 mb-12 sticky top-4 z-10">
        <span className="font-label text-[10px] uppercase tracking-widest opacity-60 self-center mr-1">{T.jump}</span>
        {LEVELS.map((lv) => (
          <a
            key={lv}
            href={`#level-${lv}`}
            className="px-3 py-1.5 border-2 border-on-surface bg-surface font-label text-[10px] uppercase font-bold tracking-wider hover:bg-secondary hover:text-white hover:border-secondary transition-colors"
          >
            {lv}
          </a>
        ))}
      </div>

      {unitsLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : (
        LEVELS.map((level) => (
          <LevelSection
            key={level}
            level={level}
            label={labels[level]}
            units={unitsByLevel[level] || []}
            levelStats={levelStatsByLevel[level]}
            currentUnitId={progress?.current_unit_id}
            navigate={navigate}
            onLockedClick={handleLockedClick}
          />
        ))
        )}
      </div>
    </div>
  );
}
