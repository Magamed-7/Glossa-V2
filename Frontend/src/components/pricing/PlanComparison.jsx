import Icon from "../ui/Icon.jsx";
import { formatSeconds } from "../../lib/format.js";
import { useT } from "../../lib/i18n.jsx";

const PLAN_COLUMN_CLASS = {
  free: "",
  premium: "bg-secondary-fixed/25",
  pro: "bg-tertiary-fixed/30",
};

const ROW_ICONS = {
  stories_per_day: "auto_stories",
  deck_words_per_day: "translate",
  readyVocab: "collections_bookmark",
  own_stories_per_week: "edit_note",
  generated_stories_per_day: "auto_fix_high",
  ai_seconds_per_day: "smart_toy",
  audioWords: "volume_up",
  transcription: "record_voice_over",
  audiobooks_per_day: "headphones",
  buyStories: "storefront",
  telegram: "send",
};

const NUMERIC_ROWS = [
  { key: "stories_per_day", labelKey: "pricing.rows.storiesPerDay" },
  { key: "deck_words_per_day", labelKey: "pricing.rows.wordsPerDay" },
  { key: "own_stories_per_week", labelKey: "pricing.rows.ownStoriesPerWeek" },
  { key: "audiobooks_per_day", labelKey: "pricing.rows.audiobooksPerDay" },
];

function divider(i, total) {
  return i < total - 1 ? "border-r-2 border-tertiary" : "";
}

function RowLabel({ icon, children }) {
  return (
    <td className="p-6 border-r-2 border-tertiary font-semibold">
      <span className="flex items-center gap-2.5">
        <Icon name={icon} className="text-secondary text-xl shrink-0" />
        {children}
      </span>
    </td>
  );
}

function UnlimitedValue({ t }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-display text-3xl font-bold text-secondary leading-none">∞</span>
      <span className="font-label text-[10px] uppercase tracking-widest text-secondary font-bold mt-1">
        {t("pricing.unlimitedLabel")}
      </span>
    </div>
  );
}

function LockedValue({ t }) {
  return (
    <div className="flex flex-col items-center opacity-50">
      <Icon name="lock" className="text-xl" />
      <span className="font-label text-[10px] uppercase tracking-widest font-bold mt-1">{t("pricing.aiLocked")}</span>
    </div>
  );
}

function NumberValue({ value }) {
  return <span className="font-display text-3xl font-bold text-on-surface">{value}</span>;
}

