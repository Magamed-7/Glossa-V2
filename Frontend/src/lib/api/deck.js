import { api } from "./client.js";

export function getCards({ status, limit = 20, offset = 0 } = {}) {
  const params = new URLSearchParams({ limit, offset });
  if (status) params.set("status", status);
  return api.get(`/deck/?${params}`);
}

export function getCard(cardId) {
  return api.get(`/deck/${cardId}`);
}

export function createCard({ word, translation, example, source_story_id, transcription, audio_url, accent }) {
  return api.post("/deck/", { word, translation, example, source_story_id, transcription, audio_url, accent });
}

export function setCardStatus(cardId, status) {
  return api.patch(`/deck/${cardId}/status`, { status });
}

export function deleteCard(cardId) {
  return api.delete(`/deck/${cardId}`);
}

export function generateAudio(cardId) {
  return api.post(`/deck/${cardId}/audio`);
}
