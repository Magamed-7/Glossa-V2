import { useNavigate } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader.jsx";
import ScenarioCard from "../components/tutor/ScenarioCard.jsx";
import { SCENARIOS } from "../lib/scenarios.js";

export default function TutorScenarios() {
  const navigate = useNavigate();
  const featured = SCENARIOS.find((s) => s.featured);
  const rest = SCENARIOS.filter((s) => !s.featured);

  function onSelect(scenario) {
    navigate(`/tutor/chat?scenario=${scenario.code}`);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Live Practice"
        title="The Dialogue"
        accent="Bureau"
        subtitle="Practice real conversation with an AI partner across everyday scenarios."
      />
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
    </div>
  );
}
