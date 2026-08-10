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
    registryNo: "Registry No. EXM-74",
    volume: "Vol. IV",
    title: "Examination Hall",
    subtitle: "An Official Registry of Assessment. From foundational pedagogical drills to formal promotion examinations, evaluate your academic mastery with rigorous precision.",
    standingTitle: "Academic Standing Ledger",
    standingSub: "Your practice record. Ungraded — this ledger never affects your Roadmap, XP or streak.",
    average: "Avg. Score",
    attempts: "Drills Logged",
    passRate: "Pass Rate",
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
    promotionNote: "Successful navigation of this rigorous assessment permanently advances your academic standing within the registry.",
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
    read: "Read",
    unread: "Unread",
    bestOf: (n) => `Best ${n}%`,
    commenceExam: "Commence Exam",
    retakeExam: "Retake Exam",
    noStories: "No texts archived for this filter yet.",
  },
  ru: {
    registryNo: "Реестр № ЭКЗ-74",
    volume: "Вып. IV",
    title: "Экзаменационный зал",
    subtitle: "Официальный реестр аттестации. От базовых тренировочных упражнений до официальных экзаменов на повышение уровня — оцени своё мастерство с полной строгостью.",
    standingTitle: "Журнал успеваемости",
    standingSub: "Твой журнал практики. Без оценки в личное дело — этот реестр никак не влияет на роудмап, опыт или серию.",
    average: "Средний балл",
    attempts: "Всего попыток",
    passRate: "Процент сдачи",
    noAttemptsYet: "В журнале пока пусто — начни тренировку ниже, чтобы открыть запись.",
    recentEntries: "Последние записи",
    combined: "Грамматика + лексика",
    story: "Литература",
    grammarCat: "Грамматика",
    vocabCat: "Лексика",
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
    pickLevel: "Выбери хотя бы один целевой уровень",
    pickCategory: "Выбери хотя бы один учебный фокус",
    advancementTitle: "Registry Advancement",
    officialAssessment: "Official Assessment",
    promotionExam: "Promotion Exam",
    promotionRange: (a, b) => `${a} в ${b}`,
    promotionBody: "This formal adjudication evaluates your scholarly readiness to progress. It encompasses advanced grammatical architectures, extended lexical mastery, and complex textual comprehension.",
    promotionNote: "Successful navigation of this rigorous assessment permanently advances your academic standing within the registry.",
    initiate: "Initiate Official Examination",
    maxLevelTitle: "Высшая репутация достигнута",
    maxLevelBody: "Ты уже достиг высшей официальной репутации в реестре. Экзамен на повышение больше недоступен.",
    archivesTitle: "Literature Comprehension Archives",
    indexFilter: "Фильтр каталога",
    completeIndex: "Весь каталог",
    sealed: "Sealed",
    prerequisiteDeficient: "Prerequisite Deficient",
    prerequisiteBody: "Scholarly review of the foundational text is mandatory prior to examination access.",
    consultText: "Consult Text First",
    read: "Прочитано",
    unread: "Не прочитано",
    bestOf: (n) => `Лучший ${n}%`,
    commenceExam: "Commence Exam",
    retakeExam: "Retake Exam",
    noStories: "Для этого фильтра пока нет текстов в архиве.",
  },
  tg: {
    registryNo: "Феҳрист № ИМТ-74",
    volume: "Ҷилди IV",
    title: "Толори имтиҳонот",
    subtitle: "Феҳристи расмии арзёбӣ. Аз машқҳои таълимии асосӣ то имтиҳонҳои расмии гузариш ба сатҳи баланд — донишу маҳорати худро бо дақиқии қатъӣ санҷед.",
    standingTitle: "Дафтари сабти баҳоҳо",
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
    pickLevel: "Ҳадди ақал як сатҳи мақсаднокро интихоб кунед",
    pickCategory: "Ҳадди ақал як фокуси таълимиро интихоб кунед",
    advancementTitle: "Registry Advancement",
    officialAssessment: "Official Assessment",
    promotionExam: "Promotion Exam",
    promotionRange: (a, b) => `${a} ба ${b}`,
    promotionBody: "This formal adjudication evaluates your scholarly readiness to progress. It encompasses advanced grammatical structures, extended lexical mastery, and complex textual comprehension.",
    promotionNote: "Successful navigation of this rigorous assessment permanently advances your academic standing within the registry.",
    initiate: "Initiate Official Examination",
    maxLevelTitle: "Мақоми баландтарин ба даст омад",
    maxLevelBody: "Шумо аллакай ба мақоми баландтарини расмии феҳрист расидед. Имтиҳони гузариш дигар дастрас нест.",
    archivesTitle: "Literature Comprehension Archives",
    indexFilter: "Филтри феҳрист",
    completeIndex: "Феҳристи пурра",
    sealed: "Мӯҳршуда",
    prerequisiteDeficient: "Пешшарт иҷро нашудааст",
    prerequisiteBody: "Пеш аз дастрасӣ ба имтиҳон хондани матни асосӣ ҳатмист.",
    consultText: "Аввал матнро хонед",
    read: "Хондашуда",
    unread: "Хонданашуда",
    bestOf: (n) => `Беҳтарин ${n}%`,
    commenceExam: "Commence Exam",
    retakeExam: "Retake Exam",
    noStories: "Барои ин филтр ҳанӯз матне дар бойгонӣ нест.",
  },
};

