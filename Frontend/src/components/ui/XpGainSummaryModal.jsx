import React, { useEffect, useState } from "react";
import Icon from "./Icon.jsx";
import { useAuth } from "../../lib/auth/AuthContext.jsx";

function getAdaptiveTip({ gameType, userLevel, isPremium, lang, pct }) {
  const isALevel = ["A1", "A2"].includes(userLevel);

  if (gameType === "typewriter" || gameType === "speed-recall" || gameType === "spaced-repetition") {
    if (!isPremium) {
      return {
        ru: "Учите слова без ограничений! Перейдите на Premium-подписку, чтобы расширить дневной лимит колоды до 55 слов и открыть все разделы!",
        en: "Learn words without limits! Upgrade to Premium to expand your daily deck limit to 55 words and unlock all sections!",
        tg: "Калимаҳоро бе маҳдудият омӯзед! Ба тарифи Premium гузаред, то лимити кортҳои рӯзонаро то 55 калима зиёд кунед!"
      }[lang] || "";
    }
    if (isALevel) {
      return {
        ru: "Слова изучены! Рекомендуем перейти в раздел Истории и прочитать простую историю уровня A1/A2, чтобы увидеть их в контексте и получить +10 XP!",
        en: "Words learned! We recommend reading a simple A1/A2 story in the library to see them in context and earn +10 XP!",
        tg: "Калимаҳо омӯхта шуданд! Тавсия медиҳем, ки ҳикояи оддии сатҳи A1/A2-ро дар китобхона хонед, то онҳоро дар матн бинед ва +10 XP гиред!"
      }[lang] || "";
    } else {
      return {
        ru: "Прекрасный словарный запас! Теперь пройдите тест юнита на дорожной карте, чтобы закрепить материал и заработать от 35 до 50 XP!",
        en: "Great vocabulary! Now complete a Unit Test on the roadmap to reinforce your learning and earn 35 to 50 XP!",
        tg: "Захираи калимаҳои олӣ! Акнун тести юнитро дар харитаи роҳ иҷро кунед, то дониши худро мустаҳкам карда, 35-50 XP ба даст оред!"
      }[lang] || "";
    }
  }

  if (gameType === "grammar") {
    if (isALevel) {
      return {
        ru: "Грамматика пройдена! Пройдите тест юнита на дорожной карте, чтобы закрепить правила и получить дополнительные 35-50 XP!",
        en: "Grammar lesson completed! Try the Unit Test on the roadmap to verify your skills and grab another 35-50 XP!",
        tg: "Дарси грамматика тамом шуд! Тести юнитро дар харитаи роҳ супоред, то қоидаҳоро санҷида, 35-50 XP-и иловагӣ гиред!"
      }[lang] || "";
    } else {
      return {
        ru: "Отличный уровень грамматики! Самое время пообщаться с ИИ-репетитором на эту тему в чате для практики живого общения!",
        en: "Excellent grammar score! Now is a great time to practice this topic live with the AI tutor in the chat!",
        tg: "Сатҳи олии грамматика! Вақти он расидааст, ки бо репетитори ИИ дар чат барои таҷрибаи зинда сӯҳбат кунед!"
      }[lang] || "";
    }
  }

  if (gameType === "practice_test" || gameType === "unit_test" || gameType === "level_test" || gameType === "story_test") {
    if (pct < 75) {
      return {
        ru: "Не расстраивайтесь! Попробуйте повторить слова из колоды с помощью интервального повторения (+10 XP за слово) и пройдите тест повторно!",
        en: "Don't worry! Try reviewing deck words using spaced repetition (+10 XP per word) and run the test again!",
        tg: "Хафа нашавед! Кӯшиш кунед калимаҳоро дар даста тавассути такрори фосилавӣ (+10 XP) машқ кунед ва тесткуниро такрор намоед!"
      }[lang] || "";
    }
    if (pct >= 90) {
      if (gameType === "level_test") {
        return {
          ru: "Выдающийся результат! Вы подтвердили свой уровень. Попробуйте сдать экзамен на следующий уровень или изучить новые темы!",
          en: "Outstanding! You proved your proficiency. Try taking the exam for the next level or exploring new topics!",
          tg: "Натиҷаи олӣ! Шумо сатҳи худро тасдиқ кардед. Имтиҳони сатҳи навбатиро супоред ё мавзӯъҳои навро омӯзед!"
        }[lang] || "";
      }
      return {
        ru: "Потрясающе! Вы отлично усвоили тему. Самое время прочитать новую историю в библиотеке (+10 XP)!",
        en: "Excellent score! You've mastered this topic. It's the perfect time to read a new library story (+10 XP)!",
        tg: "Олиҷаноб! Шумо мавзӯъро хуб азхуд кардед. Вақти хубест барои хондани ҳикояи нав дар китобхона (+10 XP)!"
      }[lang] || "";
    }
    if (!isPremium) {
      return {
        ru: "Поднимитесь на новый уровень: с Premium-подпиской вам станут доступны подробные аудиокниги для тренировки аудирования!",
        en: "Level up your learning: Premium subscription unlocks comprehensive audiobooks for listening practice!",
        tg: "Сатҳи дониши худро боло баред: бо тарифи Premium китобҳои аудиоӣ барои машқи шунавоӣ дастрас мешаванд!"
      }[lang] || "";
    }
  }

  if (gameType === "story") {
    return {
      ru: "Отличная тренировка чтения! Пройдите тест по этой истории в библиотеке, чтобы закрепить понимание и заработать дополнительные XP!",
      en: "Great reading practice! Complete the comprehension test for this story to verify your understanding and gain extra XP!",
      tg: "Машқи хониши олӣ! Тестро оид ба ин ҳикоя дар китобхона иҷро кунед, то фаҳмиши худро санҷед ва холҳои иловагӣ гиред!"
    }[lang] || "";
  }

  // Fallback generic tips
  return {
    ru: "Повторяйте слова каждый день: интервальное повторение даёт по 10 XP за слово!",
    en: "Review words daily: spaced repetition reviews grant 10 XP per word!",
    tg: "Калимаҳоро ҳар рӯз такрор кунед: такрори фосилавӣ барои як вожа 10 XP медиҳад!"
  }[lang] || "";
}