function BooleanValue({ value }) {
  if (value) {
    return (
      <span className="inline-flex w-9 h-9 rounded-full bg-secondary items-center justify-center">
        <Icon name="check" className="text-on-secondary text-xl" />
      </span>
    );
  }
  return <Icon name="lock" className="text-xl opacity-40" />;
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
                className={`p-6 font-headline text-xl uppercase tracking-widest text-center align-bottom ${divider(i, plans.length)} ${PLAN_COLUMN_CLASS[plan.code] || ""}`}
              >
                {plan.code === "premium" && (
                  <span className="block font-label text-[9px] tracking-widest text-secondary font-bold mb-1">
                    {t("pricing.mostPopular")}
                  </span>
                )}
                {t(`pricing.plans.${plan.code}.name`) || plan.code}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="font-body text-body-md">
          {NUMERIC_ROWS.map((row) => (
            <tr key={row.key} className="border-b border-surface-container-highest">
              <RowLabel icon={ROW_ICONS[row.key]}>{t(row.labelKey)}</RowLabel>
              {plans.map((plan, i) => (
                <td
                  key={plan.id}
                  className={`p-6 text-center ${divider(i, plans.length)} ${PLAN_COLUMN_CLASS[plan.code] || ""}`}
                >
                  {plan[row.key] === null ? <UnlimitedValue t={t} /> : <NumberValue value={plan[row.key]} />}
                </td>
              ))}
            </tr>
          ))}

          <tr className="border-b border-surface-container-highest">
            <RowLabel icon={ROW_ICONS.ai_seconds_per_day}>{t("pricing.rows.aiPerDay")}</RowLabel>
            {plans.map((plan, i) => (
              <td
                key={plan.id}
                className={`p-6 text-center ${divider(i, plans.length)} ${PLAN_COLUMN_CLASS[plan.code] || ""}`}
              >
                {plan.ai_seconds_per_day === 0 ? (
                  <LockedValue t={t} />
                ) : plan.ai_seconds_per_day === null ? (
                  <UnlimitedValue t={t} />
                ) : (
                  <span className="font-display text-2xl font-bold text-secondary">{formatSeconds(plan.ai_seconds_per_day)}</span>
                )}
              </td>
            ))}
          </tr>

          <tr className="border-b border-surface-container-highest">
            <RowLabel icon={ROW_ICONS.generated_stories_per_day}>{t("pricing.rows.generatedStoriesPerDay")}</RowLabel>
            {plans.map((plan, i) => (
              <td
                key={plan.id}
                className={`p-6 text-center ${divider(i, plans.length)} ${PLAN_COLUMN_CLASS[plan.code] || ""}`}
              >
                {plan.generated_stories_per_day === 0 ? (
                  <LockedValue t={t} />
                ) : plan.generated_stories_per_day === null ? (
                  <UnlimitedValue t={t} />
                ) : (
                  <NumberValue value={plan.generated_stories_per_day} />
                )}
              </td>
            ))}
          </tr>

          <tr className="border-b border-surface-container-highest">
            <RowLabel icon={ROW_ICONS.readyVocab}>{t("pricing.rows.readyVocab")}</RowLabel>
            {plans.map((plan, i) => (
              <td
                key={plan.id}
                className={`p-6 text-center ${divider(i, plans.length)} ${PLAN_COLUMN_CLASS[plan.code] || ""}`}
              >
                {plan.code === "free" ? (
                  <span className="font-body text-sm text-on-surface-variant">{t(`pricing.readyVocabByPlan.${plan.code}`)}</span>
                ) : (
                  <span className="font-display text-2xl font-bold text-secondary">{t(`pricing.readyVocabByPlan.${plan.code}`)}</span>
                )}
              </td>
            ))}
          </tr>

          <tr className="border-b border-surface-container-highest">
            <RowLabel icon={ROW_ICONS.audioWords}>{t("pricing.rows.audioWordsPerDay")}</RowLabel>
            {plans.map((plan, i) => (
              <td
                key={plan.id}
                className={`p-6 text-center ${divider(i, plans.length)} ${PLAN_COLUMN_CLASS[plan.code] || ""}`}
              >
                {plan.code === "free" ? (
                  <span className="font-body text-sm text-on-surface-variant">{t(`pricing.audioWordsByPlan.${plan.code}`)}</span>
                ) : (
                  <span className="font-display text-2xl font-bold text-secondary">{t(`pricing.audioWordsByPlan.${plan.code}`)}</span>
                )}
              </td>
            ))}
          </tr>

          <tr className="border-b border-surface-container-highest">
            <RowLabel icon={ROW_ICONS.transcription}>{t("pricing.rows.transcription")}</RowLabel>
            {plans.map((plan, i) => (
              <td
                key={plan.id}
                className={`p-6 text-center ${divider(i, plans.length)} ${PLAN_COLUMN_CLASS[plan.code] || ""}`}
              >
                {plan.code === "free" ? (
                  <span className="font-body text-sm text-on-surface-variant">{t(`pricing.transcriptionByPlan.${plan.code}`)}</span>
                ) : (
                  <span className="font-display text-2xl font-bold text-secondary">{t(`pricing.transcriptionByPlan.${plan.code}`)}</span>
                )}
              </td>
            ))}
          </tr>

          <tr className="border-b border-surface-container-highest">
            <RowLabel icon={ROW_ICONS.buyStories}>{t("pricing.rows.buyStories")}</RowLabel>
            {plans.map((plan, i) => (
              <td
                key={plan.id}
                className={`p-6 text-center ${divider(i, plans.length)} ${PLAN_COLUMN_CLASS[plan.code] || ""}`}
              >
                <BooleanValue value={plan.can_buy_stories} />
              </td>
            ))}
          </tr>

          <tr>
            <RowLabel icon={ROW_ICONS.telegram}>{t("pricing.rows.telegram")}</RowLabel>
            {plans.map((plan, i) => (
              <td
                key={plan.id}
                className={`p-6 text-center ${divider(i, plans.length)} ${PLAN_COLUMN_CLASS[plan.code] || ""}`}
              >
                <BooleanValue value={plan.telegram_access} />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
