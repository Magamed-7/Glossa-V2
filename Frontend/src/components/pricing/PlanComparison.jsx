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

function divider(i, total) {
  return i < total - 1 ? "border-r-2 border-tertiary" : "";
}

export default function PlanComparison({ plans }) {
  const t = useT();
  return (
    <div className="border-2 border-tertiary bg-surface overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-tertiary bg-surface-container-high">
            <th scope="col" className="p-6 font-label text-label-md uppercase tracking-widest border-r-2 border-tertiary">
              {t("pricing.feature")}
            </th>
            {plans.map((plan, i) => (
              <th
                key={plan.id}
                scope="col"
                className={`p-6 font-label text-label-md uppercase tracking-widest text-center ${divider(i, plans.length)}`}
              >
                {t(`pricing.plans.${plan.code}.name`) || plan.code}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="font-body text-body-md">
          {ROW_KEYS.map((row) => (
            <tr key={row.key} className="border-b border-surface-container-highest">
              <td className="p-6 border-r-2 border-tertiary font-semibold">{t(row.labelKey)}</td>
              {plans.map((plan, i) => (
                <td key={plan.id} className={`p-6 text-center font-ledger ${divider(i, plans.length)}`}>
                  {row.key === "ai_seconds_per_day" && plan[row.key] === 0
                    ? t("pricing.aiLocked")
                    : row.format(plan[row.key])}
                </td>
              ))}
            </tr>
          ))}
          <tr className="border-b border-surface-container-highest">
            <td className="p-6 border-r-2 border-tertiary font-semibold">{t("pricing.rows.readyVocab")}</td>
            {plans.map((plan, i) => (
              <td key={plan.id} className={`p-6 text-center font-ledger ${divider(i, plans.length)}`}>
                {t(`pricing.readyVocabByPlan.${plan.code}`) || "—"}
              </td>
            ))}
          </tr>
          <tr className="border-b border-surface-container-highest">
            <td className="p-6 border-r-2 border-tertiary font-semibold">{t("pricing.rows.buyStories")}</td>
            {plans.map((plan, i) => (
              <td key={plan.id} className={`p-6 text-center ${divider(i, plans.length)}`}>
                {plan.can_buy_stories ? (
                  <Icon name="check" className="text-secondary" />
                ) : (
                  <Icon name="close" className="text-outline-variant" />
                )}
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-6 border-r-2 border-tertiary font-semibold">{t("pricing.rows.telegram")}</td>
            {plans.map((plan, i) => (
              <td key={plan.id} className={`p-6 text-center ${divider(i, plans.length)}`}>
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
