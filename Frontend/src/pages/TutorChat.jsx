import { useSearchParams } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader.jsx";
import MessageList from "../components/tutor/MessageList.jsx";
import { useAiChatSocket } from "../lib/useAiChatSocket.js";

export default function TutorChat() {
  const [searchParams] = useSearchParams();
  const scenario = searchParams.get("scenario") || "casual";
  const language = searchParams.get("language") || "English";

  const { status, messages } = useAiChatSocket({ scenario, language });

  return (
    <div>
      <PageHeader eyebrow="Live Session" title="The Oral" accent="Examiner" subtitle={`Scenario: ${scenario}`} />
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        <div className="flex flex-col h-[600px] border-2 border-tertiary">
          {status === "connecting" && (
            <p className="p-6 font-label text-label-md uppercase text-on-surface-variant">Connecting…</p>
          )}
          {(status === "open" || status === "closed") && <MessageList messages={messages} />}
          <div className="border-t-2 border-tertiary p-4">{/* Chat input */}</div>
        </div>
        <div>{/* Sidebar stats */}</div>
      </div>
    </div>
  );
}
