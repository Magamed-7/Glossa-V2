import { api } from "./client.js";

export function getLessons({ level, unit, search, limit = 20, offset = 0 } = {}) {
  const params = new URLSearchParams({ limit, offset });
  if (level) params.set("level", level);
  if (unit) params.set("unit", unit);
  if (search) params.set("search", search);
  return api.get(`/grammar/?${params}`);
}

export function getWeakTopics() {
  return api.get("/grammar/weak-topics");
}

export function getGrammarProgress() {
  return api.get("/grammar/progress");
}

export function getLesson(lessonId, locale = "en") {
  return api.get(`/grammar/${lessonId}?locale=${locale}`);
}

export function submitLesson(lessonId, answers) {
  return api.post(`/grammar/${lessonId}/submit`, { answers });
}
