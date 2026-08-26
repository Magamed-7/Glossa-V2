import { useCallback, useEffect, useRef, useState } from "react";
import { WS_URL } from "./config.js";
import { getAccessToken } from "./auth/tokens.js";
import { refreshAccessToken } from "./api/client.js";

// Менеджер голосового звонка: один автомат вместо десятка эффектов.
//
// Раньше состояние разговора было размазано по TutorChat: микрофон, воспроизведение,
// «сторож» на случай пропавшего звука и флаг isProcessing жили в разных эффектах и
// чинили друг друга. Здесь ход — это явные состояния и один владелец у каждого.
//
// Звук приходит по сокету кусками (по предложению) и играется через Web Audio: буферы
// ставятся встык на таймлайне, поэтому между предложениями нет щелчков, а на перебивании
// всё обрывается мгновенно.

// Сколько молчать после последнего изменения распознанного текста, прежде чем считать
// фразу законченной и не ждать вердикта браузера. Web Speech отдаёт isFinal только
// через 1–1.5 секунды тишины — это самая заметная пауза во всём разговоре.
const STABLE_SILENCE_MS = 420;
// Совсем короткие обрывки («а», «мм») не отправляем — это обычно шум.
const MIN_WORDS_TO_SEND = 1;

// Первые полсекунды звучания наставника микрофон почти всегда слышит сам себя из
// динамика, поэтому перебивание в этом окне не засчитываем.
const BARGE_IN_GUARD_MS = 600;
// Перебиванием считается только осмысленная реплика, а не одно слово-эхо.
const BARGE_IN_MIN_WORDS = 2;
// Доля слов, совпавших с тем, что наставник произносит прямо сейчас. Выше порога —
// это эхо из динамика, а не ученик.
const ECHO_OVERLAP = 0.5;

const WATCHDOG_MS = 12000;

