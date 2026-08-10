import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Skeleton from "../components/ui/Skeleton.jsx";
import Icon from "../components/ui/Icon.jsx";
import Gauge from "../components/ui/Gauge.jsx";
import { useApi } from "../lib/useApi.js";
import { useI18n } from "../lib/i18n.jsx";
import { getEligibleLevels, getPracticeAnalytics, getPracticeHistory, getStoryTests } from "../lib/api/practiceTests.js";
import { getBookCoverUrl } from "./StoriesCatalog.jsx";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const LEVEL_ORDER_INDEX = Object.fromEntries(LEVELS.map((l, i) => [l, i]));
const PRACTICE_SIZE = "medium";

const TXT = {
  en: {
    registryNo: "Registry No. EXM-71",
    volume: "Vol. 19",
    title: "Examination Hall",
    subtitle: "An Official Registry of Assessment. From foundational pedagogical drills to formal promotion examinations, evaluate your academic mastery with rigorous precision.",
    standingTitle: "Academic Standing",
    standingSub: "Your practice record. Ungraded — this ledger never affects your Roadmap, XP or streak.",
    average: "Average score",
    attempts: "Attempts logged",
    passRate: "Pass rate",
    noAttemptsYet: "No entries in the ledger yet — commence a drill below to begin your record.",
    recentEntries: "Recent entries",
    combined: "Grammar + Vocabulary",
    story: "Literature",
    grammarCat: "Grammar",
    vocabCat: "Vocabulary",
    drillsTitle: "Foundational Drills",
    ungraded: "Ungraded",
    drillsBody: "Configure modular pedagogical exercises tailored to your current scholarly focus. These iterations do not influence formal registry standing.",
    targetProficiency: "Target Proficiency",
    curricularFocus: "Curricular Focus",
    grammaticalArchitecture: "Grammatical Architecture",
    lexicalAcquisition: "Lexical Acquisition",
    literaryComprehension: "Literary Comprehension",
    comprehensiveSynthesis: "Comprehensive Synthesis",
    commence: "Commence Training Drill",
    pickLevel: "Select at least one proficiency target",
    pickCategory: "Select at least one curricular focus",
    advancementTitle: "Registry Advancement",
    officialAssessment: "Official Assessment",
    promotionExam: "Promotion Exam",
    promotionRange: (a, b) => `${a} to ${b}`,
    promotionBody: "This formal adjudication evaluates your scholarly readiness to progress. It encompasses advanced grammatical architectures, extended lexical mastery, and complex textual comprehension.",
    promotionNote: "Successful navigation of this rigorous assessment permanently advances your scholarly standing within the registry.",
    initiate: "Initiate Official Examination",
    maxLevelTitle: "Highest Standing Achieved",
    maxLevelBody: "You have already attained the registry's highest formal standing. No further promotion examination is available.",
    archivesTitle: "Literature Comprehension Archives",
    indexFilter: "Index Filter",
    completeIndex: "Complete Index",
    sealed: "Sealed",
    prerequisiteDeficient: "Prerequisite Deficient",
    prerequisiteBody: "Scholarly review of the foundational text is mandatory prior to examination access.",
    consultText: "Consult Text First",
    indexed: "Indexed",
    bestOf: (n) => `Best ${n}%`,
    commenceExam: "Commence Exam",
    retakeExam: "Retake Exam",
    noStories: "No texts archived for this filter yet.",
  },
  ru: {
    registryNo: "Реестр № ЭКЗ-71",
    volume: "Вып. 19",
    title: "Экзаменационный зал",
    subtitle: "Официальный реестр аттестации. От базовых тренировочных упражнений до официальных экзаменов на повышение уровня — оцени своё мастерство с полной строгостью.",
    standingTitle: "Академическая репутация",
    standingSub: "Твой журнал практики. Без оценки в личное дело — этот реестр никак не влияет на роудмап, опыт или серию.",
    average: "Средний результат",
    attempts: "Попыток в журнале",
    passRate: "Процент сдачи",
    noAttemptsYet: "В журнале пока пусто — начни тренировку ниже, чтобы открыть запись.",
    recentEntries: "Последние записи",
    combined: "Грамматика + лексика",
    story: "Литература",
    grammarCat: "Грамматика",
    vocabCat: "Лексика",
    drillsTitle: "Базовые тренировки",
    ungraded: "Без оценки",
    drillsBody: "Настрой модульные тренировочные упражнения под текущий научный фокус. Эти попытки не влияют на официальную репутацию в реестре.",
    targetProficiency: "Целевой уровень",
    curricularFocus: "Учебный фокус",
    grammaticalArchitecture: "Грамматическая архитектура",
    lexicalAcquisition: "Освоение лексики",
    literaryComprehension: "Понимание текста",
    comprehensiveSynthesis: "Комплексный синтез",
    commence: "Начать тренировку",
    pickLevel: "Выбери хотя бы один целевой уровень",
    pickCategory: "Выбери хотя бы один учебный фокус",
    advancementTitle: "Продвижение по реестру",
    officialAssessment: "Официальная аттестация",
    promotionExam: "Экзамен на повышение",
    promotionRange: (a, b) => `${a} → ${b}`,
    promotionBody: "Эта формальная аттестация оценивает твою научную готовность к продвижению. Она охватывает продвинутые грамматические конструкции, расширенное владение лексикой и сложное понимание текста.",
    promotionNote: "Успешное прохождение этой строгой аттестации навсегда повышает твою репутацию в реестре.",
    initiate: "Начать официальный экзамен",
    maxLevelTitle: "Высшая репутация достигнута",
    maxLevelBody: "Ты уже достиг высшей официальной репутации в реестре. Экзамен на повышение больше недоступен.",
    archivesTitle: "Архив понимания текста",
    indexFilter: "Фильтр каталога",
    completeIndex: "Весь каталог",
    sealed: "Опечатано",
    prerequisiteDeficient: "Не выполнено предусловие",
    prerequisiteBody: "Перед доступом к экзамену необходимо прочитать первоисточник.",
    consultText: "Сначала читать текст",
    indexed: "В каталоге",
    bestOf: (n) => `Лучший ${n}%`,
    commenceExam: "Сдать экзамен",
    retakeExam: "Пересдать",
    noStories: "Для этого фильтра пока нет текстов в архиве.",
  },
  tg: {
    registryNo: "Феҳрист № ИМТ-71",
    volume: "Ҷилди 19",
    title: "Толори имтиҳонот",
    subtitle: "Феҳристи расмии арзёбӣ. Аз машқҳои таълимии асосӣ то имтиҳонҳои расмии гузариш ба сатҳи баланд — донишу маҳорати худро бо дақиқии қатъӣ санҷед.",
    standingTitle: "Мақоми илмӣ",
    standingSub: "Феҳристи машқи шумо. Бе баҳогузорӣ — ин феҳрист ба нақшаи роҳ, XP ё силсила ҳеҷ гоҳ таъсир намерасонад.",
    average: "Натиҷаи миёна",
    attempts: "Кӯшишҳои сабтшуда",
    passRate: "Фоизи гузариш",
    noAttemptsYet: "Феҳрист ҳанӯз холист — барои кушодани сабт аз поён машқеро оғоз кунед.",
    recentEntries: "Сабтҳои охирин",
    combined: "Грамматика + луғат",
    story: "Адабиёт",
    grammarCat: "Грамматика",
    vocabCat: "Луғат",
    drillsTitle: "Машқҳои асосӣ",
    ungraded: "Бе баҳо",
    drillsBody: "Машқҳои таълимии модулиро мутобиқи фокуси илмии ҷории худ танзим кунед. Ин такрорҳо ба мақоми расмии феҳрист таъсир намерасонанд.",
    targetProficiency: "Сатҳи мақсаднок",
    curricularFocus: "Фокуси таълимӣ",
    grammaticalArchitecture: "Сохтори грамматикӣ",
    lexicalAcquisition: "Азхудкунии луғат",
    literaryComprehension: "Фаҳмиши матн",
    comprehensiveSynthesis: "Синтези ҳамаҷониба",
    commence: "Машқро оғоз кунед",
    pickLevel: "Ҳадди ақал як сатҳи мақсаднокро интихоб кунед",
    pickCategory: "Ҳадди ақал як фокуси таълимиро интихоб кунед",
    advancementTitle: "Пешравӣ дар феҳрист",
    officialAssessment: "Арзёбии расмӣ",
    promotionExam: "Имтиҳони гузариш",
    promotionRange: (a, b) => `${a} → ${b}`,
    promotionBody: "Ин арзёбии расмӣ омодагии илмии шуморо барои пешравӣ месанҷад. Он сохторҳои грамматикии пешрафта, азхудкунии васеи луғат ва фаҳмиши мураккаби матнро дар бар мегирад.",
    promotionNote: "Гузаштани муваффақонаи ин арзёбии қатъӣ мақоми шуморо дар феҳрист ба таври доимӣ баланд мебардорад.",
    initiate: "Имтиҳони расмиро оғоз кунед",
    maxLevelTitle: "Мақоми баландтарин ба даст омад",
    maxLevelBody: "Шумо аллакай ба мақоми баландтарини расмии феҳрист расидед. Имтиҳони гузариш дигар дастрас нест.",
    archivesTitle: "Бойгонии фаҳмиши матн",
    indexFilter: "Филтри феҳрист",
    completeIndex: "Феҳристи пурра",
    sealed: "Мӯҳршуда",
    prerequisiteDeficient: "Пешшарт иҷро нашудааст",
    prerequisiteBody: "Пеш аз дастрасӣ ба имтиҳон хондани матни асосӣ ҳатмист.",
    consultText: "Аввал матнро хонед",
    indexed: "Дар феҳрист",
    bestOf: (n) => `Беҳтарин ${n}%`,
    commenceExam: "Имтиҳонро супоред",
    retakeExam: "Такрор супоред",
    noStories: "Барои ин филтр ҳанӯз матне дар бойгонӣ нест.",
  },
};

