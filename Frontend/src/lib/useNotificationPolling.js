import { useEffect, useState } from "react";
import { getNotifications } from "./api/notifications.js";

const POLL_INTERVAL_MS = 60000;

// Live-канала уведомлений нет (MISSING_API.md, п.9) — опрашиваем раз в минуту, и только
// пока вкладка активна, чтобы не тратить запросы на фоновую вкладку.
export function useNotificationPolling() {
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (document.visibilityState !== "visible") return;
      try {
        const list = await getNotifications({ is_read: false, limit: 1 });
        if (!cancelled) setHasUnread(list.length > 0);
      } catch (e) {
        // тихо игнорируем — это фоновая проверка, не должна показывать ошибки пользователю
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

  return hasUnread;
}
