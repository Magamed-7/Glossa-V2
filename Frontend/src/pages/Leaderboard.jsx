import { useSearchParams } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader.jsx";
import Podium from "../components/leaderboard/Podium.jsx";
import RankTable from "../components/leaderboard/RankTable.jsx";
import Tabs from "../components/ui/Tabs.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";
import { useApi } from "../lib/useApi.js";
import { getGlobal, getWeekly, getMyRank, resetLeaderboard } from "../lib/api/leaderboard.js";
import { readUserId } from "../lib/auth/tokens.js";
import { useT } from "../lib/i18n.jsx";
import { useAuth } from "../lib/auth/AuthContext.jsx";

export default function Leaderboard() {
  const t = useT();
  const { user } = useAuth();
  const PERIOD_TABS = [
    { value: "global", label: t("leaderboard.allTime") },
    { value: "weekly", label: t("leaderboard.thisWeek") },
  ];
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

  return (
    <div>
      <PageHeader
        eyebrow={t("leaderboard.eyebrow")}
        title={t("leaderboard.titleLead")}
        accent={t("leaderboard.titleAccent")}
        subtitle={t("leaderboard.subtitle")}
      />

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <Tabs id="leaderboard-period" tabs={PERIOD_TABS} value={period} onChange={onPeriodChange} />
        {user && (user.role === "admin" || user.role === "teacher") && (
          <NeoButton
            variant="inverse"
            size="md"
            onClick={handleReset}
            className="text-error border-error hover:bg-error-container font-headline text-sm uppercase tracking-widest px-4 py-2"
          >
            {t("leaderboard.resetButton")}
          </NeoButton>
        )}
      </div>

      {loading && <Skeleton className="h-96" />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {!loading && !error && entries && (
        <>
          <Podium entries={entries.filter((e) => e.rank <= 3)} />
          <RankTable entries={entries} myUserId={myUserId} myEntry={myEntry} />
        </>
      )}
    </div>
  );
}