function RegistryTag({ children, align = "left" }) {
  return (
    <span
      className={`font-ledger text-[9px] uppercase tracking-widest border border-tertiary/70 px-2 py-1 inline-block ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {children}
    </span>
  );
}

function SectionLabel({ children }) {
  return (
    <h2 className="font-headline text-headline-md border-b border-tertiary pb-2">{children}</h2>
  );
}

function CheckRow({ checked, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2.5 text-left group cursor-pointer py-1"
    >
      <span
        className={`w-4 h-4 shrink-0 border border-tertiary flex items-center justify-center transition-colors ${
          checked ? "bg-tertiary" : "bg-surface"
        }`}
      >
        {checked && <Icon name="check" className="text-surface text-[11px]" />}
      </span>
      <span className="font-body text-sm group-hover:text-secondary transition-colors">{children}</span>
    </button>
  );
}

function AcademicStanding({ analytics, history, t }) {
  const hasAttempts = analytics && analytics.total_attempts > 0;

  return (
    <div className="border border-tertiary p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-6">
        <div>
          <h2 className="font-headline text-headline-md">{t.standingTitle}</h2>
          <p className="font-body text-body-md text-on-surface-variant mt-1 max-w-xl italic">{t.standingSub}</p>
        </div>
      </div>

      {!analytics ? (
        <Skeleton className="h-24" />
      ) : !hasAttempts ? (
        <div className="border border-dashed border-tertiary p-6 flex items-center gap-3">
          <Icon name="history_edu" className="text-3xl text-on-surface-variant/50" />
          <p className="font-body text-body-md text-on-surface-variant">{t.noAttemptsYet}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-8 md:gap-12 pb-6 mb-6 border-b border-dotted border-tertiary/50">
            <Gauge value={Math.round(analytics.average_score_percent)} label={t.average} size={112} />
            <div className="flex flex-col gap-1">
              <span className="font-ledger text-4xl leading-none">{analytics.total_attempts}</span>
              <span className="font-label text-label-md uppercase text-on-surface-variant">{t.attempts}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-ledger text-4xl leading-none">{Math.round(analytics.pass_rate)}%</span>
              <span className="font-label text-label-md uppercase text-on-surface-variant">{t.passRate}</span>
            </div>

            {(analytics.by_category.length > 0 || analytics.by_level.length > 0) && (
              <div className="flex flex-wrap gap-2 ml-auto">
                {analytics.by_category.map((c) => (
                  <span key={c.category} className="font-label text-[10px] uppercase font-bold border border-tertiary px-2 py-1">
                    {c.category === "combined" ? t.combined : c.category === "story" ? t.story : c.category === "grammar" ? t.grammarCat : t.vocabCat}
                    {" · "}{Math.round(c.average_score_percent)}%
                  </span>
                ))}
                {analytics.by_level.map((l) => (
                  <span key={l.cefr_level} className="font-label text-[10px] uppercase font-bold border border-tertiary px-2 py-1">
                    {l.cefr_level} · {Math.round(l.average_score_percent)}%
                  </span>
                ))}
              </div>
            )}
          </div>

          {history && history.length > 0 && (
            <div>
              <p className="font-label text-label-md uppercase text-on-surface-variant mb-3">{t.recentEntries}</p>
              <div className="divide-y divide-dotted divide-tertiary/50">
                {history.slice(0, 5).map((h) => (
                  <div key={h.id} className="flex items-center justify-between gap-4 py-2.5">
                    <span className="font-body text-sm truncate">
                      {h.category === "combined" ? t.combined : h.category === "story" ? t.story : h.category === "grammar" ? t.grammarCat : t.vocabCat}
                      <span className="text-on-surface-variant"> — {h.cefr_levels.join(", ")}</span>
                    </span>
                    <span className="font-ledger text-lg shrink-0">
                      {h.score_percent !== null ? `${Math.round(h.score_percent)}%` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FoundationalDrills({ t, eligibleLevels }) {
  const navigate = useNavigate();
  const [levels, setLevels] = useState([]);
  const [categories, setCategories] = useState(["grammar", "vocab"]);

  useEffect(() => {
    if (eligibleLevels?.length) setLevels((prev) => (prev.length ? prev : [eligibleLevels[eligibleLevels.length - 1]]));
  }, [eligibleLevels]);

  function toggleLevel(level) {
    setLevels((prev) => (prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]));
  }

  function toggleCategory(cat) {
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  }

  const comprehensive = ["grammar", "vocab", "reading"].every((c) => categories.includes(c));

  function toggleComprehensive() {
    setCategories(comprehensive ? [] : ["grammar", "vocab", "reading"]);
  }

  const canStart = levels.length > 0 && categories.length > 0;

  function start() {
    if (!canStart) return;
    const params = new URLSearchParams({ levels: levels.join(","), categories: categories.join(","), size: PRACTICE_SIZE });
    navigate(`/tests/practice/run?${params.toString()}`);
  }

  return (
    <div className="border border-tertiary p-6 md:p-8 flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="font-headline text-headline-md">{t.drillsTitle}</h3>
        <span className="font-label text-[10px] uppercase font-bold border border-tertiary px-2 py-0.5 text-on-surface-variant">
          {t.ungraded}
        </span>
      </div>
      <p className="font-body text-sm text-on-surface-variant mb-6">{t.drillsBody}</p>

      <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">{t.targetProficiency}</p>
      <div className="grid grid-cols-3 gap-2 mb-6">
        {(eligibleLevels || []).map((level) => {
          const active = levels.includes(level);
          return (
            <button
              key={level}
              type="button"
              onClick={() => toggleLevel(level)}
              className={`font-label text-xs font-bold py-2 border border-tertiary transition-colors cursor-pointer ${
                active ? "bg-tertiary text-surface" : "bg-surface hover:bg-surface-container"
              }`}
            >
              {level}
            </button>
          );
        })}
      </div>

      <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">{t.curricularFocus}</p>
      <div className="mb-6 space-y-1">
        <CheckRow checked={categories.includes("grammar")} onClick={() => toggleCategory("grammar")}>
          {t.grammaticalArchitecture}
        </CheckRow>
        <CheckRow checked={categories.includes("vocab")} onClick={() => toggleCategory("vocab")}>
          {t.lexicalAcquisition}
        </CheckRow>
        <CheckRow checked={categories.includes("reading")} onClick={() => toggleCategory("reading")}>
          {t.literaryComprehension}
        </CheckRow>
        <CheckRow checked={comprehensive} onClick={toggleComprehensive}>
          {t.comprehensiveSynthesis}
        </CheckRow>
      </div>

      <button
        type="button"
        onClick={start}
        disabled={!canStart}
        className="mt-auto w-full bg-tertiary text-surface py-3 font-label text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity cursor-pointer"
      >
        <Icon name="play_arrow" className="text-base" />
        {t.commence}
      </button>
      {!canStart && (
        <p className="font-label text-[10px] text-on-surface-variant mt-2 text-center">
          {levels.length === 0 ? t.pickLevel : t.pickCategory}
        </p>
      )}
    </div>
  );
}

function RegistryAdvancement({ t, currentLevel }) {
  const navigate = useNavigate();
  const idx = LEVEL_ORDER_INDEX[currentLevel];
  const nextLevel = idx !== undefined && idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;

  return (
    <div className="border border-secondary bg-surface p-6 md:p-8 flex flex-col h-full relative">
      <div className="flex items-start justify-between mb-4">
        <span className="bg-secondary text-on-secondary font-label text-[10px] uppercase tracking-widest font-bold px-2.5 py-1">
          {t.officialAssessment}
        </span>
        <span className="w-8 h-8 rounded-full border border-secondary flex items-center justify-center shrink-0">
          <Icon name="workspace_premium" className="text-secondary text-base" />
        </span>
      </div>

      {nextLevel ? (
        <>
          <h3 className="font-headline text-headline-md">{t.promotionExam}</h3>
          <p className="font-headline italic text-secondary text-lg mb-4">{t.promotionRange(currentLevel, nextLevel)}</p>
          <p className="font-body text-sm text-on-surface-variant mb-5">{t.promotionBody}</p>

          <div className="bg-secondary-fixed text-on-secondary-fixed p-4 flex items-start gap-3 mb-6">
            <Icon name="verified" className="text-secondary shrink-0 mt-0.5 text-lg" />
            <p className="font-body text-sm">{t.promotionNote}</p>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/roadmap/level-test/${currentLevel}/placement`)}
            className="mt-auto w-full bg-secondary text-on-secondary py-3 font-label text-[11px] uppercase tracking-widest hover:opacity-90 transition-opacity cursor-pointer"
          >
            {t.initiate}
          </button>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
          <Icon name="military_tech" className="text-4xl text-secondary mb-3" />
          <h3 className="font-headline text-headline-md mb-2">{t.maxLevelTitle}</h3>
          <p className="font-body text-body-md text-on-surface-variant max-w-xs">{t.maxLevelBody}</p>
        </div>
      )}
    </div>
  );
}

