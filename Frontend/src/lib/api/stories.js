import { api } from "./client.js";

export function getStories({ level, genre, limit = 20, offset = 0 } = {}) {
  const params = new URLSearchParams({ limit, offset });
  if (level) params.set("level", level);
  if (genre) params.set("genre", genre);
  return api.get(`/stories/?${params}`);
}

export function getMyProgress() {
  return api.get("/stories/my-progress");
}

// GET /stories/{id} расходует дневной лимит stories_per_day (enforce_story_limit на бэкенде) —
// не вызывать для превью в каталоге, только при реальном открытии истории читателем.
export function getStory(storyId, { locale } = {}) {
  const params = new URLSearchParams();
  if (locale) params.set("locale", locale);
  const query = params.toString();
  return api.get(`/stories/${storyId}${query ? `?${query}` : ""}`);
}

// Списывает дневной лимит аудиокниг (audiobooks_per_day), кроме повторного прослушивания уже
// начатой сегодня истории — см. check_audiobook_limit на бэкенде.
export function listenToStory(storyId) {
  return api.post(`/stories/${storyId}/listen`);
}

export function saveProgress(storyId, { is_completed, last_position }) {
  return api.post(`/stories/${storyId}/progress`, { is_completed, last_position });
}

// locale по умолчанию на бэкенде — 'ru', а не 'en' (router_story.py:71) — всегда передавать явно.
export function addWordToDeck(storyId, wordId, { locale }) {
  const params = new URLSearchParams({ locale });
  return api.post(`/stories/${storyId}/words/${wordId}/add-to-deck?${params}`);
}

export function submitQuestions(storyId, answers, { locale } = {}) {
  const params = new URLSearchParams();
  if (locale) params.set("locale", locale);
  const query = params.toString();
  return api.post(`/stories/${storyId}/questions/submit${query ? `?${query}` : ""}`, { answers });
}
