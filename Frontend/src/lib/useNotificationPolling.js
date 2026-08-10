import { useEffect, useState, useRef } from "react";
import { getNotifications } from "./api/notifications.js";

const POLL_INTERVAL_MS = 12000; // Check every 12 seconds for responsive real-time push

export function useNotificationPolling() {
  const [hasUnread, setHasUnread] = useState(false);
  const [activeToast, setActiveToast] = useState(null);
  const seenIdsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (document.visibilityState !== "visible") return;
      try {
        const list = await getNotifications({ limit: 15 });
        if (cancelled) return;

        const unreadList = list.filter((n) => !n.is_read);
        setHasUnread(unreadList.length > 0);

        if (isFirstLoadRef.current) {
          // Populate seen set on initial load to avoid toast storms for existing notifications
          list.forEach((n) => seenIdsRef.current.add(n.id));
          isFirstLoadRef.current = false;
        } else {
          // Detect any new notifications that are not in the seen set
          const unseen = list.filter((n) => !seenIdsRef.current.has(n.id));
          if (unseen.length > 0) {
            // Add them to the seen set
            unseen.forEach((n) => seenIdsRef.current.add(n.id));

            // Select the latest one to show as toast (unseen list is sorted newest first)
            const latest = unseen[0];
            setActiveToast({
              id: latest.id,
              title: latest.title,
              body: latest.body,
              type: latest.type,
            });

            // Automatically clear toast after 8 seconds
            setTimeout(() => {
              setActiveToast((current) => (current?.id === latest.id ? null : current));
            }, 8000);
          }
        }
      } catch (e) {
        // silent ignore
      }
    }

    check();
    const interval = setInterval(check, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", check);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  return {
    hasUnread,
    activeToast,
    clearToast: () => setActiveToast(null),
  };
}
