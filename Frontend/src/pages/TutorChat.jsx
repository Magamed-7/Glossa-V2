import { useSearchParams } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader.jsx";

export default function TutorChat() {
  const [searchParams] = useSearchParams();
  const scenario = searchParams.get("scenario") || "casual";

  return (
    <div>
      <PageHeader eyebrow="Live Session" title="The Oral" accent="Examiner" subtitle={`Scenario: ${scenario}`} />
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        <div className="flex flex-col h-[600px] border-2 border-tertiary">
          <div className="flex-1 overflow-y-auto p-6">{/* Message list */}</div>
          <div className="border-t-2 border-tertiary p-4">{/* Chat input */}</div>
        </div>
        <div>{/* Sidebar stats */}</div>
      </div>
    </div>
  );
}
