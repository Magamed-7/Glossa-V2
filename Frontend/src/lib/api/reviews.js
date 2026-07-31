import { api } from "./client.js";

export function getDueToday() {
  return api.get("/reviews/today");
}

export function submitReview(cardId, quality) {
  return api.post(`/reviews/${cardId}`, { quality });
}
