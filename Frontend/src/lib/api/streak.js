// ВРЕМЕННАЯ ЗАГЛУШКА. Настоящего эндпоинта GET /streak нет.
// См. Frontend/Plan/MISSING_API.md, пункт 1.
// Когда бэкенд отдаст GET /streak — заменить тело функции на реальный вызов
// и удалить этот комментарий. Сигнатура и форма ответа меняться не должны.
import { exportMyData } from "../account.js";

export async function getStreak() {
  const data = await exportMyData();
  const streak = data.streak || {};
  return {
    current_streak: streak.current_streak ?? 0,
    best_streak: streak.best_streak ?? 0,
    last_activity_date: streak.last_activity_date ?? null,
  };
}
