import { Link } from "react-router-dom";
import NeoCard from "../ui/NeoCard.jsx";
import Icon from "../ui/Icon.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import { useApi } from "../../lib/useApi.js";
import { useI18n } from "../../lib/i18n.jsx";
import { getOnboardingStatus, getTodayQueue } from "../../lib/api/learning.js";

const ATOM_ICON = {
  review: "bolt",
  vocabulary: "library_books",
  grammar: "menu_book",
  story: "auto_stories",
  next_unit_preview: "flag",
};

function atomHref(item) {
  if (item.kind === "review") return "/deck";
  return `/roadmap/units/${item.course_unit_id}`;
}

const T = {
  en: {
    title: "Today",
    setPace: "Set your pace to get a daily plan",
    heavy: "Heavy review day — focus there first, new material can wait.",
    minutes: (used, budget) => `${used}/${budget} min planned`,
    empty: "Nothing queued — open the roadmap to pick a unit.",
    open: "Open roadmap",
    dueCards: (n) => `${n} cards due`,
  },
  ru: {
    title: "Сегодня",
    setPace: "Задай темп, чтобы получить план на день",
    heavy: "Сегодня много повторений — сначала они, новое подождёт.",
    minutes: (used, budget) => `${used}/${budget} мин запланировано`,
    empty: "Пока пусто — открой роадмап и выбери юнит.",
    open: "Открыть роадмап",
    dueCards: (n) => `${n} карточек к повтору`,
  },
  tg: {
    title: "Имрӯз",
    setPace: "Суръатро танзим кунед, то нақшаи рӯзона гиред",
    heavy: "Имрӯз такрори зиёд — аввал онҳо, нав интизор шавад.",
    minutes: (used, budget) => `${used}/${budget} дақ ба нақша гирифта шуд`,
    empty: "Ҳоло холист — нақшаи роҳро кушоед ва воҳид интихоб кунед.",
    open: "Кушодани нақшаи роҳ",
    dueCards: (n) => `${n} корт барои такрор`,
  },
};

export default function TodayQueueCard() {
  const { lang } = useI18n();
  const t = T[lang] || T.en;

  const { data: onboarding, loading: onboardingLoading } = useApi(() => getOnboardingStatus(), []);
  const onboarded = onboarding?.onboarded;

  const { data: today, loading: todayLoading } = useApi(
    () => (onboarded ? getTodayQueue() : Promise.resolve(null)),
    [onboarded]
  );

  if (onboardingLoading) {
    return (
      <div className="col-span-12">
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!onboarded) {
    return (
      <div className="col-span-12">
        <NeoCard className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Icon name="route" className="text-secondary text-2xl" />
            <p className="font-body text-body-md">{t.setPace}</p>
          </div>
          <Link to="/roadmap" className="btn-primary-neo px-5 py-2.5 font-label-md text-xs uppercase tracking-wider">
            {t.open}
          </Link>
        </NeoCard>
      </div>
    );
  }

  return (
    <div className="col-span-12">
      <NeoCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline text-headline-md leading-none">{t.title}</h3>
          {today && (
            <span className="font-label text-label-md uppercase opacity-60">
              {t.minutes(today.used_minutes, today.budget_minutes)}
            </span>
          )}
        </div>

        {todayLoading ? (
          <Skeleton className="h-24" />
        ) : !today || today.queue.length === 0 ? (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="font-body text-body-md opacity-70">{t.empty}</p>
            <Link to="/roadmap" className="btn-outline-neo px-4 py-2 font-label-md text-xs uppercase tracking-wider">
              {t.open}
            </Link>
          </div>
        ) : (
          <>
            {today.heavy_review_day && (
              <p className="font-body text-body-md text-secondary mb-3">{t.heavy}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {today.queue.map((item, i) => (
                <Link
                  key={i}
                  to={atomHref(item)}
                  className="border-2 border-on-surface p-4 flex flex-col gap-1 hover:bg-surface-container transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Icon name={ATOM_ICON[item.kind] || "check_circle"} className="text-secondary" />
                    <span className="font-label text-[10px] uppercase tracking-widest font-bold opacity-60">
                      {item.estimated_minutes} min
                    </span>
                  </div>
                  <p className="font-body text-sm font-bold line-clamp-1">
                    {item.kind === "review" ? t.dueCards(item.due_card_count) : item.theme_title}
                  </p>
                  {item.unit_code && (
                    <p className="font-label text-[10px] uppercase tracking-widest opacity-50">{item.unit_code}</p>
                  )}
                </Link>
              ))}
            </div>
          </>
        )}
      </NeoCard>
    </div>
  );
}
