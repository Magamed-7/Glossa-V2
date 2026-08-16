import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import MessageList from "../components/tutor/MessageList.jsx";
import ChatInput from "../components/tutor/ChatInput.jsx";
import { useAiChatSocket } from "../lib/useAiChatSocket.js";
import { useT } from "../lib/i18n.jsx";
import { useTheme } from "../lib/theme.jsx";

const PRESETS = {
  rose: {
    id: "rose",
    name: "Anya (Аня)",
    accent: "oklch(0.7 0.2 330)",
    bodyBgLight: "#fdf6f7",
    bodyBgDark: "#0c0b0e",
    accentHexLight: "#ec4899",
    accentHexDark: "#f472b6",
    gradientStyleLight: "linear-gradient(135deg, #ff007f 0%, #da70d6 100%)",
    gradientStyleDark: "linear-gradient(135deg, #8a1352 0%, #6e1c6b 100%)",
    bubbleBgLight: "linear-gradient(135deg, rgba(255, 0, 127, 0.08) 0%, rgba(218, 112, 214, 0.08) 100%)",
    bubbleBgDark: "linear-gradient(135deg, rgba(138, 19, 82, 0.25) 0%, rgba(110, 28, 107, 0.25) 100%)",
    orbBg: "conic-gradient(from 0deg, oklch(0.7 0.2 330), oklch(0.68 0.22 300), oklch(0.7 0.2 330))",
    coreBg: "radial-gradient(circle at 35% 30%, oklch(0.92 0.05 300), oklch(0.72 0.19 320) 45%, oklch(0.55 0.2 280) 100%)",
    absorbColors: ["oklch(0.76 0.22 330)", "oklch(0.72 0.2 300)", "oklch(0.74 0.18 260)", "oklch(0.8 0.16 210)"],
    burstColors: ["#ff007f", "#8a2be2", "#ff1493", "#da70d6", "#ff4500", "#9370db"],
    accentText: "Русский акцент (Soft & Friendly A1-A2)",
    welcomeTemplates: {
      interview: "Hello! Welcome to your job interview simulation. I am Anya, your interviewer. Let's start with a simple question: Can you tell me a little bit about yourself and your work experience?",
      casual: "Hello my friend! I am Anya. I speak with a friendly Russian tempo. Let's just talk about your weekend. What did you do?",
      restaurant: "Welcome to our virtual restaurant! I am your waitress Anya. Ready to order your dinner?",
      hospital: "Hello, I am Doctor Anya. What health problems do you have today?",
      hotel: "Hello! Welcome to the Glossa Grand Hotel. I am Anya at the reception. How can I help you check-in?"
    }
  },
  mint: {
    id: "mint",
    name: "Kenzo (Кензо)",
    accent: "oklch(0.75 0.15 160)",
    bodyBgLight: "#f0fdf4",
    bodyBgDark: "#0c0b0e",
    accentHexLight: "#059669",
    accentHexDark: "#34d399",
    gradientStyleLight: "linear-gradient(135deg, #00fa9a 0%, #20b2aa 100%)",
    gradientStyleDark: "linear-gradient(135deg, #00804c 0%, #105954 100%)",
    bubbleBgLight: "linear-gradient(135deg, rgba(0, 250, 154, 0.08) 0%, rgba(32, 178, 170, 0.08) 100%)",
    bubbleBgDark: "linear-gradient(135deg, rgba(0, 128, 76, 0.25) 0%, rgba(16, 89, 84, 0.25) 100%)",
    orbBg: "conic-gradient(from 0deg, oklch(0.75 0.15 160), oklch(0.72 0.18 140), oklch(0.75 0.15 160))",
    coreBg: "radial-gradient(circle at 35% 30%, oklch(0.94 0.04 150), oklch(0.78 0.14 160) 45%, oklch(0.6 0.16 180) 100%)",
    absorbColors: ["oklch(0.78 0.16 160)", "oklch(0.74 0.18 140)", "oklch(0.8 0.14 180)", "oklch(0.82 0.12 200)"],
    burstColors: ["#00fa9a", "#00ffff", "#adff2f", "#20b2aa", "#32cd32", "#4aa88b"],
    accentText: "Японский акцент (Polite & Calm A2-B1)",
    welcomeTemplates: {
      interview: "Konnichiwa! I am Kenzo, your interviewer. I like structured answers. Could you tell me why you want to join our company?",
      casual: "Konnichiwa! Kenzo here. Let's have a peaceful conversation about hobbies. What is your favorite hobby?",
      restaurant: "Konnichiwa. Welcome to restaurant. I am waiter Kenzo. May I suggest today's special green tea soup?",
      hospital: "Konnichiwa. Doctor Kenzo here. I will check your medical history. Please tell me your symptoms.",
      hotel: "Konnichiwa. Receptionist Kenzo here. Do you have a reservation code for check-in?"
    }
  },
  lavender: {
    id: "lavender",
    name: "Priya (Прийя)",
    accent: "oklch(0.72 0.16 290)",
    bodyBgLight: "#faf5ff",
    bodyBgDark: "#0c0b0e",
    accentHexLight: "#7c3aed",
    accentHexDark: "#a78bfa",
    gradientStyleLight: "linear-gradient(135deg, #8f00ff 0%, #9370db 100%)",
    gradientStyleDark: "linear-gradient(135deg, #4c008a 0%, #4f337d 100%)",
    bubbleBgLight: "linear-gradient(135deg, rgba(143, 0, 255, 0.08) 0%, rgba(147, 112, 219, 0.08) 100%)",
    bubbleBgDark: "linear-gradient(135deg, rgba(76, 0, 138, 0.25) 0%, rgba(79, 51, 125, 0.25) 100%)",
    orbBg: "conic-gradient(from 0deg, oklch(0.72 0.16 290), oklch(0.69 0.18 270), oklch(0.72 0.16 290))",
    coreBg: "radial-gradient(circle at 35% 30%, oklch(0.93 0.04 280), oklch(0.74 0.16 290) 45%, oklch(0.58 0.18 310) 100%)",
    absorbColors: ["oklch(0.75 0.18 290)", "oklch(0.7 0.2 270)", "oklch(0.76 0.16 310)", "oklch(0.78 0.14 330)"],
    burstColors: ["#4b0082", "#8f00ff", "#ff00ff", "#00ffff", "#9370db", "#1e90ff", "#ff1493", "#da70d6"],
    accentText: "Индийский акцент (Energetic IT-pace B1-B2)",
    welcomeTemplates: {
      interview: "Namaste! Priya here, excited to talk with you. Let's check your coding stack. Tell me, how do you optimize relational databases?",
      casual: "Namaste! Priya here. Let's discuss latest tech trends. Are you interested in AI tools?",
      restaurant: "Namaste! Welcome. I am Priya, restaurant manager. Do you want to see our delicious curry list?",
      hospital: "Namaste. Doctor Priya. I hear you are not feeling well. Tell me everything about your headache.",
      hotel: "Namaste. Welcome to Glossa Suites. Priya at your service. Let's get you checked in immediately!"
    }
  },
  peach: {
    id: "peach",
    name: "Carlos (Карлос)",
    accent: "oklch(0.78 0.14 65)",
    bodyBgLight: "#fffbeb",
    bodyBgDark: "#0c0b0e",
    accentHexLight: "#ea580c",
    accentHexDark: "#fb923c",
    gradientStyleLight: "linear-gradient(135deg, #ff4500 0%, #ffd700 100%)",
    gradientStyleDark: "linear-gradient(135deg, #8a2400 0%, #7d6b00 100%)",
    bubbleBgLight: "linear-gradient(135deg, rgba(255, 69, 0, 0.08) 0%, rgba(255, 215, 0, 0.08) 100%)",
    bubbleBgDark: "linear-gradient(135deg, rgba(138, 36, 0, 0.25) 0%, rgba(125, 107, 0, 0.25) 100%)",
    orbBg: "conic-gradient(from 0deg, oklch(0.78 0.14 65), oklch(0.75 0.16 45), oklch(0.78 0.14 65))",
    coreBg: "radial-gradient(circle at 35% 30%, oklch(0.95 0.03 55), oklch(0.8 0.13 65) 45%, oklch(0.65 0.15 45) 100%)",
    absorbColors: ["oklch(0.8 0.15 65)", "oklch(0.78 0.18 45)", "oklch(0.82 0.13 85)", "oklch(0.84 0.1 100)"],
    burstColors: ["#ff4500", "#ff8c00", "#ff1493", "#ffd700", "#ff6347", "#db7093", "#e0115f", "#ff007f"],
    accentText: "Испанский акцент (Expressive B1-B2)",
    welcomeTemplates: {
      interview: "Hola! I am Carlos, your interviewer. Let's do a friendly interview. What is your style of managing creative conflicts in teams?",
      casual: "Hola amigo! Carlos here. Let's chat about travel. What was the most beautiful country you visited?",
      restaurant: "Hola! Welcome to El Carlos Bistro. I have excellent recommendations for wine and tapas today!",
      hospital: "Hola. Carlos here. Doctor Carlos. Where does it hurt, amigo? Let's check it.",
      hotel: "Hola! Welcome. I am Carlos, hotel assistant. We have a suite with ocean view ready for you."
    }
  },
  sky: {
    id: "sky",
    name: "Alastair (Аластер)",
    accent: "oklch(0.74 0.14 220)",
    bodyBgLight: "#f0f9ff",
    bodyBgDark: "#0c0b0e",
    accentHexLight: "#0284c7",
    accentHexDark: "#38bdf8",
    gradientStyleLight: "linear-gradient(135deg, #00bfff 0%, #1e90ff 100%)",
    gradientStyleDark: "linear-gradient(135deg, #006087 0%, #0f4a85 100%)",
    bubbleBgLight: "linear-gradient(135deg, rgba(0, 191, 255, 0.08) 0%, rgba(30, 144, 255, 0.08) 100%)",
    bubbleBgDark: "linear-gradient(135deg, rgba(0, 96, 135, 0.25) 0%, rgba(15, 74, 133, 0.25) 100%)",
    orbBg: "conic-gradient(from 0deg, oklch(0.74 0.14 220), oklch(0.71 0.16 200), oklch(0.74 0.14 220))",
    coreBg: "radial-gradient(circle at 35% 30%, oklch(0.94 0.04 210), oklch(0.76 0.13 220) 45%, oklch(0.6 0.15 240) 100%)",
    absorbColors: ["oklch(0.76 0.15 220)", "oklch(0.73 0.18 200)", "oklch(0.78 0.13 240)", "oklch(0.8 0.11 260)"],
    burstColors: ["#00bfff", "#0000ff", "#00ffff", "#7b68ee", "#1e90ff", "#00fa9a"],
    accentText: "Шотландский акцент (Challenging B2-C1)",
    welcomeTemplates: {
      interview: "Aye, hello! Alastair here. Let's test your wits. Tell me about your biggest failure at your past job, and how you fixed it?",
      casual: "Aye, hello! Let's talk about the weather or soccer. What team do you support?",
      restaurant: "Aye, welcome. I am Alastair, the chef. Do you want to try our famous haggis or steak?",
      hospital: "Aye, hello. Doctor Alastair. Tell me what's wrong. Have you been coughing a lot?",
      hotel: "Aye, welcome to the Highlands Lodge. I'm Alastair. Let me grab your keys and bags."
    }
  }
};

