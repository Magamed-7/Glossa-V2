import { useNavigate } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader.jsx";
import LockedDossiers from "../components/tutor/LockedDossiers.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import Icon from "../components/ui/Icon.jsx";
import { SCENARIOS } from "../lib/scenarios.js";
import { useApi } from "../lib/useApi.js";
import { getMySubscription } from "../lib/api/subscriptions.js";
import { formatSeconds } from "../lib/format.js";
import { useT } from "../lib/i18n.jsx";

export default function TutorScenarios() {
  const t = useT();
  const navigate = useNavigate();

  // Fetch subscription access details
  const { data: subscription, loading } = useApi(() => getMySubscription(), []);
  const aiSeconds = subscription?.plan.ai_seconds_per_day;
  const hasAccess = aiSeconds === null || (aiSeconds ?? 0) > 0;

  function onSelect(scenario) {
    navigate(`/tutor/chat?scenario=${scenario.code}`);
  }

  if (loading) {
    return (
      <div>
        <PageHeader
          eyebrow={t("tutor.scenariosEyebrow")}
          title={t("tutor.scenariosTitleLead")}
          accent={t("tutor.scenariosTitleAccent")}
        />
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Group scenarios
  // 1: Interview
  const interviewScenario = SCENARIOS.find((s) => s.code === "interview");
  // 2: Casual
  const casualScenario = SCENARIOS.find((s) => s.code === "casual");
  // 3: Restaurant
  const restaurantScenario = SCENARIOS.find((s) => s.code === "restaurant");
  
  // The rest for the bottom grid
  const gridScenarios = SCENARIOS.filter(
    (s) => s.code !== "interview" && s.code !== "casual" && s.code !== "restaurant"
  );

  return (
    <div className="pb-16">
      <PageHeader
        eyebrow={t("tutor.scenariosEyebrow")}
        title={t("tutor.scenariosTitleLead")}
        accent={t("tutor.scenariosTitleAccent")}
        subtitle={
          hasAccess
            ? t("tutor.planGivesYou", {
                seconds: aiSeconds === null ? t("tutor.unlimited") : formatSeconds(aiSeconds),
              })
            : t("tutor.lockedUpsell")
        }
      />

      {hasAccess ? (
        <div className="space-y-12">
          {/* ─── Top section: Asymmetric Layout ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* SCENARIO 01-A (Job Interview) - spans 7/12 cols */}
            {interviewScenario && (
              <div className="lg:col-span-7 flex">
                <button
                  type="button"
                  onClick={() => onSelect(interviewScenario)}
                  className="neo-card w-full flex flex-col text-left hover:-translate-y-1 transition-all overflow-hidden"
                >
                  <div className="relative aspect-[16/9] w-full border-b-2 border-tertiary overflow-hidden">
                    <img
                      src={interviewScenario.image}
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-4 left-4 bg-tertiary text-on-tertiary px-3 py-1 font-label text-[11px] uppercase tracking-widest font-bold border-2 border-tertiary">
                      SCENARIO 01-A
                    </div>
                  </div>
                  <div className="p-6 flex-grow flex flex-col justify-between bg-surface">
                    <div>
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <h3 className="font-headline text-3xl font-bold text-on-surface">
                          {t(`tutor.scenarios.interview.title`)}
                        </h3>
                        <Icon name="work" className="text-secondary text-2xl" />
                      </div>
                      <p className="font-body text-base text-on-surface-variant leading-relaxed mb-6">
                        {t(`tutor.scenarios.interview.description`)}
                      </p>
                    </div>
                    <div className="bg-tertiary text-on-tertiary font-label text-label-md uppercase tracking-widest py-3 px-6 hover:bg-secondary hover:text-on-secondary transition-colors hard-shadow w-fit">
                      {t("tutor.startSession")}
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* SCENARIO 02-B & 03-C (Casual & Restaurant) - spans 5/12 cols */}
            <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
              {/* SCENARIO 02-B */}
              {casualScenario && (
                <button
                  type="button"
                  onClick={() => onSelect(casualScenario)}
                  className="neo-card flex-1 flex flex-col text-left hover:-translate-y-1 transition-all overflow-hidden"
                >
                  <div className="relative aspect-[21/9] w-full border-b-2 border-tertiary overflow-hidden">
                    <img
                      src={casualScenario.image}
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-4 left-4 bg-secondary-container text-on-secondary-container px-3 py-1 font-label text-[10px] uppercase tracking-widest font-bold border-2 border-tertiary">
                      SCN 02-B
                    </div>
                  </div>
                  <div className="p-4 flex-grow bg-surface">
                    <h3 className="font-headline text-xl font-bold text-on-surface mb-1">
                      {t(`tutor.scenarios.casual.title`)}
                    </h3>
                    <p className="font-body text-sm text-on-surface-variant leading-snug">
                      {t(`tutor.scenarios.casual.description`)}
                    </p>
                  </div>
                </button>
              )}

              {/* SCENARIO 03-C */}
              {restaurantScenario && (
                <button
                  type="button"
                  onClick={() => onSelect(restaurantScenario)}
                  className="neo-card flex-1 flex flex-col text-left hover:-translate-y-1 transition-all overflow-hidden"
                >
                  <div className="relative aspect-[21/9] w-full border-b-2 border-tertiary overflow-hidden">
                    <img
                      src={restaurantScenario.image}
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-4 left-4 bg-secondary-container text-on-secondary-container px-3 py-1 font-label text-[10px] uppercase tracking-widest font-bold border-2 border-tertiary">
                      SCN 03-C
                    </div>
                  </div>
                  <div className="p-4 flex-grow bg-surface">
                    <h3 className="font-headline text-xl font-bold text-on-surface mb-1">
                      {t(`tutor.scenarios.restaurant.title`)}
                    </h3>
                    <p className="font-body text-sm text-on-surface-variant leading-snug">
                      {t(`tutor.scenarios.restaurant.description`)}
                    </p>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* ─── Bottom Section: Grid Layout ─── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
            {gridScenarios.map((scenario, idx) => {
              const globalIdx = idx + 3; // Starts after first 3
              const labelLetter = String.fromCharCode(65 + globalIdx);
              const labelText = `SCENARIO 0${globalIdx + 1}-${labelLetter}`;

              return (
                <button
                  key={scenario.code}
                  type="button"
                  onClick={() => onSelect(scenario)}
                  className="neo-card flex flex-col text-left hover:-translate-y-1 transition-all overflow-hidden h-full"
                >
                  {/* Aspect ratio to fit beautiful neo-retro generated images nicely */}
                  <div className="relative aspect-[4/3] w-full border-b-2 border-tertiary overflow-hidden bg-surface-container-low">
                    <img
                      src={scenario.image}
                      alt=""
                      aria-hidden="true"
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  
                  <div className="p-5 flex-grow flex flex-col justify-between bg-surface">
                    <div className="space-y-2">
                      <span className="block font-label text-[11px] uppercase tracking-widest text-on-surface-variant/70">
                        {labelText}
                      </span>
                      <h3 className="font-headline text-2xl font-bold text-on-surface leading-tight">
                        {t(`tutor.scenarios.${scenario.code}.title`)}
                      </h3>
                      <p className="font-body text-sm text-on-surface-variant leading-relaxed">
                        {t(`tutor.scenarios.${scenario.code}.description`)}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-start">
                      <div className="w-8 h-8 rounded-full border-2 border-tertiary flex items-center justify-center text-on-surface group-hover:bg-tertiary group-hover:text-on-tertiary transition-colors">
                        <Icon name="arrow_forward" className="text-lg" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <LockedDossiers />
      )}
    </div>
  );
}
