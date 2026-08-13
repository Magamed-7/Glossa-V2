import { Link, useNavigate } from "react-router-dom";
import Icon from "../ui/Icon.jsx";
import Avatar from "../ui/Avatar.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import SearchBar from "./SearchBar.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import { useApi } from "../../lib/useApi.js";
import { getBalance } from "../../lib/api/payments.js";
import { formatMoney } from "../../lib/format.js";
import { useT } from "../../lib/i18n.jsx";
import { useAuth } from "../../lib/auth/AuthContext.jsx";

const ICON_BOX = "flex items-center justify-center w-10 h-10 border-2 border-tertiary hover:bg-surface-container transition-colors shrink-0";

export default function TopAppBar({ hasUnread, user }) {
  const t = useT();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { data: balance } = useApi(() => getBalance(), []);

  function onLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <header className="bg-surface border-b-2 border-tertiary flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 sticky top-0 z-30">
      <Link to="/dashboard" className="font-display text-2xl font-black uppercase tracking-tight text-tertiary shrink-0">
        {t("loadingScreen.brand")}
      </Link>

      <div className="flex items-center gap-3">
        <SearchBar />

        <Link
          to="/wallet"
          className="flex items-center gap-2 h-10 px-3 border-2 border-tertiary hover:bg-surface-container transition-colors shrink-0"
          aria-label={t("nav.wallet")}
        >
          <Icon name="account_balance_wallet" className="text-tertiary text-lg" />
          <span className="font-ledger text-sm whitespace-nowrap">
            {balance ? formatMoney(balance.balance) : "…"}
          </span>
        </Link>

        <Link to="/messenger" className={ICON_BOX} aria-label={t("nav.messenger")}>
          <Icon name="chat" className="text-tertiary" />
        </Link>

        <Link to="/notifications" className={`relative ${ICON_BOX}`} aria-label={t("nav.notifications")}>
          <Icon name="notifications" className="text-tertiary" />
          {hasUnread && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full" aria-hidden="true" />
          )}
        </Link>

        <ThemeToggle className={ICON_BOX} />

        <Link to="/profile" className="shrink-0" aria-label={t("nav.myProfile")}>
          {user === undefined ? (
            <Skeleton className="w-10 h-10" />
          ) : (
            <Avatar photoUrl={user?.photo_url} name={user?.username} shape="square" size="md" eager />
          )}
        </Link>

        <button type="button" onClick={onLogout} className={ICON_BOX} aria-label={t("nav.logOut")} title={t("nav.logOut")}>
          <Icon name="logout" className="text-secondary" />
        </button>
      </div>
    </header>
  );
}
