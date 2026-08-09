import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import { useApi } from "../lib/useApi.js";
import { useI18n } from "../lib/i18n.jsx";
import { useToast } from "../lib/toast.jsx";
import { errorText } from "../lib/api/errorText.js";
import { getCourseUnitDetail, completeAtom } from "../lib/api/learning.js";
import { getVocabularyByIds } from "../lib/api/vocabulary.js";
import { getLesson } from "../lib/api/grammar.js";
import { getStory } from "../lib/api/stories.js";
import { createCard } from "../lib/api/deck.js";

const LEVEL_SENTINEL = { A1: -1, A2: -2, B1: -3, B2: -4, C1: -5 };

function AtomCard({ icon, title, done, children }) {
  return (
    <div className={`neo-card p-6 relative ${done ? "border-secondary" : ""}`}>
      {done && (
        <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-secondary border-2 border-on-surface flex items-center justify-center">
          <Icon name="check" className="text-white text-base" />
        </div>
      )}
      <div className="flex items-center gap-2 mb-4">
        <Icon name={icon} className="text-secondary text-xl" />
        <h3 className="font-headline text-headline-md">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function CourseUnitDetail() {
  const { lang } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: unit, loading, error, reload } = useApi(() => getCourseUnitDetail(id, { locale: lang }), [id, lang]);

  const { data: vocabWords } = useApi(
    () => (unit ? getVocabularyByIds(unit.vocab_entry_ids, { locale: lang }) : Promise.resolve(null)),
    [unit, lang]
  );
  const { data: grammarLesson } = useApi(
    () => (unit?.grammar_lesson_id ? getLesson(unit.grammar_lesson_id) : Promise.resolve(null)),
    [unit]
  );
  const { data: storyList } = useApi(
    () =>
      unit?.story_ids?.length
        ? Promise.allSettled(unit.story_ids.map((sid) => getStory(sid, { locale: lang }))).then((results) =>
            results.filter((r) => r.status === "fulfilled").map((r) => r.value)
          )
        : unit
          ? Promise.resolve([])
          : Promise.resolve(null),
    [unit, lang]
  );

  const [addingVocab, setAddingVocab] = useState(false);
  const [marking, setMarking] = useState(null);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 mt-10">
        <Skeleton className="h-24" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (error || !unit) {
    return (
      <div className="max-w-3xl mx-auto mt-10">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }

  const T = {
    en: {
      back: "Back to roadmap",
      vocab: "Vocabulary",
      grammar: "Grammar",
      story: "Story",
      addAll: (n) => `Add all ${n} words to deck`,
      added: "Added to your deck",
      openLesson: "Open lesson",
      markDone: "Mark as done",
      noVocab: "No words attached to this unit yet.",
      noStory: "No story attached to this unit yet.",
      storyLocked: "This unit's story is written for a different level than the one on your profile, so it can't be opened right now.",
      unitLocked: "This unit isn't open yet — finish the units before it on your roadmap first.",
    },
    ru: {
      back: "Назад к роадмапу",
      vocab: "Слова",
      grammar: "Грамматика",
      story: "История",
      addAll: (n) => `Добавить все ${n} слов в колоду`,
      added: "Добавлено в колоду",
      openLesson: "Открыть урок",
      markDone: "Отметить пройденным",
      noVocab: "К этому юниту пока не привязаны слова.",
      noStory: "К этому юниту пока не привязана история.",
      storyLocked: "История этого юнита написана для другого уровня, чем указан в твоём профиле, поэтому сейчас её нельзя открыть.",
      unitLocked: "Этот юнит ещё не открыт — сначала заверши юниты перед ним на роадмапе.",
    },
    tg: {
      back: "Бозгашт ба нақшаи роҳ",
      vocab: "Калимаҳо",
      grammar: "Грамматика",
      story: "Ҳикоя",
      addAll: (n) => `Илова кардани ҳамаи ${n} калима`,
      added: "Ба даста илова шуд",
      openLesson: "Кушодани дарс",
      markDone: "Ҳамчун иҷрошуда қайд кунед",
      noVocab: "Ба ин воҳид ҳанӯз калима пайваст нашудааст.",
      noStory: "Ба ин воҳид ҳанӯз ҳикоя пайваст нашудааст.",
      storyLocked: "Ҳикояи ин воҳид барои сатҳи дигаре навишта шудааст, на он чи дар профили шумост, бинобар ин ҳоло кушода намешавад.",
      unitLocked: "Ин воҳид ҳанӯз кушода нашудааст — аввал воҳидҳои пеш аз онро дар нақшаи роҳ ба итмом расонед.",
    },
  }[lang];

  if (unit.locked) {
    return (
      <div className="max-w-3xl mx-auto pb-24">
        <button
          onClick={() => navigate("/roadmap")}
          className="flex items-center gap-2 font-label text-xs uppercase tracking-widest font-bold text-on-surface-variant hover:text-secondary mb-6"
        >
          <Icon name="arrow_back" className="text-lg" />
          {T.back}
        </button>
        <div className="neo-card p-8 text-center">
          <Icon name="lock" className="text-4xl text-on-surface-variant mb-3" />
          <span className="font-label text-[10px] uppercase tracking-widest opacity-60">
            {unit.cefr_level} · {unit.unit_code}
          </span>
          <h1 className="font-headline text-headline-md mt-1 mb-3">{unit.theme_title}</h1>
          <p className="font-body text-sm text-on-surface-variant">{T.unitLocked}</p>
        </div>
      </div>
    );
  }

  const completed = new Set(unit.completed_atoms);

  const handleAddVocab = async () => {
    if (!vocabWords?.length) return;
    setAddingVocab(true);
    try {
      const sourceId = LEVEL_SENTINEL[unit.cefr_level] ?? null;
      let added = 0;
      let limitHit = null;

      for (const word of vocabWords) {
        try {
          await createCard({
            word: word.word,
            translation: word.translation || word.word,
            example: word.example_en || null,
            source_story_id: sourceId,
          });
          added += 1;
        } catch (e) {
          if (e.code === "LIMIT_REACHED" || e.code === "LEVELED_VOCAB_LIMIT_REACHED") {
            limitHit = e;
            break;
          }
          // CARD_ALREADY_EXISTS or similar — continue with the rest
        }
      }

      if (limitHit) {
        toast.error(errorText(limitHit));
      }

      if (added > 0) {
        await completeAtom(unit.id, "vocabulary");
      }

      reload();
    } finally {
      setAddingVocab(false);
    }
  };

  const handleMark = async (atomType) => {
    setMarking(atomType);
    try {
      await completeAtom(unit.id, atomType);
      reload();
    } finally {
      setMarking(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-24">
      <button
        onClick={() => navigate("/roadmap")}
        className="flex items-center gap-2 font-label text-xs uppercase tracking-widest font-bold text-on-surface-variant hover:text-secondary mb-6"
      >
        <Icon name="arrow_back" className="text-lg" />
        {T.back}
      </button>

      <div className="neo-card-secondary p-6 md:p-8 mb-8">
        <span className="font-label text-[10px] uppercase tracking-widest opacity-70">
          {unit.cefr_level} · {unit.unit_code}
        </span>
        <h1 className="font-headline text-headline-lg mt-1">{unit.theme_title}</h1>
        {unit.grammar_topic_label && (
          <p className="font-body text-sm opacity-80 mt-2">{unit.grammar_topic_label}</p>
        )}
      </div>

      <div className="space-y-6">
        {unit.vocab_entry_ids.length > 0 && (
          <AtomCard icon="library_books" title={T.vocab} done={completed.has("vocabulary")}>
            {!vocabWords ? (
              <Skeleton className="h-16" />
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-4">
                  {vocabWords.slice(0, 24).map((w) => (
                    <span
                      key={w.id}
                      className="px-2 py-1 bg-surface-container border border-on-surface/20 font-body text-xs"
                    >
                      {w.word}
                      {w.translation ? ` — ${w.translation}` : ""}
                    </span>
                  ))}
                </div>
                <button
                  onClick={handleAddVocab}
                  disabled={addingVocab || completed.has("vocabulary")}
                  className="btn-primary-neo px-5 py-2.5 font-label-md text-xs uppercase tracking-wider disabled:opacity-60"
                >
                  {completed.has("vocabulary") ? T.added : T.addAll(vocabWords.length)}
                </button>
              </>
            )}
          </AtomCard>
        )}

        <AtomCard icon="menu_book" title={T.grammar} done={completed.has("grammar")}>
          {!grammarLesson ? (
            <Skeleton className="h-16" />
          ) : (
            <>
              <p className="font-body text-sm text-on-surface-variant mb-4 line-clamp-3">
                {grammarLesson.structure || grammarLesson.topic}
              </p>
              <div className="flex gap-3">
                <Link
                  to={`/grammar/${unit.grammar_lesson_id}`}
                  className="btn-outline-neo px-5 py-2.5 font-label-md text-xs uppercase tracking-wider"
                >
                  {T.openLesson}
                </Link>
                {!completed.has("grammar") && (
                  <button
                    onClick={() => handleMark("grammar")}
                    disabled={marking === "grammar"}
                    className="btn-primary-neo px-5 py-2.5 font-label-md text-xs uppercase tracking-wider disabled:opacity-60"
                  >
                    {T.markDone}
                  </button>
                )}
              </div>
            </>
          )}
        </AtomCard>

        {unit.story_ids.length > 0 && (
          <AtomCard icon="auto_stories" title={T.story} done={completed.has("story")}>
            {!storyList ? (
              <Skeleton className="h-16" />
            ) : storyList.length === 0 ? (
              <p className="font-body text-sm text-on-surface-variant italic mb-4">{T.storyLocked}</p>
            ) : (
              <>
                <ul className="space-y-2 mb-4">
                  {storyList.map((s) => (
                    <li key={s.id}>
                      <Link to={`/stories/${s.id}`} className="font-body text-sm text-secondary hover:underline">
                        {s.title_translated || s.title} →
                      </Link>
                    </li>
                  ))}
                </ul>
                {!completed.has("story") && (
                  <button
                    onClick={() => handleMark("story")}
                    disabled={marking === "story"}
                    className="btn-primary-neo px-5 py-2.5 font-label-md text-xs uppercase tracking-wider disabled:opacity-60"
                  >
                    {T.markDone}
                  </button>
                )}
              </>
            )}
          </AtomCard>
        )}
      </div>
    </div>
  );
}
