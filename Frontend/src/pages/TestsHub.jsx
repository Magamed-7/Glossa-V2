import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Skeleton from "../components/ui/Skeleton.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useApi } from "../lib/useApi.js";
import { useI18n } from "../lib/i18n.jsx";
import { getEligibleLevels, getPracticeAnalytics, getPracticeHistory, getStoryTests } from "../lib/api/practiceTests.js";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const LEVEL_ORDER_INDEX = Object.fromEntries(LEVELS.map((l, i) => [l, i]));

const SIZES = ["short", "medium", "long"];
const SIZE_COUNT = { short: 10, medium: 20, long: 30 };

const TXT = {
  en: {
    title: "Test Yourself",
    subtitle: "Extra practice tests, on your own terms. Taking these never changes your Roadmap progress, XP or streak — they're just for checking where you stand.",
    analyticsTitle: "Your practice average",
    attempts: "attempts",
    passRate: "pass rate",
    byCategory: "By content",
    byLevel: "By level",
    noAttemptsYet: "No practice tests taken yet — try one below.",
    levelUpTitle: "Level-up test",
    levelUpBody: (level, next) => `Pass this to skip straight from ${level} to ${next}. Unlike the tests below, this one does affect your Roadmap.`,
    levelUpCta: "Take the level-up test",
    levelUpNone: "You're on the highest level — no level-up test available.",
    builderTitle: "Build your own test",
    builderBody: "Choose levels and content, then start. Doesn't touch your Roadmap.",
    levelsLabel: "Levels",
    categoriesLabel: "Content",
    grammar: "Grammar",
    vocab: "Vocabulary",
    sizeLabel: "Length",
    sizeNames: { short: "Short", medium: "Medium", long: "Long" },
    questions: "questions",
    start: "Start test",
    pickLevel: "Pick at least one level",
    pickCategory: "Pick at least one content type",
    storiesTitle: "Story tests",
    storiesBody: "Reading comprehension checks, one per story. Read the story first to unlock its test.",
    allLevels: "All levels",
    readFirst: "Read the story first",
    readIt: "Read it",
    takeTest: "Take the test",
    retake: "Retake",
    best: "Best",
    historyTitle: "Recent attempts",
    combined: "Combined",
    story: "Story",
    noHistory: "Nothing here yet.",
  },
  ru: {
    title: "Проверь себя",
    subtitle: "Дополнительные тесты по твоему выбору. Они никак не влияют на прогресс роудмапа, опыт или серию — только для самопроверки.",
    analyticsTitle: "Твой средний результат",
    attempts: "попыток",
    passRate: "% сдачи",
    byCategory: "По разделам",
    byLevel: "По уровням",
    noAttemptsYet: "Пока нет пройденных тестов — начни с любого ниже.",
    levelUpTitle: "Тест перехода на уровень выше",
    levelUpBody: (level, next) => `Сдай его, чтобы перескочить с ${level} сразу на ${next}. В отличие от тестов ниже, этот влияет на твой роудмап.`,
    levelUpCta: "Пройти тест перехода",
    levelUpNone: "Ты уже на максимальном уровне — тест перехода недоступен.",
    builderTitle: "Собери свой тест",
    builderBody: "Выбери уровни и содержание, затем начни. Роудмап не затронет.",
    levelsLabel: "Уровни",
    categoriesLabel: "Содержание",
    grammar: "Грамматика",
    vocab: "Лексика",
    sizeLabel: "Длина",
    sizeNames: { short: "Короткий", medium: "Средний", long: "Длинный" },
    questions: "вопросов",
    start: "Начать тест",
    pickLevel: "Выбери хотя бы один уровень",
    pickCategory: "Выбери хотя бы один раздел",
    storiesTitle: "Тесты по историям",
    storiesBody: "Проверка понимания прочитанного, отдельно по каждой истории. Сначала прочитай историю — тест откроется после.",
    allLevels: "Все уровни",
    readFirst: "Сначала прочитайте историю",
    readIt: "Читать",
    takeTest: "Пройти тест",
    retake: "Пройти ещё раз",
    best: "Лучший результат",
    historyTitle: "Недавние попытки",
    combined: "Грамматика + лексика",
    story: "История",
    noHistory: "Пока пусто.",
  },
  tg: {
    title: "Худро санҷед",
    subtitle: "Санҷишҳои иловагӣ ба хости худ. Онҳо ба пешрафти нақшаи роҳ, XP ё силсила таъсир намерасонанд — танҳо барои худсанҷӣ.",
    analyticsTitle: "Натиҷаи миёнаи шумо",
    attempts: "кӯшиш",
    passRate: "% гузариш",
    byCategory: "Аз рӯи бахш",
    byLevel: "Аз рӯи сатҳ",
    noAttemptsYet: "Ҳанӯз ягон санҷиш супорида нашудааст — аз поён сар кунед.",
    levelUpTitle: "Санҷиши гузариш ба сатҳи болотар",
    levelUpBody: (level, next) => `Барои гузаштан аз ${level} мустақим ба ${next} инро супоред. Бар хилофи санҷишҳои поён, ин ба нақшаи роҳатон таъсир мерасонад.`,
    levelUpCta: "Санҷиши гузаришро супоред",
    levelUpNone: "Шумо аллакай дар сатҳи баландтарин ҳастед — санҷиши гузариш дастрас нест.",
    builderTitle: "Санҷиши худро созед",
    builderBody: "Сатҳҳо ва мазмунро интихоб кунед, сипас оғоз кунед. Ба нақшаи роҳ таъсир намерасонад.",
    levelsLabel: "Сатҳҳо",
    categoriesLabel: "Мазмун",
    grammar: "Грамматика",
    vocab: "Луғат",
    sizeLabel: "Дарозӣ",
    sizeNames: { short: "Кӯтоҳ", medium: "Миёна", long: "Дароз" },
    questions: "савол",
    start: "Санҷишро оғоз кунед",
    pickLevel: "Ҳадди ақал як сатҳро интихоб кунед",
    pickCategory: "Ҳадди ақал як бахшро интихоб кунед",
    storiesTitle: "Санҷиш аз рӯи ҳикояҳо",
    storiesBody: "Санҷиши фаҳмиши хониш, барои ҳар ҳикоя алоҳида. Аввал ҳикояро хонед — сипас санҷиш кушода мешавад.",
    allLevels: "Ҳамаи сатҳҳо",
    readFirst: "Аввал ҳикояро хонед",
    readIt: "Хондан",
    takeTest: "Санҷишро супоред",
    retake: "Такрор супоред",
    best: "Беҳтарин натиҷа",
    historyTitle: "Кӯшишҳои охирин",
    combined: "Грамматика + луғат",
    story: "Ҳикоя",
    noHistory: "Ҳанӯз холӣ.",
  },
};

