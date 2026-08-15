import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import XpGainSummaryModal from "../components/ui/XpGainSummaryModal.jsx";
import { useI18n } from "../lib/i18n.jsx";
import { startVocabSizeTest, submitVocabSizeTest, confirmVocabSizeTest } from "../lib/api/vocabSizeTest.js";

const TXT = {
  en: {
    eyebrow: "Vocabulary Census",
    title: "Vocabulary Size Test",
    intro: "A quick test to estimate roughly how many English words you actually know — including words you never studied in Glossa. Swipe through each word: do you know it or not? Takes about two minutes.",
    start: "Start the test",
    knowIt: "I know it",
    dontKnow: "I don't know it",
    progress: (a, b) => `${a} / ${b}`,
    scoring: "Scoring…",
    resultTitle: "Here's our estimate",
    resultBody: (n) => `Based on your answers, you know approximately ${n.toLocaleString()} words.`,
    byLevel: "Breakdown by level",
    confirmQuestion: "Does that sound about right?",
    yesConfirm: "Yes, that's about right",
    adjust: "No, let me adjust it",
    adjustLabel: "Your estimate (number of words)",
    saveAdjusted: "Save this number",
    saved: "Saved to your profile — it'll show up in your PDF export too.",
    backToTests: "Back to Tests",
    retake: "Take again",
  },
  ru: {
    eyebrow: "Перепись словаря",
    title: "Тест словарного запаса",
    intro: "Быстрый тест, чтобы примерно оценить, сколько английских слов ты реально знаешь — включая те, что не изучал в Glossa. Проходи слово за словом: знаешь его или нет? Займёт около двух минут.",
    start: "Начать тест",
    knowIt: "Знаю",
    dontKnow: "Не знаю",
    progress: (a, b) => `${a} / ${b}`,
    scoring: "Считаем результат…",
    resultTitle: "Вот наша оценка",
    resultBody: (n) => `Судя по твоим ответам, ты знаешь примерно ${n.toLocaleString("ru-RU")} слов.`,
    byLevel: "Разбивка по уровням",
    confirmQuestion: "Похоже на правду?",
    yesConfirm: "Да, похоже на правду",
    adjust: "Нет, дай поправить",
    adjustLabel: "Твоя оценка (кол-во слов)",
    saveAdjusted: "Сохранить это число",
    saved: "Сохранено в профиле — появится и в PDF-экспорте.",
    backToTests: "Назад к тестам",
    retake: "Пройти ещё раз",
  },
  tg: {
    eyebrow: "Барӯйхатгирии луғат",
    title: "Тести ҳаҷми луғавӣ",
    intro: "Тести зуд барои баҳодиҳии тахминии шумораи калимаҳои англисие, ки шумо воқеан медонед — аз ҷумла онҳое, ки дар Glossa наомӯхтаед. Калима ба калима бигзаред: медонед ё не? Тахминан ду дақиқа вақт мегирад.",
    start: "Тестро оғоз кунед",
    knowIt: "Медонам",
    dontKnow: "Намедонам",
    progress: (a, b) => `${a} / ${b}`,
    scoring: "Ҳисоб карда истодаем…",
    resultTitle: "Ин баҳодиҳии мост",
    resultBody: (n) => `Аз рӯи ҷавобҳои шумо, шумо тахминан ${n.toLocaleString("ru-RU")} калимаро медонед.`,
    byLevel: "Тақсимот аз рӯи сатҳ",
    confirmQuestion: "Ба назар дуруст мерасад?",
    yesConfirm: "Ҳа, дуруст аст",
    adjust: "Не, иҷозат диҳед ислоҳ кунам",
    adjustLabel: "Баҳодиҳии шумо (шумораи калима)",
    saveAdjusted: "Ин рақамро нигоҳ доред",
    saved: "Дар профил нигоҳ дошта шуд — дар содироти PDF низ пайдо мешавад.",
    backToTests: "Бозгашт ба тестҳо",
    retake: "Аз нав гузаронед",
  },
};

const STAGE = { INTRO: "intro", SWIPING: "swiping", SCORING: "scoring", RESULT: "result" };

