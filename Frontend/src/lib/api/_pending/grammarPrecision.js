// ВРЕМЕННАЯ ЗАГЛУШКА для несуществующей метрики произношения ("Phonetic Accuracy" из дизайна).
// См. Frontend/Plan/MISSING_API.md, пункт 4.
// Функции распознавания речи в продукте нет вообще — вместо выдуманного числа подставлена
// реальная точность по грамматике (GET /grammar/weak-topics). Если появится настоящая оценка
// произношения — вернуть заголовок "Phonetic Accuracy" и подключить её эндпоинт отдельно,
// не заменяя эту карточку (на дашборде хватит места под обе).
import { getWeakTopics } from "../grammar.js";

export async function getGrammarPrecision() {
  const topics = await getWeakTopics();
  if (topics.length === 0) return { value: null, attempts: 0 };

  const attempts = topics.reduce((sum, t) => sum + t.attempts, 0);
  const incorrect = topics.reduce((sum, t) => sum + t.incorrect, 0);
  if (attempts === 0) return { value: null, attempts: 0 };

  return { value: Math.round((1 - incorrect / attempts) * 100), attempts };
}