function RegistryTag({ children, align = "left" }) {
  return (
    <span
      className={`font-mono text-[9px] uppercase tracking-widest border border-on-surface/40 px-2.5 py-1 inline-block ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {children}
    </span>
  );
}

function SectionLabel({ children }) {
  return (
    <h2 className="font-serif text-2xl font-normal text-on-surface border-b border-on-surface/15 pb-2 mb-4 flex items-center gap-2">
      <Icon name="menu_book" className="text-xl text-on-surface/75" />
      {children}
    </h2>
  );
}

function CheckRow({ checked, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 text-left group cursor-pointer py-1.5 select-none"
    >
      <span
        className="w-4 h-4 shrink-0 border border-on-surface flex items-center justify-center transition-all bg-surface"
      >
        {checked && <div className="w-2 h-2 bg-on-surface" />}
      </span>
      <span className="font-body text-xs font-semibold text-on-surface/85 group-hover:text-secondary transition-colors">
        {children}
      </span>
    </button>
  );
}

function AcademicStandingLedger({ analytics, history, t }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasAttempts = analytics && analytics.total_attempts > 0;

  if (!analytics) return <Skeleton className="h-12 mb-8" />;

  return (
    <div className="border-2 border-on-surface bg-surface mb-8 shadow-[3px_3px_0_0_#000] relative neo-card">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-on-surface/10 cursor-pointer hover:bg-surface-container transition-colors select-none"
      >
        <div className="flex items-center gap-3">
          <Icon name="analytics" className="text-secondary text-xl" />
          <span className="font-serif text-lg font-bold uppercase tracking-tight">{t.standingTitle}</span>
        </div>
        <div className="flex items-center gap-6 text-xs font-mono">
          {hasAttempts ? (
            <>
              <span>{t.average}: <strong className="text-secondary">{Math.round(analytics.average_score_percent)}%</strong></span>
              <span className="hidden sm:inline opacity-30">|</span>
              <span>{t.attempts}: <strong>{analytics.total_attempts}</strong></span>
              <span className="hidden sm:inline opacity-30">|</span>
              <span>{t.passRate}: <strong className="text-emerald-600">{Math.round(analytics.pass_rate)}%</strong></span>
            </>
          ) : (
            <span className="opacity-60">{t.noAttemptsYet}</span>
          )}
          <Icon name={isOpen ? "expand_less" : "expand_more"} className="text-lg opacity-60 ml-2" />
        </div>
      </div>

      {isOpen && (
        <div className="p-6 bg-surface-container/30 border-t border-on-surface">
          {!hasAttempts ? (
            <p className="font-body text-sm text-on-surface-variant italic">{t.noAttemptsYet}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Category list */}
              <div>
                <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-3">{t.recentEntries}</p>
                <div className="divide-y divide-dotted divide-on-surface/20">
                  {history && history.slice(0, 5).map((h) => (
                    <div key={h.id} className="flex items-center justify-between gap-4 py-2">
                      <span className="font-body text-xs truncate">
                        {h.category === "combined" ? t.combined : h.category === "story" ? t.story : h.category === "grammar" ? t.grammarCat : t.vocabCat}
                        <span className="opacity-60"> — {h.cefr_levels.join(", ")}</span>
                      </span>
                      <span className="font-mono text-sm font-bold">
                        {h.score_percent !== null ? `${Math.round(h.score_percent)}%` : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Stats by Level / Category */}
              <div className="flex flex-col gap-3">
                <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Performance breakdown</p>
                <div className="flex flex-wrap gap-2">
                  {analytics.by_category.map((c) => (
                    <span key={c.category} className="font-mono text-[10px] uppercase font-bold border border-on-surface/40 bg-surface px-2.5 py-1">
                      {c.category === "combined" ? t.combined : c.category === "story" ? t.story : c.category === "grammar" ? t.grammarCat : t.vocabCat}
                      {": "}{Math.round(c.average_score_percent)}%
                    </span>
                  ))}
                  {analytics.by_level.map((l) => (
                    <span key={l.cefr_level} className="font-mono text-[10px] uppercase font-bold border border-on-surface/40 bg-surface px-2.5 py-1">
                      Level {l.cefr_level}: {Math.round(l.average_score_percent)}%
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
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
    <div className="border border-on-surface bg-surface p-6 md:p-8 flex flex-col h-full shadow-[5px_5px_0px_0px_#000] neo-card">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="font-serif text-2xl font-normal text-on-surface">{t.drillsTitle}</h3>
        <span className="font-mono text-[9px] uppercase tracking-widest border border-on-surface/40 px-2 py-0.5 text-on-surface/60 font-bold">
          {t.ungraded}
        </span>
      </div>
      <p className="font-body text-xs text-on-surface-variant mb-6 leading-relaxed">{t.drillsBody}</p>

      <p className="font-label text-[10px] uppercase tracking-widest text-on-surface/70 mb-2 font-bold flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-on-surface" />
        {t.targetProficiency}
      </p>
      <div className="grid grid-cols-5 gap-2 mb-6 max-w-xs">
        {(eligibleLevels || []).map((level) => {
          const active = levels.includes(level);
          return (
            <button
              key={level}
              type="button"
              onClick={() => toggleLevel(level)}
              className={`w-10 h-10 flex items-center justify-center font-bold font-serif text-xs border cursor-pointer select-none transition-all ${
                active
                  ? "border-4 border-double border-on-surface font-black bg-surface text-on-surface shadow-[1px_1px_0px_rgba(0,0,0,0.15)]"
                  : "border-on-surface/30 text-on-surface/60 bg-surface hover:border-on-surface/60 hover:text-on-surface"
              }`}
            >
              {level}
            </button>
          );
        })}
      </div>

      <p className="font-label text-[10px] uppercase tracking-widest text-on-surface/70 mb-2 font-bold flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-on-surface" />
        {t.curricularFocus}
      </p>
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
        className="mt-auto w-full bg-on-surface text-surface py-3 font-label text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity cursor-pointer font-bold border border-on-surface shadow-[3px_3px_0px_rgba(0,0,0,0.15)]"
      >
        <span>▶</span>
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
    <div className="border border-secondary bg-surface p-6 md:p-8 flex flex-col h-full shadow-[5px_5px_0px_0px_var(--color-secondary)] relative neo-card">
      <div className="flex items-start justify-between mb-4 border-b border-secondary/15 pb-2">
        <h3 className="font-serif text-2xl font-normal text-secondary">{t.advancementTitle}</h3>
        <span className="w-7 h-7 rounded-full border border-secondary flex items-center justify-center shrink-0">
          <Icon name="workspace_premium" className="text-secondary text-base" />
        </span>
      </div>

      {nextLevel ? (
        <>
          <div className="mb-4">
            <span className="bg-secondary text-on-secondary font-label text-[9px] uppercase tracking-widest font-black px-2 py-0.5 inline-block">
              {t.officialAssessment}
            </span>
          </div>
          <h4 className="font-serif text-3xl font-normal leading-tight text-on-surface">{t.promotionExam}</h4>
          <p className="font-serif italic text-secondary text-lg mb-4">{t.promotionRange(currentLevel, nextLevel)}</p>
          <p className="font-body text-xs text-on-surface-variant mb-5 leading-relaxed">{t.promotionBody}</p>

          <div className="bg-secondary/10 border-l-4 border-secondary p-4 flex items-start gap-3 mb-6">
            <Icon name="verified_user" className="text-secondary shrink-0 mt-0.5 text-lg" style={{ fontVariationSettings: "'FILL' 1" }} />
            <p className="font-body text-xs text-on-surface font-medium">{t.promotionNote}</p>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/roadmap/level-test/${currentLevel}/placement`)}
            className="mt-auto w-full bg-secondary text-on-secondary py-3 font-label text-[11px] uppercase tracking-widest font-bold shadow-[3px_3px_0px_0px_#000] hover:opacity-90 transition-opacity cursor-pointer border border-secondary"
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
      <div className="border border-on-surface bg-surface flex flex-col p-6 shadow-[4px_4px_0_0_#000] text-center relative h-full min-h-[350px] neo-card">
        <div className="border border-dashed border-on-surface/35 p-5 flex flex-col items-center justify-center flex-1 h-full">
          <div className="w-14 h-14 rounded-full bg-secondary flex flex-col items-center justify-center gap-0.5 text-on-secondary shadow-md mb-4 animate-pulse">
            <Icon name="lock" className="text-xl" style={{ fontVariationSettings: "'FILL' 1" }} />
            <span className="font-label text-[8px] uppercase tracking-widest font-black">{t.sealed}</span>
          </div>
          <span className="font-label text-[9px] uppercase font-black text-secondary tracking-wider mb-2">
            {t.prerequisiteDeficient}
          </span>
          <p className="font-body text-xs text-on-surface-variant/80 mb-5 leading-normal max-w-xs">
            {t.prerequisiteBody}
          </p>
          <button
            type="button"
            onClick={() => navigate(`/stories/${story.story_id}`)}
            className="w-full bg-on-surface hover:bg-on-surface/90 text-surface py-2.5 font-label text-[10px] uppercase tracking-widest font-bold transition-colors cursor-pointer border border-on-surface shadow-[2px_2px_0_0_rgba(0,0,0,0.15)]"
          >
            {t.consultText}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-on-surface bg-surface flex flex-col shadow-[4px_4px_0_0_#000] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#000] transition-all duration-200 group relative neo-card">
      <div className="aspect-[4/3] relative overflow-hidden border-b border-on-surface">
        <img
          src={getBookCoverUrl(story.story_id)}
          alt=""
          className="absolute inset-0 w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 transition-all duration-300"
        />
        <span className="absolute top-2 left-2 bg-on-surface text-surface font-ledger text-[8px] uppercase tracking-widest px-2.5 py-0.5 font-bold z-10 border border-on-surface">
          VOL. I - {story.cefr_level}
        </span>
        {story.attempts > 0 && (
          <span className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
            <Icon name="workspace_premium" className="text-on-secondary text-sm" />
          </span>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1 justify-between">
        <h4 className="font-serif text-lg font-bold leading-tight mb-4 text-on-surface">{story.title}</h4>
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-dotted border-on-surface/20">
          <span className="font-label text-[9px] uppercase font-bold text-on-surface flex items-center gap-1.5 select-none">
            <Icon name="check_circle" className="text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }} />
            {story.is_read ? t.read : t.unread}
          </span>
          <button
            type="button"
            onClick={() => navigate(`/tests/story/${story.story_id}/run`)}
            className="bg-surface border border-on-surface px-3 py-1.5 font-label text-[9px] uppercase tracking-widest font-bold hover:bg-on-surface hover:text-surface transition-colors cursor-pointer"
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
        <div className="flex items-start justify-between mb-4">
          <RegistryTag>{t.registryNo}</RegistryTag>
          <RegistryTag align="right">{t.volume}</RegistryTag>
        </div>

        <div className="text-center mb-6">
          <h1 className="font-serif text-5xl md:text-6xl font-normal uppercase tracking-tight text-on-surface">
            {t.title}
          </h1>
          <div className="flex items-center justify-center gap-2 mt-4 mb-2">
            <div className="w-12 h-0.5 bg-on-surface/30" />
            <span className="font-serif text-sm italic text-on-surface/60">8</span>
            <div className="w-12 h-0.5 bg-on-surface/30" />
          </div>
          <p className="font-body text-sm italic text-on-surface-variant max-w-xl mx-auto mt-2 leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        <div className="border-t-4 border-double border-on-surface mb-8"></div>

        <div className="mb-8">
          <AcademicStandingLedger analytics={analytics} history={history} t={t} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
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
                className="appearance-none font-label text-[11px] uppercase font-bold border border-on-surface bg-surface pl-3 pr-8 py-2 cursor-pointer focus:outline-none"
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-72" />)}
          </div>
        ) : storyTests && storyTests.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {storyTests.map((story) => (
              <StoryCard key={story.story_id} story={story} t={t} />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-on-surface/40 p-10 text-center">
            <p className="font-body text-body-md text-on-surface-variant">{t.noStories}</p>
          </div>
        )}
      </main>
    </div>
  );
}
