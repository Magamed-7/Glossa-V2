import { useState, useEffect } from "react";
import Icon from "../ui/Icon.jsx";
import ContextHelpChat from "../ai/ContextHelpChat.jsx";

function grammarQuestionRefId(item) {
  if (item?.kind !== "grammar" || typeof item.id !== "string") return null;
  const match = item.id.match(/^gq-(\d+)$/);
  return match ? Number(match[1]) : null;
}

function Paperclip() {
  return (
    <svg fill="none" height="80" stroke="currentColor" strokeLinecap="round"
      strokeLinejoin="round" strokeWidth="4" viewBox="-10 -10 50 90" width="40"
      className="text-on-surface/20">
      <path d="M14 0 C 6 0 0 6 0 14 L 0 50 C 0 58 6 64 14 64 C 22 64 28 58 28 50 L 28 20 C 28 16 25 12 21 12 C 17 12 14 16 14 20 L 14 44 C 14 46 16 48 18 48 C 20 48 22 46 22 44 L 22 24 L 26 24 L 26 44 C 26 48 22 52 18 52 C 14 52 10 48 10 44 L 10 20 C 10 14 15 9 21 9 C 27 9 32 14 32 20 L 32 50 C 32 60 24 68 14 68 C 4 68 -4 60 -4 50 L -4 14 C -4 4 4 -4 14 -4 Z" />
    </svg>
  );
}

// Many DB questions are stored as "Choose the correct form: He ___ a student."
// Split on the FIRST colon so the instruction goes to the header and only the
// sentence stays in the sentence card.
function parseQuestionText(raw) {
  if (!raw) return { instruction: "", sentence: "" };

  const colonIdx = raw.indexOf(":");

  if (colonIdx > 0 && colonIdx < 80) {
    const before = raw.slice(0, colonIdx).trim();
    const after = raw.slice(colonIdx + 1).trim();
    if (!before.includes(".") && !before.includes("!") && after.length > 0) {
      return { instruction: before, sentence: after };
    }
  }

  return { instruction: "", sentence: raw };
}