function StoryCard({ story, t }) {
  const navigate = useNavigate();

  if (!story.is_read) {
    return (
      <div className="border border-tertiary bg-surface flex flex-col">
        <div className="aspect-[4/3] bg-surface-container-high border-b border-tertiary flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex flex-col items-center justify-center gap-0.5 text-on-secondary">
            <Icon name="lock" className="text-lg" />
            <span className="font-label text-[8px] uppercase tracking-widest font-bold">{t.sealed}</span>
          </div>
        </div>
        <div className="p-5 flex flex-col flex-1">
          <span className="font-label text-[9px] uppercase font-bold text-on-surface-variant mb-2">{t.prerequisiteDeficient}</span>
          <p className="font-body text-sm text-on-surface-variant mb-4 flex-1">{t.prerequisiteBody}</p>
          <button
            type="button"
            onClick={() => navigate(`/stories/${story.story_id}`)}
            className="w-full bg-tertiary text-surface py-2.5 font-label text-[10px] uppercase tracking-widest font-bold hover:opacity-90 transition-opacity cursor-pointer"
          >
            {t.consultText}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-tertiary bg-surface flex flex-col group">
      <div className="aspect-[4/3] relative overflow-hidden border-b border-tertiary">
        <img
          src={getBookCoverUrl(story.story_id)}
          alt=""
          className="absolute inset-0 w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 transition-all duration-300"
        />
        <span className="absolute top-2 left-2 bg-surface font-ledger text-[9px] uppercase tracking-widest px-2 py-0.5 border border-tertiary">
          {story.cefr_level}
        </span>
        {story.attempts > 0 && (
          <span className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
            <Icon name="workspace_premium" className="text-on-secondary text-sm" />
          </span>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h4 className="font-headline text-lg font-bold leading-tight mb-1">{story.title}</h4>
        {story.genre && <p className="font-body text-xs italic text-on-surface-variant mb-4">{story.genre}</p>}
        <div className="mt-auto flex items-center justify-between gap-3 pt-3 border-t border-dotted border-tertiary/50">
          <span className="font-label text-[9px] uppercase font-bold text-on-surface-variant flex items-center gap-1">
            <Icon name="bookmark" className="text-sm" />
            {story.attempts > 0 ? t.bestOf(Math.round(story.best_score_percent)) : t.indexed}
          </span>
          <button
            type="button"
            onClick={() => navigate(`/tests/story/${story.story_id}/run`)}
            className="bg-surface border border-tertiary px-3 py-1.5 font-label text-[9px] uppercase tracking-widest font-bold hover:bg-tertiary hover:text-surface transition-colors cursor-pointer"
          >
            {story.attempts > 0 ? t.retakeExam : t.commenceExam}
          </button>
        </div>
      </div>
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
    <div className="min-h-screen text-on-surface bg-surface">
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-14 pb-24">
        <div className="flex items-start justify-between mb-6">
          <RegistryTag>{t.registryNo}</RegistryTag>
          <RegistryTag align="right">{t.volume}</RegistryTag>
        </div>

        <div className="text-center mb-6">
          <h1 className="font-headline text-4xl md:text-5xl font-bold uppercase tracking-tight">{t.title}</h1>
          <p className="font-body text-body-lg italic text-on-surface-variant max-w-2xl mx-auto mt-4">{t.subtitle}</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-16 h-px bg-tertiary" />
          <span className="text-tertiary text-xs">•</span>
          <div className="w-16 h-px bg-tertiary" />
        </div>
        <div className="h-px bg-tertiary mb-12" />

        <div className="mb-12">
          <AcademicStanding analytics={analytics} history={history} t={t} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
          <FoundationalDrills t={t} eligibleLevels={levelsData?.eligible_levels} />
          <RegistryAdvancement t={t} currentLevel={levelsData?.current_level || "A1"} />
        </div>

        <div className="flex items-end justify-between gap-4 mb-6">
          <SectionLabel>{t.archivesTitle}</SectionLabel>
          <div className="shrink-0 flex items-center gap-2">
            <span className="font-label text-[10px] uppercase text-on-surface-variant hidden sm:inline">{t.indexFilter}</span>
            <div className="relative">
              <select
                value={storyLevelFilter}
                onChange={(e) => setStoryLevelFilter(e.target.value)}
                className="appearance-none font-label text-[11px] uppercase font-bold border border-tertiary bg-surface pl-3 pr-8 py-2 cursor-pointer"
              >
                <option value="">{t.completeIndex}</option>
                {(levelsData?.eligible_levels || []).map((lv) => (
                  <option key={lv} value={lv}>{lv}</option>
                ))}
              </select>
              <Icon name="expand_more" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-base" />
            </div>
          </div>
        </div>

        {storiesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-72" />)}
          </div>
        ) : storyTests && storyTests.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {storyTests.map((story) => (
              <StoryCard key={story.story_id} story={story} t={t} />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-tertiary p-10 text-center">
            <p className="font-body text-body-md text-on-surface-variant">{t.noStories}</p>
          </div>
        )}
      </main>
    </div>
  );
}
