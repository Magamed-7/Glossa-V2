import { useRef, useState } from "react";
import { getIceServers } from "./api/messenger.js";

// Публичный STUN как крайний резерв — реальные ICE-серверы (STUN+TURN) берутся с бэкенда
// (GET /messenger/ice-servers, app/services/turn_credentials.py) прямо перед звонком, каждый
// раз заново: и потому что временные TURN-креды рано или поздно истекают, и потому что так
// смена провайдера (coturn/Cloudflare) на бэкенде не требует правок на фронте.
const FALLBACK_ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

async function resolveIceServers() {
  try {
    const { ice_servers } = await getIceServers();
    return ice_servers && ice_servers.length > 0 ? ice_servers : FALLBACK_ICE_SERVERS;
  } catch (e) {
    return FALLBACK_ICE_SERVERS;
  }
}

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

  async function createPeerConnection(conversationId) {
    const iceServers = await resolveIceServers();
    const pc = new RTCPeerConnection({ iceServers });

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

    const pc = await createPeerConnection(conversationId);
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

    const pc = await createPeerConnection(conversation_id);
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
