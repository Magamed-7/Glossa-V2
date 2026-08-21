import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import Icon from "../components/ui/Icon.jsx";
import { useApi } from "../lib/useApi.js";
import { getNotifications, markAllRead } from "../lib/api/notifications.js";
import { useT } from "../lib/i18n.jsx";

const PAGE_SIZE = 5;

// Older notifications were stored before they carried their own destination.
const DEFAULT_LINKS = {
  review_reminder: "/deck",
  streak_warning: "/deck",
  leaderboard_reset: "/leaderboard",
  achievement: "/profile",
  new_message: "/messenger",
};
const MAX_PAGES = 3;

export default function Notifications() {
  const t = useT();
  // Fetch up to 15 notifications max (3 pages of 5 items)
  const { data: fetched, loading, error, reload } = useApi(() => getNotifications({ limit: 15 }), []);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (fetched) {
      setItems(fetched);
      const hasUnread = fetched.some((n) => !n.is_read);
      if (hasUnread) {
        // Automatically mark all as read when user visits the page
        setItems((current) => current.map((n) => ({ ...n, is_read: true })));
        markAllRead().catch(() => {
          setItems(fetched);
        });
      }
    }
  }, [fetched]);

  function formatRegistryDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  // Client-side pagination logic
  const totalPages = Math.min(MAX_PAGES, Math.ceil(items.length / PAGE_SIZE));
  const displayedItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* ── Header Section ── */}
      <section className="border-b-4 border-tertiary pb-6 mb-8">
        <h1 className="font-headline text-4xl md:text-6xl text-on-surface font-extrabold uppercase tracking-tight">
          {t("notifications.registryTitle") || "NOTIFICATION REGISTRY"}
        </h1>
        <p className="font-body text-base md:text-lg text-on-surface-variant italic mt-3">
          {t("notifications.registrySubtitle") ||
            "Official log of system dispatches, academic reprimands, and market missives. Keep for your permanent record."}
        </p>
      </section>

      {loading && <Skeleton className="h-64" />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {!loading && !error && items.length === 0 && (
        <EmptyState icon="notifications" title={t("notifications.caughtUp")} />
      )}

      {!loading && !error && items.length > 0 && (
        <div className="space-y-8">
          <ul className="space-y-6">
            {displayedItems.map((n) => {
              // Determine category label and styling based on notification type
              let category = "SYSTEM";
              let categoryBg = "bg-tertiary text-on-tertiary";
              if (n.type === "achievement") {
                category = "ACADEMY";
                categoryBg = "bg-black text-white";
              } else if (n.type === "leaderboard_reset") {
                category = "LEADERBOARD";
                categoryBg = "bg-secondary-container text-on-secondary-container";
              } else if (n.type === "review_reminder") {
                category = "SM-2";
                categoryBg = "bg-surface-variant text-on-surface-variant border border-tertiary";
              } else if (n.type === "new_message") {
                category = "MESSAGE";
                categoryBg = "bg-secondary text-on-secondary";
              }

              // Notifications carry the place they came from, so a message leads back to
              // its own conversation rather than dumping the reader on the home page.
              const destination = n.link || DEFAULT_LINKS[n.type] || "/dashboard";
              const destinationLabel =
                n.type === "new_message"
                  ? t("nav.messenger") || "OPEN CHAT"
                  : destination === "/deck"
                    ? t("nav.deck") || "LEXICON"
                    : destination === "/leaderboard"
                      ? t("nav.leaderboard") || "LEADERBOARD"
                      : destination === "/profile"
                        ? t("nav.profile") || "PROFILE"
                        : t("nav.dashboard") || "HOME";

              // Card styling matching mockup
              return (
                <li key={n.id} className="relative">
                  <div
                    className={`neo-card p-6 bg-surface border-2 border-tertiary relative overflow-hidden transition-all duration-300 ${
                      !n.is_read
                        ? "shadow-[6px_6px_0_0_#dc2c4f]"
                        : "hard-shadow"
                    }`}
                  >
                    {/* Unread Exclamation badge matching mockup */}
                    {!n.is_read && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#dc2c4f] text-white flex items-center justify-center font-bold text-sm border-2 border-tertiary z-20 animate-pulse">
                        !
                      </div>
                    )}

                    {/* Card Top Line */}
                    <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-on-surface-variant pb-3 border-b border-surface-variant/40">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 font-label text-[10px] uppercase font-bold tracking-widest ${categoryBg}`}>
                          [{category}]
                        </span>
                        <span className="font-mono">REG. NO. NTF-{n.id}</span>
                      </div>
                      <span className="font-display italic text-sm font-bold text-on-surface-variant">
                        {formatRegistryDate(n.created_at)}
                      </span>
                    </div>

                    {/* Card Title & Body */}
                    <div className="mt-4">
                      <h3 className="font-headline text-xl font-bold uppercase tracking-tight text-on-surface leading-snug">
                        {n.title}
                      </h3>
                      {n.body && (
                        <p className="font-body text-sm text-on-surface-variant leading-relaxed mt-2">
                          {n.body}
                        </p>
                      )}
                    </div>

                    {/* Action links based on notification type */}
                    <div className="mt-4 flex justify-start">
                      <Link
                        to={destination}
                        className="font-label text-xs uppercase tracking-widest text-secondary hover:underline flex items-center gap-1"
                      >
                        {destinationLabel}
                        <Icon name="arrow_right_alt" className="text-sm" />
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* ── Pagination controls (max 3 pages) ── */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6 border-t-2 border-tertiary">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border-2 border-tertiary bg-surface text-on-surface hover:bg-surface-variant disabled:opacity-50 disabled:cursor-not-allowed font-label text-xs uppercase tracking-widest flex items-center gap-1"
              >
                <Icon name="chevron_left" className="text-sm" />
                {t("common.prev") || "Prev"}
              </button>

              {Array.from({ length: totalPages }, (_, idx) => {
                const pageNum = idx + 1;
                const isActive = pageNum === page;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    className={`px-4 py-1.5 border-2 border-tertiary font-mono text-sm font-bold transition-colors ${
                      isActive
                        ? "bg-tertiary text-on-tertiary"
                        : "bg-surface text-on-surface hover:bg-surface-variant"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 border-2 border-tertiary bg-surface text-on-surface hover:bg-surface-variant disabled:opacity-50 disabled:cursor-not-allowed font-label text-xs uppercase tracking-widest flex items-center gap-1"
              >
                {t("common.next") || "Next"}
                <Icon name="chevron_right" className="text-sm" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
