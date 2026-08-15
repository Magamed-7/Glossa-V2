import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Skeleton from "../components/ui/Skeleton.jsx";
import Icon from "../components/ui/Icon.jsx";
import Gauge from "../components/ui/Gauge.jsx";
import { useApi } from "../lib/useApi.js";
import { useI18n } from "../lib/i18n.jsx";
import { getEligibleLevels, getLearnedIds, getPracticeAnalytics, getPracticeHistory, getStoryTests } from "../lib/api/practiceTests.js";
import { getLessons } from "../lib/api/grammar.js";
import { getVocabulary } from "../lib/api/vocabulary.js";
import { getBookCoverUrl } from "./StoriesCatalog.jsx";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const LEVEL_ORDER_INDEX = Object.fromEntries(LEVELS.map((l, i) => [l, i]));
const PRACTICE_SIZE = "medium";

const STORY_ILLUSTRATIONS = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDqJ6orvya99Kgj7mUf95ezdxhEvuN0yhihTQJY091-FslFnUv6XK-TAHFA9nnU22zO4aVXLZEeMayA-A2AePSM5Jg0Ak6AhyGaurgt0IENLDxXe6RDZKv-cUQ-QX_BhaMOjt71-O4VILCOFOWCi-RV2jMSYvDhjzCpvgu9mLN0qfLyBhPkh4EO4ngyF8odoOGkQC44gUMglqTygZJfpXMwjqAS-OzllckWUxF3D1_9n4Dsf1THDB2DmQ",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC5gzmKgzJSVcnp7_Mjh-_hXRWq0BadfPyIh-Po9aAt_lVnmOF_9z7rNiyrWDeyGRlsfcgivM9xwwIpgkfkUOrNmzHQI9vgG-N-uk2nUd9UUAj59l8MeyizEAcmWUy6H8XuapC5vJMbta_YcNwxTeSoRyaIQdG0r4uqpjrr6Qeq4UzQOP0HRbGkwIs3kVPggtV0ZGS3lXog2dlDQMyEy7ahc3RZ9QqiKCukNUy75aAyoee3uhsai-nI_g",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBfc51GYpyAajX8HTo1ZzWCX9qoAGdQHPFt9DLvPZq7wDmg9fK-v1ZEIHRMyU-HOsXJTt4bu4avnrzQT9DCa1BF_ayhX8KX9KPKcOEG9Ef30QicvT9hycLRabcHyGi1-ghYro42Q7SEPAgSUxvshv1aoXd8rs1H6iGmiCC2IrhOupog_MXMRIBCovskKbMxfCnLfSET24A44A2c6qqZnubWnMBzBlX0IJQqqUMTitqLSAWM-kZeKe0Spw"
];

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
    comprehensiveSynthesis: "All three combined (Grammar + Vocabulary + Reading)",
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
    performanceBreakdown: "Performance breakdown",
    levelLabel: (level) => `Level ${level}`,
    volLabel: (roman, level) => `Vol. ${roman} - ${level}`,
    chooseSpecific: "Choose specific topics, words & stories",
    specificGrammar: "Specific grammar topics",
    specificVocab: "Specific words",
    specificStories: "Specific stories (already read)",
    searchWords: "Search words…",
    searchTopics: "Search topics…",
    searchStories: "Search stories…",
    noTopics: "No topics for the selected levels.",
    noWords: "No words found.",
    noStoriesRead: "You haven't finished reading anything at these levels yet.",
    filterAll: "All",
    filterStudied: "Studied",
    filterNew: "Not yet studied",
    selectedCount: (g, v) => `${g} topic${g === 1 ? "" : "s"}, ${v} word${v === 1 ? "" : "s"} selected`,
    clearSelection: "Clear selection",
    randomFromLearned: "🎲 Build from what I've already studied",
    randomFromLearnedEmpty: "You haven't studied anything at these levels yet — try a topic or two first.",
    vocabSizeTitle: "Vocabulary Size Test",
    vocabSizeSubtitle: "Estimate roughly how many English words you actually know, including ones never taught in Glossa.",
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
    drillsTitle: "Базовые тренировки",
    ungraded: "Без оценки",
    drillsBody: "Настрой модульные тренировочные упражнения под текущий научный фокус. Эти попытки не влияют на официальную репутацию в реестре.",
    targetProficiency: "Целевой уровень",
    curricularFocus: "Учебный фокус",
    grammaticalArchitecture: "Грамматическая архитектура",
    lexicalAcquisition: "Освоение лексики",
    literaryComprehension: "Понимание текста",
    comprehensiveSynthesis: "Всё сразу (грамматика + лексика + истории)",
    commence: "Начать тренировку",
    pickLevel: "Выбери хотя бы один целевой уровень",
    pickCategory: "Выбери хотя бы один учебный фокус",
    advancementTitle: "Продвижение по реестру",
    officialAssessment: "Официальная аттестация",
    promotionExam: "Экзамен на повышение",
    promotionRange: (a, b) => `${a} в ${b}`,
    promotionBody: "Эта формальная аттестация оценивает твою научную готовность к продвижению. Она охватывает продвинутые грамматические конструкции, расширенное владение лексикой и сложное понимание текста.",
    promotionNote: "Успешное прохождение этой строгой аттестации навсегда повышает твою академическую репутацию в реестре.",
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
    read: "Прочитано",
    unread: "Не прочитано",
    bestOf: (n) => `Лучший ${n}%`,
    commenceExam: "Сдать экзамен",
    retakeExam: "Пересдать",
    noStories: "Для этого фильтра пока нет текстов в архиве.",
    performanceBreakdown: "Разбивка по результатам",
    levelLabel: (level) => `Уровень ${level}`,
    volLabel: (roman, level) => `Вып. ${roman} - ${level}`,
    chooseSpecific: "Выбрать конкретные темы, слова и истории",
    specificGrammar: "Конкретные темы грамматики",
    specificVocab: "Конкретные слова",
    specificStories: "Конкретные истории (уже прочитанные)",
    searchWords: "Поиск слов…",
    searchTopics: "Поиск тем…",
    searchStories: "Поиск историй…",
    noTopics: "Для выбранных уровней нет тем.",
    noWords: "Слова не найдены.",
    noStoriesRead: "На этих уровнях ты пока не дочитал(а) ни одной истории.",
    filterAll: "Все",
    filterStudied: "Изучено",
    filterNew: "Ещё не изучено",
    selectedCount: (g, v) => `Выбрано тем: ${g}, слов: ${v}`,
    clearSelection: "Очистить выбор",
    randomFromLearned: "🎲 Собрать из уже изученного",
    randomFromLearnedEmpty: "На этих уровнях ты пока ничего не изучил(а) — сначала пройди хотя бы пару тем.",
    vocabSizeTitle: "Тест словарного запаса",
    vocabSizeSubtitle: "Оцени, сколько английских слов ты реально знаешь — включая те, что не проходил(а) в Glossa.",
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
    drillsTitle: "Машқҳои асосӣ",
    ungraded: "Бе баҳо",
    drillsBody: "Машқҳои таълимии модулиро мутобиқи фокуси илмии ҷории худ танзим кунед. Ин такрорҳо ба мақоми расмии феҳрист таъсир намерасонанд.",
    targetProficiency: "Сатҳи мақсаднок",
    curricularFocus: "Фокуси таълимӣ",
    grammaticalArchitecture: "Сохтори грамматикӣ",
    lexicalAcquisition: "Азхудкунии луғат",
    literaryComprehension: "Фаҳмиши матн",
    comprehensiveSynthesis: "Ҳама якҷоя (грамматика + луғат + матн)",
    commence: "Машқро оғоз кунед",
    pickLevel: "Ҳадди ақал як сатҳи мақсаднокро интихоб кунед",
    pickCategory: "Ҳадди ақал як фокуси таълимиро интихоб кунед",
    advancementTitle: "Пешравӣ дар феҳрист",
    officialAssessment: "Арзёбии расмӣ",
    promotionExam: "Имтиҳони гузариш",
    promotionRange: (a, b) => `${a} ба ${b}`,
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
    read: "Хондашуда",
    unread: "Хонданашуда",
    bestOf: (n) => `Беҳтарин ${n}%`,
    commenceExam: "Имтиҳонро супоред",
    retakeExam: "Такрор супоред",
    noStories: "Барои ин филтр ҳанӯз матне дар бойгонӣ нест.",
    performanceBreakdown: "Тақсимоти натиҷаҳо",
    levelLabel: (level) => `Сатҳи ${level}`,
    volLabel: (roman, level) => `Ҷилди ${roman} - ${level}`,
    chooseSpecific: "Мавзӯъ, калима ва ҳикояҳои мушаххасро интихоб кунед",
    specificGrammar: "Мавзӯъҳои мушаххаси грамматика",
    specificVocab: "Калимаҳои мушаххас",
    specificStories: "Ҳикояҳои мушаххас (аллакай хондашуда)",
    searchWords: "Ҷустуҷӯи калима…",
    searchTopics: "Ҷустуҷӯи мавзӯъ…",
    searchStories: "Ҷустуҷӯи ҳикоя…",
    noTopics: "Барои сатҳҳои интихобшуда мавзӯъ нест.",
    noWords: "Калима ёфт нашуд.",
    noStoriesRead: "Дар ин сатҳҳо шумо ҳанӯз ягон ҳикояро пурра нахондаед.",
    filterAll: "Ҳама",
    filterStudied: "Омӯхташуда",
    filterNew: "Ҳанӯз наомӯхта",
    selectedCount: (g, v) => `Интихоб шуд: ${g} мавзӯъ, ${v} калима`,
    clearSelection: "Тоза кардани интихоб",
    randomFromLearned: "🎲 Аз чизи аллакай омӯхташуда созед",
    randomFromLearnedEmpty: "Дар ин сатҳҳо шумо ҳанӯз чизе наомӯхтаед — аввал якчанд мавзӯъро гузаред.",
    vocabSizeTitle: "Тести ҳаҷми луғавӣ",
    vocabSizeSubtitle: "Баҳо диҳед, ки шумо воқеан чанд калимаи англисиро медонед — аз ҷумла онҳое, ки дар Glossa наомӯхтаед.",
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
      className="flex items-center gap-4 text-left group cursor-pointer py-1.5 select-none"
    >
      <div className="w-6 h-6 editorial-border flex items-center justify-center bg-surface group-hover:bg-surface-container shadow-[2px_2px_0px_var(--color-on-surface)] transition-all shrink-0">
        {checked && <div className="w-3 h-3 bg-on-surface" />}
      </div>
      <span className="font-serif text-lg text-on-surface leading-tight">
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
                <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">{t.performanceBreakdown}</p>
                <div className="flex flex-wrap gap-2">
                  {analytics.by_category.map((c) => (
                    <span key={c.category} className="font-mono text-[10px] uppercase font-bold border border-on-surface/40 bg-surface px-2.5 py-1">
                      {c.category === "combined" ? t.combined : c.category === "story" ? t.story : c.category === "grammar" ? t.grammarCat : t.vocabCat}
                      {": "}{Math.round(c.average_score_percent)}%
                    </span>
                  ))}
                  {analytics.by_level.map((l) => (
                    <span key={l.cefr_level} className="font-mono text-[10px] uppercase font-bold border border-on-surface/40 bg-surface px-2.5 py-1">
                      {t.levelLabel(l.cefr_level)}: {Math.round(l.average_score_percent)}%
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

function TopicCheckbox({ checked, onChange, tag, label }) {
  return (
    <label className="flex items-center gap-2 text-xs cursor-pointer group py-0.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="accent-on-surface w-3.5 h-3.5 shrink-0 cursor-pointer"
      />
      <span className="font-body group-hover:text-secondary transition-colors leading-snug">
        {tag && <span className="font-mono text-[9px] opacity-50 mr-1">{tag}</span>}
        {label}
      </span>
    </label>
  );
}

function FilterChips({ value, onChange, t }) {
  const options = [
    ["all", t.filterAll],
    ["studied", t.filterStudied],
    ["new", t.filterNew],
  ];
  return (
    <div className="flex gap-1 mb-2">
      {options.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`font-mono text-[8px] uppercase tracking-wider px-2 py-1 border transition-colors cursor-pointer ${
            value === key ? "bg-on-surface text-surface border-on-surface" : "bg-surface text-on-surface-variant border-on-surface/30 hover:border-on-surface"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function FoundationalDrills({ t, eligibleLevels }) {
  const navigate = useNavigate();
  const [levels, setLevels] = useState([]);
  const [categories, setCategories] = useState(["grammar", "vocab"]);

  const [showTopics, setShowTopics] = useState(false);
  const [grammarTopics, setGrammarTopics] = useState([]);
  const [vocabWords, setVocabWords] = useState([]);
  const [readStories, setReadStories] = useState([]);
  const [grammarLessonIds, setGrammarLessonIds] = useState([]);
  const [vocabEntryIds, setVocabEntryIds] = useState([]);
  const [storyIds, setStoryIds] = useState([]);
  const [grammarSearch, setGrammarSearch] = useState("");
  const [vocabSearch, setVocabSearch] = useState("");
  const [storySearch, setStorySearch] = useState("");
  const [grammarFilter, setGrammarFilter] = useState("all");
  const [vocabFilter, setVocabFilter] = useState("all");
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [learned, setLearned] = useState(null);

  useEffect(() => {
    if (eligibleLevels?.length) setLevels((prev) => (prev.length ? prev : [eligibleLevels[eligibleLevels.length - 1]]));
  }, [eligibleLevels]);

  useEffect(() => {
    getLearnedIds().then(setLearned).catch(() => setLearned({ grammar_lesson_ids: [], vocab_entry_ids: [], story_ids: [] }));
  }, []);

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

  const levelsKey = levels.join(",");
  const learnedGrammarSet = new Set(learned?.grammar_lesson_ids || []);
  const learnedVocabSet = new Set(learned?.vocab_entry_ids || []);

  useEffect(() => {
    if (!showTopics || levels.length === 0) {
      setGrammarTopics([]);
      return;
    }
    let cancelled = false;
    setTopicsLoading(true);
    Promise.all(levels.map((lv) => getLessons({ level: lv, search: grammarSearch || undefined, limit: 100 })))
      .then((results) => {
        if (!cancelled) setGrammarTopics(results.flat());
      })
      .finally(() => !cancelled && setTopicsLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTopics, levelsKey, grammarSearch]);

  useEffect(() => {
    if (!showTopics || levels.length === 0) {
      setVocabWords([]);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(() => {
      Promise.all(levels.map((lv) => getVocabulary({ level: lv, search: vocabSearch || undefined, limit: 60 })))
        .then((results) => {
          if (!cancelled) setVocabWords(results.flat());
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTopics, levelsKey, vocabSearch]);

  useEffect(() => {
    if (!showTopics || !categories.includes("reading") || levels.length === 0) {
      setReadStories([]);
      return;
    }
    let cancelled = false;
    Promise.all(levels.map((lv) => getStoryTests({ level: lv })))
      .then((results) => {
        if (!cancelled) setReadStories(results.flat().filter((s) => s.is_read));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTopics, levelsKey, categories.includes("reading")]);

  useEffect(() => {
    const validIds = new Set(grammarTopics.map((g) => g.id));
    setGrammarLessonIds((prev) => prev.filter((id) => validIds.has(id)));
  }, [grammarTopics]);

  useEffect(() => {
    const validIds = new Set(vocabWords.map((w) => w.id));
    setVocabEntryIds((prev) => prev.filter((id) => validIds.has(id)));
  }, [vocabWords]);

  useEffect(() => {
    const validIds = new Set(readStories.map((s) => s.story_id));
    setStoryIds((prev) => prev.filter((id) => validIds.has(id)));
  }, [readStories]);

  function toggleGrammarLesson(id) {
    setGrammarLessonIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setCategories((prev) => (prev.includes("grammar") ? prev : [...prev, "grammar"]));
  }

  function toggleVocabEntry(id) {
    setVocabEntryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setCategories((prev) => (prev.includes("vocab") ? prev : [...prev, "vocab"]));
  }

  function toggleStory(id) {
    setStoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setCategories((prev) => (prev.includes("reading") ? prev : [...prev, "reading"]));
  }

  function clearTopicSelection() {
    setGrammarLessonIds([]);
    setVocabEntryIds([]);
    setStoryIds([]);
  }

  const visibleGrammarTopics = grammarTopics.filter((g) => {
    if (grammarFilter === "studied") return learnedGrammarSet.has(g.id);
    if (grammarFilter === "new") return !learnedGrammarSet.has(g.id);
    return true;
  });

  const visibleVocabWords = vocabWords.filter((w) => {
    if (vocabFilter === "studied") return learnedVocabSet.has(w.id);
    if (vocabFilter === "new") return !learnedVocabSet.has(w.id);
    return true;
  });

  const visibleStories = readStories.filter((s) =>
    !storySearch || s.title.toLowerCase().includes(storySearch.toLowerCase())
  );

  const canStart = levels.length > 0 && categories.length > 0;

  function launch(params) {
    navigate(`/tests/practice/run?${params.toString()}`);
  }

  function start() {
    if (!canStart) return;
    const params = new URLSearchParams({ levels: levels.join(","), categories: categories.join(","), size: PRACTICE_SIZE });
    if (grammarLessonIds.length) params.set("grammarLessonIds", grammarLessonIds.join(","));
    if (vocabEntryIds.length) params.set("vocabEntryIds", vocabEntryIds.join(","));
    if (storyIds.length) params.set("storyIds", storyIds.join(","));
    launch(params);
  }

  const hasLearnedContent = learned && (learned.grammar_lesson_ids.length > 0 || learned.vocab_entry_ids.length > 0 || learned.story_ids.length > 0);

  function startFromLearned() {
    if (!learned || levels.length === 0) return;
    const g = learned.grammar_lesson_ids;
    const v = learned.vocab_entry_ids;
    const s = learned.story_ids;
    if (g.length === 0 && v.length === 0 && s.length === 0) return;

    const cats = [];
    if (g.length > 0) cats.push("grammar");
    if (v.length > 0) cats.push("vocab");
    if (s.length > 0) cats.push("reading");

    const params = new URLSearchParams({ levels: levels.join(","), categories: cats.join(","), size: PRACTICE_SIZE });
    if (g.length) params.set("grammarLessonIds", g.join(","));
    if (v.length) params.set("vocabEntryIds", v.join(","));
    if (s.length) params.set("storyIds", s.join(","));
    launch(params);
  }

  return (
    <div className="border border-on-surface bg-surface p-6 md:p-8 flex flex-col h-full shadow-hard-black relative overflow-hidden neo-card">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none"></div>
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <Icon name="history_edu" className="text-6xl" />
      </div>

      <div className="flex items-center gap-3 mb-4 relative z-10">
        <h3 className="font-serif text-2xl font-normal text-on-surface">{t.drillsTitle}</h3>
        <span className="font-mono text-[9px] uppercase tracking-widest bg-surface-container px-3 py-1 border border-on-surface/40 text-on-surface-variant font-bold shadow-stamp">
          {t.ungraded}
        </span>
      </div>
      <p className="font-body text-xs text-on-surface-variant mb-6 leading-relaxed relative z-10 italic">{t.drillsBody}</p>

      <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface mb-4 font-bold flex items-center gap-1.5 relative z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-on-surface" />
        {t.targetProficiency}
      </p>
      <div className="flex flex-wrap gap-3 mb-6 relative z-10">
        {(eligibleLevels || []).map((level) => {
          const active = levels.includes(level);
          return (
            <button
              key={level}
              type="button"
              onClick={() => toggleLevel(level)}
              className={`stamp-border font-serif text-xl hover:bg-surface-container transition-colors shadow-stamp neo-button ${
                active
                  ? "bg-on-surface text-surface"
                  : "bg-surface text-on-surface"
              }`}
            >
              <div className={`inner-dash ${active ? "border-surface" : "border-on-surface/40"}`}>
                {level}
              </div>
            </button>
          );
        })}
      </div>

      <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface mb-2 font-bold flex items-center gap-1.5 relative z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-on-surface" />
        {t.curricularFocus}
      </p>
      <div className="mb-6 space-y-1 relative z-10">
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
        onClick={() => setShowTopics((v) => !v)}
        className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-secondary transition-colors mb-4 relative z-10 cursor-pointer"
      >
        <Icon name={showTopics ? "expand_less" : "expand_more"} className="text-base" />
        {t.chooseSpecific}
      </button>

      {showTopics && (
        <div className="mb-6 border border-on-surface/30 border-dashed p-4 relative z-10 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-on-surface-variant mb-2 font-bold">{t.specificGrammar}</p>
            <input
              type="text"
              value={grammarSearch}
              onChange={(e) => setGrammarSearch(e.target.value)}
              placeholder={t.searchTopics}
              className="w-full border-b border-on-surface/40 bg-transparent text-xs font-body py-1 mb-2 focus:outline-none focus:border-secondary"
            />
            <FilterChips value={grammarFilter} onChange={setGrammarFilter} t={t} />
            <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1">
              {topicsLoading ? (
                <Skeleton className="h-24" />
              ) : visibleGrammarTopics.length === 0 ? (
                <p className="font-body text-xs text-on-surface-variant italic">{t.noTopics}</p>
              ) : (
                visibleGrammarTopics.map((lesson) => (
                  <TopicCheckbox
                    key={lesson.id}
                    checked={grammarLessonIds.includes(lesson.id)}
                    onChange={() => toggleGrammarLesson(lesson.id)}
                    tag={lesson.cefr_level}
                    label={lesson.topic}
                  />
                ))
              )}
            </div>
          </div>

          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-on-surface-variant mb-2 font-bold">{t.specificVocab}</p>
            <input
              type="text"
              value={vocabSearch}
              onChange={(e) => setVocabSearch(e.target.value)}
              placeholder={t.searchWords}
              className="w-full border-b border-on-surface/40 bg-transparent text-xs font-body py-1 mb-2 focus:outline-none focus:border-secondary"
            />
            <FilterChips value={vocabFilter} onChange={setVocabFilter} t={t} />
            <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1">
              {visibleVocabWords.length === 0 ? (
                <p className="font-body text-xs text-on-surface-variant italic">{t.noWords}</p>
              ) : (
                visibleVocabWords.map((entry) => (
                  <TopicCheckbox
                    key={entry.id}
                    checked={vocabEntryIds.includes(entry.id)}
                    onChange={() => toggleVocabEntry(entry.id)}
                    tag={entry.cefr_level}
                    label={`${entry.word}${entry.transcription ? ` /${entry.transcription}/` : ""}${entry.translation ? ` — ${entry.translation}` : ""}`}
                  />
                ))
              )}
            </div>
          </div>

          {categories.includes("reading") && (
            <div className="md:col-span-2">
              <p className="font-mono text-[9px] uppercase tracking-widest text-on-surface-variant mb-2 font-bold">{t.specificStories}</p>
              <input
                type="text"
                value={storySearch}
                onChange={(e) => setStorySearch(e.target.value)}
                placeholder={t.searchStories}
                className="w-full border-b border-on-surface/40 bg-transparent text-xs font-body py-1 mb-2 focus:outline-none focus:border-secondary"
              />
              <div className="max-h-40 overflow-y-auto space-y-0.5 pr-1">
                {visibleStories.length === 0 ? (
                  <p className="font-body text-xs text-on-surface-variant italic">{t.noStoriesRead}</p>
                ) : (
                  visibleStories.map((story) => (
                    <TopicCheckbox
                      key={story.story_id}
                      checked={storyIds.includes(story.story_id)}
                      onChange={() => toggleStory(story.story_id)}
                      tag={story.cefr_level}
                      label={story.title}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {(grammarLessonIds.length > 0 || vocabEntryIds.length > 0 || storyIds.length > 0) && (
            <div className="md:col-span-2 flex items-center justify-between font-mono text-[9px] uppercase text-on-surface-variant pt-3 border-t border-on-surface/20">
              <span>{t.selectedCount(grammarLessonIds.length, vocabEntryIds.length)}</span>
              <button type="button" onClick={clearTopicSelection} className="underline hover:text-secondary cursor-pointer">
                {t.clearSelection}
              </button>
            </div>
          )}
        </div>
      )}

      {hasLearnedContent && (
        <button
          type="button"
          onClick={startFromLearned}
          disabled={levels.length === 0}
          className="w-full border border-on-surface/40 border-dashed py-2.5 mb-3 font-mono text-[10px] uppercase tracking-widest text-on-surface-variant hover:border-secondary hover:text-secondary transition-colors relative z-10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {t.randomFromLearned}
        </button>
      )}
      {learned && !hasLearnedContent && (
        <p className="font-body text-[10px] text-on-surface-variant italic mb-3 text-center relative z-10">
          {t.randomFromLearnedEmpty}
        </p>
      )}

      <button
        type="button"
        onClick={start}
        disabled={!canStart}
        className="mt-auto w-full border-[3px] border-on-surface py-4 bg-on-surface text-surface font-mono text-[10px] uppercase tracking-widest shadow-hard-black hover:opacity-90 neo-button flex justify-center items-center gap-3 relative overflow-hidden group disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-bold relative z-10"
      >
        <span className="material-symbols-outlined relative z-10">play_arrow</span>
        <span className="relative z-10">{t.commence}</span>
      </button>
      {!canStart && (
        <p className="font-mono text-[9px] text-on-surface-variant mt-2 text-center relative z-10 uppercase tracking-wider">
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
    <div className="bg-surface p-8 md:p-10 shadow-hard-crimson border-4 border-secondary relative overflow-hidden group h-full flex flex-col justify-between neo-card min-h-[400px]">
      {/* Certificate Inner Border */}
      <div className="absolute inset-3 border-2 border-dashed border-secondary/40 pointer-events-none"></div>
      {/* Decorative background elements */}
      <div className="absolute -right-16 -bottom-16 w-56 h-56 bg-secondary/5 rounded-full opacity-40 blur-2xl pointer-events-none"></div>
      <div className="absolute top-6 right-6">
        <Icon name="workspace_premium" className="text-secondary text-4xl" />
      </div>

      {nextLevel ? (
        <>
          <div className="mb-6 relative z-10">
            <span className="bg-secondary text-on-secondary px-3 py-1 font-mono text-[9px] uppercase tracking-widest border-2 border-on-surface shadow-stamp inline-block mb-4 font-bold">
              {t.officialAssessment}
            </span>
            <h3 className="font-serif text-4xl text-on-surface leading-none mb-2 font-normal">
              {t.promotionExam}
            </h3>
            <h4 className="font-serif text-3xl text-secondary italic font-normal">
              {t.promotionRange(currentLevel, nextLevel)}
            </h4>
          </div>

          <p className="font-body text-sm mb-6 relative z-10 italic text-on-surface-variant leading-relaxed">
            {t.promotionBody}
          </p>

          <div className="bg-secondary/10 border-l-4 border-secondary p-5 mb-8 flex items-start gap-4 relative z-10">
            <Icon name="gavel" className="text-secondary shrink-0 mt-0.5 text-lg" />
            <p className="font-mono text-xs leading-relaxed text-on-surface font-bold">
              {t.promotionNote}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/roadmap/level-test/${currentLevel}/placement`)}
            className="w-full border-2 border-secondary py-4 bg-secondary text-on-secondary font-mono text-[10px] uppercase tracking-widest shadow-[4px_4px_0px_0px_#40000e] hover:bg-secondary/90 neo-button-crimson relative z-10 transition-colors cursor-pointer font-bold"
          >
            {t.initiate}
          </button>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6 relative z-10">
          <Icon name="military_tech" className="text-5xl text-secondary mb-3" />
          <h3 className="font-serif text-2xl font-normal mb-2 text-on-surface">{t.maxLevelTitle}</h3>
          <p className="font-body text-xs text-on-surface-variant max-w-xs">{t.maxLevelBody}</p>
        </div>
      )}
    </div>
  );
}

