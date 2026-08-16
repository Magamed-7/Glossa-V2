import { api } from "./client.js";

export function generateExercise({ topic, level }) {
  return api.post("/ai/exercises/generate", { topic, level });
}

export function getMyErrors() {
  return api.get("/ai/errors/my");
}

export function getSessionAnalysis(sessionId) {
  return api.get(`/ai/sessions/${sessionId}/analysis`);
}

export function getTtsUrl({ text, tutor }) {
  return api.get(`/ai/tts?text=${encodeURIComponent(text)}&tutor=${encodeURIComponent(tutor)}`);
}
