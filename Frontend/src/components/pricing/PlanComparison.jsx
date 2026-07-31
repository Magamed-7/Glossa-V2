import Icon from "../ui/Icon.jsx";
import { formatLimit, formatSeconds } from "../../lib/format.js";
import { useT } from "../../lib/i18n.jsx";

const ROW_KEYS = [
  { key: "stories_per_day", labelKey: "pricing.rows.storiesPerDay", format: formatLimit },
  { key: "deck_words_per_day", labelKey: "pricing.rows.wordsPerDay", format: formatLimit },
  { key: "own_stories_per_week", labelKey: "pricing.rows.ownStoriesPerWeek", format: formatLimit },
  {
    key: "ai_seconds_per_day",
    labelKey: "pricing.rows.aiPerDay",
    format: (v) => (v === null ? "∞" : v === 0 ? "—" : formatSeconds(v)),
  },
];

export default function PlanComparison({ plans }) {
  const t = useT();
  return (
    <div className="overflow-x-auto mt-section-gap">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-tertiary">
            <th scope="col" className="text-left py-3 font-label text-label-md uppercase">{t("pricing.feature")}</th>
            {plans.map((plan) => (
              <th key={plan.id} scope="col" className="text-center py-3 font-label text-label-md uppercase capitalize">
                {plan.code}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROW_KEYS.map((row) => (
            <tr key={row.key} className="border-b border-surface-container-highest">
              <td className="py-3 font-body text-body-md">{t(row.labelKey)}</td>
              {plans.map((plan) => (
                <td key={plan.id} className="py-3 text-center font-ledger">
                  {row.format(plan[row.key])}
                </td>
              ))}
            </tr>
          ))}
          <tr className="border-b border-surface-container-highest">
            <td className="py-3 font-body text-body-md">{t("pricing.rows.buyStories")}</td>
            {plans.map((plan) => (
              <td key={plan.id} className="py-3 text-center">
                {plan.can_buy_stories ? (
                  <Icon name="check" className="text-secondary" />
                ) : (
                  <Icon name="close" className="text-outline-variant" />
                )}
              </td>
            ))}
          </tr>
          <tr>
            <td className="py-3 font-body text-body-md">{t("pricing.rows.telegram")}</td>
            {plans.map((plan) => (
              <td key={plan.id} className="py-3 text-center">
                {plan.telegram_access ? (
                  <Icon name="check" className="text-secondary" />
                ) : (
                  <Icon name="close" className="text-outline-variant" />
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
