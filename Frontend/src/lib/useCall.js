import { useRef, useState } from "react";

// Публичный STUN (бесплатный, Google) — достаточно для большинства прямых соединений.
// TURN-сервер не поднят (платный/self-host вне бюджета) — если оба собеседника за
// "сложным" NAT (двойной NAT, некоторые корпоративные сети), P2P-соединение не установится.
const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

export function useCall({ sendCallSignal }) {
  const [callState, setCallState] = useState("idle");
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isVideo, setIsVideo] = useState(false);
  const pcRef = useRef(null);
  const conversationIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  function createPeerConnection(conversationId) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendCallSignal(conversationId, "ice_candidate", { candidate: event.candidate.toJSON() });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pcRef.current = pc;
    return pc;
  }

  function cleanup() {
    pcRef.current?.close();
    pcRef.current = null;
    localStream?.getTracks().forEach((track) => track.stop());
    setLocalStream(null);
    setRemoteStream(null);
    pendingCandidatesRef.current = [];
  }

  async function startCall(conversationId, { video = false } = {}) {
    conversationIdRef.current = conversationId;
    setIsVideo(video);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
    setLocalStream(stream);

    const pc = createPeerConnection(conversationId);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendCallSignal(conversationId, "call_offer", { sdp: offer, video });

    setCallState("outgoing");
    startTimeRef.current = Date.now();
  }

  function handleIncomingOffer(data) {
    if (callState !== "idle") {
      sendCallSignal(data.conversation_id, "call_end", { status: "busy" });
      return;
    }
    setIncomingOffer(data);
    setIsVideo(!!data.video);
    setCallState("incoming");
  }

  async function acceptCall() {
    if (!incomingOffer) return;
    const { conversation_id, sdp, video } = incomingOffer;
    conversationIdRef.current = conversation_id;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: !!video });
    setLocalStream(stream);

    const pc = createPeerConnection(conversation_id);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    for (const candidate of pendingCandidatesRef.current) {
      await pc.addIceCandidate(candidate).catch(() => {});
    }
    pendingCandidatesRef.current = [];

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    sendCallSignal(conversation_id, "call_answer", { sdp: answer });

    setCallState("active");
    startTimeRef.current = Date.now();
    setIncomingOffer(null);
  }

  function declineCall() {
    if (incomingOffer) {
      sendCallSignal(incomingOffer.conversation_id, "call_end", { status: "declined" });
    }
    setIncomingOffer(null);
    setCallState("idle");
  }

  async function handleAnswer(data) {
    if (!pcRef.current) return;
    await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));
    for (const candidate of pendingCandidatesRef.current) {
      await pcRef.current.addIceCandidate(candidate).catch(() => {});
    }
    pendingCandidatesRef.current = [];
    setCallState("active");
  }

  async function handleIceCandidate(data) {
    if (!pcRef.current || !pcRef.current.remoteDescription) {
      pendingCandidatesRef.current.push(data.candidate);
      return;
    }
    try {
      await pcRef.current.addIceCandidate(data.candidate);
    } catch (e) {
      // ICE candidates that arrive after the connection settles are safe to drop.
    }
  }

  function endCall() {
    const conversationId = conversationIdRef.current;
    const duration = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0;

    if (conversationId) {
      sendCallSignal(conversationId, "call_end", {
        status: callState === "active" ? "answered" : "missed",
        duration_seconds: duration,
      });
    }

    cleanup();
    setCallState("idle");
    conversationIdRef.current = null;
    startTimeRef.current = null;
  }

  function handleRemoteEnd() {
    cleanup();
    setCallState("idle");
    setIncomingOffer(null);
    conversationIdRef.current = null;
    startTimeRef.current = null;
  }

  return {
    callState,
    incomingOffer,
    localStream,
    remoteStream,
    isVideo,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    handleIncomingOffer,
    handleAnswer,
    handleIceCandidate,
    handleRemoteEnd,
  };
}
