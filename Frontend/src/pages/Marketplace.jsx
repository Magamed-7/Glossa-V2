import { useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader.jsx";
import Icon from "../components/ui/Icon.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import AcquisitionCard from "../components/market/AcquisitionCard.jsx";
import CommunityGrid from "../components/market/CommunityGrid.jsx";
import FilterPanel from "../components/market/FilterPanel.jsx";
import { useApi } from "../lib/useApi.js";
import { getBalance } from "../lib/api/payments.js";
import { getUserStories } from "../lib/api/userStories.js";
import { formatMoney } from "../lib/format.js";

export default function Marketplace() {
  const [filters, setFilters] = useState({ level: "", price: "" });
  const { data: balance } = useApi(() => getBalance(), []);
  const { data: stories, loading } = useApi(
    () => getUserStories({ level: filters.level || undefined, limit: 20 }),
    [filters.level]
  );

  const priceFiltered = (stories || []).filter((s) => {
    if (filters.price === "free") return !s.price;
    if (filters.price === "paid") return !!s.price;
    return true;
  });
  const sorted = [...priceFiltered].sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
  const topPicks = sorted.slice(0, 3);
  const rest = sorted.slice(3);

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

      {!loading && topPicks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topPicks.map((story) => (
            <AcquisitionCard key={story.id} story={story} />
          ))}
        </div>
      )}

      {!loading && <CommunityGrid stories={rest} />}

      <FilterPanel filters={filters} onChange={setFilters} />
    </div>
  );
}