export default function VocabSizeTest() {
  const { lang } = useI18n();
  const t = TXT[lang] || TXT.en;
  const navigate = useNavigate();

  const [stage, setStage] = useState(STAGE.INTRO);
  const [attemptId, setAttemptId] = useState(null);
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [knownIds, setKnownIds] = useState([]);
  const [result, setResult] = useState(null);
  const [showXpModal, setShowXpModal] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustedValue, setAdjustedValue] = useState(0);
  const [error, setError] = useState(null);

  async function handleStart() {
    setError(null);
    try {
      const data = await startVocabSizeTest();
      setAttemptId(data.attempt_id);
      setItems(data.items);
      setIndex(0);
      setKnownIds([]);
      setStage(STAGE.SWIPING);
    } catch (e) {
      setError(e?.message || "Failed to start");
    }
  }

  async function handleAnswer(knows) {
    const current = items[index];
    const nextKnownIds = knows ? [...knownIds, current.id] : knownIds;
    setKnownIds(nextKnownIds);

    if (index + 1 < items.length) {
      setIndex(index + 1);
      return;
    }

    setStage(STAGE.SCORING);
    try {
      const data = await submitVocabSizeTest(attemptId, nextKnownIds);
      setResult(data);
      setAdjustedValue(data.estimated_total);
      setStage(STAGE.RESULT);
      if (data.xp_earned > 0) setShowXpModal(true);
    } catch (e) {
      setError(e?.message || "Failed to score");
      setStage(STAGE.RESULT);
    }
  }

  async function handleConfirm(accepted) {
    if (!accepted) {
      setShowAdjust(true);
      return;
    }
    await confirmVocabSizeTest(attemptId, { accepted: true });
    setConfirmed(true);
  }

  async function handleSaveAdjusted() {
    await confirmVocabSizeTest(attemptId, { accepted: false, adjustedTotal: Number(adjustedValue) || 0 });
    setConfirmed(true);
    setShowAdjust(false);
  }

  const current = items[index];

  return (
    <div className="min-h-screen text-on-surface bg-surface font-body-md antialiased">
      <main className="w-full max-w-2xl mx-auto px-4 md:px-8 py-16">
        <div className="text-center mb-10">
          <span className="font-mono text-[10px] uppercase tracking-widest border border-on-surface/40 px-2.5 py-1 inline-block mb-4">
            {t.eyebrow}
          </span>
          <h1 className="font-serif text-4xl md:text-5xl font-normal uppercase tracking-tight">{t.title}</h1>
        </div>

        {stage === STAGE.INTRO && (
          <div className="border-2 border-on-surface bg-surface p-8 shadow-[4px_4px_0_0_#000] text-center">
            <Icon name="quiz" className="text-5xl text-secondary mb-4" />
            <p className="font-body text-body-lg leading-relaxed mb-8">{t.intro}</p>
            <button
              type="button"
              onClick={handleStart}
              className="border-[3px] border-on-surface px-8 py-4 bg-on-surface text-surface font-mono text-xs uppercase tracking-widest shadow-[4px_4px_0_0_#000] hover:opacity-90 cursor-pointer"
            >
              {t.start}
            </button>
            {error && <p className="text-secondary text-xs mt-4">{error}</p>}
          </div>
        )}

        {stage === STAGE.SWIPING && current && (
          <div>
            <div className="h-2 bg-surface-container border border-on-surface mb-8">
              <div
                className="h-full bg-secondary transition-all duration-200"
                style={{ width: `${((index) / items.length) * 100}%` }}
              />
            </div>
            <p className="text-center font-mono text-[10px] uppercase tracking-widest text-on-surface-variant mb-6">
              {t.progress(index + 1, items.length)}
            </p>
            <div className="border-2 border-on-surface bg-surface p-12 shadow-[4px_4px_0_0_#000] text-center mb-8 min-h-[180px] flex items-center justify-center">
              <span className="font-serif text-4xl md:text-5xl">{current.word}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleAnswer(false)}
                className="border-2 border-on-surface py-4 bg-surface font-mono text-xs uppercase tracking-widest hover:bg-surface-container cursor-pointer"
              >
                {t.dontKnow}
              </button>
              <button
                type="button"
                onClick={() => handleAnswer(true)}
                className="border-2 border-on-surface py-4 bg-secondary text-on-secondary font-mono text-xs uppercase tracking-widest hover:opacity-90 cursor-pointer"
              >
                {t.knowIt}
              </button>
            </div>
          </div>
        )}

        {stage === STAGE.SCORING && (
          <div className="text-center py-16">
            <Skeleton className="h-40" />
            <p className="font-body text-sm text-on-surface-variant mt-4">{t.scoring}</p>
          </div>
        )}

        {stage === STAGE.RESULT && result && (
          <div className="border-2 border-on-surface bg-surface p-8 shadow-[4px_4px_0_0_#000]">
            <h2 className="font-serif text-2xl mb-2 text-center">{t.resultTitle}</h2>
            <p className="font-body text-body-lg text-center mb-8">{t.resultBody(result.estimated_total)}</p>

            <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant mb-3">{t.byLevel}</p>
            <div className="space-y-2 mb-8">
              {result.by_level.map((row) => (
                <div key={row.level} className="flex items-center gap-3">
                  <span className="font-mono text-xs w-8">{row.level}</span>
                  <div className="flex-1 h-4 bg-surface-container border border-on-surface/30">
                    <div
                      className="h-full bg-secondary"
                      style={{ width: `${Math.min(100, row.known_rate)}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs w-16 text-right">{row.estimated_words}</span>
                </div>
              ))}
            </div>

            {!confirmed && !showAdjust && (
              <div className="border-t border-on-surface/20 pt-6 text-center">
                <p className="font-body text-sm mb-4">{t.confirmQuestion}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => handleConfirm(true)}
                    className="border-2 border-on-surface px-6 py-3 bg-secondary text-on-secondary font-mono text-xs uppercase tracking-widest cursor-pointer"
                  >
                    {t.yesConfirm}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirm(false)}
                    className="border-2 border-on-surface px-6 py-3 bg-surface font-mono text-xs uppercase tracking-widest cursor-pointer"
                  >
                    {t.adjust}
                  </button>
                </div>
              </div>
            )}

            {showAdjust && !confirmed && (
              <div className="border-t border-on-surface/20 pt-6 text-center">
                <label className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant block mb-2">
                  {t.adjustLabel}
                </label>
                <input
                  type="number"
                  min={0}
                  value={adjustedValue}
                  onChange={(e) => setAdjustedValue(e.target.value)}
                  className="border-2 border-on-surface px-4 py-2 font-mono text-lg text-center w-40 mb-4"
                />
                <div>
                  <button
                    type="button"
                    onClick={handleSaveAdjusted}
                    className="border-2 border-on-surface px-6 py-3 bg-on-surface text-surface font-mono text-xs uppercase tracking-widest cursor-pointer"
                  >
                    {t.saveAdjusted}
                  </button>
                </div>
              </div>
            )}

            {confirmed && (
              <div className="border-t border-on-surface/20 pt-6 text-center">
                <Icon name="check_circle" className="text-3xl text-emerald-600 mb-2" />
                <p className="font-body text-sm mb-6">{t.saved}</p>
                <div className="flex gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => navigate("/tests")}
                    className="border-2 border-on-surface px-5 py-2.5 bg-surface font-mono text-xs uppercase tracking-widest cursor-pointer"
                  >
                    {t.backToTests}
                  </button>
                  <button
                    type="button"
                    onClick={handleStart}
                    className="border-2 border-on-surface px-5 py-2.5 bg-surface font-mono text-xs uppercase tracking-widest cursor-pointer"
                  >
                    {t.retake}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <XpGainSummaryModal
        isOpen={showXpModal}
        onClose={() => setShowXpModal(false)}
        xpGained={result?.xp_earned || 0}
        correctCount={result?.estimated_total || 0}
        totalCount={items.length}
        gameType="vocab_size_test"
        lang={lang}
      />
    </div>
  );
}
