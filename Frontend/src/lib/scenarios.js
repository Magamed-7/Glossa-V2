// Список сценариев жёстко задан на бэкенде (schema_ai.py: SCENARIOS Literal) — своего
// эндпоинта-справочника нет, поэтому держим константой на клиенте. Заголовок и описание
// живут в locales/*.js под tutor.scenarios.<code> — здесь только визуальные метаданные.
export const SCENARIOS = [
  { code: "interview", image: "/img/scenarios/interview.webp", featured: true },
  { code: "casual", image: "/img/scenarios/casual.webp" },
  { code: "restaurant", image: "/img/scenarios/restaurant.webp" },
  { code: "airport", image: "/img/scenarios/airport.png" },
  { code: "adventure", image: "/img/scenarios/adventure.png" },
  { code: "newfriend", image: "/img/scenarios/newfriend.png" },
  { code: "debate", image: "/img/scenarios/debate.png" },
  { code: "shopping", image: "/img/scenarios/shopping.png" },
  { code: "doctor", image: "/img/scenarios/doctor.png" },
  { code: "telegram", image: "/img/scenarios/telegram.png" },
];