export default function QuizCard({ questions, lang, exerciseLabel, onFinish }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [inputVal, setInputVal] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const q = questions[currentQ];
  const total = questions.length;
  const isLastQ = currentQ === total - 1;
  const pct = (currentQ / total) * 100;

  useEffect(() => {
    setSelected(null);
    setInputVal("");
    setFeedback(null);
  }, [currentQ]);

  function pickOption(opt) {
    if (feedback !== null) return;
    setSelected(opt);
    const newAnswers = { ...answers, [q.id]: opt };
    setAnswers(newAnswers);

    setTimeout(() => {
      advanceOrFinish(newAnswers);
    }, 350);
  }

  function submitText() {
    if (feedback !== null) return;
    const val = inputVal.trim();
    const newAnswers = { ...answers, [q.id]: val };
    setAnswers(newAnswers);
    advanceOrFinish(newAnswers);
  }

  async function advanceOrFinish(finalAnswers) {
    if (!isLastQ) {
      setCurrentQ((c) => c + 1);
    } else {
      setSubmitting(true);
      try {
        await onFinish(finalAnswers);
      } catch {
        setSubmitting(false);
      }
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-3 border-2 border-on-surface bg-surface relative overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-secondary transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
          <div className="absolute inset-0 flex justify-evenly pointer-events-none">
            {Array.from({ length: total - 1 }).map((_, i) => (
              <div key={i} className="w-px h-full bg-on-surface/20" />
            ))}
          </div>
        </div>
        <span className="font-label text-[11px] uppercase font-bold text-on-surface-variant whitespace-nowrap">
          {currentQ + 1} / {total}
        </span>
      </div>

      <div className="bg-surface border-2 border-on-surface shadow-[8px_8px_0px_0px_#b90538] p-8 md:p-12 relative">
        <div className="absolute -top-3 -right-2 rotate-45 z-20">
          <Paperclip />
        </div>

        {(() => {
          const { instruction, sentence } = parseQuestionText(q.text);
          const taskLine = instruction
            || (q.options?.length > 0
              ? (lang === "ru" ? "Выберите правильный вариант" : lang === "tg" ? "Вариантро интихоб кунед" : "Choose the correct answer")
              : (lang === "ru" ? "Заполните пропуск" : lang === "tg" ? "Холиро пур кунед" : "Fill in the blank"));

          return (
            <>
              <div className="flex justify-between items-start border-b-2 border-on-surface pb-4 mb-8">
                <div>
                  <span className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface-variant block mb-1">
                    {exerciseLabel || (lang === "ru" ? "Упражнение" : lang === "tg" ? "Машқ" : "Exercise No.")}{" "}
                    {String(currentQ + 1).padStart(3, "0")}
                  </span>
                  <p className="font-body text-lg italic text-on-surface-variant">
                    {taskLine}
                  </p>
                </div>
                <span className="font-label text-[9px] font-bold uppercase tracking-widest text-secondary bg-[#ffdadb] px-2 py-1 border border-secondary shadow-[2px_2px_0px_0px_#b90538] shrink-0 ml-4">
                  {currentQ + 1}/{total}
                </span>
              </div>

              {sentence && (
                <div className="flex items-center justify-center mb-10 px-4 py-8 bg-surface-container border-2 border-on-surface shadow-[4px_4px_0px_0px_#000]">
                  <span className="font-headline text-3xl md:text-5xl text-on-surface leading-none text-center">
                    {sentence}
                  </span>
                </div>
              )}
            </>
          );
        })()}

        {q.options && q.options.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {q.options.map((opt) => {
              const isChosen = selected === opt;
              return (
                <button
                  key={opt}
                  onClick={() => pickOption(opt)}
                  disabled={selected !== null}
                  className={`
                    border-2 border-on-surface p-5 text-center transition-all cursor-pointer
                    ${isChosen
                      ? "bg-secondary text-surface shadow-[4px_4px_0px_0px_#000] scale-[0.98]"
                      : "bg-surface hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0px_0px_#000]"
                    }
                    disabled:cursor-default
                  `}
                >
                  <span className="font-headline text-2xl font-bold">{opt}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            <input
              autoFocus
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && inputVal.trim() && submitText()}
              placeholder="___"
              className="w-full font-headline text-3xl text-secondary text-center bg-transparent border-0 border-b-4 border-dashed border-on-surface focus:ring-0 focus:border-secondary outline-none transition-colors py-3"
            />
            <button
              onClick={submitText}
              disabled={!inputVal.trim() || submitting}
              className="w-full bg-secondary text-surface border-2 border-on-surface py-4 font-label text-[11px] uppercase tracking-widest font-bold shadow-[4px_4px_0px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all disabled:opacity-40 flex items-center justify-between px-6 cursor-pointer"
            >
              <span>
                {isLastQ
                  ? (submitting
                    ? (lang === "ru" ? "Отправка…" : lang === "tg" ? "Фиристодан…" : "Submitting…")
                    : (lang === "ru" ? "Завершить" : lang === "tg" ? "Анҷом додан" : "Finish"))
                  : (lang === "ru" ? "Далее" : lang === "tg" ? "Минбаъд" : "Next")}
              </span>
              <Icon name={isLastQ ? "check" : "arrow_forward"} className="text-lg" />
            </button>
          </div>
        )}

        <div className="absolute -bottom-8 -right-4 md:-right-10 bg-[#ffb95f] text-[#2a1700] p-3 border-2 border-on-surface shadow-[4px_4px_0px_0px_#000] rotate-3 z-20">
          <div className="flex gap-1.5">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full border border-[#2a1700] transition-all ${
                  i < currentQ ? "bg-[#2a1700]" : i === currentQ ? "bg-secondary scale-125" : "bg-transparent"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-6 mt-5">
        <button
          onClick={() => currentQ > 0 && setCurrentQ((c) => c - 1)}
          disabled={currentQ === 0}
          className="font-label text-[10px] text-on-surface-variant hover:text-on-surface underline underline-offset-4 transition-colors cursor-pointer uppercase font-bold tracking-widest disabled:opacity-30"
        >
          {lang === "ru" ? "← Назад" : lang === "tg" ? "← Бозгашт" : "← Back"}
        </button>
        <button
          onClick={() => window.history.back()}
          className="font-label text-[10px] text-on-surface-variant hover:text-secondary underline underline-offset-4 transition-colors cursor-pointer uppercase font-bold tracking-widest"
        >
          {lang === "ru" ? "Выйти" : lang === "tg" ? "Баромадан" : "Exit"}
        </button>
      </div>

      {grammarQuestionRefId(q) !== null && (
        <ContextHelpChat
          key={q.id}
          contextType="exercise"
          contextRefId={grammarQuestionRefId(q)}
        />
      )}
    </div>
  );
}
