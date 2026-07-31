// Отзывы и карточки маркетплейса отдают только числовой user_id/author_id, без имени и фото.
// См. Frontend/Plan/MISSING_API.md, пункт 8. Реальный GET /profile/{user_id} публичный —
// резолвим через него с кэшем, чтобы список из N карточек не бил N параллельных запросов.
// Когда ReviewResponse/UserStoryResponse начнут включать author: {id, username, photo_url} —
// удалить этот резолвер и читать поле напрямую.
import { getPublicProfile } from "../profile.js";

const cache = new Map();

export function resolveUser(userId) {
  if (!cache.has(userId)) {
    cache.set(
      userId,
      getPublicProfile(userId).catch(() => ({ user_id: userId, username: null }))
    );
  }
  return cache.get(userId);
}
