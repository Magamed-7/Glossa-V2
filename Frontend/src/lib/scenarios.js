// Список сценариев жёстко задан на бэкенде (schema_ai.py: SCENARIOS Literal) — своего
// эндпоинта-справочника нет, поэтому держим константой на клиенте.
export const SCENARIOS = [
  { code: "interview", title: "Job Interview", image: "/img/scenarios/interview.webp", featured: true },
  { code: "casual", title: "Random Chat", image: "/img/scenarios/casual.webp" },
  { code: "restaurant", title: "At the Restaurant", image: "/img/scenarios/restaurant.webp" },
  { code: "airport", title: "At the Airport", image: "/img/scenarios/airport.webp" },
];
