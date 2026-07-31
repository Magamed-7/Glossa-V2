import { useNavigate } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader.jsx";
import ScenarioCard from "../components/tutor/ScenarioCard.jsx";
import LockedDossiers from "../components/tutor/LockedDossiers.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import { SCENARIOS } from "../lib/scenarios.js";
import { useApi } from "../lib/useApi.js";
import { getMySubscription } from "../lib/api/subscriptions.js";
import { formatSeconds } from "../lib/format.js";
import { useT } from "../lib/i18n.jsx";

export default function TutorScenarios() {
  const t = useT();
  const navigate = useNavigate();
  const featured = SCENARIOS.find((s) => s.featured);
  const rest = SCENARIOS.filter((s) => !s.featured);

  // Проверка доступа делается до входа в чат, а не по коду 4403 после подключения —
  // см. API_CONTRACT.md §3.8 (free=0 секунд, premium=9000, pro=безлимит).
  const { data: subscription, loading } = useApi(() => getMySubscription(), []);
  const aiSeconds = subscription?.plan.ai_seconds_per_day;
  const hasAccess = aiSeconds === null || (aiSeconds ?? 0) > 0;

  function onSelect(scenario) {
    navigate(`/tutor/chat?scenario=${scenario.code}`);
  }

  if (loading) {
    return (
      <div>
        <PageHeader eyebrow={t("tutor.scenariosEyebrow")} title={t("tutor.scenariosTitleLead")} accent={t("tutor.scenariosTitleAccent")} />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow={t("tutor.scenariosEyebrow")}
        title={t("tutor.scenariosTitleLead")}
        accent={t("tutor.scenariosTitleAccent")}
        subtitle={
          hasAccess
            ? t("tutor.planGivesYou", { seconds: aiSeconds === null ? t("tutor.unlimited") : formatSeconds(aiSeconds) })
            : t("tutor.lockedUpsell")
        }
      />
      {hasAccess ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <ScenarioCard scenario={featured} featured onSelect={onSelect} />
          </div>
          <div className="flex flex-col gap-6">
            {rest.map((scenario) => (
              <ScenarioCard key={scenario.code} scenario={scenario} onSelect={onSelect} />
            ))}
          </div>
        </div>
      ) : (
        <LockedDossiers />
      )}
    </div>
  );
}