function StoryCard({ story, t }) {
  const navigate = useNavigate();
  const illustration = STORY_ILLUSTRATIONS[story.story_id % STORY_ILLUSTRATIONS.length];

  if (!story.is_read) {
    return (
      <article className="bg-surface-container-low editorial-border flex flex-col shadow-hard-black relative p-3 h-full min-h-[400px]">
        {/* Locked Overlay with Wax Seal Aesthetic */}
        <div className="absolute inset-0 bg-surface/75 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center p-4">
          <div className="w-28 h-28 rounded-full bg-secondary text-on-secondary flex flex-col items-center justify-center shadow-lg border-4 border-secondary-fixed transform -rotate-[6deg] mb-3">
            <Icon name="lock" className="text-3xl mb-0.5" style={{ fontVariationSettings: "'FILL' 1" }} />
            <span className="font-serif text-[11px] uppercase tracking-widest font-black">{t.sealed}</span>
          </div>
          <div className="bg-surface editorial-border p-4 shadow-stamp text-center max-w-[90%] border-dashed">
            <p className="font-mono text-[9px] uppercase mb-1 tracking-widest text-secondary font-bold">
              {t.prerequisiteDeficient}
            </p>
            <p className="font-body text-[11px] mb-3 italic text-on-surface-variant">
              {t.prerequisiteBody}
            </p>
            <button
              type="button"
              onClick={() => navigate(`/stories/${story.story_id}`)}
              className="border border-on-surface px-4 py-2 bg-on-surface text-surface font-mono text-[9px] hover:bg-on-surface/90 transition-colors shadow-stamp neo-button uppercase tracking-widest w-full text-center block font-bold cursor-pointer"
            >
              {t.consultText}
            </button>
          </div>
        </div>

        {/* Inner book plate border underneath overlay */}
        <div className="border border-outline-variant h-full flex flex-col opacity-40 filter grayscale">
          <div className="h-48 border-b border-outline-variant relative overflow-hidden p-1">
            <img
              src={illustration}
              alt=""
              className="w-full h-full object-cover mix-blend-multiply"
            />
            <div className="absolute top-3 left-3 bg-surface text-on-surface px-3 py-1 font-mono text-[9px] uppercase tracking-widest border border-on-surface shadow-stamp font-bold">
              {t.volLabel("II", story.cefr_level)}
            </div>
          </div>
          <div className="p-5 flex flex-col flex-grow bg-surface">
            <h3 className="font-serif text-xl font-bold mb-2 leading-tight text-outline">
              {story.title}
            </h3>
            <p className="font-body text-xs italic text-outline mb-4 line-clamp-2">
              {story.body_preview || story.body?.substring(0, 100) + "..."}
            </p>
            <div className="mt-auto pt-3 border-t border-outline-variant flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-outline font-bold">
                <Icon name="visibility_off" className="text-base" />
                {t.unread}
              </span>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="bg-surface editorial-border flex flex-col shadow-hard-black hover:-translate-y-1.5 transition-all duration-300 relative p-3 h-full min-h-[400px]">
      {/* Inner book plate border */}
      <div className="border border-on-surface h-full flex flex-col">
        <div className="h-48 border-b border-on-surface relative overflow-hidden bg-on-surface p-1">
          <img
            src={illustration}
            alt=""
            className="w-full h-full object-cover grayscale opacity-90 mix-blend-screen group-hover:grayscale-0 transition-all duration-300"
          />
          <div className="absolute top-3 left-3 bg-on-surface text-surface px-3 py-1 font-mono text-[9px] uppercase tracking-widest border border-surface shadow-[2px_2px_0px_var(--color-surface)] font-bold">
            {t.volLabel("I", story.cefr_level)}
          </div>
          {story.attempts > 0 && (
            <span className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-secondary flex items-center justify-center shadow-md">
              <Icon name="workspace_premium" className="text-on-secondary text-sm" />
            </span>
          )}
        </div>
        <div className="p-5 flex flex-col flex-grow bg-surface">
          <h3 className="font-serif text-xl font-bold mb-2 leading-tight text-on-surface">
            {story.title}
          </h3>
          <p className="font-body text-xs italic text-on-surface-variant mb-4 line-clamp-2">
            {story.body_preview || story.body?.substring(0, 100) + "..."}
          </p>
          <div className="mt-auto pt-3 border-t border-on-surface flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-on-surface font-bold">
              <Icon name="verified" className="text-base text-secondary" style={{ fontVariationSettings: "'FILL' 1" }} />
              {t.read}
            </span>
            <button
              type="button"
              onClick={() => navigate(`/tests/story/${story.story_id}/run`)}
              className="border border-on-surface px-4 py-2 bg-surface text-on-surface font-mono text-[9px] uppercase tracking-widest hover:bg-on-surface hover:text-surface transition-all shadow-stamp neo-button font-bold cursor-pointer"
            >
              {story.attempts > 0 ? t.retakeExam : t.commenceExam}
            </button>
          </div>
        </div>
      </div>
    </article>
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
    <div className="min-h-screen text-on-surface bg-surface font-body-md antialiased flex flex-col">
      <style>{`
        .editorial-border {
          border: 2px solid var(--color-on-surface, #000000);
        }
        
        .neo-button {
          transition: all 0.15s ease-in-out;
        }

        .neo-button:active {
          transform: translate(2px, 2px);
          box-shadow: 1px 1px 0px 0px var(--color-on-surface, #000000);
        }
        
        .neo-button-crimson:active {
          transform: translate(2px, 2px);
          box-shadow: 1px 1px 0px 0px var(--color-secondary, #dc2c4f);
        }
        
        .stamp-border {
          border: 2px solid var(--color-on-surface, #000000);
          padding: 2px;
          background-clip: content-box;
        }
        
        .inner-dash {
          border: 1px dashed var(--color-on-surface, #000000);
          padding: 8px 16px;
        }

        .shadow-stamp {
          box-shadow: 2px 2px 0px 0px var(--color-on-surface, #000000);
        }
        
        .shadow-hard-black {
          box-shadow: 4px 4px 0px 0px var(--color-on-surface, #000000);
        }

        .shadow-hard-crimson {
          box-shadow: 4px 4px 0px 0px var(--color-secondary, #dc2c4f);
        }
      `}</style>

      <main className="w-full max-w-[1440px] mx-auto px-4 md:px-12 py-16">
        {/* Page Header block from the mockup */}
        <div className="mb-16 border-b-[6px] border-double border-on-surface pb-10 relative text-center pt-8">
          <div className="absolute top-0 left-0 text-[10px] font-mono tracking-widest text-on-surface-variant uppercase bg-surface px-2 py-1 editorial-border">
            {t.registryNo}
          </div>
          <div className="absolute top-0 right-0 text-[10px] font-mono tracking-widest text-on-surface-variant uppercase bg-surface px-2 py-1 editorial-border">
            {t.volume}
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-normal uppercase tracking-tight text-on-surface mt-4">
            {t.title}
          </h1>
          <div className="flex items-center justify-center gap-4 mt-6">
            <span className="w-16 h-[2px] bg-on-surface"></span>
            <Icon name="local_florist" className="text-sm text-on-surface" />
            <span className="w-16 h-[2px] bg-on-surface"></span>
          </div>
          <p className="font-serif text-lg italic text-on-surface-variant max-w-3xl mx-auto mt-6 leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        <div className="mb-8">
          <AcademicStandingLedger analytics={analytics} history={history} t={t} />
        </div>

        <button
          type="button"
          onClick={() => navigate("/tests/vocab-size")}
          className="w-full text-left border-2 border-on-surface bg-surface p-6 mb-8 shadow-[3px_3px_0_0_#000] hover:shadow-[5px_5px_0_0_#000] hover:-translate-y-0.5 transition-all flex items-center gap-5 cursor-pointer neo-card"
        >
          <Icon name="quiz" className="text-4xl text-secondary shrink-0" />
          <div className="flex-1">
            <h3 className="font-serif text-xl font-normal">{t.vocabSizeTitle}</h3>
            <p className="font-body text-xs text-on-surface-variant mt-1">{t.vocabSizeSubtitle}</p>
          </div>
          <Icon name="arrow_forward" className="text-xl opacity-60 shrink-0" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          <div className="lg:col-span-7">
            <FoundationalDrills t={t} eligibleLevels={levelsData?.eligible_levels} />
          </div>
          <div className="lg:col-span-5">
            <RegistryAdvancement t={t} currentLevel={levelsData?.current_level || "A1"} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-b-[3px] border-on-surface pb-4 mb-8">
          <h2 className="font-serif text-2xl font-normal text-on-surface flex items-center gap-3">
            <Icon name="menu_book" className="text-2xl text-on-surface" />
            {t.archivesTitle}
          </h2>
          {/* Filter */}
          <div className="flex gap-3 items-center">
            <span className="font-mono text-[10px] uppercase text-on-surface-variant tracking-widest">{t.indexFilter}:</span>
            <div className="relative">
              <select
                value={storyLevelFilter}
                onChange={(e) => setStoryLevelFilter(e.target.value)}
                className="editorial-border bg-surface font-serif text-lg px-4 py-1 shadow-stamp cursor-pointer appearance-none pr-10 focus:outline-none"
              >
                <option value="">{t.completeIndex}</option>
                {LEVELS.map((lv) => (
                  <option key={lv} value={lv}>{lv}</option>
                ))}
              </select>
              <Icon name="arrow_drop_down" className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-xl" />
            </div>
          </div>
        </div>

        {storiesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96" />)}
          </div>
        ) : storyTests && storyTests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
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
