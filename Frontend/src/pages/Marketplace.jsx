import { Link } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useApi } from "../lib/useApi.js";
import { getBalance } from "../lib/api/payments.js";
import { formatMoney } from "../lib/format.js";

export default function Marketplace() {
  const { data: balance } = useApi(() => getBalance(), []);

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
      <div>{/* Featured and community grids go here */}</div>
    </div>
  );
}
