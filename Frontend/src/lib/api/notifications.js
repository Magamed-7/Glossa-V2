import { api } from "./client.js";

export function getNotifications({ is_read, limit = 20, offset = 0 } = {}) {
  const params = new URLSearchParams({ limit, offset });
  if (is_read !== undefined) params.set("is_read", is_read);
  return api.get(`/notifications?${params}`);
}

export function markRead(notificationId) {
  return api.patch(`/notifications/${notificationId}/read`);
}

export function markAllRead() {
  return api.patch("/notifications/read-all");
}
