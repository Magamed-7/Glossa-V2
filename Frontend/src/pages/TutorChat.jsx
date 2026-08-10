import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "../components/layout/PageHeader.jsx";
import MessageList from "../components/tutor/MessageList.jsx";
import ChatInput from "../components/tutor/ChatInput.jsx";
import ChatSidebar from "../components/tutor/ChatSidebar.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";
import { useAiChatSocket } from "../lib/useAiChatSocket.js";
import { useT } from "../lib/i18n.jsx";

export default function TutorChat() {
  const t = useT();
  const [searchParams] = useSearchParams();
  const scenario = searchParams.get("scenario") || "casual";
  const language = searchParams.get("language") || "English";

  const { status, messages, sessionId, denyReason, sendMessage } = useAiChatSocket({ scenario, language });
  const waitingForReply = messages.length > 0 && messages[messages.length - 1].role === "user";
  const showHistory = status === "open" || status === "reconnecting" || status === "closed";

  return (
    <div>
      <PageHeader
        eyebrow={t("tutor.eyebrow")}
        title={t("tutor.titleLead")}
        accent={t("tutor.titleAccent")}
        subtitle={t("tutor.scenario", { scenario: t(`tutor.scenarios.${scenario}.title`) })}
      />
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        <div className="flex flex-col h-[600px] border-2 border-tertiary">
          {status === "connecting" && (
            <p className="p-6 font-label text-label-md uppercase text-on-surface-variant">{t("tutor.connecting")}</p>
          )}
          {status === "denied" && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <p className="font-body text-body-md text-on-surface-variant max-w-sm">
                {denyReason === "limit_reached" ? t("tutor.limitReachedSoft") : t("tutor.denyReasonDefault")}
              </p>
              <Link to="/pricing">
                <NeoButton variant="ghost">{t("common.viewPlans")}</NeoButton>
              </Link>
            </div>
          )}
          {showHistory && <MessageList messages={messages} typing={status === "open" && waitingForReply} />}
          {status === "reconnecting" && (
            <p className="px-6 py-3 font-label text-label-md uppercase text-on-surface-variant border-t-2 border-tertiary">
              {t("tutor.reconnecting")}
            </p>
          )}
          {status === "closed" && (
            <p className="px-6 py-3 font-label text-label-md uppercase text-error border-t-2 border-tertiary">
              {t("tutor.reconnectFailed")}
            </p>
          )}
          <div className="border-t-2 border-tertiary p-4">
            <ChatInput disabled={status !== "open" || waitingForReply} onSend={sendMessage} />
          </div>
        </div>
        <ChatSidebar messages={messages} scenario={scenario} language={language} sessionId={sessionId} />
      </div>
    </div>
  );
}
