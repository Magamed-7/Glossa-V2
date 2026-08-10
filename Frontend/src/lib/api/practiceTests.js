import { api } from "./client.js";

export function getEligibleLevels() {
  return api.get("/practice-tests/levels");
}

export function getPracticeAnalytics() {
  return api.get("/practice-tests/analytics");
}

export function getPracticeHistory({ limit, offset } = {}) {
  const params = new URLSearchParams();
  if (limit) params.set("limit", limit);
  if (offset) params.set("offset", offset);
  const query = params.toString();
  return api.get(`/practice-tests/history${query ? `?${query}` : ""}`);
}

export function getStoryTests({ level, locale } = {}) {
  const params = new URLSearchParams();
  if (level) params.set("level", level);
  if (locale) params.set("locale", locale);
  const query = params.toString();
  return api.get(`/practice-tests/stories${query ? `?${query}` : ""}`);
}

export function generateStoryTest(storyId, { locale } = {}) {
  const params = new URLSearchParams();
  if (locale) params.set("locale", locale);
  const query = params.toString();
  return api.post(`/practice-tests/stories/${storyId}/generate${query ? `?${query}` : ""}`);
}

export function generateCustomTest({ cefrLevels, categories, size, grammarLessonIds, vocabEntryIds, storyIds }, { locale } = {}) {
  const params = new URLSearchParams();
  if (locale) params.set("locale", locale);
  const query = params.toString();
  return api.post(`/practice-tests/custom/generate${query ? `?${query}` : ""}`, {
    cefr_levels: cefrLevels,
    categories,
    size,
    grammar_lesson_ids: grammarLessonIds || [],
    vocab_entry_ids: vocabEntryIds || [],
    story_ids: storyIds || [],
  });
}

export function getLearnedIds() {
  return api.get("/practice-tests/learned");
}

export function submitPracticeTest(attemptId, answers) {
  return api.post(`/practice-tests/${attemptId}/submit`, { answers });
}
