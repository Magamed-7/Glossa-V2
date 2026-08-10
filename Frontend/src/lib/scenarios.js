// Список сценариев жёстко задан на бэкенде (schema_ai.py: SCENARIOS Literal) — своего
// эндпоинта-справочника нет, поэтому держим константой на клиенте. Заголовок и описание
// живут в locales/*.js под tutor.scenarios.<code> — здесь только визуальные метаданные.
// У сценариев без готового фото (image: null) карточка рисует плитку с иконкой (см. ScenarioCard).
export const SCENARIOS = [
  { code: "interview", image: "/img/scenarios/interview.webp", featured: true },
  { code: "casual", image: "/img/scenarios/casual.webp" },
  { code: "restaurant", image: "/img/scenarios/restaurant.webp" },
  { code: "airport", image: "/img/scenarios/airport.webp" },
  { code: "adventure", icon: "auto_stories", tileClass: "bg-tertiary-fixed text-on-tertiary-fixed" },
  { code: "newfriend", icon: "diversity_2", tileClass: "bg-secondary-fixed text-on-secondary-fixed" },
  { code: "debate", icon: "forum", tileClass: "bg-primary-fixed text-on-primary-fixed" },
  { code: "shopping", icon: "shopping_bag", tileClass: "bg-tertiary-fixed text-on-tertiary-fixed" },
  { code: "doctor", icon: "medical_services", tileClass: "bg-secondary-fixed text-on-secondary-fixed" },
  { code: "telegram", icon: "send", tileClass: "bg-primary-fixed text-on-primary-fixed" },
];
