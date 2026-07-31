import { useSearchParams } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader.jsx";
import Podium from "../components/leaderboard/Podium.jsx";
import RankTable from "../components/leaderboard/RankTable.jsx";
import Tabs from "../components/ui/Tabs.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import { useApi } from "../lib/useApi.js";
import { getGlobal, getWeekly, getMyRank } from "../lib/api/leaderboard.js";
import { readUserId } from "../lib/auth/tokens.js";
import { useT } from "../lib/i18n.jsx";

export default function Leaderboard() {
  const t = useT();
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
  const { data: myEntry } = useApi(() => getMyRank(), []);

  function onPeriodChange(value) {
    const next = new URLSearchParams(searchParams);
    next.set("period", value);
    setSearchParams(next);
  }

  return (
    <div>
      <PageHeader
        eyebrow={t("leaderboard.eyebrow")}
        title={t("leaderboard.titleLead")}
        accent={t("leaderboard.titleAccent")}
        subtitle={t("leaderboard.subtitle")}
      />

      <div className="mb-8">
        <Tabs id="leaderboard-period" tabs={PERIOD_TABS} value={period} onChange={onPeriodChange} />
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
