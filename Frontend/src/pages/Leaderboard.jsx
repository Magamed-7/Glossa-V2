import { useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Podium from "../components/leaderboard/Podium.jsx";
import RankTable from "../components/leaderboard/RankTable.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import { useApi } from "../lib/useApi.js";
import { getGlobal, getWeekly, getMyRank, resetLeaderboard } from "../lib/api/leaderboard.js";
import { readUserId, getAccessToken } from "../lib/auth/tokens.js";
import { useT } from "../lib/i18n.jsx";
import { useAuth } from "../lib/auth/AuthContext.jsx";
import { WS_URL } from "../lib/config.js";

export default function Leaderboard() {
  const t = useT();
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const period = searchParams.get("period") === "weekly" ? "weekly" : "global";
  const myUserId = Number(readUserId());

  const { data: entries, loading, error, reload } = useApi(
    () => (period === "weekly" ? getWeekly() : getGlobal()),
    [period]
  );
  const { data: myEntry, reload: reloadMyRank } = useApi(() => getMyRank(period), [period]);

  // Real-time leaderboard updates via WebSocket
  const wsRef = useRef(null);
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    const ws = new WebSocket(`${WS_URL}/ws/leaderboard?token=${token}`);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "update") {
          reload();
          reloadMyRank();
        }
      } catch {}
    };
    ws.onerror = () => {};
    return () => {
      ws.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  function onPeriodChange(value) {
    const next = new URLSearchParams(searchParams);
    next.set("period", value);
    setSearchParams(next);
  }

  async function handleReset() {
    const confirmed = window.confirm(
      period === "weekly"
        ? t("leaderboard.confirmResetWeekly")
        : t("leaderboard.confirmResetGlobal")
    );
    if (!confirmed) return;
    try {
      await resetLeaderboard(period);
      reload();
      reloadMyRank();
    } catch (e) {
      alert(e.message || "Failed to reset leaderboard");
    }
  }

  /* XP progress */
  const myScore = myEntry?.score ?? 0;
  const myRank = myEntry?.rank ?? null;
  const nextRankScore = myScore ? Math.ceil(myScore / 100) * 100 + 50 : 1300;
  const progressPrev = nextRankScore - 100;
  const progressPct = Math.min(
    100,
    Math.max(0, Math.round(((myScore - progressPrev) / (nextRankScore - progressPrev)) * 100))
  );

  const top3 = entries ? entries.filter((e) => e.rank <= 3) : [];
  const rest = entries ?? [];

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <section className="flex flex-col md:flex-row justify-between items-end gap-6 border-b-2 border-tertiary pb-8 mb-10">
        <div>
          <span className="font-label text-label-md text-secondary uppercase tracking-widest block mb-4">
            {t("leaderboard.eyebrow")}
          </span>
          <h1 className="font-headline text-4xl md:text-6xl text-on-surface italic leading-tight">
            {t("leaderboard.titleLead")}{" "}
            <em className="not-italic text-secondary-container">{t("leaderboard.titleAccent")}</em>
          </h1>
          <p className="font-body text-on-surface-variant mt-3 max-w-2xl text-base md:text-lg">
            {t("leaderboard.subtitle")}
          </p>
        </div>

        <div className="flex gap-3 self-start md:self-end flex-wrap">
          <button
            id="lb-period-global"
            onClick={() => onPeriodChange("global")}
            className={`border-2 border-tertiary font-label text-label-md uppercase tracking-widest px-5 py-2 transition-colors ${
              period === "global"
                ? "bg-tertiary text-on-tertiary"
                : "bg-surface text-on-surface hover:bg-surface-variant"
            }`}
          >
            {t("leaderboard.allTime")}
          </button>
          <button
            id="lb-period-weekly"
            onClick={() => onPeriodChange("weekly")}
            className={`border-2 border-tertiary font-label text-label-md uppercase tracking-widest px-5 py-2 transition-colors ${
              period === "weekly"
                ? "bg-tertiary text-on-tertiary"
                : "bg-surface text-on-surface hover:bg-surface-variant"
            }`}
          >
            {t("leaderboard.thisWeek")}
          </button>
          {user && (user.role === "admin" || user.role === "teacher") && (
            <button
              onClick={handleReset}
              className="border-2 border-error text-error font-label text-label-md uppercase tracking-widest px-4 py-2 hover:bg-error-container transition-colors"
            >
              {t("leaderboard.resetButton")}
            </button>
          )}
        </div>
      </section>

      {loading && <Skeleton className="h-96 mb-8" />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {!loading && !error && entries && (
        <>
          {/* ── 12-col grid: Podium + Standing sidebar ──────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
            {/* Podium */}
            <section className="lg:col-span-8 flex flex-col items-center justify-end min-h-[360px] border-2 border-tertiary p-6 bg-surface-container-low relative overflow-hidden neo-card">
              <div
                className="absolute inset-0 pointer-events-none opacity-5"
                style={{
                  backgroundImage: "radial-gradient(var(--color-on-surface) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />
              <Podium entries={top3} />
            </section>

            {/* Standing sidebar */}
            <aside className="lg:col-span-4">
              <div className="neo-card p-6 flex flex-col h-full">
                {/* header */}
                <div className="flex items-center gap-2 mb-6 border-b-2 border-tertiary pb-4">
                  <span className="material-symbols-outlined text-secondary">badge</span>
                  <h2 className="font-headline text-xl italic text-on-surface">
                    {t("leaderboard.yourStanding")}
                  </h2>
                </div>

                {myEntry ? (
                  <>
                    <div className="flex items-center gap-4 mb-6">
                      <Avatar
                        photoUrl={profile?.photo_url}
                        name={user?.username}
                        userId={user?.id}
                        size="lg"
                        className="border-2 border-tertiary"
                      />
                      <div>
                        <p className="font-label text-sm text-on-surface-variant uppercase tracking-widest">
                          {myRank ? `RANK ${myRank}` : "UNRANKED"}
                        </p>
                        <p className="font-headline text-2xl text-on-surface">
                          {myScore.toLocaleString()} XP
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto space-y-3">
                      <div className="flex justify-between items-center text-sm font-label">
                        <span className="text-on-surface-variant">
                          {t("leaderboard.nextRank")} ({myRank ? myRank - 1 : "—"})
                        </span>
                        <span className="text-on-surface font-bold">
                          {nextRankScore.toLocaleString()} XP
                        </span>
                      </div>
                      <div className="w-full bg-surface-variant h-4 border-2 border-tertiary relative overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-secondary-container border-r-2 border-tertiary transition-all duration-700"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-on-surface-variant text-sm font-body italic">—</p>
                )}

                <Link
                  to="/missions"
                  id="lb-view-missions"
                  className="w-full mt-6 bg-secondary-container text-on-secondary-container border-2 border-tertiary hard-shadow font-label text-label-md uppercase tracking-widest py-4 px-4 flex justify-center items-center gap-2 hover:bg-secondary hover:text-on-secondary transition-colors"
                >
                  <span className="material-symbols-outlined">assignment_turned_in</span>
                  {t("leaderboard.viewMissions")}
                </Link>
              </div>
            </aside>
          </div>

          {/* ── Rank table ──────────────────────────────────────────── */}
          <RankTable entries={rest} myUserId={myUserId} myEntry={myEntry} />
        </>
      )}
    </div>
  );
}
