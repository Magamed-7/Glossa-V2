import insights from "../../data/insights.json";
import { useT } from "../../lib/i18n.jsx";

// Локальный контент — см. Frontend/Plan/MISSING_API.md, пункт 5.
// Заменить на GET /insights, когда бэкенд его отдаст (форма ответа уже совпадает).
// Сам контент insights.json — англоязычный мок, локализация ждёт реального API.
export default function Insights() {
  const t = useT();
  return (
    <div className="mt-section-gap grid grid-cols-12 gap-gutter">
      <div className="col-span-12 lg:col-span-3">
        <h3 className="font-display text-headline-lg border-l-4 border-secondary pl-6 py-2">{t("dashboard.insightsTitle")}</h3>
      </div>
      <div className="col-span-12 lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights.slice(0, 2).map((item) => (
          <div key={item.id} className="border-t-2 border-tertiary pt-6 group cursor-pointer">
            <span className="font-label text-label-md text-secondary mb-2 block uppercase">{item.category}</span>
            <h4 className="font-headline text-2xl group-hover:underline underline-offset-4 decoration-secondary">
              {item.title}
            </h4>
            <p className="font-body text-body-md mt-4 opacity-70">{item.excerpt}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
