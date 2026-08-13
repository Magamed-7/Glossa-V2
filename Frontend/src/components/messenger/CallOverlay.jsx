import { useEffect, useRef } from "react";
import Icon from "../ui/Icon.jsx";
import Avatar from "../ui/Avatar.jsx";
import { useT } from "../../lib/i18n.jsx";

export default function CallOverlay({ call, otherUser }) {
  const t = useT();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = call.localStream || null;
  }, [call.localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = call.remoteStream || null;
  }, [call.remoteStream]);

  if (call.callState === "idle") return null;

  const isIncoming = call.callState === "incoming";
  const isRinging = call.callState === "outgoing";

  return (
    <div className="fixed inset-0 z-[60] bg-tertiary/70 flex items-center justify-center p-margin-mobile">
      <div className="neo-card hard-shadow-lg w-full max-w-md flex flex-col items-center gap-6 p-8 relative overflow-hidden">
        {call.isVideo && call.callState === "active" ? (
          <div className="relative w-full aspect-video bg-tertiary border-2 border-on-surface overflow-hidden">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute bottom-2 right-2 w-24 h-16 object-cover border-2 border-on-surface"
            />
          </div>
        ) : (
          <Avatar photoUrl={otherUser?.photo_url} name={otherUser?.username} size="xl" />
        )}

        <div className="text-center">
          <h3 className="font-headline text-headline-md">{otherUser?.username || t("messenger.someone")}</h3>
          <p className="font-label text-label-md uppercase tracking-widest text-on-surface-variant mt-1">
            {isIncoming && t("messenger.call.incoming")}
            {isRinging && t("messenger.call.ringing")}
            {call.callState === "active" && t("messenger.call.active")}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {isIncoming ? (
            <>
              <button
                type="button"
                onClick={call.declineCall}
                className="flex items-center justify-center w-16 h-16 rounded-full bg-error text-on-error border-2 border-on-surface shadow-[3px_3px_0_0_#000] hover:-translate-y-0.5 transition-transform"
                aria-label={t("messenger.call.decline")}
              >
                <Icon name="call_end" className="text-2xl" />
              </button>
              <button
                type="button"
                onClick={call.acceptCall}
                className="flex items-center justify-center w-16 h-16 rounded-full bg-secondary text-on-secondary border-2 border-on-surface shadow-[3px_3px_0_0_#000] hover:-translate-y-0.5 transition-transform"
                aria-label={t("messenger.call.accept")}
              >
                <Icon name="call" className="text-2xl" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={call.endCall}
              className="flex items-center justify-center w-16 h-16 rounded-full bg-error text-on-error border-2 border-on-surface shadow-[3px_3px_0_0_#000] hover:-translate-y-0.5 transition-transform"
              aria-label={t("messenger.call.end")}
            >
              <Icon name="call_end" className="text-2xl" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
