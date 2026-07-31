import { useNavigate } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader.jsx";
import ScenarioCard from "../components/tutor/ScenarioCard.jsx";
import LockedDossiers from "../components/tutor/LockedDossiers.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import { SCENARIOS } from "../lib/scenarios.js";
import { useApi } from "../lib/useApi.js";
import { getMySubscription } from "../lib/api/subscriptions.js";
import { formatSeconds } from "../lib/format.js";

export default function TutorScenarios() {
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
        <PageHeader eyebrow="Live Practice" title="The Dialogue" accent="Bureau" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Live Practice"
        title="The Dialogue"
        accent="Bureau"
        subtitle={
          hasAccess
            ? `Your plan gives you ${aiSeconds === null ? "unlimited" : formatSeconds(aiSeconds)} of AI conversation per day.`
            : "Practice real conversation with an AI partner — upgrade your plan to unlock it."
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
