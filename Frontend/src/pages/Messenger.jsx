import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import MessageBubble from "../components/messenger/MessageBubble.jsx";
import MessageComposer from "../components/messenger/MessageComposer.jsx";
import CallOverlay from "../components/messenger/CallOverlay.jsx";
import NewConversationModal from "../components/messenger/NewConversationModal.jsx";
import { useApi } from "../lib/useApi.js";
import { useAuth } from "../lib/auth/AuthContext.jsx";
import { useMessengerSocket } from "../lib/useMessengerSocket.js";
import { useCall } from "../lib/useCall.js";
import { useT } from "../lib/i18n.jsx";
import {
  getConversations,
  getMessages,
  markConversationRead,
  startConversation,
} from "../lib/api/messenger.js";

const TYPING_TIMEOUT_MS = 3000;

export default function Messenger() {
  const t = useT();
  const navigate = useNavigate();
  const { conversationId: conversationIdParam } = useParams();
  const conversationId = conversationIdParam ? Number(conversationIdParam) : null;
  const { user } = useAuth();

  const { data: conversations, reload: reloadConversations } = useApi(() => getConversations(), []);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [typingUntil, setTypingUntil] = useState(0);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const messagesEndRef = useRef(null);
  const conversationIdRef = useRef(conversationId);
  conversationIdRef.current = conversationId;

  const activeConversation = conversations?.find((c) => c.id === conversationId) || null;

  function handleSocketEvent(data) {
    if (data.type === "new_message") {
      if (data.message.conversation_id === conversationIdRef.current) {
        setMessages((current) => [...current, data.message]);
        markConversationRead(data.message.conversation_id).catch(() => {});
      }
      reloadConversations();
    } else if (data.type === "typing") {
      if (data.conversation_id === conversationIdRef.current) {
        setTypingUntil(Date.now() + TYPING_TIMEOUT_MS);
      }
    } else if (data.type === "call_offer") {
      call.handleIncomingOffer(data);
    } else if (data.type === "call_answer") {
      call.handleAnswer(data);
    } else if (data.type === "ice_candidate") {
      call.handleIceCandidate(data);
    } else if (data.type === "call_end") {
      call.handleRemoteEnd();
      reloadConversations();
    }
  }

  const socket = useMessengerSocket(handleSocketEvent);
  const call = useCall({ sendCallSignal: socket.sendCallSignal });

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    setMessagesLoading(true);
    getMessages(conversationId)
      .then((data) => {
        if (!cancelled) setMessages(data);
      })
      .finally(() => {
        if (!cancelled) setMessagesLoading(false);
      });

    markConversationRead(conversationId).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSendText(text) {
    if (!conversationId) return;
    socket.sendMessage(conversationId, { messageType: "text", text });
  }

  function handleSendAttachment(payload) {
    if (!conversationId) return;
    socket.sendMessage(conversationId, payload);
  }

  function handleTyping() {
    if (!conversationId) return;
    socket.sendTyping(conversationId);
  }

  async function handlePickFriend(userId) {
    const conversation = await startConversation(userId);
    setShowNewConversation(false);
    reloadConversations();
    navigate(`/messenger/${conversation.id}`);
  }

  const isTyping = typingUntil > Date.now();

  useEffect(() => {
    if (!isTyping) return undefined;
    const timeout = setTimeout(() => setTypingUntil(0), typingUntil - Date.now());
    return () => clearTimeout(timeout);
  }, [isTyping, typingUntil]);

  return (
    /*
      На телефоне список и переписка не делят экран пополам — виден кто-то один: пока
      разговор не выбран, это список, а как выбрали, список уступает место переписке и
      возвращается по кнопке «назад».
    */
    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] border-2 border-tertiary bg-surface h-[calc(100dvh-13rem)] md:h-[calc(100vh-180px)] min-h-[420px] md:min-h-[500px]">
      <aside
        className={`border-r-2 border-tertiary flex-col min-h-0 ${conversationId ? "hidden md:flex" : "flex"}`}
      >
        <div className="flex items-center justify-between p-4 border-b-2 border-tertiary shrink-0">
          <h2 className="font-headline text-headline-md">{t("messenger.title")}</h2>
          <button
            type="button"
            onClick={() => setShowNewConversation(true)}
            className="flex items-center justify-center w-9 h-9 border-2 border-tertiary hover:bg-surface-container transition-colors"
            aria-label={t("messenger.newConversation")}
          >
            <Icon name="add" />
          </button>
        </div>

        <div className="neo-scroll flex-1 overflow-y-auto">
          {!conversations ? (
            <div className="p-4 flex flex-col gap-3">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon="chat_bubble"
                title={t("messenger.noConversations")}
                description={t("messenger.startOne")}
              />
            </div>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => navigate(`/messenger/${conversation.id}`)}
                className={`w-full flex items-center gap-3 p-4 border-b border-tertiary/30 hover:bg-surface-container transition-colors text-left ${
                  conversation.id === conversationId ? "bg-surface-container" : ""
                }`}
              >
                <Avatar
                  photoUrl={conversation.other_user?.photo_url}
                  name={conversation.other_user?.username}
                  userId={conversation.other_user?.id}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-body text-body-md font-bold truncate">
                      {conversation.other_user?.username || t("messenger.someone")}
                    </span>
                    {conversation.unread_count > 0 && (
                      <span className="shrink-0 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-secondary text-on-secondary font-label text-[10px] font-bold">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="font-body text-body-md text-on-surface-variant truncate">
                    {conversation.last_message
                      ? conversation.last_message.type === "text"
                        ? conversation.last_message.text
                        : `[${t(`messenger.messageType.${conversation.last_message.type}`)}]`
                      : t("messenger.noMessagesYet")}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className={`flex-col min-h-0 ${conversationId ? "flex" : "hidden md:flex"}`}>
        {!activeConversation ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <EmptyState icon="forum" title={t("messenger.pickConversation")} description={t("messenger.pickConversationDesc")} />
          </div>
        ) : (
          <>
            <header className="flex items-center justify-between gap-3 p-3 md:p-4 border-b-2 border-tertiary shrink-0">
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => navigate("/messenger")}
                  aria-label={t("common.goBack")}
                  className="md:hidden flex items-center justify-center w-10 h-10 border-2 border-tertiary shrink-0"
                >
                  <Icon name="arrow_back" className="text-tertiary" />
                </button>
                <Avatar
                  photoUrl={activeConversation.other_user?.photo_url}
                  name={activeConversation.other_user?.username}
                  userId={activeConversation.other_user?.id}
                  size="md"
                />
                <div className="min-w-0">
                  <h3 className="font-body text-body-md font-bold truncate">
                    {activeConversation.other_user?.username || t("messenger.someone")}
                  </h3>
                  {isTyping && (
                    <p className="font-label text-[10px] uppercase tracking-widest text-secondary">
                      {t("messenger.typing")}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => call.startCall(conversationId, { video: false })}
                  disabled={call.callState !== "idle"}
                  className="flex items-center justify-center w-10 h-10 border-2 border-tertiary hover:bg-surface-container transition-colors disabled:opacity-40"
                  aria-label={t("messenger.call.voiceCall")}
                >
                  <Icon name="call" className="text-tertiary" />
                </button>
                <button
                  type="button"
                  onClick={() => call.startCall(conversationId, { video: true })}
                  disabled={call.callState !== "idle"}
                  className="flex items-center justify-center w-10 h-10 border-2 border-tertiary hover:bg-surface-container transition-colors disabled:opacity-40"
                  aria-label={t("messenger.call.videoCall")}
                >
                  <Icon name="videocam" className="text-tertiary" />
                </button>
              </div>
            </header>

            <div className="neo-scroll flex-1 overflow-y-auto p-4">
              {messagesLoading ? (
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-10 w-2/3" />
                  <Skeleton className="h-10 w-1/2 ml-auto" />
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} isMine={message.sender_id === user?.id} />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <MessageComposer
              conversationId={conversationId}
              onSendText={handleSendText}
              onSendAttachment={handleSendAttachment}
              onTyping={handleTyping}
            />
          </>
        )}
      </section>

      <CallOverlay call={call} otherUser={activeConversation?.other_user} />

      <NewConversationModal
        open={showNewConversation}
        onClose={() => setShowNewConversation(false)}
        onPick={handlePickFriend}
      />
    </div>
  );
}
