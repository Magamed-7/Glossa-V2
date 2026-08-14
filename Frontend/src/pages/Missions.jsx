import Icon from "../components/ui/Icon.jsx";
import { useApi } from "../lib/useApi.js";
import { getDailyMissions } from "../lib/api/learning.js";
import { useT } from "../lib/i18n.jsx";
export default function Missions() {
  const t = useT();

  const { data: missionsData, loading: missionsLoading } = useApi(
    () => getDailyMissions(),
    []
  );

  const opLog = missionsData?.operations_log ?? [];
  const missions = missionsData?.daily_missions ?? [];
  const streakCount = missionsData?.streak ?? 0;
  const isMaintained = missionsData?.streak_maintained ?? false;
  const xpTotal = missionsData?.xp_total ?? 0;
  const xpLevelMin = missionsData?.xp_level_min ?? 0;
  const xpLevelMax = missionsData?.xp_level_max ?? 500;
  const rank = missionsData?.rank ?? "";
  const xpPct = xpLevelMax > xpLevelMin
    ? Math.min(100, Math.round(((xpTotal - xpLevelMin) / (xpLevelMax - xpLevelMin)) * 100))
    : 0;

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

  const getRankTranslation = (rankStr) => {
    if (rankStr === "Lexicon Recruit") return t("deck.games.lexiconRecruit");
    if (rankStr === "Archive Analyst") return t("deck.games.archiveAnalyst");
    if (rankStr === "Senior Cryptographer") return t("deck.games.seniorCryptographer");
    if (rankStr === "Master Decipherer") return t("deck.games.masterDecipherer");
    if (rankStr === "Director of Lexicography") return t("deck.games.directorOfLexicography");
    return rankStr;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 bg-surface text-on-surface min-h-screen">
      <header className="border-b-[2px] border-on-surface pb-4 mb-8">
        <h1 className="font-serif text-4xl md:text-5xl">{t("deck.games.missionControlTitle")}</h1>
      </header>

      {missionsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-pulse">
          <div className="md:col-span-8 flex flex-col gap-6">
            <div className="h-32 bg-surface-variant rounded" />
            <div className="h-56 bg-surface-variant rounded" />
          </div>
          <div className="md:col-span-4 flex flex-col gap-6">
            <div className="h-40 bg-surface-variant rounded" />
            <div className="h-48 bg-surface-variant rounded" />
          </div>
        </div>
      ) : (
        /* Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column: Operations Log & Checklist */}
          <div className="md:col-span-8 flex flex-col gap-10">
            {/* 7-Day Log */}
            <section>
              <h2 className="font-serif text-2xl font-bold text-primary mb-6 border-b-2 border-primary inline-block pb-1">
                {t("deck.games.operationsLog")}
              </h2>
              <div className="grid grid-cols-7 gap-3">
                {opLog.map((dayEntry, index) => (
                  <div
                    key={index}
                    className={`aspect-square border-2 border-primary bg-surface flex flex-col items-center justify-center relative overflow-hidden ${
                      dayEntry.date === new Date().toISOString().split("T")[0]
                        ? "bg-surface-container-high font-bold ring-2 ring-secondary"
                        : ""
                    }`}
                  >
                    <span className="font-mono text-xs text-outline absolute top-2 left-2">{dayEntry.day}</span>
                    {dayEntry.completed && (
                      <div className="stamp absolute inset-0 m-auto w-max h-max font-serif text-[10px] uppercase px-2 py-0.5 border-2 border-secondary text-secondary font-black transform -rotate-12">
                        {t("deck.games.duty")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Daily Missions */}
            <section className="bg-surface border-2 border-primary p-6 shadow-[5px_5px_0_0_#000] relative">
              <div className="absolute top-0 right-0 w-8 h-8 border-l-2 border-b-2 border-primary bg-[#ffddb8]"></div>
              <h2 className="font-serif text-2xl font-bold text-primary mb-6 uppercase tracking-wider">
                {t("deck.games.dailyMissions")}
              </h2>
              <ul className="flex flex-col gap-4">
                {missions.map((mission) => (
                  <li key={mission.id} className="flex items-start gap-4 p-4 border-2 border-primary hover:bg-surface-container-high transition-all">
                    <div className={`w-5 h-5 border-2 border-primary flex-shrink-0 flex items-center justify-center mt-0.5 ${
                      mission.completed ? "bg-primary text-surface text-xs font-bold" : ""
                    }`}>
                      {mission.completed && "✓"}
                    </div>
                    <div className="flex-1">
                      <div className={`font-body text-base ${mission.completed ? "line-through text-on-surface-variant" : "text-primary"}`}>
                        <strong className="block text-sm uppercase tracking-wider mb-0.5">{getMissionTitle(mission.id, mission.title)}</strong>
                        <span className="text-sm">{getMissionDescription(mission.id, mission.target, mission.description)}</span>
                        {mission.completed && (
                          <span className="ml-2 text-xs font-bold text-secondary uppercase">({t("deck.games.completed")})</span>
                        )}
                      </div>
                      {/* Progress bar */}
                      {!mission.completed && (
                        <div className="mt-2">
                          <div className="w-full border border-primary h-2 bg-surface-container relative overflow-hidden">
                            <div
                              className="absolute top-0 left-0 h-full bg-secondary transition-all"
                              style={{ width: `${Math.min(100, Math.round((mission.progress / mission.target) * 100))}%` }}
                            />
                          </div>
                          <p className="font-mono text-[10px] text-outline mt-1">
                            {mission.progress} / {mission.target}
                          </p>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Right Column: Streak Card & Dossier Record */}
          <div className="md:col-span-4 flex flex-col gap-8">
            {/* Streak Counter */}
            <div className={`border-2 border-primary p-6 shadow-[5px_5px_0_0_#000] flex flex-col items-center justify-center text-center ${isMaintained ? "bg-[#ffdadb]" : "bg-surface-container"}`}>
              <Icon name="local_fire_department" className={`text-5xl mb-2 ${isMaintained ? "text-secondary" : "text-outline"}`} />
              <h3 className="font-serif text-2xl font-bold uppercase text-primary">
                {t("deck.games.streakDays", { n: streakCount })}
              </h3>
              <p className="font-mono text-[10px] text-outline uppercase mt-1 tracking-widest">
                {isMaintained ? t("deck.games.maintained") : t("deck.games.streakRisk")}
              </p>
            </div>

            {/* Service Record */}
            <div className="bg-surface border-2 border-primary p-6 shadow-[5px_5px_0_0_#000] flex flex-col items-center text-center">
              <h3 className="font-mono text-xs text-primary uppercase tracking-widest mb-6 w-full text-left border-b-2 border-primary pb-2">
                {t("deck.games.serviceRecord")}
              </h3>
              <div className="w-24 h-24 mb-4 border-2 border-primary rounded-full overflow-hidden bg-surface-container-high flex items-center justify-center">
                <Icon name="local_police" className="text-5xl text-secondary" />
              </div>
              <div className="font-serif text-xl font-bold uppercase tracking-tight mb-1 text-primary">
                {getRankTranslation(rank)}
              </div>
              <p className="text-xs text-on-surface-variant mb-4">{t("deck.games.currentRank")}</p>

              <div className="w-full border-2 border-primary h-5 relative bg-surface-container-low overflow-hidden mb-2">
                <div
                  className="absolute top-0 left-0 h-full bg-primary transition-all"
                  style={{ width: `${xpPct}%` }}
                />
              </div>
              <div className="w-full flex justify-between font-mono text-[10px] text-outline">
                <span>{xpLevelMin} XP</span>
                <span>{xpTotal} XP {t("deck.games.total")}</span>
                <span>{xpLevelMax} XP</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
