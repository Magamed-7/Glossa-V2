import Icon from "../ui/Icon.jsx";
import { formatSeconds } from "../../lib/format.js";
import { useT } from "../../lib/i18n.jsx";

const PLAN_COLUMN_CLASS = {
  free: "",
  premium: "bg-secondary-fixed/25",
  pro: "bg-tertiary-fixed/30",
};

function divider(i, total) {
  return i < total - 1 ? "border-r-2 border-tertiary" : "";
}

function UnlimitedValue({ t }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-display text-3xl font-bold text-secondary leading-none">∞</span>
      <span className="font-label text-[10px] uppercase tracking-widest text-secondary font-bold mt-1 text-center">
        {t("pricing.unlimitedLabel")}
      </span>
    </div>
  );
}

function LockedValue({ t }) {
  return (
    <div className="flex flex-col items-center opacity-50">
      <Icon name="lock" className="text-xl" />
      <span className="font-label text-[10px] uppercase tracking-widest font-bold mt-1 text-center">
        {t("pricing.aiLocked")}
      </span>
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

function limitValue(field) {
  return (plan, t) =>
    plan[field] === null ? <UnlimitedValue t={t} /> : <NumberValue value={plan[field]} />;
}

// Ноль здесь значит «в этом тарифе недоступно», а не «ноль штук в день».
function gatedValue(field, render) {
  return (plan, t) => {
    if (plan[field] === 0) return <LockedValue t={t} />;
    if (plan[field] === null) return <UnlimitedValue t={t} />;
    return render(plan, t);
  };
}

function wordedValue(dictKey) {
  return (plan, t) =>
    plan.code === "free" ? (
      <span className="font-body text-sm text-on-surface-variant">{t(`pricing.${dictKey}.${plan.code}`)}</span>
    ) : (
      <span className="font-display text-2xl font-bold text-secondary">{t(`pricing.${dictKey}.${plan.code}`)}</span>
    );
}

// Одно описание строк на две вёрстки: широкая таблица и карточки для телефона.
const ROWS = [
  { key: "stories_per_day", labelKey: "pricing.rows.storiesPerDay", icon: "auto_stories", value: limitValue("stories_per_day") },
  { key: "deck_words_per_day", labelKey: "pricing.rows.wordsPerDay", icon: "translate", value: limitValue("deck_words_per_day") },
  { key: "own_stories_per_week", labelKey: "pricing.rows.ownStoriesPerWeek", icon: "edit_note", value: limitValue("own_stories_per_week") },
  { key: "audiobooks_per_day", labelKey: "pricing.rows.audiobooksPerDay", icon: "headphones", value: limitValue("audiobooks_per_day") },
  {
    key: "ai_seconds_per_day",
    labelKey: "pricing.rows.aiPerDay",
    icon: "smart_toy",
    value: gatedValue("ai_seconds_per_day", (plan) => (
      <span className="font-display text-2xl font-bold text-secondary">{formatSeconds(plan.ai_seconds_per_day)}</span>
    )),
  },
  {
    key: "generated_stories_per_day",
    labelKey: "pricing.rows.generatedStoriesPerDay",
    icon: "auto_fix_high",
    value: gatedValue("generated_stories_per_day", (plan) => <NumberValue value={plan.generated_stories_per_day} />),
  },
  { key: "readyVocab", labelKey: "pricing.rows.readyVocab", icon: "collections_bookmark", value: wordedValue("readyVocabByPlan") },
  { key: "audioWords", labelKey: "pricing.rows.audioWordsPerDay", icon: "volume_up", value: wordedValue("audioWordsByPlan") },
  { key: "transcription", labelKey: "pricing.rows.transcription", icon: "record_voice_over", value: wordedValue("transcriptionByPlan") },
  { key: "buyStories", labelKey: "pricing.rows.buyStories", icon: "storefront", value: (plan) => <BooleanValue value={plan.can_buy_stories} /> },
  { key: "telegram", labelKey: "pricing.rows.telegram", icon: "send", value: (plan) => <BooleanValue value={plan.telegram_access} /> },
];

export default function PlanComparison({ plans }) {
  const t = useT();

  return (
    <>
      {/*
        На телефоне таблица из четырёх колонок не помещается никак: даже ужатая, она
        требует тянуть страницу вбок. Поэтому здесь каждый тариф — отдельная карточка со
        своим списком возможностей, а таблица остаётся широким экранам.
      */}
      <div className="flex flex-col gap-6 md:hidden">
        {plans.map((plan) => (
          <div key={plan.id} className="border-2 border-tertiary bg-surface">
            <div
              className={`flex items-center justify-between gap-3 p-4 border-b-2 border-tertiary ${
                PLAN_COLUMN_CLASS[plan.code] || "bg-surface-container-high"
              }`}
            >
              <span className="font-headline text-xl uppercase tracking-widest min-w-0 break-words">
                {t(`pricing.plans.${plan.code}.name`) || plan.code}
              </span>
              {plan.code === "premium" && (
                <span className="font-label text-[9px] tracking-widest text-secondary font-bold uppercase text-right shrink-0 max-w-[45%] break-words">
                  {t("pricing.mostPopular")}
                </span>
              )}
            </div>

            <dl className="font-body text-body-md">
              {ROWS.map((row) => (
                <div
                  key={row.key}
                  className="flex items-center justify-between gap-3 px-4 py-3 border-b border-surface-container-highest last:border-b-0"
                >
                  <dt className="flex items-center gap-2 min-w-0 flex-1">
                    <Icon name={row.icon} className="text-secondary text-xl shrink-0" />
                    <span className="min-w-0 break-words font-semibold text-sm">{t(row.labelKey)}</span>
                  </dt>
                  <dd className="shrink-0 text-right">{row.value(plan, t)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <div className="hidden md:block border-2 border-tertiary bg-surface overflow-x-auto">
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
            {ROWS.map((row) => (
              <tr key={row.key} className="border-b border-surface-container-highest last:border-b-0">
                <td className="p-6 border-r-2 border-tertiary font-semibold">
                  <span className="flex items-center gap-2.5">
                    <Icon name={row.icon} className="text-secondary text-xl shrink-0" />
                    {t(row.labelKey)}
                  </span>
                </td>
                {plans.map((plan, i) => (
                  <td
                    key={plan.id}
                    className={`p-6 text-center ${divider(i, plans.length)} ${PLAN_COLUMN_CLASS[plan.code] || ""}`}
                  >
                    {row.value(plan, t)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
