import { useState } from "react";
import Icon from "../components/ui/Icon.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import StoryBody from "../components/stories/StoryBody.jsx";
import { useApi } from "../lib/useApi.js";
import { useI18n } from "../lib/i18n.jsx";
import { errorText } from "../lib/api/errorText.js";
import { getEligibleLevels } from "../lib/api/practiceTests.js";
import { getMySubscription } from "../lib/api/subscriptions.js";
import { generateVocabStory } from "../lib/api/vocabStoryGen.js";

const TXT = {
  en: {
    eyebrow: "Vocabulary Workshop",
    title: "Generate a Story From My Words",
    intro: "Pick which levels and which of your deck words to draw from, choose roughly how long the story should be, and let AI write something new for you. New/unfamiliar words are click-to-translate, and you can add any of them straight to your deck.",
    levels: "Levels",
    wordStatus: "Which words to include",
    statusAll: "All words in my deck",
    statusLearning: "Still learning",
    statusLearned: "Already learned",
    length: "Approximate length (words)",
    generate: "Generate story",
    generating: "Writing your story…",
    quotaFree: "Free plan doesn't include story generation — upgrade to unlock it.",
    quotaLeft: (used, limit) => `${used} / ${limit} today`,
    quotaUnlimited: "Unlimited on your plan",
    another: "Generate another",
    limitReached: "Daily limit reached — upgrade your plan for more.",
  },
  ru: {
    eyebrow: "Мастерская словаря",
    title: "Сгенерировать историю из моих слов",
    intro: "Выбери уровни и какие слова из колоды использовать, задай примерную длину — и ИИ напишет что-то новое. Незнакомые слова кликабельны для перевода, любое можно сразу добавить в колоду.",
    levels: "Уровни",
    wordStatus: "Какие слова использовать",
    statusAll: "Все слова из колоды",
    statusLearning: "Ещё учу",
    statusLearned: "Уже выучены",
    length: "Примерная длина (слов)",
    generate: "Сгенерировать историю",
    generating: "Пишем твою историю…",
    quotaFree: "На бесплатном тарифе генерация историй недоступна — оформи подписку.",
    quotaLeft: (used, limit) => `${used} / ${limit} сегодня`,
    quotaUnlimited: "Безлимит на твоём тарифе",
    another: "Сгенерировать ещё",
    limitReached: "Дневной лимит исчерпан — обнови тариф для большего.",
  },
  tg: {
    eyebrow: "Устохонаи луғат",
    title: "Аз калимаҳои ман ҳикоя эҷод кунед",
    intro: "Сатҳҳо ва кадом калимаҳои дастаро истифода баред, дарозии тахминиро интихоб кунед — ва ИИ чизи наве нависад. Калимаҳои ношинос барои тарҷума пахшшаванда мебошанд, ҳар кадомро метавон бевосита ба даста илова кард.",
    levels: "Сатҳҳо",
    wordStatus: "Кадом калимаҳоро истифода барем",
    statusAll: "Ҳама калимаҳои даста",
    statusLearning: "Ҳанӯз меомӯзам",
    statusLearned: "Аллакай омӯхташуда",
    length: "Дарозии тахминӣ (калима)",
    generate: "Ҳикоя эҷод кунед",
    generating: "Ҳикояи шумо навишта мешавад…",
    quotaFree: "Дар тарифи ройгон эҷоди ҳикоя дастрас нест — тарифро баланд кунед.",
    quotaLeft: (used, limit) => `${used} / ${limit} имрӯз`,
    quotaUnlimited: "Бемаҳдуд дар тарифи шумо",
    another: "Боз як ҳикоя эҷод кунед",
    limitReached: "Ҳадди рӯзона тамом шуд — тарифро баланд кунед.",
  },
};

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function GenerateStoryPage() {
  const { lang } = useI18n();
  const t = TXT[lang] || TXT.en;

  const { data: levelsData } = useApi(() => getEligibleLevels(), []);
  const { data: subscription } = useApi(() => getMySubscription(), []);

  const [levels, setLevels] = useState([]);
  const [wordStatus, setWordStatus] = useState("all");
  const [approxWordCount, setApproxWordCount] = useState(150);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [story, setStory] = useState(null);

  const planCode = subscription?.plan?.code || "free";
  const dailyLimit = subscription?.plan?.generated_stories_per_day;
  const isBlocked = planCode === "free";

  function toggleLevel(level) {
    setLevels((prev) => (prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]));
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const data = await generateVocabStory({ levels, wordStatus, approxWordCount });
      setStory(data);
    } catch (err) {
      setError(errorText(err) || t.limitReached);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen text-on-surface bg-surface font-body-md antialiased">
      <main className="w-full max-w-3xl mx-auto px-4 md:px-8 py-16">
        <div className="text-center mb-10">
          <span className="font-mono text-[10px] uppercase tracking-widest border border-on-surface/40 px-2.5 py-1 inline-block mb-4">
            {t.eyebrow}
          </span>
          <h1 className="font-serif text-4xl md:text-5xl font-normal uppercase tracking-tight mb-4">{t.title}</h1>
          <p className="font-body text-body-md text-on-surface-variant max-w-xl mx-auto leading-relaxed">{t.intro}</p>
        </div>

        {isBlocked && (
          <div className="border-2 border-secondary bg-secondary/10 p-5 mb-8 text-center font-body text-sm text-secondary">
            {t.quotaFree}
          </div>
        )}

        {!isBlocked && !story && (
          <div className="border-2 border-on-surface bg-surface p-8 shadow-[4px_4px_0_0_#000]">
            <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant mb-3 font-bold">{t.levels}</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {(levelsData?.eligible_levels || LEVELS).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => toggleLevel(level)}
                  className={`border-2 border-on-surface px-4 py-2 font-mono text-xs uppercase cursor-pointer ${
                    levels.includes(level) ? "bg-on-surface text-surface" : "bg-surface"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant mb-3 font-bold">{t.wordStatus}</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                ["all", t.statusAll],
                ["learning", t.statusLearning],
                ["learned", t.statusLearned],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setWordStatus(value)}
                  className={`border-2 border-on-surface px-4 py-2 font-mono text-xs uppercase cursor-pointer ${
                    wordStatus === value ? "bg-secondary text-on-secondary" : "bg-surface"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant mb-3 font-bold">{t.length}</p>
            <input
              type="range"
              min={60}
              max={400}
              step={10}
              value={approxWordCount}
              onChange={(e) => setApproxWordCount(Number(e.target.value))}
              className="w-full mb-2"
            />
            <p className="text-center font-mono text-sm mb-6">{approxWordCount}</p>

            {dailyLimit != null && (
              <p className="text-center font-mono text-[10px] uppercase tracking-widest text-on-surface-variant mb-4">
                {t.quotaLeft(0, dailyLimit)}
              </p>
            )}
            {dailyLimit === null && planCode !== "free" && (
              <p className="text-center font-mono text-[10px] uppercase tracking-widest text-on-surface-variant mb-4">
                {t.quotaUnlimited}
              </p>
            )}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="w-full border-[3px] border-on-surface py-4 bg-on-surface text-surface font-mono text-xs uppercase tracking-widest shadow-[4px_4px_0_0_#000] hover:opacity-90 cursor-pointer disabled:opacity-50"
            >
              {loading ? t.generating : t.generate}
            </button>

            {error && <p className="text-secondary text-xs mt-4 text-center">{error}</p>}
          </div>
        )}

        {loading && !story && (
          <div className="mt-8">
            <Skeleton className="h-64" />
          </div>
        )}

        {story && (
          <div className="border-2 border-on-surface bg-surface p-8 shadow-[4px_4px_0_0_#000]">
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              {story.cefr_levels.map((level) => (
                <span key={level} className="font-mono text-[9px] uppercase tracking-widest border border-on-surface/40 px-2 py-1">
                  {level}
                </span>
              ))}
              <Icon name="auto_awesome" className="text-secondary text-lg ml-auto" />
            </div>

            <StoryBody body={story.body} wordDictionary={story.word_dictionary} storyId={null} level={story.cefr_levels[0]} />

            <button
              type="button"
              onClick={() => setStory(null)}
              className="mt-8 border-2 border-on-surface px-6 py-3 bg-surface font-mono text-xs uppercase tracking-widest cursor-pointer"
            >
              {t.another}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
