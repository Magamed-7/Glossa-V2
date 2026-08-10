import { useSearchParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Podium from "../components/leaderboard/Podium.jsx";
import RankTable from "../components/leaderboard/RankTable.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import { useApi } from "../lib/useApi.js";
import { getGlobal, getWeekly, getMyRank, resetLeaderboard } from "../lib/api/leaderboard.js";
import { readUserId } from "../lib/auth/tokens.js";
import { useT } from "../lib/i18n.jsx";
import { useAuth } from "../lib/auth/AuthContext.jsx";

/* ─── page-scoped styles ──────────────────────────────────────────────── */
const pageStyles = `
  .neo-shadow {
    box-shadow: 4px 4px 0 0 #000000;
    transition: all 0.2s ease;
  }
  .neo-shadow:hover {
    box-shadow: 2px 2px 0 0 #000000;
    transform: translate(2px, 2px);
  }
  .neo-shadow-crimson {
    box-shadow: 4px 4px 0 0 #dc2c4f;
    transition: all 0.2s ease;
  }
  .neo-shadow-crimson:hover {
    box-shadow: 2px 2px 0 0 #dc2c4f;
    transform: translate(2px, 2px);
  }
  .dot-bg {
    background-image: radial-gradient(var(--color-on-surface) 1px, transparent 1px);
    background-size: 20px 20px;
    opacity: 0.05;
  }
`;

export default function Leaderboard() {
  const t = useT();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const period = searchParams.get("period") === "weekly" ? "weekly" : "global";
  const myUserId = Number(readUserId());

  const { data: entries, loading, error, reload } = useApi(
    () => (period === "weekly" ? getWeekly() : getGlobal()),
    [period]
  );
  const { data: myEntry, reload: reloadMyRank } = useApi(() => getMyRank(period), [period]);

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

  /* XP progress — derive from myEntry */
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
    <>
      <style>{pageStyles}</style>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <section className="flex flex-col md:flex-row justify-between items-end gap-6 border-b-2 border-black pb-8 mb-10">
        <div>
          <span className="font-label-md text-label-md text-crimson-accent uppercase tracking-widest block mb-4">
            {t("leaderboard.eyebrow")}
          </span>
          <h1 className="font-headline text-4xl md:text-6xl text-[var(--color-on-surface)] italic leading-tight">
            {t("leaderboard.titleLead")}{" "}
            <em className="not-italic">{t("leaderboard.titleAccent")}</em>
          </h1>
          <p className="font-body text-[var(--color-on-surface-variant)] mt-3 max-w-2xl text-base md:text-lg">
            {t("leaderboard.subtitle")}
          </p>
        </div>

        <div className="flex gap-3 self-start md:self-end flex-wrap">
          <button
            id="lb-period-global"
            onClick={() => onPeriodChange("global")}
            className={`border-2 border-black font-label-md text-label-md uppercase tracking-widest px-5 py-2 transition-colors ${
              period === "global"
                ? "bg-black text-[var(--color-surface)]"
                : "bg-[var(--color-surface)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-variant)]"
            }`}
          >
            {t("leaderboard.allTime")}
          </button>
          <button
            id="lb-period-weekly"
            onClick={() => onPeriodChange("weekly")}
            className={`border-2 border-black font-label-md text-label-md uppercase tracking-widest px-5 py-2 transition-colors ${
              period === "weekly"
                ? "bg-black text-[var(--color-surface)]"
                : "bg-[var(--color-surface)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-variant)]"
            }`}
          >
            {t("leaderboard.thisWeek")}
          </button>
          {/* Admin reset */}
          {user && (user.role === "admin" || user.role === "teacher") && (
            <button
              onClick={handleReset}
              className="border-2 border-error text-error font-label-md text-label-md uppercase tracking-widest px-4 py-2 hover:bg-error-container transition-colors"
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
          {/* ── Main grid: Podium (8 cols) + Sidebar (4 cols) ──────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
            {/* Podium box */}
            <section className="lg:col-span-8 flex flex-col items-center justify-end min-h-[360px] border-2 border-black p-6 bg-[var(--color-surface-container-low)] relative overflow-hidden">
              <div className="absolute inset-0 dot-bg pointer-events-none" />
              <Podium entries={top3} />
            </section>

            {/* Standing sidebar */}
            <aside className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-[var(--color-surface)] border-2 border-black p-6 neo-shadow flex flex-col h-full">
                {/* header */}
                <div className="flex items-center gap-2 mb-6 border-b-2 border-black pb-4">
                  <span className="material-symbols-outlined text-crimson-accent">badge</span>
                  <h2 className="font-headline text-xl italic text-[var(--color-on-surface)]">
                    {t("leaderboard.yourStanding")}
                  </h2>
                </div>

                {myEntry ? (
                  <>
                    {/* user row */}
                    <div className="flex items-center gap-4 mb-6">
                      <Avatar
                        photoUrl={myEntry.photo_url}
                        name={myEntry.username}
                        userId={myEntry.user_id}
                        size="lg"
                        className="border-2 border-black"
                      />
                      <div>
                        <p className="font-label-md text-sm text-[var(--color-on-surface-variant)] uppercase tracking-widest">
                          {myRank ? `RANK ${myRank}` : "UNRANKED"}
                        </p>
                        <p className="font-headline text-2xl text-[var(--color-on-surface)]">
                          {myScore.toLocaleString()} XP
                        </p>
                      </div>
                    </div>

                    {/* progress */}
                    <div className="mt-auto space-y-3">
                      <div className="flex justify-between items-center text-sm font-label-md">
                        <span className="text-[var(--color-on-surface-variant)]">
                          {t("leaderboard.nextRank")} ({myRank ? myRank - 1 : "—"})
                        </span>
                        <span className="text-[var(--color-on-surface)] font-bold">
                          {nextRankScore.toLocaleString()} XP
                        </span>
                      </div>
                      <div className="w-full bg-[var(--color-surface-variant)] h-4 border-2 border-black relative overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-crimson-accent border-r-2 border-black transition-all duration-700"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-[var(--color-on-surface-variant)] text-sm font-body italic">
                    —
                  </p>
                )}

                {/* CTA */}
                <Link
                  to="/dashboard"
                  id="lb-view-missions"
                  className="w-full mt-6 bg-crimson-accent text-white border-2 border-black neo-shadow font-label-md text-label-md uppercase tracking-widest py-4 px-4 flex justify-center items-center gap-2 hover:bg-secondary transition-colors"
                >
                  <span className="material-symbols-outlined">assignment_turned_in</span>
                  {t("leaderboard.viewMissions")}
                </Link>
              </div>
            </aside>
          </div>

          {/* ── Rank table ──────────────────────────────────────────────── */}
          <RankTable entries={rest} myUserId={myUserId} myEntry={myEntry} />
        </>
      )}
    </>
  );
}
