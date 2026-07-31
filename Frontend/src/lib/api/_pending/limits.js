// ВРЕМЕННАЯ ЗАГЛУШКА. Настоящего эндпоинта GET /limits/my нет.
// См. Frontend/Plan/MISSING_API.md, пункт 3.
// Когда бэкенд отдаст GET /limits/my — заменить тело функции на реальный вызов
// и удалить этот комментарий. Сигнатура и форма ответа меняться не должны.
import { getMySubscription } from "../subscriptions.js";

// used: null означает "неизвестно" — UI обязан уметь скрывать счётчик использования,
// показывая только потолок тарифа (limit), а не выдуманное "осталось".
export async function getMyLimits() {
  const { plan } = await getMySubscription();
  const cap = (value) => ({ used: null, limit: value });

  return {
    stories_per_day: cap(plan.stories_per_day),
    deck_words_per_day: cap(plan.deck_words_per_day),
    own_stories_per_week: cap(plan.own_stories_per_week),
    ai_seconds_per_day: cap(plan.ai_seconds_per_day),
  };
}
