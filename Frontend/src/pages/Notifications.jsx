import { useEffect, useState } from "react";
import PageHeader from "../components/layout/PageHeader.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import { useApi } from "../lib/useApi.js";
import { getNotifications, markAllRead, markRead } from "../lib/api/notifications.js";
import { formatRelative } from "../lib/format.js";

export default function Notifications() {
  const { data: fetched, loading, error, reload } = useApi(() => getNotifications({ limit: 50 }), []);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (fetched) setItems(fetched);
  }, [fetched]);

  async function onOpen(notification) {
    if (notification.is_read) return;
    setItems((current) => current.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n)));
    try {
      await markRead(notification.id);
    } catch (e) {
      setItems((current) => current.map((n) => (n.id === notification.id ? { ...n, is_read: false } : n)));
    }
  }

  async function onMarkAllRead() {
    const previous = items;
    setItems((current) => current.map((n) => ({ ...n, is_read: true })));
    try {
      await markAllRead();
    } catch (e) {
      setItems(previous);
    }
  }

  const hasUnread = items.some((n) => !n.is_read);

  return (
    <div>
      <div className="flex justify-between items-start">
        <PageHeader eyebrow="Updates" title="Notifications" />
        {hasUnread && (
          <NeoButton variant="ghost" size="md" onClick={onMarkAllRead}>
            Mark all read
          </NeoButton>
        )}
      </div>

      {loading && <Skeleton className="h-64" />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {!loading && !error && items.length === 0 && <EmptyState icon="notifications" title="You're all caught up" />}

      {!loading && !error && items.length > 0 && (
        <ul className="divide-y-2 divide-surface-container-highest">
          {items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                className={`w-full text-left py-4 pl-4 ${n.is_read ? "" : "border-l-4 border-secondary"}`}
                onClick={() => onOpen(n)}
              >
                <div className="flex justify-between items-start gap-4">
                  <h3 className="font-headline text-lg">{n.title}</h3>
                  <span className="font-label text-label-md text-on-surface-variant whitespace-nowrap">
                    {formatRelative(n.created_at)}
                  </span>
                </div>
                {n.body && <p className="font-body text-body-md text-on-surface-variant mt-1">{n.body}</p>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