const words = (text) => String(text || "").toLowerCase().match(/[\p{L}\p{N}']+/gu) || [];

function looksLikeEcho(heard, spoken) {
  const heardWords = words(heard);
  if (!heardWords.length) return true;

  const spokenWords = new Set(words(spoken));
  if (!spokenWords.size) return false;

  const matched = heardWords.filter((word) => spokenWords.has(word)).length;
  return matched / heardWords.length >= ECHO_OVERLAP;
}

export function useVoiceCall({ scenario, language, nativeLanguage, tutor, langCode, sessionId }) {
  // idle → listening → thinking → speaking → listening …
  const [phase, setPhase] = useState("idle");
  const [status, setStatus] = useState("closed");
  const [subtitle, setSubtitle] = useState(null); // { text, isUser }
  const [timings, setTimings] = useState(null);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState(null);

  const socketRef = useRef(null);
  const activeRef = useRef(false);
  const mutedRef = useRef(false);
  const phaseRef = useRef("idle");
  const turnRef = useRef(0);
  const sentTextRef = useRef("");
  const pendingMetaRef = useRef(null);
  const recognitionRef = useRef(null);
  const stableTimerRef = useRef(null);
  const watchdogRef = useRef(null);
  const interimRef = useRef("");

  // Воспроизведение
  const audioCtxRef = useRef(null);
  const playHeadRef = useRef(0);
  const sourcesRef = useRef([]);
  const speakingSinceRef = useRef(0);
  const spokenNowRef = useRef("");
  const replyRef = useRef("");

  const setPhaseBoth = useCallback((value) => {
    phaseRef.current = value;
    setPhase(value);
  }, []);

  const armWatchdog = useCallback(() => {
    clearTimeout(watchdogRef.current);
    watchdogRef.current = setTimeout(() => {
      // Ход завис (упала озвучка, потерялся кадр) — возвращаем микрофон, а не
      // оставляем ученика перед немым экраном.
      if (activeRef.current && phaseRef.current !== "listening") {
        setPhaseBoth("listening");
      }
    }, WATCHDOG_MS);
  }, [setPhaseBoth]);

  const stopPlayback = useCallback(() => {
    sourcesRef.current.forEach((source) => {
      try {
        source.onended = null;
        source.stop();
      } catch (e) {
        // источник мог уже отыграть
      }
    });
    sourcesRef.current = [];
    playHeadRef.current = 0;
  }, []);

  const enqueueAudio = useCallback(
    async (bytes, meta) => {
      if (!activeRef.current) return;

      let context = audioCtxRef.current;
      if (!context) {
        context = new (window.AudioContext || window.webkitAudioContext)();
        audioCtxRef.current = context;
      }
      if (context.state === "suspended") {
        await context.resume().catch(() => {});
      }

      let buffer;
      try {
        buffer = await context.decodeAudioData(bytes.slice(0));
      } catch (err) {
        console.warn("Не удалось разобрать кусок озвучки:", err);
        return;
      }

      if (!activeRef.current) return;

      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);

      const now = context.currentTime;
      const startAt = Math.max(now, playHeadRef.current || now);
      source.start(startAt);
      playHeadRef.current = startAt + buffer.duration;

      if (phaseRef.current !== "speaking") {
        setPhaseBoth("speaking");
        speakingSinceRef.current = Date.now();
      }
      if (meta?.text) {
        spokenNowRef.current = meta.text;
      }

      sourcesRef.current.push(source);
      source.onended = () => {
        sourcesRef.current = sourcesRef.current.filter((item) => item !== source);
        // Очередь опустела и модель закончила — можно снова слушать.
        if (activeRef.current && sourcesRef.current.length === 0 && phaseRef.current === "speaking") {
          playHeadRef.current = 0;
          spokenNowRef.current = "";
          setPhaseBoth("listening");
        }
      };
      armWatchdog();
    },
    [armWatchdog, setPhaseBoth],
  );

  const send = useCallback((payload) => {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  const sayTurn = useCallback(
    (text) => {
      const trimmed = String(text || "").trim();
      if (!trimmed || trimmed === sentTextRef.current) return;

      sentTextRef.current = trimmed;
      turnRef.current += 1;
      stopPlayback();
      replyRef.current = "";
      setSubtitle({ text: trimmed, isUser: true });
      setPhaseBoth("thinking");
      armWatchdog();
      send({ type: "say", text: trimmed, turn: turnRef.current });
    },
    [armWatchdog, send, setPhaseBoth, stopPlayback],
  );

  const interrupt = useCallback(() => {
    if (!activeRef.current) return;
    stopPlayback();
    spokenNowRef.current = "";
    send({ type: "cancel", turn: turnRef.current });
    setPhaseBoth("listening");
  }, [send, setPhaseBoth, stopPlayback]);

  // ---- распознавание речи ----

  const stopRecognition = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    try {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
    } catch (e) {
      // ignore
    }
    recognitionRef.current = null;
  }, []);

  const handleTranscript = useCallback(
    (text, isFinal) => {
      if (!activeRef.current || mutedRef.current) return;

      const trimmed = text.trim();
      if (!trimmed) return;

      // Наставник ещё говорит: либо это его же голос из динамика, либо ученик решил
      // перебить. Разбираемся до того, как что-то отправлять.
      if (phaseRef.current === "speaking") {
        const sinceStart = Date.now() - speakingSinceRef.current;
        const enough = words(trimmed).length >= BARGE_IN_MIN_WORDS;
        if (sinceStart < BARGE_IN_GUARD_MS || !enough || looksLikeEcho(trimmed, spokenNowRef.current)) {
          return;
        }
        interrupt();
      }

      interimRef.current = trimmed;
      clearTimeout(stableTimerRef.current);

      if (isFinal) {
        sayTurn(trimmed);
        return;
      }

      if (words(trimmed).length < MIN_WORDS_TO_SEND) return;

      // Не ждём вердикта браузера: если текст перестал меняться, фраза закончена.
      stableTimerRef.current = setTimeout(() => {
        if (interimRef.current === trimmed) sayTurn(trimmed);
      }, STABLE_SILENCE_MS);
    },
    [interrupt, sayTurn],
  );

  useEffect(() => {
    if (phase === "idle" || muted) {
      stopRecognition();
      return undefined;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("no_speech_recognition");
      return undefined;
    }

    stopRecognition();

    const recognition = new SpeechRecognition();
    // Микрофон не глохнет, пока говорит наставник: без этого перебить его нельзя,
    // а каждый ход начинался с перезапуска распознавания и терял первое слово.
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = langCode;
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        handleTranscript(result[0]?.transcript || "", result.isFinal);
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.warn("Распознавание речи:", event.error);
      }
    };

    recognition.onend = () => {
      // Браузер закрывает поток сам по себе — поднимаем обратно, пока звонок идёт.
      if (activeRef.current && !mutedRef.current) {
        try {
          recognition.start();
        } catch (e) {
          // уже запущено
        }
      }
    };

    try {
      recognition.start();
    } catch (e) {
      // уже запущено
    }

    return () => stopRecognition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase === "idle", muted, langCode, handleTranscript]);

  // ---- сокет ----

  const openSocket = useCallback(
    async (retryOnAuth = true) => {
      let token = getAccessToken();
      if (!token) {
        token = await refreshAccessToken().catch(() => null);
        if (!token) {
          setStatus("denied");
          return;
        }
      }

      const params = new URLSearchParams({
        token,
        scenario,
        language,
        tutor: tutor || "rose",
      });
      if (nativeLanguage) params.set("native_language", nativeLanguage);
      // Звонок продолжает тот же разговор, что открыт в чате, — иначе история
      // распадётся на две ветки одной беседы.
      if (sessionId) params.set("session_id", String(sessionId));

      const socket = new WebSocket(`${WS_URL}/ws/ai/call?${params.toString()}`);
      socket.binaryType = "arraybuffer";
      socketRef.current = socket;
      setStatus("connecting");

      socket.onopen = () => setStatus("open");

      socket.onmessage = async (event) => {
        if (event.data instanceof ArrayBuffer) {
          const meta = pendingMetaRef.current;
          pendingMetaRef.current = null;
          await enqueueAudio(event.data, meta);
          return;
        }

        let frame;
        try {
          frame = JSON.parse(event.data);
        } catch (e) {
          return;
        }

        // Кадры отменённого хода игнорируем: ученик уже говорит новое.
        if (frame.turn !== undefined && frame.turn !== turnRef.current) return;

        switch (frame.type) {
          case "call_ready":
            setPhaseBoth("listening");
            break;
          case "text":
            replyRef.current += frame.delta || "";
            setSubtitle({ text: replyRef.current, isUser: false });
            armWatchdog();
            break;
          case "audio_meta":
            pendingMetaRef.current = frame;
            break;
          case "turn_done":
            setTimings(frame.timings || null);
            setSubtitle({ text: frame.reply, isUser: false });
            // Защита от повтора нужна только внутри одной фразы: спекулятивная отправка
            // и финальный вердикт браузера приходят одним и тем же текстом. Ход закрыт —
            // снимаем её, иначе второе «да» за разговор просто потеряется.
            sentTextRef.current = "";
            // Если озвучка не пришла вовсе, здесь и вернём микрофон.
            if (sourcesRef.current.length === 0) setPhaseBoth("listening");
            break;
          case "cancelled":
            break;
          case "assistant_error":
            setError(frame.code || "AI_TEMPORARILY_UNAVAILABLE");
            setPhaseBoth("listening");
            break;
          default:
            break;
        }
      };

      socket.onclose = async (event) => {
        socketRef.current = null;
        if (!activeRef.current) {
          setStatus("closed");
          return;
        }
        if (event.code === 4401 && retryOnAuth) {
          const fresh = await refreshAccessToken().catch(() => null);
          if (fresh) {
            openSocket(false);
            return;
          }
        }
        setStatus(event.code === 4403 ? "denied" : "closed");
        setPhaseBoth("idle");
      };
    },
    [armWatchdog, enqueueAudio, language, nativeLanguage, scenario, sessionId, setPhaseBoth, tutor],
  );

  // Приветствие наставника синтезируется обычным запросом, а не приходит по сокету.
  // Пропускаем его через ту же очередь воспроизведения: иначе микрофон услышит его из
  // динамика, не найдёт совпадения с «тем, что наставник говорит сейчас», и отправит
  // приветствие обратно как реплику ученика.
  const speakLocal = useCallback(
    async (text, audioUrl) => {
      if (!audioUrl) return;
      setSubtitle({ text, isUser: false });
      try {
        const response = await fetch(audioUrl);
        const bytes = await response.arrayBuffer();
        await enqueueAudio(bytes, { text });
      } catch (err) {
        console.warn("Не удалось проиграть приветствие:", err);
        if (activeRef.current) setPhaseBoth("listening");
      }
    },
    [enqueueAudio, setPhaseBoth],
  );

  const start = useCallback(async () => {
    if (activeRef.current) return;
    activeRef.current = true;
    setError(null);
    setTimings(null);
    setSubtitle(null);
    sentTextRef.current = "";
    interimRef.current = "";
    turnRef.current = 0;
    replyRef.current = "";
    setPhaseBoth("listening");

    // Контекст создаём внутри жеста пользователя, иначе браузер не даст ему звучать.
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    await audioCtxRef.current.resume().catch(() => {});

    await openSocket();
  }, [openSocket, setPhaseBoth]);

  const stop = useCallback(() => {
    activeRef.current = false;
    clearTimeout(stableTimerRef.current);
    clearTimeout(watchdogRef.current);
    stopPlayback();
    stopRecognition();
    setPhaseBoth("idle");
    setSubtitle(null);
    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch (e) {
        // ignore
      }
      socketRef.current = null;
    }
  }, [setPhaseBoth, stopPlayback, stopRecognition]);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => stop, [stop]);

  return {
    phase,
    status,
    subtitle,
    timings,
    error,
    muted,
    setMuted,
    start,
    stop,
    interrupt,
    speak: sayTurn,
    speakLocal,
  };
}
