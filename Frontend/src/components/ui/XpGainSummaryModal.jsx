import React, { useEffect, useState } from "react";
import Icon from "./Icon.jsx";

const TIPS = [
  {
    ru: "Повторяйте слова каждый день: интервальное повторение даёт по 10 XP за слово!",
    en: "Review words daily: spaced repetition reviews grant 10 XP per word!",
    tg: "Калимаҳоро ҳар рӯз такрор кунед: такрори фосилавӣ барои як вожа 10 XP медиҳад!"
  },
  {
    ru: "Проходите тесты юнитов на дорожной карте: сдача теста даёт от 35 до 50 XP!",
    en: "Complete Unit Tests on the roadmap: passing a test awards 35 to 50 XP!",
    tg: "Тестҳои юнитҳоро дар харитаи роҳ иҷро кунед: супоридани тест аз 35 то 50 XP медиҳад!"
  },
  {
    ru: "Сдавайте тесты уровней (A1, A2, B1...): успешный экзамен приносит сразу 100 XP!",
    en: "Pass CEFR level tests (A1, A2, B1...): a successful exam awards 100 XP instantly!",
    tg: "Тестҳои сатҳҳоро (A1, A2, B1...) супоред: имтиҳони муваффақ якбора 100 XP меорад!"
  },
  {
    ru: "Общайтесь с ИИ-репетитором: живой диалог даёт ценный опыт для рейтинга!",
    en: "Chat with the AI tutor: real-time dialogue grants valuable experience points!",
    tg: "Бо репетитори ИИ сӯҳбат кунед: муоширати зинда барои рейтинг холҳои қиматбаҳо медиҳад!"
  },
  {
    ru: "Добавляйте новые слова в свою колоду: за каждое создание карточки вы получаете 2 XP!",
    en: "Add new words to your deck: creating a flashcard awards 2 XP!",
    tg: "Калимаҳои навро ба дастаи худ илова кунед: сохтани ҳар як корт 2 XP медиҳад!"
  },
  {
    ru: "Пишите и публикуйте истории: авторы получают по 50 XP за каждую статью!",
    en: "Write and publish stories: authors earn 50 XP per published library story!",
    tg: "Ҳикояҳо нависед ва нашр кунед: муаллифон барои ҳар як мақола 50 XP мегиранд!"
  }
];

export default function XpGainSummaryModal({
  isOpen,
  onClose,
  xpGained,
  correctCount,
  totalCount,
  gameType = "typewriter",
  lang = "ru"
}) {
  const [randomTip, setRandomTip] = useState("");

  useEffect(() => {
    if (isOpen) {
      const idx = Math.floor(Math.random() * TIPS.length);
      setRandomTip(TIPS[idx][lang] || TIPS[idx]["en"]);
    }
  }, [isOpen, lang]);

  if (!isOpen) return null;

  const titleText = {
    ru: "ТРЕНИРОВКА ЗАВЕРШЕНА!",
    en: "TRAINING COMPLETE!",
    tg: "ОМӮЗИШ БА ОХИР РАСИД!"
  }[lang] || "TRAINING COMPLETE!";

  const subText = {
    ru: "Вы проявили отличную дисциплину! Ваши результаты внесены в систему рейтингов.",
    en: "Excellent discipline! Your results have been recorded in the leaderboard system.",
    tg: "Шумо интизоми хуб нишон додед! Натиҷаҳои шумо ба системаи рейтинг ворид карда шуданд."
  }[lang] || "";

  const statsTitle = {
    ru: "СТАТИСТИКА СЕССИИ",
    en: "SESSION STATS",
    tg: "ОМОРИ СЕССИЯ"
  }[lang] || "SESSION STATS";

  const correctLabel = {
    ru: "Верные ответы",
    en: "Correct Answers",
    tg: "Ҷавобҳои дуруст"
  }[lang] || "Correct Answers";

  const xpLabel = {
    ru: "Получено опыта",
    en: "XP Gained",
    tg: "Холҳои таҷриба"
  }[lang] || "XP Gained";

  const tipTitle = {
    ru: "СОВЕТ ПО НАБОРУ XP",
    en: "XP MAXIMIZER TIP",
    tg: "ТАСВИЯ БАРОИ ГИРИФТАНИ XP"
  }[lang] || "XP MAXIMIZER TIP";

  const buttonText = {
    ru: "ПРОДОЛЖИТЬ",
    en: "CONTINUE",
    tg: "ИДОМА ДИҲЕД"
  }[lang] || "CONTINUE";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Neo-retro Card container */}
      <div 
        className="w-full max-w-md bg-[#FAF8F5] border-4 border-black p-6 relative shadow-[8px_8px_0px_#000] animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-6"
      >
        {/* Colorful top bar decoration */}
        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-secondary via-mustard to-blue-600 border-b-2 border-black" />
        
        {/* Main Header */}
        <div className="text-center mt-3">
          <div className="w-16 h-16 bg-mustard border-3 border-black text-black flex items-center justify-center mx-auto rounded-none rotate-3 shadow-[3px_3px_0px_#000] mb-4">
            <Icon name={gameType === "typewriter" ? "keyboard" : "stars"} className="text-3xl font-black" />
          </div>
          <h2 className="font-display text-2xl font-black text-black tracking-tight uppercase leading-none">
            {titleText}
          </h2>
          <p className="font-body text-xs text-on-surface-variant mt-2 max-w-sm mx-auto leading-relaxed">
            {subText}
          </p>
        </div>

        {/* Stats Grid Box */}
        <div className="border-2 border-black bg-white p-4 shadow-[3px_3px_0px_#000] flex flex-col gap-3">
          <h3 className="font-label text-[10px] uppercase font-black tracking-widest text-gray-500 border-b border-gray-200 pb-1">
            {statsTitle}
          </h3>
          
          <div className="flex justify-between items-center">
            <span className="font-body text-sm font-bold text-black">{correctLabel}:</span>
            <span className="font-display text-lg font-black text-secondary">
              {correctCount} <span className="text-xs font-sans text-gray-400 font-normal">/ {totalCount}</span>
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="font-body text-sm font-bold text-black">{xpLabel}:</span>
            <span className="font-display text-xl font-black text-green-600 flex items-center gap-1 animate-bounce">
              +{xpGained} XP
            </span>
          </div>
        </div>

        {/* Gamified Tip Section */}
        <div className="border-2 border-black bg-yellow-50 p-4 border-dashed relative">
          <span className="absolute -top-3 left-3 bg-black text-white px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider font-label">
            💡 {tipTitle}
          </span>
          <p className="font-body text-xs text-black italic leading-relaxed mt-1">
            {randomTip}
          </p>
        </div>

        {/* Continue Action Button */}
        <button
          onClick={onClose}
          className="w-full bg-[#E32652] hover:bg-[#c91d44] active:translate-y-1 text-white border-2 border-black font-label text-sm uppercase tracking-wider font-black py-3 shadow-[4px_4px_0_0_#000] active:shadow-[1px_1px_0_0_#000] transition-all duration-100"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
