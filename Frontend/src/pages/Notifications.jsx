import PageHeader from "../components/layout/PageHeader.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import { useApi } from "../lib/useApi.js";
import { getNotifications } from "../lib/api/notifications.js";
import { formatRelative } from "../lib/format.js";

export default function Notifications() {
  const { data: notifications, loading, error, reload } = useApi(() => getNotifications({ limit: 50 }), []);

  return (
    <div>
      <PageHeader eyebrow="Updates" title="Notifications" />

      {loading && <Skeleton className="h-64" />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {!loading && !error && notifications && notifications.length === 0 && (
        <EmptyState icon="notifications" title="You're all caught up" />
      )}

      {!loading && !error && notifications && notifications.length > 0 && (
        <ul className="divide-y-2 divide-surface-container-highest">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`py-4 pl-4 ${n.is_read ? "" : "border-l-4 border-secondary"}`}
            >
              <div className="flex justify-between items-start gap-4">
                <h3 className="font-headline text-lg">{n.title}</h3>
                <span className="font-label text-label-md text-on-surface-variant whitespace-nowrap">
                  {formatRelative(n.created_at)}
                </span>
              </div>
              {n.body && <p className="font-body text-body-md text-on-surface-variant mt-1">{n.body}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