const CALL_SAMPLES = {
  rose: "I want to apply for the middle frontend vacancy at your studio.",
  mint: "Can you help me understand how to tell about my hobbies?",
  lavender: "I am ready to try mock interviews with you right now.",
  peach: "I am ready Carlos. Tell me something about your country's culture.",
  sky: "Aye, I am prepared for a challenge today."
};

// Simple staggered words renderer to replicate HTML subtitles
function StaggeredWords({ text, highlightColor, isUser }) {
  if (!text) return null;
  const words = text.split(/\s+/);
  return (
    <span className="inline-block text-center">
      {words.map((word, idx) => (
        <span
          key={idx}
          className="inline-block"
          style={{
            animationName: "word-fade-in",
            animationDuration: "0.45s",
            animationTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
            animationFillMode: "forwards",
            animationDelay: `${idx * 0.12}s`,
            opacity: 0,
            transform: "translateY(7px)",
            textShadow: isUser ? `0 0 12px ${highlightColor}20` : "none",
            color: "#ffffff"
          }}
        >
          {word}&nbsp;
        </span>
      ))}
    </span>
  );
}

export default function TutorChat() {
  const t = useT();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [searchParams] = useSearchParams();
  const scenario = searchParams.get("scenario") || "casual";
  const language = searchParams.get("language") || "English";

  // Existing standard WebSocket chat connection
  const { status, messages, sessionId, denyReason, sendMessage } = useAiChatSocket({ scenario, language });
  const waitingForReply = messages.length > 0 && messages[messages.length - 1].role === "user";
  const showHistory = status === "open" || status === "reconnecting" || status === "closed";

  // Tutor Preset Selection State
  const [tutor, setTutor] = useState(null);

  // Voice Call Overlay Simulation States
  const [callActive, setCallActive] = useState(false);
  const [callState, setCallState] = useState("listening"); // 'listening' or 'speaking'
  const [callTimeSeconds, setCallTimeSeconds] = useState(0);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [micMuted, setMicMuted] = useState(false);

  // Background Canvas Particles Ref & Logic
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const activeTutorRef = useRef(null);
  activeTutorRef.current = tutor;

  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // projection of styling to body tags
  useEffect(() => {
    if (!tutor) return;
    const originalBodyBg = document.body.style.backgroundColor;
    
    if (callActive) {
      const palette = PRESETS[tutor];
      document.body.style.backgroundColor = isDarkMode ? palette.bodyBgDark : palette.bodyBgLight;
    } else {
      document.body.style.backgroundColor = isDarkMode ? "#0c0b0e" : "#faf8f5";
    }

    return () => {
      document.body.style.backgroundColor = originalBodyBg;
    };
  }, [tutor, callActive, isDarkMode]);

  // Burst function
  const triggerCallBurst = (x, y, targetPreset = null) => {
    const currentPreset = targetPreset || activeTutorRef.current;
    if (!currentPreset || !PRESETS[currentPreset]) return;
    const colors = PRESETS[currentPreset].burstColors;

    // Center glow
    particlesRef.current.push({
      x, y, vx: 0, vy: 0, radius: 100,
      maxRadius: 700 + 200 * Math.random(),
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1, decay: 0.0035, drag: 1, maxOpacity: 0.22
    });

    // Sub particles
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + 11 * Math.random();
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 30 + 50 * Math.random(),
        maxRadius: 360 + 240 * Math.random(),
        color: colors[i % colors.length],
        life: 1, decay: 0.004 + 0.005 * Math.random(),
        drag: 0.975, maxOpacity: 0.28
      });
    }
  };

  // Canvas loop
  useEffect(() => {
    if (!tutor) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const loopParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const list = particlesRef.current;

      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.life -= p.decay;
        if (p.life <= 0) {
          list.splice(i, 1);
          continue;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= p.drag;
        p.vy *= p.drag;

        const progress = Math.min(1, (1 - p.life) * 1.8);
        const radius = p.radius + (p.maxRadius - p.radius) * progress;
        const pOpacity = isDarkMode ? p.maxOpacity * 0.6 : p.maxOpacity;
        const opacity = pOpacity * Math.sin(p.life * Math.PI);

        // Convert HEX string to RGB
        let hex = p.color;
        let r = 255, g = 255, b = 255;
        const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (match) {
          r = parseInt(match[1], 16);
          g = parseInt(match[2], 16);
          b = parseInt(match[3], 16);
        }

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${opacity})`);
        gradient.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, ${0.4 * opacity})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, 2 * Math.PI);
        ctx.fill();
      }
      animationFrameId = requestAnimationFrame(loopParticles);
    };

    loopParticles();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [tutor, isDarkMode]);

  // Infinite Background Bursts loop while chat is open and call is inactive
  useEffect(() => {
    if (!tutor || callActive) return;

    // Trigger initial burst
    triggerCallBurst(window.innerWidth / 2, window.innerHeight / 2);

    const interval = setInterval(() => {
      triggerCallBurst(window.innerWidth / 2, window.innerHeight / 2);
    }, 950);

    return () => clearInterval(interval);
  }, [tutor, callActive]);

  // Trigger burst when new messages arrive
  const prevMessagesLength = useRef(0);
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      if (tutor && !callActive) {
        triggerCallBurst(window.innerWidth / 2, window.innerHeight / 2);
      }
      prevMessagesLength.current = messages.length;
    }
  }, [messages, tutor, callActive]);

  // Voice Call Timer and Simulator transitions
  useEffect(() => {
    if (!callActive) return;

    let timer = setInterval(() => {
      setCallTimeSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [callActive]);

  useEffect(() => {
    if (!callActive) return;

    let subInterval;
    let burstTimer;

    const runListeningState = () => {
      setCallState("listening");
      subInterval = setTimeout(() => {
        runSpeakingState();
      }, 5500);
    };

    const runSpeakingState = () => {
      setCallState("speaking");
      
      const coreX = window.innerWidth / 2;
      const coreY = window.innerHeight / 2;
      triggerCallBurst(coreX, coreY);
      burstTimer = setInterval(() => {
        triggerCallBurst(coreX, coreY);
      }, 550);

      subInterval = setTimeout(() => {
        clearInterval(burstTimer);
        runListeningState();
      }, 6500);
    };

    runListeningState();

    return () => {
      clearTimeout(subInterval);
      clearInterval(burstTimer);
    };
  }, [callActive, tutor]);

  const handleSend = (text) => {
    sendMessage(text);
    if (tutor) {
      triggerCallBurst(window.innerWidth / 2, window.innerHeight / 2);
    }
  };

  const startVoiceCall = () => {
    setCallActive(true);
    setCallTimeSeconds(0);
  };

  const closeVoiceCall = () => {
    setCallActive(false);
  };

  // Preset configuration
  const activePreset = tutor ? PRESETS[tutor] : null;

  return (
    <div className="relative min-h-[600px] w-full flex flex-col justify-center items-center">
      {/* Dynamic Keyframe Style Tags */}
      <style>{`
        @keyframes word-fade-in {
          0% { opacity: 0; transform: translateY(7px); filter: blur(3px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes conic-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes core-breathe-idle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        @keyframes core-breathe-listen {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes core-breathe-speak {
          0%, 100% { transform: scale(1); }
          33% { transform: scale(1.25); }
          66% { transform: scale(0.92); }
        }
        @keyframes ring-pulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(0.82); opacity: 0.3; }
        }
      `}</style>

      {/* Background Canvas Particles */}
      {tutor && <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-10" />}

      {/* ================= STAGE 1: TUTOR PICKER OVERLAY ================= */}
      {!tutor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border-2 border-black dark:border-stone-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl flex flex-col gap-5 text-[#160f22] dark:text-white">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-headline text-xl font-extrabold">С каким репетитором вы хотите общаться?</h3>
                <p className="font-body text-xs text-neutral-500 dark:text-stone-400 mt-1">
                  Выберите наставника. От выбора зависит акцент и стиль ведения разговора.
                </p>
              </div>
              <button onClick={() => navigate("/tutor/scenarios")} className="text-neutral-400 hover:text-neutral-800 dark:hover:text-white text-xl font-bold p-1">
                &times;
              </button>
            </div>

            <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1">
              {Object.values(PRESETS).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setTutor(p.id)}
                  className="w-full flex items-center gap-4 p-3.5 border-2 border-black dark:border-stone-800 hover:border-pink-500 rounded-2xl bg-white dark:bg-stone-900 text-left hover:bg-pink-50/10 transition duration-200"
                >
                  <span className="w-10 h-10 rounded-full shrink-0 border border-neutral-300 dark:border-stone-700" style={{ background: p.orbBg }} />
                  <div className="flex-grow">
                    <div className="flex justify-between items-center">
                      <span className="font-headline font-bold text-sm">{p.name}</span>
                      <span className="text-[9px] font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded border border-pink-200 uppercase">
                        {p.id === "rose" ? "A1-A2" : p.id === "mint" ? "A2-B1" : p.id === "sky" ? "B2-C1" : "B1-B2"}
                      </span>
                    </div>
                    <p className="font-body text-[11px] text-neutral-500 dark:text-stone-400 mt-0.5">{p.accentText}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= STAGE 2: OPAQUE SOLID CHAT VIEW ================= */}
      {tutor && !callActive && (
        <div
          id="chat-screen"
          className="w-full max-w-5xl rounded-[32px] overflow-hidden z-30 flex flex-col h-[640px] transition-all duration-300 shadow-xl border-2"
          style={{
            backgroundColor: isDarkMode ? "#0c0b0e" : "#ffffff",
            borderColor: isDarkMode ? "rgba(243, 244, 246, 0.15)" : "rgba(22, 15, 34, 0.12)"
          }}
        >
          {/* Header */}
          <div 
            className="border-b p-4 flex justify-between items-center z-40 transition-colors duration-200"
            style={{
              backgroundColor: isDarkMode ? "#070608" : "#fbfaf8",
              borderColor: isDarkMode ? "rgba(243, 244, 246, 0.15)" : "rgba(22, 15, 34, 0.12)"
            }}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/tutor/scenarios")}
                className="px-4 py-2 border border-neutral-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-neutral-50 dark:hover:bg-stone-850 rounded-2xl text-xs font-bold transition"
              >
                ← Назад
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-headline font-black text-sm uppercase tracking-wide text-neutral-900 dark:text-white">
                    {t(`tutor.scenarios.${scenario}.title`) || scenario}
                  </h3>
                  <span
                    className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider bg-white dark:bg-stone-900 shadow-sm"
                    style={{ color: isDarkMode ? activePreset.accentHexDark : activePreset.accentHexLight }}
                  >
                    {activePreset.name}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-500 dark:text-stone-400 font-semibold">{activePreset.accentText}</p>
              </div>
            </div>

            {/* Pulsing Call Trigger */}
            <button
              onClick={startVoiceCall}
              className="w-12 h-12 rounded-full border border-neutral-200 dark:border-stone-800 text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all animate-pulse"
              style={{ background: isDarkMode ? activePreset.gradientStyleDark : activePreset.gradientStyleLight }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
            </button>
          </div>

          {/* Bubbles Area */}
          <div 
            className="flex-grow overflow-hidden flex flex-col justify-between transition-colors duration-200"
            style={{ backgroundColor: isDarkMode ? "#0c0b0e" : "#ffffff" }}
          >
            {status === "connecting" && (
              <p className="p-6 font-label text-label-md uppercase text-neutral-500 dark:text-stone-400">{t("tutor.connecting")}</p>
            )}
            {status === "denied" && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
                <p className="font-body text-body-md text-neutral-500 dark:text-stone-400 max-w-sm">
                  {denyReason === "limit_reached" ? t("tutor.limitReachedSoft") : t("tutor.denyReasonDefault")}
                </p>
                <Link to="/pricing">
                  <button className="px-4 py-2 bg-secondary text-white font-bold rounded-xl border border-black">{t("common.viewPlans")}</button>
                </Link>
              </div>
            )}

            {showHistory && (
              <MessageList
                messages={messages}
                typing={status === "open" && waitingForReply}
                tutorPreset={activePreset}
                isDarkMode={isDarkMode}
              />
            )}

            {status === "reconnecting" && (
              <p className="px-6 py-3 font-label text-label-md uppercase text-neutral-500 dark:text-stone-400 border-t">
                {t("tutor.reconnecting")}
              </p>
            )}
            {status === "closed" && (
              <p className="px-6 py-3 font-label text-label-md uppercase text-red-500 border-t">
                {t("tutor.reconnectFailed")}
              </p>
            )}
          </div>

          {/* Input Footer Area */}
          <div
            className="p-4 border-t flex items-center gap-3 z-40 transition-colors duration-200"
            style={{
              backgroundColor: isDarkMode ? "#070608" : "#fbfaf8",
              borderColor: isDarkMode ? "rgba(243, 244, 246, 0.15)" : "rgba(22, 15, 34, 0.12)"
            }}
          >
            <ChatInput 
              disabled={status !== "open" || waitingForReply} 
              onSend={handleSend} 
              tutorPreset={activePreset}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      )}

      {/* ================= STAGE 3: FULLSCREEN VOICE CALL OVERLAY ================= */}
      {tutor && callActive && (
        <div id="fullscreen-call-overlay" className="fixed inset-0 z-50 flex flex-col justify-between items-center p-6 bg-transparent transition-all duration-300">
          
          {/* Header Call Info */}
          <div className="w-full max-w-xl flex items-center justify-between z-50 border-b border-black/10 dark:border-white/10 pb-4 mt-4 font-semibold text-neutral-900 dark:text-white">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
              <div>
                <h2 className="font-headline font-black text-lg">Звонок: {activePreset.name}</h2>
                <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-300 uppercase tracking-widest">
                  {callState === "listening" ? "Listening" : "Speaking"}
                </span>
              </div>
            </div>
            {/* Call Timer */}
            <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 px-4 py-1.5 rounded-full text-xs font-mono font-bold">
              Timer: {String(Math.floor(callTimeSeconds / 60)).padStart(2, "0")}:{String(callTimeSeconds % 60).padStart(2, "0")}
            </div>
          </div>

          {/* Central breathing orb */}
          <div className="relative w-72 h-72 flex items-center justify-center z-50">
            {/* Rotating Conic Blur Blob */}
            <div
              className="absolute h-[68%] w-[68%] rounded-full opacity-35"
              style={{
                background: activePreset.orbBg,
                filter: "blur(22px)",
                animation: "conic-rotate 6s linear infinite"
              }}
            />

            {/* Listening Ripple Ring */}
            {callState === "listening" && (
              <div
                className="absolute h-[62%] w-[62%] rounded-full border"
                style={{
                  borderColor: `${activePreset.accent}80`,
                  animation: "ring-pulse 1.8s ease-in-out infinite"
                }}
              />
            )}

            {/* Speaking Concentric Ripples */}
            {callState === "speaking" && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="absolute rounded-full border pointer-events-none"
                    style={{
                      borderColor: activePreset.accent,
                      boxShadow: `0 0 16px 2px ${activePreset.accent}`,
                      width: "42%",
                      height: "42%",
                      animation: `ring-pulse 2s ease-out infinite`,
                      animationDelay: `${i * 0.65}s`
                    }}
                  />
                ))}
              </div>
            )}

            {/* Inward absorbing particles inside listening phase */}
            {callState === "listening" && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {Array.from({ length: 9 }).map((_, idx) => {
                  const angle = (idx / 9) * Math.PI * 2;
                  const delay = (idx / 9) * 1.7;
                  const color = activePreset.absorbColors[idx % activePreset.absorbColors.length];
                  const startX = 118 * Math.cos(angle);
                  const startY = 118 * Math.sin(angle);
                  
                  return (
                    <span
                      key={idx}
                      className="absolute w-2.5 h-2.5 rounded-full z-20"
                      style={{
                        background: color,
                        boxShadow: `0 0 10px 3px ${color}`,
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        animationName: "word-fade-in", // reused stagger logic
                        animationDuration: "1.7s",
                        animationIterationCount: "infinite",
                        animationDelay: `${delay}s`
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* Central Glowing Core */}
            <div
              className="relative rounded-full z-10 shadow-lg"
              style={{
                width: "38%",
                height: "38%",
                background: activePreset.coreBg,
                animationName: callState === "speaking" ? "core-breathe-speak" : (callState === "listening" ? "core-breathe-listen" : "core-breathe-idle"),
                animationDuration: callState === "speaking" ? "1s" : (callState === "listening" ? "1.7s" : "3.4s"),
                animationIterationCount: "infinite",
                animationTimingFunction: "ease-in-out"
              }}
            />
          </div>

          {/* Subtitles & Actions Panel */}
          <div className="w-full max-w-lg flex flex-col items-center gap-4 z-50 mb-4">
            
            {/* Subtitles Display Box */}
            <div
              id="call-overlay-subtitles-box"
              className={`w-full min-h-[72px] px-6 py-4 rounded-3xl text-center flex items-center justify-center backdrop-blur-md shadow-lg border border-white/20 transition-opacity duration-200 ${
                showSubtitles ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              style={{ background: isDarkMode ? activePreset.gradientStyleDark : activePreset.gradientStyleLight }}
            >
              <div className="text-xs font-semibold leading-relaxed w-full">
                {callState === "listening" ? (
                  <StaggeredWords text={CALL_SAMPLES[tutor]} highlightColor={activePreset.accent} isUser={true} />
                ) : (
                  <StaggeredWords 
                    text={activePreset.welcomeTemplates[scenario] || activePreset.welcomeTemplates.casual} 
                    highlightColor={activePreset.accent} 
                    isUser={false} 
                  />
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-5">
              {/* CC Toggle */}
              <button
                onClick={() => setShowSubtitles(prev => !prev)}
                className={`w-12 h-12 rounded-full border border-neutral-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all ${
                  showSubtitles ? "opacity-100" : "opacity-40"
                }`}
                title="Показать/скрыть субтитры"
              >
                <svg className="w-5 h-5 text-neutral-800 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
                </svg>
              </button>

              {/* Mic Toggle */}
              <button
                onClick={() => setMicMuted(prev => !prev)}
                className={`w-12 h-12 rounded-full border border-neutral-200 dark:border-stone-800 bg-white dark:bg-stone-950 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all ${
                  micMuted ? "bg-red-50 dark:bg-red-950/20" : ""
                }`}
                title="Вкл/Выкл микрофон"
              >
                {!micMuted ? (
                  <svg className="w-5 h-5 text-neutral-800 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                  </svg>
                )}
              </button>

              {/* Hangup */}
              <button
                onClick={closeVoiceCall}
                className="w-14 h-14 rounded-full border border-neutral-200 dark:border-stone-800 bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
                title="Завершить звонок"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v2a2 2 0 00.224 1.216l3.62 3.62a2 2 0 001.52.508l3.036-.506a2 2 0 011.888 1.13l1.294 2.588a2 2 0 001.45 1.116l3.528.882a2 2 0 002.224-1.506l1.25-5a2 2 0 00-.73-2.106l-4.528-3.018A2 2 0 0015 3h-2a2 2 0 00-1.89 1.348l-.756 2.268A2 2 0 018.46 7.73L6.16 5.43A2 2 0 005.172 5H5z"/>
                </svg>
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
