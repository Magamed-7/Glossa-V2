import { api } from "./client.js";

export function getConversations() {
  return api.get("/messenger/conversations");
}

export function startConversation(userId) {
  return api.post("/messenger/conversations", { user_id: userId });
}

export function getMessages(conversationId, { beforeId, limit = 30 } = {}) {
  const params = new URLSearchParams({ limit });
  if (beforeId) params.set("before_id", beforeId);
  return api.get(`/messenger/conversations/${conversationId}/messages?${params}`);
}

export function markConversationRead(conversationId) {
  return api.post(`/messenger/conversations/${conversationId}/read`);
}

export function getIceServers() {
  return api.get("/messenger/ice-servers");
}

export function uploadAttachment(conversationId, file) {
  const body = new FormData();
  body.append("file", file);
  return api.post(`/messenger/conversations/${conversationId}/attachments`, body);
}