export default function XpGainSummaryModal({
  isOpen,
  onClose,
  xpGained,
  correctCount,
  totalCount,
  gameType = "typewriter",
  lang = "ru"
}) {
  const { user, languages } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [randomTip, setRandomTip] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Async import to avoid top-level bundle weight issues or dependency loops
      import("../../lib/api/subscriptions.js")
        .then(({ getMySubscription }) => getMySubscription())
        .then((sub) => {
          setIsPremium(sub && sub.plan_code !== "free");
        })
        .catch(() => setIsPremium(false));
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (isOpen) {
      const userLevel = languages?.find((l) => l.is_target)?.level || "A1";
      const pct = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
      const tip = getAdaptiveTip({ gameType, userLevel, isPremium, lang, pct });
      setRandomTip(tip);
    }
  }, [isOpen, lang, isPremium, languages, gameType, correctCount, totalCount]);

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

  const getIconName = () => {
    if (gameType === "typewriter") return "keyboard";
    if (gameType === "speed-recall") return "bolt";
    if (gameType === "spaced-repetition") return "psychology";
    if (gameType === "grammar") return "edit_note";
    if (gameType === "story") return "menu_book";
    if (gameType.endsWith("_test")) return "assignment_turned_in";
    return "stars";
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      {/* Neo-retro Card container */}
      <div 
        className="w-full max-w-md bg-[#FAF8F5] border-4 border-black p-6 relative shadow-[8px_8px_0px_#000] animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-6"
      >
        {/* Colorful top bar decoration */}
        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-secondary via-mustard to-blue-600 border-b-2 border-black" />
        
        {/* Main Header */}
        <div className="text-center mt-3">
          <div className="w-16 h-16 bg-mustard border-3 border-black text-black flex items-center justify-center mx-auto rounded-none rotate-3 shadow-[3px_3px_0px_#000] mb-4">
            <Icon name={getIconName()} className="text-3xl font-black" />
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
