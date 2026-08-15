import { api } from "./client.js";

export function startVocabSizeTest() {
  return api.post("/tests/vocab-size/start");
}

export function submitVocabSizeTest(attemptId, knownIds) {
  return api.post(`/tests/vocab-size/${attemptId}/submit`, { known_ids: knownIds });
}

export function confirmVocabSizeTest(attemptId, { accepted, adjustedTotal } = {}) {
  return api.post(`/tests/vocab-size/${attemptId}/confirm`, {
    accepted,
    adjusted_total: adjustedTotal ?? null,
  });
}