function StatBlock({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="font-headline text-4xl font-bold leading-none">{value}</span>
      <span className="font-label text-[10px] uppercase tracking-widest font-bold opacity-70 mt-1">{label}</span>
    </div>
  );
}

function AnalyticsPanel({ analytics, t }) {
  if (!analytics) {
    return (
      <div className="bg-secondary text-surface border-2 border-on-surface p-6 shadow-[4px_4px_0px_0px_#000]">
        <Skeleton className="h-8 w-1/2 mb-3 bg-surface/20" />
        <Skeleton className="h-12 w-1/3 bg-surface/20" />
      </div>
    );
  }

  if (analytics.total_attempts === 0) {
    return (
      <div className="bg-surface border-2 border-on-surface p-6 shadow-[4px_4px_0px_0px_#000] flex items-center gap-3">
        <Icon name="quiz" className="text-3xl text-on-surface-variant/50" />
        <p className="font-body text-sm text-on-surface-variant">{t.noAttemptsYet}</p>
      </div>
    );
  }

  return (
    <div className="bg-secondary text-surface border-2 border-on-surface p-6 shadow-[4px_4px_0px_0px_#000]">
      <h3 className="font-headline text-lg font-bold mb-4">{t.analyticsTitle}</h3>
      <div className="flex items-end gap-8 mb-5">
        <div className="flex items-end gap-1">
          <span className="font-headline text-6xl font-bold leading-none">{Math.round(analytics.average_score_percent)}</span>
          <span className="font-headline text-2xl font-bold mb-1">%</span>
        </div>
        <StatBlock label={t.attempts} value={analytics.total_attempts} />
        <StatBlock label={t.passRate} value={`${Math.round(analytics.pass_rate)}%`} />
      </div>

      {analytics.by_category.length > 0 && (
        <div className="mb-3">
          <p className="font-label text-[9px] uppercase tracking-widest font-bold opacity-70 mb-2">{t.byCategory}</p>
          <div className="flex flex-wrap gap-2">
            {analytics.by_category.map((c) => (
              <span key={c.category} className="font-label text-[10px] uppercase font-bold border border-surface/50 px-2 py-1">
                {c.category === "combined" ? t.combined : c.category === "story" ? t.story : c.category === "grammar" ? t.grammar : t.vocab}
                {" — "}{Math.round(c.average_score_percent)}%
              </span>
            ))}
          </div>
        </div>
      )}

      {analytics.by_level.length > 0 && (
        <div>
          <p className="font-label text-[9px] uppercase tracking-widest font-bold opacity-70 mb-2">{t.byLevel}</p>
          <div className="flex flex-wrap gap-2">
            {analytics.by_level.map((l) => (
              <span key={l.cefr_level} className="font-label text-[10px] uppercase font-bold border border-surface/50 px-2 py-1">
                {l.cefr_level} — {Math.round(l.average_score_percent)}%
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TestBuilder({ t, lang, eligibleLevels }) {
  const navigate = useNavigate();
  const [levels, setLevels] = useState([]);
  const [categories, setCategories] = useState(["grammar", "vocab"]);
  const [size, setSize] = useState("medium");

  useEffect(() => {
    if (eligibleLevels?.length) setLevels((prev) => (prev.length ? prev : [eligibleLevels[eligibleLevels.length - 1]]));
  }, [eligibleLevels]);

  function toggleLevel(level) {
    setLevels((prev) => (prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]));
  }

  function toggleCategory(category) {
    setCategories((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]));
  }

  const canStart = levels.length > 0 && categories.length > 0;

  function start() {
    if (!canStart) return;
    const params = new URLSearchParams({ levels: levels.join(","), categories: categories.join(","), size });
    navigate(`/tests/practice/run?${params.toString()}`);
  }

  return (
    <div className="bg-surface border-2 border-on-surface p-6 shadow-[4px_4px_0px_0px_#000]">
      <h3 className="font-headline text-lg font-bold text-on-surface mb-1">{t.builderTitle}</h3>
      <p className="font-body text-sm text-on-surface-variant mb-5">{t.builderBody}</p>

      <p className="font-label text-[9px] uppercase tracking-widest font-bold text-on-surface-variant mb-2">{t.levelsLabel}</p>
      <div className="flex flex-wrap gap-2 mb-5">
        {(eligibleLevels || []).map((level) => {
          const active = levels.includes(level);
          return (
            <button
              key={level}
              type="button"
              onClick={() => toggleLevel(level)}
              className={`font-label text-[11px] uppercase font-bold px-3 py-2 border-2 border-on-surface transition-all cursor-pointer ${
                active ? "bg-secondary text-surface shadow-[3px_3px_0px_0px_#000]" : "bg-surface text-on-surface hover:bg-surface-variant"
              }`}
            >
              {level}
            </button>
          );
        })}
      </div>

      <p className="font-label text-[9px] uppercase tracking-widest font-bold text-on-surface-variant mb-2">{t.categoriesLabel}</p>
      <div className="flex flex-wrap gap-2 mb-5">
        {[["grammar", t.grammar], ["vocab", t.vocab]].map(([key, label]) => {
          const active = categories.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleCategory(key)}
              className={`font-label text-[11px] uppercase font-bold px-3 py-2 border-2 border-on-surface transition-all cursor-pointer ${
                active ? "bg-secondary text-surface shadow-[3px_3px_0px_0px_#000]" : "bg-surface text-on-surface hover:bg-surface-variant"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <p className="font-label text-[9px] uppercase tracking-widest font-bold text-on-surface-variant mb-2">{t.sizeLabel}</p>
      <div className="flex flex-wrap gap-2 mb-6">
        {SIZES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSize(s)}
            className={`font-label text-[11px] uppercase font-bold px-3 py-2 border-2 border-on-surface transition-all cursor-pointer ${
              size === s ? "bg-secondary text-surface shadow-[3px_3px_0px_0px_#000]" : "bg-surface text-on-surface hover:bg-surface-variant"
            }`}
          >
            {t.sizeNames[s]} ({SIZE_COUNT[s]} {t.questions})
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={start}
        disabled={!canStart}
        className="w-full bg-secondary text-surface border-2 border-on-surface py-3 font-label text-[11px] uppercase tracking-widest font-bold shadow-[4px_4px_0px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        {t.start}
      </button>
      {!canStart && (
        <p className="font-label text-[10px] text-on-surface-variant mt-2 text-center">
          {levels.length === 0 ? t.pickLevel : t.pickCategory}
        </p>
      )}
    </div>
  );
}

function LevelUpCard({ t, currentLevel }) {
  const navigate = useNavigate();
  const idx = LEVEL_ORDER_INDEX[currentLevel];
  const nextLevel = idx !== undefined && idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;

  return (
    <div className="border-2 border-on-surface border-dashed p-6 bg-[#fff8e8]">
      <div className="flex items-center gap-2 mb-2">
        <Icon name="military_tech" className="text-secondary text-xl" />
        <h3 className="font-headline text-lg font-bold text-on-surface">{t.levelUpTitle}</h3>
      </div>
      {nextLevel ? (
        <>
          <p className="font-body text-sm text-on-surface-variant mb-4">{t.levelUpBody(currentLevel, nextLevel)}</p>
          <button
            type="button"
            onClick={() => navigate(`/roadmap/level-test/${currentLevel}/placement`)}
            className="bg-on-surface text-surface border-2 border-on-surface px-5 py-2.5 font-label text-[10px] uppercase tracking-widest font-bold shadow-[4px_4px_0px_0px_#b90538] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all cursor-pointer"
          >
            {t.levelUpCta}
          </button>
        </>
      ) : (
        <p className="font-body text-sm text-on-surface-variant">{t.levelUpNone}</p>
      )}
    </div>
  );
}

function StoryRow({ story, t, lang }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between gap-4 border-2 border-on-surface bg-surface p-4 shadow-[3px_3px_0px_0px_#000]">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-label text-[9px] uppercase font-bold border border-on-surface px-1.5 py-0.5">{story.cefr_level}</span>
          {story.attempts > 0 && (
            <span className="font-label text-[9px] uppercase font-bold text-on-surface-variant">
              {t.best}: {Math.round(story.best_score_percent)}%
            </span>
          )}
        </div>
        <p className="font-headline text-base font-bold text-on-surface truncate">{story.title}</p>
      </div>

      {story.is_read ? (
        <button
          type="button"
          onClick={() => navigate(`/tests/story/${story.story_id}/run`)}
          className="shrink-0 bg-secondary text-surface border-2 border-on-surface px-4 py-2 font-label text-[10px] uppercase tracking-widest font-bold shadow-[3px_3px_0px_0px_#000] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all cursor-pointer"
        >
          {story.attempts > 0 ? t.retake : t.takeTest}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => navigate(`/stories/${story.story_id}`)}
          title={t.readFirst}
          className="shrink-0 flex items-center gap-1.5 bg-surface text-on-surface-variant border-2 border-on-surface/40 border-dashed px-4 py-2 font-label text-[10px] uppercase tracking-widest font-bold hover:border-on-surface hover:text-on-surface transition-all cursor-pointer"
        >
          <Icon name="lock" className="text-sm" />
          {t.readIt}
        </button>
      )}
    </div>
  );
}

export default function TestsHub() {
  const { lang } = useI18n();
  const t = TXT[lang] || TXT.en;

  const [storyLevelFilter, setStoryLevelFilter] = useState("");

  const { data: levelsData } = useApi(() => getEligibleLevels(), []);
  const { data: analytics } = useApi(() => getPracticeAnalytics(), []);
  const { data: history } = useApi(() => getPracticeHistory({ limit: 10 }), []);
  const { data: storyTests, loading: storiesLoading } = useApi(
    () => getStoryTests({ level: storyLevelFilter || undefined, locale: lang }),
    [lang, storyLevelFilter]
  );

  return (
    <div
      className="min-h-screen text-on-surface relative overflow-x-hidden"
      style={{
        backgroundColor: "#fcf9f6",
        backgroundImage: "radial-gradient(#dcdad7 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
    >
      <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-16 py-16">
        <div className="mb-10">
          <h1 className="font-headline text-5xl md:text-6xl font-bold text-on-surface tracking-tight leading-none">
            {t.title}
          </h1>
          <p className="font-body text-base text-on-surface-variant max-w-2xl mt-3">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-12 gap-6 mb-10">
          <div className="col-span-12 lg:col-span-6">
            <AnalyticsPanel analytics={analytics} t={t} />
          </div>
          <div className="col-span-12 lg:col-span-6">
            <LevelUpCard t={t} currentLevel={levelsData?.current_level || "A1"} />
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 mb-14">
          <div className="col-span-12 lg:col-span-5">
            <TestBuilder t={t} lang={lang} eligibleLevels={levelsData?.eligible_levels} />
          </div>

          <div className="col-span-12 lg:col-span-7">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h3 className="font-headline text-xl font-bold text-on-surface">{t.storiesTitle}</h3>
                <p className="font-body text-sm text-on-surface-variant">{t.storiesBody}</p>
              </div>
              <select
                value={storyLevelFilter}
                onChange={(e) => setStoryLevelFilter(e.target.value)}
                className="font-label text-[11px] uppercase font-bold border-2 border-on-surface bg-surface px-2 py-2 shrink-0"
              >
                <option value="">{t.allLevels}</option>
                {LEVELS.map((lv) => (
                  <option key={lv} value={lv}>{lv}</option>
                ))}
              </select>
            </div>

            {storiesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {(storyTests || []).map((story) => (
                  <StoryRow key={story.story_id} story={story} t={t} lang={lang} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-headline text-xl font-bold text-on-surface border-b-2 border-on-surface pb-3 mb-5">
            {t.historyTitle}
          </h3>
          {history && history.length > 0 ? (
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.id} className="flex items-center justify-between gap-4 border-2 border-on-surface bg-surface p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-label text-[9px] uppercase font-bold border border-on-surface px-1.5 py-0.5 shrink-0">
                      {h.category === "combined" ? t.combined : h.category === "story" ? t.story : h.category === "grammar" ? t.grammar : t.vocab}
                    </span>
                    <span className="font-body text-sm text-on-surface-variant truncate">{h.cefr_levels.join(", ")}</span>
                  </div>
                  <span className="font-headline text-lg font-bold text-secondary shrink-0">
                    {h.score_percent !== null ? `${Math.round(h.score_percent)}%` : "—"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-body text-sm text-on-surface-variant">{t.noHistory}</p>
          )}
        </div>
      </main>
    </div>
  );
}
