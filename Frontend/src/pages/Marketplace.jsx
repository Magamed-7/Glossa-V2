import { Link } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader.jsx";
import Icon from "../components/ui/Icon.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import AcquisitionCard from "../components/market/AcquisitionCard.jsx";
import { useApi } from "../lib/useApi.js";
import { getBalance } from "../lib/api/payments.js";
import { getUserStories } from "../lib/api/userStories.js";
import { formatMoney } from "../lib/format.js";

export default function Marketplace() {
  const { data: balance } = useApi(() => getBalance(), []);
  const { data: topPicks, loading } = useApi(async () => {
    const stories = await getUserStories({ limit: 20 });
    return [...stories].sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0)).slice(0, 3);
  }, []);

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <PageHeader
          eyebrow="Community Marketplace"
          title="The Global"
          accent="Exchange"
          subtitle="Stories written by fellow learners, ready to buy and read."
        />
        <Link
          to="/wallet"
          className="hidden md:flex items-center gap-2 border-2 border-tertiary px-4 py-2 hard-shadow"
        >
          <Icon name="account_balance_wallet" className="text-secondary" />
          <span className="font-ledger text-lg">{balance ? formatMoney(balance.balance) : "…"}</span>
        </Link>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5]" />
          ))}
        </div>
      )}

      {!loading && topPicks?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topPicks.map((story) => (
            <AcquisitionCard key={story.id} story={story} />
          ))}
        </div>
      )}

      <div>{/* Community grid goes here */}</div>
    </div>
  );
}
