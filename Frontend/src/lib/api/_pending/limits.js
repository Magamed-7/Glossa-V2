// ВРЕМЕННАЯ ЗАГЛУШКА. Настоящего эндпоинта GET /limits/my нет.
// См. Frontend/Plan/MISSING_API.md, пункт 3.
// Когда бэкенд отдаст GET /limits/my — заменить тело функции на реальный вызов
// и удалить этот комментарий. Сигнатура и форма ответа меняться не должны.
import { getMySubscription } from "../subscriptions.js";

// used: null означает "неизвестно" — UI обязан уметь скрывать счётчик использования,
// показывая только потолок тарифа (limit), а не выдуманное "осталось".
// subscription: опционально — если уже загружена вызывающим кодом, передать сюда,
// чтобы не дёргать GET /subscriptions/my второй раз за один и тот же цикл загрузки.
export async function getMyLimits(subscription) {
  const { plan } = subscription || (await getMySubscription());
  const cap = (value) => ({ used: null, limit: value });

  return {
    stories_per_day: cap(plan.stories_per_day),
    deck_words_per_day: cap(plan.deck_words_per_day),
    own_stories_per_week: cap(plan.own_stories_per_week),
    ai_seconds_per_day: cap(plan.ai_seconds_per_day),
  };
}
