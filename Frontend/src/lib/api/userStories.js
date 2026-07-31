import { api } from "./client.js";

// author_id/is_free существуют на бэкенде (router_user_story.py), но даже с author_id
// этот эндпоинт жёстко фильтрует status == 'published' — черновики через него не видны
// (см. crud_user_story.get_user_stories). Для кабинета автора использовать getMyAuthorStats.
export function getUserStories({ level, genre, isFree, authorId, limit = 20, offset = 0 } = {}) {
  const params = new URLSearchParams({ limit, offset });
  if (level) params.set("level", level);
  if (genre) params.set("genre", genre);
  if (isFree !== undefined) params.set("is_free", isFree);
  if (authorId !== undefined) params.set("author_id", authorId);
  return api.get(`/user-stories?${params}`);
}

// Требует целевой язык уровня B2+ (require_writer_level на бэкенде), иначе 403 WRITER_LEVEL_REQUIRED —
// проверять уровень пользователя до показа формы, см. Frontend/Plan/API_CONTRACT.md §3.7.
export function createUserStory(data) {
  return api.post("/user-stories", data);
}

export function getMyAuthorStats() {
  return api.get("/user-stories/my/stats");
}

export function getUserStory(storyId) {
  return api.get(`/user-stories/${storyId}`);
}

export function updateUserStory(storyId, data) {
  return api.patch(`/user-stories/${storyId}`, data);
}

export function deleteUserStory(storyId) {
  return api.delete(`/user-stories/${storyId}`);
}

export function publishUserStory(storyId) {
  return api.post(`/user-stories/${storyId}/publish`);
}

export function buyUserStory(storyId) {
  return api.post(`/user-stories/${storyId}/buy`);
}

export function uploadCover(storyId, file) {
  const body = new FormData();
  body.append("file", file);
  return api.post(`/user-stories/${storyId}/cover`, body);
}

export function createExercise(storyId, exercise) {
  return api.post(`/user-stories/${storyId}/exercises`, exercise);
}

export function submitExercises(storyId, answers) {
  return api.post(`/user-stories/${storyId}/exercises/submit`, { answers });
}

export function createReview(storyId, { rating, text }) {
  return api.post(`/user-stories/${storyId}/reviews`, { rating, text });
}

export function getReviews(storyId) {
  return api.get(`/user-stories/${storyId}/reviews`);
}
