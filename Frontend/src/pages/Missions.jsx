import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import NeoCard from "../components/ui/NeoCard.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import { useApi } from "../lib/useApi.js";
import { getDailyMissions, restoreStreak } from "../lib/api/learning.js";
import { useT } from "../lib/i18n.jsx";

// Цветовые константы огня (меняются каждые 10 дней)
const getStreakColor = (days) => {
  const colors = [
    "#f97316", // 0-9 дн.
    "#f59e0b", // 10-19 дн.
    "#eab308", // 20-29 дн.
    "#84cc16", // 30-39 дн.
    "#22c55e", // 40-49 дн.
    "#10b981", // 50-59 дн.
    "#14b8a6", // 60-69 дн.
    "#06b6d4", // 70-79 дн.
    "#0ea5e9", // 80-89 дн.
    "#3b82f6", // 90-99 дн.
    "#6366f1", // 100-109 дн.
    "#8b5cf6", // 110-119 дн.
    "#a855f7", // 120-129 дн.
    "#d946ef", // 130-139 дн.
    "#ec4899", // 140-149 дн.
    "#f43f5e"  // 150+ дн.
  ];
  const index = Math.floor(days / 10) % colors.length;
  return colors[index];
};

export default function Missions() {
  const t = useT();
  const { data: missionsData, loading: missionsLoading, reload: reloadMissions } = useApi(
    () => getDailyMissions(),
    []
  );

  const [loadingRestore, setLoadingRestore] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Animated streak state
  const [streakState, setStreakState] = useState({
    streak: 0,
    streakMaintained: false,
    restoresUsed: 0,
    maxRestores: 1
  });
  const [animatedStreak, setAnimatedStreak] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Sync with initial API load
  useEffect(() => {
    if (missionsData) {
      setStreakState({
        streak: missionsData.streak,
        streakMaintained: missionsData.streak_maintained,
        restoresUsed: missionsData.restores_used_this_month ?? 0,
        maxRestores: missionsData.max_restores ?? 1
      });
      setAnimatedStreak(missionsData.streak);
    }
  }, [missionsData]);

  // Sync with global event (e.g. WebSocket or other component updates)
  useEffect(() => {
    const handleUpdate = (e) => {
      if (e.detail) {
        setStreakState({
          streak: e.detail.streak,
          streakMaintained: e.detail.streak_maintained,
          restoresUsed: e.detail.restores_used_this_month ?? e.detail.restores_used ?? 0,
          maxRestores: e.detail.max_restores ?? 1
        });
      } else {
        reloadMissions();
      }
    };
    window.addEventListener("streak-updated", handleUpdate);
    return () => window.removeEventListener("streak-updated", handleUpdate);
  }, [reloadMissions]);

  // Count-up/count-down animation
  useEffect(() => {
    const target = streakState.streak;
    if (animatedStreak === target) return;

    setIsAnimating(true);
    const duration = 800; // 800ms total
    const difference = target - animatedStreak;
    const steps = Math.abs(difference);
    const stepTime = Math.max(40, Math.floor(duration / steps));

    const timer = setInterval(() => {
      setAnimatedStreak((prev) => {
        if (prev < target) {
          const next = prev + 1;
          if (next === target) {
            clearInterval(timer);
            setIsAnimating(false);
          }
          return next;
        } else {
          const next = prev - 1;
          if (next === target) {
            clearInterval(timer);
            setIsAnimating(false);
          }
          return next;
        }
      });
    }, stepTime);

    return () => {
      clearInterval(timer);
      setIsAnimating(false);
    };
  }, [streakState.streak, animatedStreak]);

  if (missionsLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 min-h-screen">
        <Skeleton className="h-16 w-3/4 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-8 space-y-6">
            <Skeleton className="h-44" />
            <Skeleton className="h-60" />
          </div>
          <div className="md:col-span-4 space-y-6">
            <Skeleton className="h-56" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!missionsData) return null;

  const opLog = missionsData.operations_log ?? [];
  const missions = missionsData.daily_missions ?? [];
  const xpTotal = missionsData.xp_total ?? 0;
  const xpLevelMin = missionsData.xp_level_min ?? 0;
  const xpLevelMax = missionsData.xp_level_max ?? 500;
  const rank = missionsData.rank ?? "";

  const streakCount = animatedStreak;
  const isMaintained = streakState.streakMaintained;
  const restoresUsed = streakState.restoresUsed;
  const maxRestores = streakState.maxRestores;

  const xpPct = xpLevelMax > xpLevelMin
    ? Math.min(100, Math.round(((xpTotal - xpLevelMin) / (xpLevelMax - xpLevelMin)) * 100))
    : 0;

  const streakColor = getStreakColor(streakState.streak);

  // Хелперы названий миссий
  const getMissionTitle = (id, fallback) => {
    if (id === "cleanup") return t("deck.games.missionCleanUp");
    if (id === "new_cipher") return t("deck.games.missionNewCipher");
    if (id === "speed_march") return t("deck.games.missionSpeedMarch");
    return fallback;
  };

  const getMissionDescription = (id, target, fallback) => {
    if (id === "cleanup") return t("deck.games.missionCleanUpDesc", { n: target });
    if (id === "new_cipher") return t("deck.games.missionNewCipherDesc", { n: target });
    if (id === "speed_march") return t("deck.games.missionSpeedMarchDesc", { n: target });
    return fallback;
  };

  const getMissionIcon = (id) => {
    if (id === "cleanup") return "cleaning_services";
    if (id === "new_cipher") return "vpn_key";
    if (id === "speed_march") return "flash_on";
    return "star";
  };

  const getRankTranslation = (rankStr) => {
    if (rankStr === "Lexicon Recruit") return t("deck.games.lexiconRecruit");
    if (rankStr === "Archive Analyst") return t("deck.games.archiveAnalyst");
    if (rankStr === "Senior Cryptographer") return t("deck.games.seniorCryptographer");
    if (rankStr === "Master Decipherer") return t("deck.games.masterDecipherer");
    if (rankStr === "Director of Lexicography") return t("deck.games.directorOfLexicography");
    return rankStr;
  };

  // Метод восстановления страйка
  const handleRestoreStreak = async () => {
    try {
      setLoadingRestore(true);
      setErrorMessage("");
      setSuccessMessage("");
      await restoreStreak();
      await reloadMissions();
      setSuccessMessage(t("deck.games.restoreSuccess"));
      // Отправляем глобальное событие для обновления TopAppBar
      window.dispatchEvent(new Event("streak-updated"));
    } catch (e) {
      const msg = e.response?.data?.error?.message || e.message || "Failed to restore streak";
      setErrorMessage(msg);
    } finally {
      setLoadingRestore(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 bg-surface text-on-surface min-h-screen space-y-10">
      {/* Шапка Панели */}
      <header className="border-b-4 border-black dark:border-stone-700 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">
            {t("deck.games.agentInterface")}
          </span>
          <h1 className="font-headline text-headline-lg mt-1 text-tertiary">
            {t("deck.games.missionControlTitle")}
          </h1>
        </div>
        
        {/* Статус-бар */}
        <div className="flex gap-4">
          <div className="border-2 border-black dark:border-stone-700 bg-surface px-4 py-2 shadow-[2px_2px_0px_#000] font-ledger text-xs font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black animate-pulse" />
            {t("deck.games.operationalLogSecure")}
          </div>
        </div>
      </header>

      {/* Grid с миссиями и боковой панелью */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Левая часть: Журнал операций и Миссии */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Секция 1: Календарь заходов (7 дней) */}
          <section className="space-y-4">
            <h2 className="font-headline text-headline-sm flex items-center gap-2 text-tertiary">
              <Icon name="calendar_month" className="text-secondary" />
              {t("deck.games.operationsLog")}
            </h2>
            
            <div className="grid grid-cols-7 gap-2 md:gap-4">
              {opLog.map((dayEntry, index) => {
                const isToday = dayEntry.date === new Date().toISOString().split("T")[0];
                return (
                  <div
                    key={index}
                    className={`aspect-square border-2 border-black dark:border-stone-700 bg-surface-container flex flex-col items-center justify-between p-1.5 md:p-3 relative overflow-hidden transition-all shadow-[2px_2px_0px_#000] ${
                      isToday 
                        ? "ring-4 ring-secondary/30 border-secondary scale-105 z-10" 
                        : "hover:scale-[1.02]"
                    }`}
                  >
                    {/* День недели */}
                    <span className={`font-label text-[10px] md:text-xs font-black uppercase ${isToday ? "text-secondary" : "text-on-surface-variant"}`}>
                      {dayEntry.day}
                    </span>
                    
                    {/* Число */}
                    <span className="font-ledger text-[10px] md:text-xs text-on-surface-variant opacity-60">
                      {new Date(dayEntry.date).getDate()}
                    </span>

                    {/* Отметка выполнения штампом */}
                    {dayEntry.completed ? (
                      <div className="stamp absolute inset-0 m-auto w-max h-max font-headline text-[9px] md:text-[11px] uppercase px-1.5 py-0.5 border border-emerald-600 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400 font-black transform -rotate-12 bg-surface/90 shadow-[1px_1px_0px_rgba(0,0,0,0.1)]">
                        {t("deck.games.duty")}
                      </div>
                    ) : (
                      isToday && (
                        <div className="stamp absolute inset-0 m-auto w-max h-max font-headline text-[9px] md:text-[11px] uppercase px-1.5 py-0.5 border border-secondary text-secondary font-black transform -rotate-12 bg-surface/90 shadow-[1px_1px_0px_rgba(0,0,0,0.1)]">
                          {t("deck.games.due")}
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Секция 2: Ежедневные Миссии */}
          <section className="bg-surface border-4 border-black dark:border-stone-700 p-6 shadow-[8px_8px_0_0_#000000] dark:shadow-[8px_8px_0_0_var(--color-tertiary)] relative overflow-hidden">
            {/* Ретро уголок */}
            <div className="absolute top-0 right-0 w-10 h-10 border-l-4 border-b-4 border-black dark:border-stone-700 bg-secondary" />

            <h2 className="font-headline text-headline-sm text-tertiary mb-6 flex items-center gap-2 uppercase tracking-wide">
              <Icon name="assignment" className="text-secondary" />
              {t("deck.games.dailyMissions")}
            </h2>

            <div className="space-y-4">
              {missions.map((mission) => {
                const pct = Math.min(100, Math.round((mission.progress / mission.target) * 100));
                return (
                  <div 
                    key={mission.id} 
                    className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border-2 border-black dark:border-stone-800 transition-all ${
                      mission.completed 
                        ? "bg-emerald-50/10 dark:bg-emerald-950/5 border-emerald-500" 
                        : "bg-surface hover:bg-surface-container-low"
                    }`}
                  >
                    {/* Иконка миссии */}
                    <div className={`w-12 h-12 rounded border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000] shrink-0 ${
                      mission.completed 
                        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600" 
                        : "bg-secondary/10 text-secondary"
                    }`}>
                      <Icon name={getMissionIcon(mission.id)} className="text-2xl font-bold" />
                    </div>

                    {/* Детали миссии */}
                    <div className="flex-1 w-full space-y-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className={`font-headline text-sm uppercase tracking-wide ${
                            mission.completed ? "text-emerald-600 line-through" : "text-tertiary"
                          }`}>
                            {getMissionTitle(mission.id, mission.title)}
                          </h4>
                          <p className={`font-body text-xs ${
                            mission.completed ? "text-on-surface-variant line-through" : "text-on-surface"
                          }`}>
                            {getMissionDescription(mission.id, mission.target, mission.description)}
                          </p>
                        </div>
                        
                        {mission.completed && (
                          <span className="font-headline text-xs px-2 py-0.5 border border-emerald-500 text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50/50">
                            {t("deck.games.completed")}
                          </span>
                        )}
                      </div>

                      {/* Прогресс-бар миссии */}
                      {!mission.completed && (
                        <div className="pt-2">
                          <div className="w-full border-2 border-black dark:border-stone-700 h-6 bg-surface-container overflow-hidden shadow-[2px_2px_0px_#000] relative">
                            <div 
                              className="h-full transition-all duration-700 ease-out flex items-center justify-end pr-2 text-[10px] font-black text-white font-mono"
                              style={{ 
                                width: `${pct}%`,
                                backgroundColor: "var(--color-secondary)"
                              }}
                            >
                              {pct >= 15 && `${mission.progress} / ${mission.target}`}
                            </div>
                            {pct < 15 && (
                              <span className="absolute left-2 top-0.5 font-mono text-[10px] font-black text-on-surface">
                                {mission.progress} / {mission.target}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Правая часть: Страйк-модуль и Досье с XP */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* 1. Карточка страйка (с динамическим свечением под цвет пламени) */}
          <div 
            className="bg-surface border-4 border-black dark:border-stone-700 p-6 shadow-[6px_6px_0_0_#000] transition-shadow duration-500 flex flex-col items-center text-center relative overflow-hidden"
            style={{ 
              boxShadow: `6px 6px 0px 0px #000000, 0px 0px 24px 2px ${streakColor}33` 
            }}
          >
            {/* Декоративный ободок сверху в цвет пламени */}
            <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: streakColor }} />

            <div 
              className="w-20 h-20 rounded-full border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_#000] animate-bounce-slow"
              style={{ backgroundColor: `${streakColor}15` }}
            >
              <Icon 
                name="local_fire_department" 
                style={{ color: streakColor }} 
                className={`text-5xl ${isMaintained ? "animate-pulse" : "opacity-40"} ${isAnimating ? "animate-bounce" : ""}`} 
              />
            </div>

            <h3 
              className={`font-headline text-headline-sm uppercase mt-4 text-tertiary transition-transform duration-300 ${
                isAnimating ? "scale-125 text-secondary rotate-3 font-extrabold" : ""
              }`}
            >
              {t("deck.games.streakDays", { n: streakCount })}
            </h3>
            
            <p className={`font-mono text-[10px] font-black uppercase tracking-widest mt-1 border px-2 py-0.5 border-black ${
              isMaintained 
                ? "bg-emerald-100 text-emerald-700" 
                : "bg-red-100 text-secondary"
            }`}>
              {isMaintained ? t("deck.games.maintained") : t("deck.games.streakRisk")}</p>

            {/* РАЗДЕЛ ВОССТАНОВЛЕНИЯ СТРАЙКА */}
            <div className="w-full mt-6 pt-6 border-t-2 border-dashed border-black/20 dark:border-white/10 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-label text-on-surface-variant font-bold uppercase">
                  {t("deck.games.streakRestorationTitle")}
                </span>
                <span className="font-ledger font-black text-tertiary">
                  {restoresUsed} / {maxRestores}
                </span>
              </div>
              
              {/* Прогресс-бар лимита восстановлений */}
              <div className="w-full border border-black h-3 bg-surface-container overflow-hidden">
                <div 
                  className="h-full bg-secondary transition-all"
                  style={{ width: `${Math.min(100, (restoresUsed / maxRestores) * 100)}%` }}
                />
              </div>

              <p className="font-body text-[11px] text-on-surface-variant leading-relaxed">
                {t("deck.games.restoresUsed", { used: restoresUsed, max: maxRestores })}
              </p>

              {/* Условия кнопки восстановления */}
              {!isMaintained ? (
                restoresUsed < maxRestores ? (
                  <div className="space-y-2">
                    <NeoButton
                      variant="primary"
                      size="md"
                      onClick={handleRestoreStreak}
                      loading={loadingRestore}
                      className="w-full py-3.5 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5"
                    >
                      <Icon name="restore" className="text-sm font-bold" />
                      {t("deck.games.restoreStreak")}
                    </NeoButton>
                    {successMessage && (
                      <p className="text-xs font-bold text-emerald-600">{successMessage}</p>
                    )}
                    {errorMessage && (
                      <p className="text-xs font-bold text-secondary">{errorMessage}</p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-secondary/5 border border-secondary text-secondary rounded space-y-2 text-left">
                    <p className="text-[11px] font-bold leading-normal">
                      {t("deck.games.upgradeToGetMore")}
                    </p>
                    <Link 
                      to="/pricing" 
                      className="inline-block text-xs font-black underline uppercase hover:text-black transition-colors"
                    >
                      {t("deck.games.upgradeSubscription")}
                    </Link>
                  </div>
                )
              ) : (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500 text-emerald-600 rounded flex items-center gap-2 justify-center">
                  <Icon name="check_circle" className="text-sm" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    {t("deck.games.streakActive")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 2. Послужной список / Ранг пользователя */}
          <div className="bg-surface border-4 border-black dark:border-stone-700 p-6 shadow-[6px_6px_0_0_#000] flex flex-col items-center text-center">
            <h3 className="font-label text-xs text-on-surface-variant uppercase tracking-widest mb-6 w-full text-left border-b-2 border-black pb-2 font-bold">
              {t("deck.games.serviceRecord")}
            </h3>
            
            <div className="w-20 h-20 mb-4 border-2 border-black rounded-full overflow-hidden bg-surface-container flex items-center justify-center shadow-[2px_2px_0_#000]">
              <Icon name="local_police" className="text-4xl text-secondary animate-pulse" />
            </div>

            <div className="font-headline text-lg uppercase tracking-tight text-tertiary">
              {getRankTranslation(rank)}
            </div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-4">
              {t("deck.games.currentRank")}
            </p>

            {/* Шкала XP */}
            <div className="w-full border-2 border-black h-5 relative bg-surface-container overflow-hidden shadow-[1px_1px_0_#000] mb-2">
              <div
                className="absolute top-0 left-0 h-full bg-tertiary transition-all"
                style={{ width: `${xpPct}%` }}
              />
            </div>
            <div className="w-full flex justify-between font-mono text-[10px] text-on-surface-variant font-bold">
              <span>{xpLevelMin} XP</span>
              <span className="text-on-surface">{xpTotal} XP</span>
              <span>{xpLevelMax} XP</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
