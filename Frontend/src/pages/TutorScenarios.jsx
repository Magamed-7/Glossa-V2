import PageHeader from "../components/layout/PageHeader.jsx";

export default function TutorScenarios() {
  return (
    <div>
      <PageHeader
        eyebrow="Live Practice"
        title="The Dialogue"
        accent="Bureau"
        subtitle="Practice real conversation with an AI partner across everyday scenarios."
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{/* Scenario cards go here */}</div>
    </div>
  );
}
