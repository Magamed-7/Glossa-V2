import PageHeader from "../components/layout/PageHeader.jsx";
import Podium from "../components/leaderboard/Podium.jsx";
import RankTable from "../components/leaderboard/RankTable.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import { useApi } from "../lib/useApi.js";
import { getGlobal, getMyRank } from "../lib/api/leaderboard.js";
import { readUserId } from "../lib/auth/tokens.js";

export default function Leaderboard() {
  const myUserId = Number(readUserId());
  const { data: entries, loading, error, reload } = useApi(() => getGlobal(), []);
  const { data: myEntry } = useApi(() => getMyRank(), []);

  return (
    <div>
      <PageHeader
        eyebrow="Global Standing"
        title="The Global"
        accent="Ledger"
        subtitle="Where you stand among every learner on Glossa."
      />

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
