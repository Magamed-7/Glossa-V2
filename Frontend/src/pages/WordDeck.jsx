import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Icon from "../components/ui/Icon.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import Modal from "../components/ui/Modal.jsx";
import NeoButton from "../components/ui/NeoButton.jsx";
import { useApi } from "../lib/useApi.js";
import { useToast } from "../lib/toast.jsx";
import { errorText } from "../lib/api/errorText.js";
import { deleteCard, getCards, setCardStatus, createCard } from "../lib/api/deck.js";
import { getStats, getDailyMissions } from "../lib/api/learning.js";
import { getMySubscription } from "../lib/api/subscriptions.js";
import { useT } from "../lib/i18n.jsx";
import { submitReview } from "../lib/api/reviews.js";

const STATUS_CYCLE = ["learning", "learned", "hard", "skipped"];

export default function WordDeck() {
  const t = useT();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get("status") || "";

  // Page mode: "archive" (default), "setup", "card-flip", "typewriter", "daily-missions"
  const [gameMode, setGameMode] = useState("archive");

  // Pagination limit
  const [limit, setLimit] = useState(10);

  // API calls
  const { data: stats, loading: statsLoading, reload: reloadStats } = useApi(
    () => getStats(),
    []
  );

  const { data: missionsData, loading: missionsLoading, reload: reloadMissions } = useApi(
    () => getDailyMissions(),
    []
  );

  const { data: fetched, loading, error, reload } = useApi(
    () => getCards({ status: statusFilter === "unlearned" ? undefined : (statusFilter || undefined), limit: 100 }),
    [statusFilter]
  );

  const { data: subscription } = useApi(
    () => getMySubscription(),
    []
  );

  const [items, setItems] = useState([]);
  const [pendingDelete, setPendingDelete] = useState(null);

  // New entry form state
  const [term, setTerm] = useState("");
  const [translationInput, setTranslationInput] = useState("");
  const [example, setExample] = useState("");
  const [adding, setAdding] = useState(false);

  // Revealed card translations state
  const [revealedCards, setRevealedCards] = useState(new Set());

  // --- GAME SETUP STATES ---
  const [gameToLaunch, setGameToLaunch] = useState("");
  const [setupCategory, setSetupCategory] = useState("all");
  const [setupCount, setSetupCount] = useState(10);
  const [gameDifficulty, setGameDifficulty] = useState("normal");
  const [gameItems, setGameItems] = useState([]);
  const [gameLoading, setGameLoading] = useState(false);

  const isFreePlan = !subscription || subscription.plan?.code === "free";

  // --- GAME STATES ---
  // Speed Recall Game States
  const [recallWords, setRecallWords] = useState([]);
  const [recallTimeLeft, setRecallTimeLeft] = useState(60);
  const [recallCombo, setRecallCombo] = useState(0);
  const [recallXp, setRecallXp] = useState(0);
  const recallXpRef = useRef(0);
  const recallComboRef = useRef(0);
  const recallSpeedRef = useRef(3.2);
  const processedWordIdsRef = useRef(new Set());
  const [showRecallResults, setShowRecallResults] = useState(false);
  const [recallResultsStats, setRecallResultsStats] = useState({ correct: 0, missed: 0, maxCombo: 0 });

  // Typewriter Game States
  const [typeIndex, setTypeIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [typeTimeLeft, setTypeTimeLeft] = useState(15); // 15 seconds per word
  const [showSuccessStamp, setShowSuccessStamp] = useState(false);
  const [showErrorStamp, setShowErrorStamp] = useState(false);
  const typewriterInputRef = useRef(null);

  // --- AUDIO SYNTHESIS / SOUND GENERATORS ---
  const playTypewriterSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(80, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch (e) {}
  };

  const playBellSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {}
  };

  const playBuzzerSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(120, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {}
  };

  useEffect(() => {
    if (fetched) {
      if (statusFilter === "unlearned") {
        setItems(fetched.filter((c) => c.status !== "learned"));
      } else {
        setItems(fetched);
      }
    }
  }, [fetched, statusFilter]);

  useEffect(() => {
    recallXpRef.current = recallXp;
  }, [recallXp]);

  useEffect(() => {
    recallComboRef.current = recallCombo;
  }, [recallCombo]);

  // Speed Recall Game Loop
  useEffect(() => {
    if (gameMode !== "speed-recall" || gameItems.length === 0) return;

    setRecallTimeLeft(60);
    setRecallResultsStats({ correct: 0, missed: 0, maxCombo: 0 });

    // 1. Timer for 60 seconds
    const secondsTimer = setInterval(() => {
      setRecallTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(secondsTimer);
          setGameMode("speed-recall-results");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    // 2. Physics loop (run every 30ms for smooth scrolling)
    const interval = setInterval(() => {
      setRecallWords((prev) => {
        let allDone = true;
        const next = prev.map((w) => {
          const nextY = w.y + recallSpeedRef.current;
          
          let missed = w.missed;
          if (!w.classified && !missed && !processedWordIdsRef.current.has(w.id) && nextY > 250) {
            missed = true;
            processedWordIdsRef.current.add(w.id);
            setRecallCombo(0);
            submitReview(w.id, 0).catch((err) => console.error(err));
            setRecallResultsStats((s) => ({ ...s, missed: s.missed + 1 }));
          }

          if (nextY < 420) {
            allDone = false;
          }

          return { ...w, y: nextY, missed };
        });

        if (allDone && prev.length > 0) {
          clearInterval(interval);
          clearInterval(secondsTimer);
          setTimeout(() => {
            setGameMode("speed-recall-results");
          }, 500);
        }

        return next;
      });
    }, 30);

    return () => {
      clearInterval(interval);
      clearInterval(secondsTimer);
    };
  }, [gameMode]);

  // Typewriter Game Timer
  useEffect(() => {
    if (gameMode !== "typewriter" || gameItems.length === 0) return;

    setTypedText("");
    setShowSuccessStamp(false);
    setShowErrorStamp(false);
    setTypeTimeLeft(15);

    const interval = setInterval(() => {
      setTypeTimeLeft((t) => {
        if (t <= 0.1) {
          handleNextTypewriter(false);
          return 15;
        }
        return Number((t - 0.1).toFixed(1));
      });
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [gameMode, typeIndex]);

  function onStatusFilterChange(val) {
    const next = new URLSearchParams(searchParams);
    if (val) next.set("status", val);
    else next.delete("status");
    setSearchParams(next);
    setLimit(10); // Reset limit on tab change
  }

  function toggleReveal(cardId) {
    setRevealedCards((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  }

  async function onStatusChange(card, nextStatus) {
    const previous = items;
    setItems((current) =>
      current.map((c) => (c.id === card.id ? { ...c, status: nextStatus } : c))
    );
    setGameItems((current) =>
      current.map((c) => (c.id === card.id ? { ...c, status: nextStatus } : c))
    );

    try {
      const updated = await setCardStatus(card.id, nextStatus);
      setItems((current) => current.map((c) => (c.id === card.id ? updated : c)));
      setGameItems((current) => current.map((c) => (c.id === card.id ? updated : c)));
      reloadStats();
      reloadMissions();
    } catch (err) {
      setItems(previous);
      toast.error(errorText(err));
    }
  }

  async function confirmDelete() {
    const card = pendingDelete;
    setPendingDelete(null);
    const previous = items;
    setItems((current) => current.filter((c) => c.id !== card.id));

    try {
      await deleteCard(card.id);
      reloadStats();
    } catch (err) {
      setItems(previous);
      toast.error(errorText(err));
    }
  }

  async function handleAddEntry(e) {
    e.preventDefault();
    if (!term.trim() || !translationInput.trim()) return;
    setAdding(true);
    try {
      await createCard({
        word: term,
        translation: translationInput,
        example
      });
      toast.success("Word added to ledger.");
      setTerm("");
      setTranslationInput("");
      setExample("");
      reload();
      reloadStats();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setAdding(false);
    }
  }

  // --- GAME SETUP HANDLERS ---
  const handleStartGame = async () => {
    setGameLoading(true);
    try {
      // Query cards up to 150 (enough limit to filter client-side)
      const allCards = await getCards({ limit: 150 });
      let filtered = [];

      if (setupCategory === "all") {
        filtered = allCards;
      } else if (setupCategory === "learning") {
        filtered = allCards.filter(c => c.status === "learning");
      } else if (setupCategory === "unlearned") {
        filtered = allCards.filter(c => c.status !== "learned");
      } else if (setupCategory === "learned") {
        filtered = allCards.filter(c => c.status === "learned");
      } else if (setupCategory === "hard") {
        filtered = allCards.filter(c => c.status === "hard");
      } else if (setupCategory === "skipped") {
        filtered = allCards.filter(c => c.status === "skipped");
      }

      if (!filtered || filtered.length === 0) {
        toast.error("В выбранном разделе нет слов для повторения!");
        setGameLoading(false);
        return;
      }

      // Shuffle and slice to setupCount
      const shuffled = [...filtered].sort(() => 0.5 - Math.random());
      const count = Math.max(1, setupCount || 10);
      const selected = shuffled.slice(0, count);

      setGameItems(selected);
      setTypeIndex(0);

      if (gameToLaunch === "speed-recall") {
        setRecallTimeLeft(60);
        setRecallCombo(0);
        setRecallXp(0);
        processedWordIdsRef.current = new Set();
        
        let spacing = 200;
        let speed = 3.2;
        if (gameDifficulty === "easy") {
          spacing = 160;
          speed = 1.8;
        } else if (gameDifficulty === "normal") {
          spacing = 200;
          speed = 3.2;
        } else if (gameDifficulty === "hard") {
          spacing = 245;
          speed = 4.8;
        } else if (gameDifficulty === "expert") {
          spacing = 290;
          speed = 6.5;
        }
        
        recallSpeedRef.current = speed;

        const initial = selected.map((item, idx) => ({
          ...item,
          y: -idx * spacing - 100,
          classified: null,
          missed: false
        }));
        setRecallWords(initial);
      }

      setGameMode(gameToLaunch);
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setGameLoading(false);
    }
  };

  // --- SPEED RECALL HANDLERS ---
  const handleRecallAction = async (know) => {
    let activeIndex = -1;
    let minDistance = 99999;

    recallWords.forEach((w, idx) => {
      if (w.classified === null && !w.missed && !processedWordIdsRef.current.has(w.id) && w.y >= 100 && w.y <= 280) {
        const dist = Math.abs(w.y - 200);
        if (dist < minDistance) {
          minDistance = dist;
          activeIndex = idx;
        }
      }
    });

    if (activeIndex === -1) return;

    const activeWord = recallWords[activeIndex];
    processedWordIdsRef.current.add(activeWord.id);
    
    setRecallWords((prev) => {
      const next = [...prev];
      next[activeIndex] = {
        ...activeWord,
        classified: know ? "know" : "forgot"
      };
      return next;
    });

    let quality = 0;
    if (know) {
      if (activeWord.y <= 185) {
        quality = 5; // Easy / Fast reaction
      } else if (activeWord.y <= 220) {
        quality = 4; // Good / Medium reaction
      } else {
        quality = 3; // Hard / Slow reaction
      }
    }
    submitReview(activeWord.id, quality).catch((err) => console.error(err));

    if (know) {
      playBellSound();
      const nextCombo = recallCombo + 1;
      setRecallCombo(nextCombo);
      setRecallResultsStats((s) => ({
        ...s,
        correct: s.correct + 1,
        maxCombo: Math.max(s.maxCombo, nextCombo)
      }));
      setRecallXp((x) => x + 15 + Math.min(10, nextCombo));
    } else {
      playBuzzerSound();
      setRecallCombo(0);
      setRecallResultsStats((s) => ({ ...s, missed: s.missed + 1 }));
    }
  };

  useEffect(() => {
    if (gameMode !== "speed-recall") return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleRecallAction(true);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleRecallAction(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [gameMode, recallWords, recallCombo]);

  // --- TYPEWRITER HANDLERS ---
  const handleTypewriterInput = (e) => {
    const text = e.target.value;
    playTypewriterSound();
    setTypedText(text);

    const card = gameItems[typeIndex];
    if (!card) return;

    if (text.toLowerCase().trim() === card.word.toLowerCase().trim()) {
      playBellSound();
      setShowSuccessStamp(true);
      setTimeout(() => {
        handleNextTypewriter(true);
      }, 1200);
    } else if (text.length === card.word.length) {
      // Incorrect word completed
      playBuzzerSound();
      setShowErrorStamp(true);
      setTimeout(() => {
        handleNextTypewriter(false);
      }, 1200);
    }
  };

  const handleNextTypewriter = async (success) => {
    const card = gameItems[typeIndex];
    if (card) {
      let quality = 0;
      if (success) {
        if (typeTimeLeft >= 11) quality = 5;
        else if (typeTimeLeft >= 6) quality = 4;
        else quality = 3;
      }
      try {
        const nextStatus = success ? "learned" : "hard";
        // Optimistic UI updates
        setItems((current) =>
          current.map((c) => (c.id === card.id ? { ...c, status: nextStatus } : c))
        );
        setGameItems((current) =>
          current.map((c) => (c.id === card.id ? { ...c, status: nextStatus } : c))
        );
        
        await submitReview(card.id, quality);
        
        reloadStats();
        reloadMissions();
      } catch (err) {
        console.error(err);
      }
    }

    setTypedText("");
    setShowSuccessStamp(false);
    setShowErrorStamp(false);

    if (typeIndex + 1 < gameItems.length) {
      setTypeIndex((i) => i + 1);
    } else {
      setTypeIndex(0);
      toast.success("Typewriter Speed Check complete!");
      setGameMode("archive");
    }
  };

  // Helpers for classes
  function getCardClasses(status) {
    const base = "border-[3px] border-on-surface bg-surface p-6 md:p-8 shadow-[5px_5px_0_0_#000] flex flex-col gap-3 relative transition-all group";
    if (status === "hard") {
      return `${base} border-secondary border-l-[8px] shadow-[5px_5px_0_0_#000]`;
    }
    if (status === "skipped") {
      return `${base} border-dashed border-on-surface/40 opacity-70`;
    }
    return base;
  }

  function BadgeSelect({ card }) {
    const selectColorClasses = {
      learned: "bg-on-surface text-surface border-on-surface",
      learning: "bg-[#f59e0b] text-black border-on-surface",
      hard: "bg-[#fce7f3] text-[#be185d] border-on-surface",
      skipped: "bg-surface-variant text-on-surface-variant border-on-surface-variant/40"
    };

    return (
      <select
        value={card.status}
        onChange={(e) => onStatusChange(card, e.target.value)}
        className={`text-xs font-bold tracking-wider uppercase font-mono border-2 px-3 py-1.5 cursor-pointer focus:outline-none transition-colors rounded-none ${selectColorClasses[card.status] || ""}`}
      >
        <option value="learning" className="bg-surface text-on-surface text-sm">
          {t("deck.status.learning").toUpperCase()}
        </option>
        <option value="learned" className="bg-surface text-on-surface text-sm">
          {t("deck.status.learned").toUpperCase()} (MASTERED)
        </option>
        <option value="hard" className="bg-surface text-on-surface text-sm">
          {t("deck.status.hard").toUpperCase()} (DIFFICULT)
        </option>
        <option value="skipped" className="bg-surface text-on-surface text-sm">
          {t("deck.status.skipped").toUpperCase()}
        </option>
      </select>
    );
  }

  // --- RENDER GAME CONTENT ---

  if (gameMode === "setup") {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 bg-[#fcfbf9] text-on-surface min-h-screen flex items-center justify-center">
        <div className="w-full border-[3px] border-primary bg-surface p-8 shadow-[8px_8px_0_0_#000] relative">
          <div className="absolute top-0 right-0 w-8 h-8 border-l-2 border-b-2 border-primary bg-[#ffddb8]"></div>
          <h2 className="font-serif text-3xl font-bold uppercase tracking-tight text-primary mb-6 border-b-2 border-primary pb-3 flex justify-between items-center">
            <span>{t("deck.games.setupTitle")}</span>
            <Icon name="settings_suggest" className="text-secondary text-3xl" />
          </h2>

          <div className="flex flex-col gap-6">
            {/* Category Dropdown */}
            <div>
              <label className="font-label text-xs uppercase tracking-widest font-bold text-on-surface-variant block mb-2">
                {t("deck.games.categoryLabel")}
              </label>
              <select
                value={setupCategory}
                onChange={(e) => {
                  if (isFreePlan && !["all", "unlearned"].includes(e.target.value)) {
                    toast.error(t("deck.games.freeCategoryError"));
                    return;
                  }
                  setSetupCategory(e.target.value);
                }}
                className="w-full bg-surface border-2 border-primary px-4 py-3 font-mono text-sm rounded-none focus:outline-none shadow-[2px_2px_0_0_#000] cursor-pointer"
              >
                <option value="all">{t("deck.tabs.all")}</option>
                <option value="unlearned">{t("deck.tabs.unlearned")}</option>
                <option value="learning" disabled={isFreePlan}>
                  {t("deck.tabs.learning")} {isFreePlan ? "🔒 (Premium)" : ""}
                </option>
                <option value="learned" disabled={isFreePlan}>
                  {t("deck.tabs.learned")} {isFreePlan ? "🔒 (Premium)" : ""}
                </option>
                <option value="hard" disabled={isFreePlan}>
                  {t("deck.tabs.hard")} {isFreePlan ? "🔒 (Premium)" : ""}
                </option>
                <option value="skipped" disabled={isFreePlan}>
                  {t("deck.tabs.skipped")} {isFreePlan ? "🔒 (Premium)" : ""}
                </option>
              </select>
            </div>

            <div>
              <label className="font-label text-xs uppercase tracking-widest font-bold text-on-surface-variant block mb-2">
                {t("deck.games.countLabel")}
              </label>
              <input
                type="number"
                min={1}
                max={isFreePlan ? 10 : 100}
                value={setupCount === 0 ? "" : setupCount}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    setSetupCount(0);
                    return;
                  }
                  const val = parseInt(raw, 10);
                  if (isNaN(val)) return;
                  if (isFreePlan && val > 10) {
                    toast.error(t("deck.games.freeLimitError"));
                    setSetupCount(10);
                    return;
                  }
                  setSetupCount(val);
                }}
                className="w-full bg-surface border-2 border-primary px-4 py-3 font-mono text-sm rounded-none focus:outline-none shadow-[2px_2px_0_0_#000]"
              />
              <p className="text-[10px] text-on-surface-variant mt-1.5 font-bold uppercase tracking-wider">
                {isFreePlan 
                  ? t("deck.games.freeLimitNote") 
                  : t("deck.games.customCountNote")}
              </p>
            </div>

            {gameToLaunch === "speed-recall" && (
              <div>
                <label className="font-label text-xs uppercase tracking-widest font-bold text-on-surface-variant block mb-2">
                  {t("deck.games.difficultyLabel")}
                </label>
                <select
                  value={gameDifficulty}
                  onChange={(e) => setGameDifficulty(e.target.value)}
                  className="w-full bg-surface border-2 border-primary px-4 py-3 font-mono text-sm rounded-none focus:outline-none shadow-[2px_2px_0_0_#000] cursor-pointer"
                >
                  <option value="easy">{t("deck.games.difficultyEasy")}</option>
                  <option value="normal">{t("deck.games.difficultyNormal")}</option>
                  <option value="hard">{t("deck.games.difficultyHard")}</option>
                  <option value="expert">{t("deck.games.difficultyExpert")}</option>
                </select>
              </div>
            )}

            {isFreePlan && (
              <div className="border-[2px] border-dashed border-[#b90538] p-3 text-xs bg-[#ffdadb] text-[#b90538] font-semibold flex items-center gap-2">
                <Icon name="lock" className="text-sm" />
                <span>
                  {t("deck.games.freeWarning")}{" "}
                  <button
                    onClick={() => navigate("/pricing")}
                    className="underline font-bold hover:text-black transition-colors cursor-pointer"
                  >
                    {t("deck.games.upgradeLink")}
                  </button>{" "}
                  {t("deck.games.upgradeSuffix")}
                </span>
              </div>
            )}

            <div className="h-[2px] bg-on-surface/10 my-2" />

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => setGameMode("archive")}
                className="flex-1 bg-surface text-primary border-2 border-primary px-4 py-3.5 font-bold uppercase text-xs tracking-wider shadow-[3px_3px_0_0_#000] hover:translate-y-0.5 active:translate-y-1 transition-all cursor-pointer text-center"
              >
                {t("deck.games.btnCancel")}
              </button>

              <button
                onClick={handleStartGame}
                disabled={gameLoading}
                className="flex-1 bg-secondary text-surface border-2 border-primary px-4 py-3.5 font-bold uppercase text-xs tracking-wider shadow-[3px_3px_0_0_#000] hover:translate-y-0.5 active:translate-y-1 transition-all cursor-pointer text-center disabled:opacity-50"
              >
                {gameLoading ? "..." : t("deck.games.btnStart")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameMode === "speed-recall" && gameItems.length > 0) {
    return (
      <div 
        className="min-h-screen text-[#1c1c1a] font-sans p-4 md:p-8 flex flex-col relative overflow-hidden select-none"
        style={{
          backgroundColor: "#fcf9f6",
          backgroundImage: "linear-gradient(#e5e2df 1px, transparent 1px), linear-gradient(90deg, #e5e2df 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }}
      >
        {/* Header */}
        <header className="w-full flex flex-col md:flex-row justify-between items-center gap-4 mb-8 z-10 max-w-5xl mx-auto">
          <div className="bg-[#fcf9f6] border-2 border-black p-4 flex items-center gap-3 shadow-[4px_4px_0_0_#0F172A] neo-card">
            <span className="material-symbols-outlined text-secondary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            <h1 className="font-serif text-3xl font-bold uppercase tracking-tight text-primary">
              Speed Recall: Emergency Purge
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setGameMode("archive")}
              className="text-sm bg-[#fcf9f6] text-primary border-2 border-primary px-5 py-3 font-bold shadow-[3px_3px_0_0_#000] hover:translate-y-0.5 active:translate-y-1 transition-all uppercase cursor-pointer"
            >
              {t("deck.games.btnStopExit")}
            </button>
            <div className="bg-[#fcf9f6] border-2 border-[#ba1a1a] px-6 py-2.5 flex flex-col items-end shadow-[4px_4px_0_0_#0F172A] neo-card">
              <span className="text-[10px] text-[#ba1a1a] font-mono uppercase tracking-widest font-bold">Time Remaining</span>
              <span className="font-serif text-4xl font-black text-[#ba1a1a] leading-none">60s</span>
            </div>
          </div>
        </header>

        {/* Hazard Wrapper Container */}
        <main 
          className="flex-grow w-full max-w-5xl mx-auto z-10 p-6 border-4 border-[#ba1a1a] flex flex-col md:flex-row items-stretch gap-6 relative"
          style={{
            background: "repeating-linear-gradient(45deg, #ba1a1a, #ba1a1a 12px, #fcf9f6 12px, #fcf9f6 24px)"
          }}
        >
          {/* Left Card: KNOW */}
          <div className="hidden md:flex flex-col justify-center items-center w-1/4 select-none">
            <div
              onClick={() => handleRecallAction(true)}
              className="bg-[#fcf9f6] border-2 border-black p-8 flex flex-col items-center gap-4 text-center transform -rotate-2 shadow-[4px_4px_0px_0px_#0F172A] cursor-pointer hover:translate-y-0.5 active:translate-y-1 transition-all w-full select-none neo-card"
            >
              <span className="material-symbols-outlined text-display-lg text-primary text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_left</span>
              <span className="font-serif text-3xl font-bold text-primary tracking-tight">KNOW</span>
              <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider font-bold">Press Left Arrow</span>
            </div>
          </div>

          {/* Central Scrolling Area */}
          <div className="flex-grow relative overflow-hidden flex flex-col items-center justify-center border-2 border-black bg-[#f6f3f0] shadow-[4px_4px_0px_0px_#0F172A] min-h-[400px] select-none neo-card">
            
            {/* Combo Indicator */}
            <div className="absolute top-4 right-4 z-20">
              <div className="px-4 py-2 bg-[#ffddb8] border-2 border-black shadow-[2px_2px_0_0_#000] transform rotate-2">
                <span className="font-mono text-xs font-bold text-black uppercase">{t("deck.games.combo").toUpperCase()} x{recallCombo}</span>
              </div>
              <div className="px-4 py-1 bg-white border-2 border-black shadow-[2px_2px_0_0_#000] transform -rotate-1 mt-1 text-center">
                <span className="font-mono text-[10px] font-bold text-secondary">+{recallXp} XP</span>
              </div>
            </div>

            {/* Target Reticle Line Overlay */}
            <div className="absolute top-1/2 left-0 right-0 h-[100px] -translate-y-1/2 border-y-4 border-[#ba1a1a] pointer-events-none z-10 flex items-center justify-between px-8 bg-surface bg-opacity-20">
              <div className="w-4 h-4 bg-[#ba1a1a] rotate-45"></div>
              <div className="w-4 h-4 bg-[#ba1a1a] rotate-45"></div>
            </div>

            {/* Words List Container */}
            <div className="absolute inset-0 select-none">
              {recallWords.map((w) => {
                const isActive = w.y >= 150 && w.y <= 250;
                
                let wordContent;
                if (w.classified === "know") {
                  wordContent = <span className="text-emerald-600 line-through opacity-40">✓ {w.word}</span>;
                } else if (w.classified === "forgot") {
                  wordContent = <span className="text-[#ba1a1a] line-through opacity-40">✗ {w.word}</span>;
                } else if (w.missed) {
                  wordContent = <span className="text-[#76777d] opacity-20">{w.word}</span>;
                } else if (isActive) {
                  wordContent = (
                    <span className="inline-block bg-[#ffdadb] text-black border-2 border-black px-8 py-2 font-serif font-black text-4xl md:text-5xl shadow-[4px_4px_0_0_#0F172A] transform rotate-1 select-none">
                      {w.word}
                    </span>
                  );
                } else {
                  // Compute opacity based on distance to center line (y=200)
                  const dist = Math.abs(w.y - 200);
                  let opacity = "opacity-30";
                  if (dist < 100) opacity = "opacity-75";
                  else if (dist < 150) opacity = "opacity-50";

                  wordContent = <span className={`text-[#45464d] ${opacity} transition-opacity duration-150`}>{w.word}</span>;
                }

                return (
                  <div
                    key={w.id}
                    className="absolute left-0 right-0 text-center font-serif text-5xl md:text-6xl font-semibold pointer-events-none select-none"
                    style={{
                      transform: `translate3d(0, ${w.y - 28}px, 0)`,
                      top: 0,
                      fontFamily: "'EB Garamond', Georgia, serif"
                    }}
                  >
                    {wordContent}
                  </div>
                );
              })}
            </div>

            {/* Gradient Fades for Top/Bottom edges */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#f6f3f0] to-transparent pointer-events-none z-20"></div>
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#f6f3f0] to-transparent pointer-events-none z-20"></div>
          </div>

          {/* Right Card: FORGOT */}
          <div className="hidden md:flex flex-col justify-center items-center w-1/4 select-none">
            <div
              onClick={() => handleRecallAction(false)}
              className="bg-[#fcf9f6] border-2 border-black p-8 flex flex-col items-center gap-4 text-center transform rotate-2 shadow-[4px_4px_0px_0px_#0F172A] cursor-pointer hover:translate-y-0.5 active:translate-y-1 transition-all w-full select-none neo-card"
            >
              <span className="material-symbols-outlined text-display-lg text-[#ba1a1a] text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_right</span>
              <span className="font-serif text-3xl font-bold text-[#ba1a1a] tracking-tight">FORGOT</span>
              <span className="text-[10px] text-on-surface-variant font-mono uppercase tracking-wider font-bold">Press Right Arrow</span>
            </div>
          </div>

          {/* Mobile Bottom Control Buttons */}
          <div className="flex md:hidden w-full gap-4 mt-auto z-20">
            <button
              onClick={() => handleRecallAction(true)}
              className="flex-1 bg-[#fcf9f6] border-2 border-black p-4 flex flex-col items-center gap-2 text-center shadow-[4px_4px_0_0_#000] active:translate-y-0.5 cursor-pointer rounded-none"
            >
              <span className="material-symbols-outlined text-2xl text-black">arrow_back</span>
              <span className="font-bold text-sm uppercase text-black">{t("deck.games.btnKnow")}</span>
            </button>
            <button
              onClick={() => handleRecallAction(false)}
              className="flex-1 bg-[#fcf9f6] border-2 border-black p-4 flex flex-col items-center gap-2 text-center shadow-[4px_4px_0_0_#000] active:translate-y-0.5 cursor-pointer rounded-none"
            >
              <span className="material-symbols-outlined text-2xl text-[#ba1a1a]">arrow_forward</span>
              <span className="font-bold text-sm uppercase text-[#ba1a1a]">{t("deck.games.btnForget")}</span>
            </button>
          </div>

        </main>
      </div>
    );
  }

  if (gameMode === "speed-recall-results") {
    return (
      <div 
        className="min-h-screen text-[#1c1c1a] font-sans p-4 md:p-8 flex flex-col justify-center items-center select-none"
        style={{
          backgroundColor: "#fcf9f6",
          backgroundImage: "linear-gradient(#e5e2df 1px, transparent 1px), linear-gradient(90deg, #e5e2df 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }}
      >
        <div className="bg-[#fcf9f6] border-2 border-black p-8 max-w-md w-full shadow-[6px_6px_0_0_#000] text-center neo-card">
          <Icon name="verified_user" className="text-secondary text-5xl mb-4" />
          <h2 className="font-serif text-3xl font-black uppercase tracking-tight mb-2">
            {t("deck.games.debriefingTitle")}
          </h2>
          <p className="text-xs text-on-surface-variant font-mono uppercase tracking-widest mb-6">
            {t("deck.games.sessionComplete")}
          </p>

          <div className="border-2 border-black bg-[#f0edea] p-4 flex flex-col gap-3 text-left font-mono text-sm mb-6">
            <div className="flex justify-between border-b border-black pb-1.5">
              <span>{t("deck.games.resultsCorrect")}</span>
              <span className="font-bold text-emerald-600">{recallResultsStats.correct}</span>
            </div>
            <div className="flex justify-between border-b border-black pb-1.5">
              <span>{t("deck.games.resultsMissed")}</span>
              <span className="font-bold text-secondary">{recallResultsStats.missed}</span>
            </div>
            <div className="flex justify-between border-b border-black pb-1.5">
              <span>{t("deck.games.resultsMaxCombo")}</span>
              <span className="font-bold">x{recallResultsStats.maxCombo}</span>
            </div>
            <div className="flex justify-between">
              <span>{t("deck.games.resultsXp")}</span>
              <span className="font-bold text-secondary">+{recallXp} XP</span>
            </div>
          </div>

          <button
            onClick={() => {
              reload();
              reloadStats();
              reloadMissions();
              setGameMode("archive");
            }}
            className="w-full bg-primary text-surface border-2 border-primary py-3.5 font-bold uppercase text-xs tracking-wider shadow-[3px_3px_0_0_#000] hover:translate-y-0.5 active:translate-y-1 transition-all cursor-pointer text-center"
          >
            {t("deck.games.btnProceed")}
          </button>
        </div>
      </div>
    );
  }

  if (gameMode === "typewriter" && gameItems.length > 0) {
    const card = gameItems[typeIndex];
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 bg-[#fcfbf9] text-on-surface min-h-screen flex flex-col justify-between">
        {/* Header */}
        <header className="w-full flex justify-between items-center border-b-2 border-primary pb-4 mb-8">
          <div className="flex items-center gap-4">
            <h1 className="font-serif text-3xl font-bold">{t("deck.games.typewriterTitle")}</h1>
            <button
              onClick={() => setGameMode("archive")}
              className="text-sm bg-secondary text-surface border-2 border-primary px-4 py-2 font-bold shadow-[3px_3px_0_0_#000] hover:translate-y-0.5 active:translate-y-1 transition-all uppercase"
            >
              {t("deck.games.btnStopExit")}
            </button>
          </div>
          <div className="font-mono text-sm text-secondary uppercase font-bold">
            {t("deck.games.timeRemaining")}: {typeTimeLeft}s
          </div>
        </header>

        {/* Game Card */}
        <div
          onClick={() => typewriterInputRef.current?.focus()}
          className="flex-grow flex flex-col items-center justify-center p-8 md:p-12 border-[3px] border-primary bg-[#f0edea] shadow-[8px_8px_0_0_#000] min-h-[400px] relative overflow-hidden cursor-pointer"
        >
          {showSuccessStamp && (
            <div className="absolute inset-0 m-auto w-max h-max font-serif text-8xl font-black text-emerald-600 border-[8px] border-emerald-600 px-8 py-2 transform -rotate-12 opacity-90 z-20 pointer-events-none tracking-widest select-none bg-surface/95">
              {t("deck.games.successStamp").toUpperCase()}
            </div>
          )}

          {showErrorStamp && (
            <div className="absolute inset-0 m-auto w-max h-max font-serif text-8xl font-black text-secondary border-[8px] border-secondary px-8 py-2 transform -rotate-12 opacity-90 z-20 pointer-events-none tracking-widest select-none bg-surface/95">
              {t("deck.games.errorStamp").toUpperCase()}
            </div>
          )}

          {/* Progress bar */}
          <div className="w-full border-2 border-primary bg-surface-container h-4 mb-12 relative z-10">
            <div
              className="bg-secondary h-full transition-all duration-100"
              style={{ width: `${(typeTimeLeft / 15) * 100}%` }}
            ></div>
          </div>

          {/* Translation Hint */}
          <div className="text-center max-w-xl mx-auto mb-12 relative z-10">
            <h2 className="font-serif text-3xl italic text-primary">
              "{card.translation}"
            </h2>
            {card.example && (
              <p className="text-xs text-on-surface-variant italic mt-3">
                {t("deck.games.context")}: {card.example}
              </p>
            )}
          </div>

          {/* Typewriter Character Inputs */}
          <div className="relative z-10 flex justify-center flex-wrap gap-2 text-3xl md:text-5xl font-mono tracking-widest uppercase">
            {card.word.split("").map((char, index) => {
              const typedChar = typedText[index];
              const isFilled = typedChar !== undefined;
              return (
                <span
                  key={index}
                  className={`border-b-4 pb-2 px-2 font-bold ${
                    isFilled ? "border-primary text-primary" : "border-outline text-transparent"
                  }`}
                >
                  {isFilled ? typedChar : "_"}
                </span>
              );
            })}
          </div>

          {/* Hidden input to capture typing */}
          <input
            ref={typewriterInputRef}
            type="text"
            value={typedText}
            onChange={handleTypewriterInput}
            maxLength={card.word.length}
            className="absolute opacity-0 w-0 h-0"
            autoFocus
          />
        </div>

        {/* Footer info */}
        <div className="text-center text-outline text-xs mt-6">
          {t("deck.games.typewriterHint")}
        </div>
      </div>
    );
  }

  if (gameMode === "daily-missions") {
    const opLog = missionsData?.operations_log ?? [];
    const missions = missionsData?.daily_missions ?? [];
    const streakCount = missionsData?.streak ?? 0;
    const isMaintained = missionsData?.streak_maintained ?? false;
    const xpTotal = missionsData?.xp_total ?? 0;
    const xpLevelMin = missionsData?.xp_level_min ?? 0;
    const xpLevelMax = missionsData?.xp_level_max ?? 500;
    const rank = missionsData?.rank ?? "";
    const xpPct = xpLevelMax > xpLevelMin
      ? Math.min(100, Math.round(((xpTotal - xpLevelMin) / (xpLevelMax - xpLevelMin)) * 100))
      : 0;
    const getMissionTitle = (id, fallback) => {
      if (id === "cleanup") return t("deck.games.missionCleanUp");
      if (id === "new_cipher") return t("deck.games.missionNewCipher");
      if (id === "speed_march") return t("deck.games.missionSpeedMarch");
      return fallback;
    };

    const getMissionDescription = (id, target, fallback) => {
      if (id === "cleanup") return t("deck.games.missionCleanUpDesc", { n: target });
      if (id === "new_cipher") return t("deck.games.missionNewCipherDesc", { n: target });
      if (id === "speed_march") return t("deck.games.missionSpeedMarchDesc", { n: target });
      return fallback;
    };

    const getRankTranslation = (rankStr) => {
      if (rankStr === "Lexicon Recruit") return t("deck.games.lexiconRecruit");
      if (rankStr === "Archive Analyst") return t("deck.games.archiveAnalyst");
      if (rankStr === "Senior Cryptographer") return t("deck.games.seniorCryptographer");
      if (rankStr === "Master Decipherer") return t("deck.games.masterDecipherer");
      if (rankStr === "Director of Lexicography") return t("deck.games.directorOfLexicography");
      return rankStr;
    };


    return (
      <div className="max-w-5xl mx-auto px-4 py-8 bg-[#fcfbf9] text-on-surface min-h-screen">
        {/* Header */}
        <header className="border-b-[2px] border-on-surface pb-4 mb-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="font-serif text-4xl md:text-5xl">{t("deck.games.missionControlTitle")}</h1>
            <button
              onClick={() => setGameMode("archive")}
              className="text-sm bg-secondary text-surface border-2 border-primary px-4 py-2 font-bold shadow-[3px_3px_0_0_#000] hover:translate-y-0.5 active:translate-y-1 transition-all uppercase"
            >
              {t("deck.games.btnStopExit")}
            </button>
          </div>
        </header>

        {missionsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-pulse">
            <div className="md:col-span-8 flex flex-col gap-6">
              <div className="h-32 bg-surface-variant rounded" />
              <div className="h-56 bg-surface-variant rounded" />
            </div>
            <div className="md:col-span-4 flex flex-col gap-6">
              <div className="h-40 bg-surface-variant rounded" />
              <div className="h-48 bg-surface-variant rounded" />
            </div>
          </div>
        ) : (
          /* Grid Layout */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Left Column: Operations Log & Checklist */}
            <div className="md:col-span-8 flex flex-col gap-10">
              {/* 7-Day Log */}
              <section>
                <h2 className="font-serif text-2xl font-bold text-primary mb-6 border-b-2 border-primary inline-block pb-1">
                  {t("deck.games.operationsLog")}
                </h2>
                <div className="grid grid-cols-7 gap-3">
                  {opLog.map((dayEntry, index) => (
                    <div
                      key={index}
                      className={`aspect-square border-2 border-primary bg-surface flex flex-col items-center justify-center relative overflow-hidden ${
                        dayEntry.date === new Date().toISOString().split("T")[0]
                          ? "bg-surface-container-high font-bold ring-2 ring-secondary"
                          : ""
                      }`}
                    >
                      <span className="font-mono text-xs text-outline absolute top-2 left-2">{dayEntry.day}</span>
                      {dayEntry.completed && (
                        <div className="stamp absolute inset-0 m-auto w-max h-max font-serif text-[10px] uppercase px-2 py-0.5 border-2 border-secondary text-secondary font-black transform -rotate-12">
                          {t("deck.games.duty")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Daily Missions */}
              <section className="bg-surface border-2 border-primary p-6 shadow-[5px_5px_0_0_#000] relative">
                <div className="absolute top-0 right-0 w-8 h-8 border-l-2 border-b-2 border-primary bg-[#ffddb8]"></div>
                <h2 className="font-serif text-2xl font-bold text-primary mb-6 uppercase tracking-wider">
                  {t("deck.games.dailyMissions")}
                </h2>
                <ul className="flex flex-col gap-4">
                  {missions.map((mission) => (
                    <li key={mission.id} className="flex items-start gap-4 p-4 border-2 border-primary hover:bg-surface-container-high transition-all">
                      <div className={`w-5 h-5 border-2 border-primary flex-shrink-0 flex items-center justify-center mt-0.5 ${
                        mission.completed ? "bg-primary text-surface text-xs font-bold" : ""
                      }`}>
                        {mission.completed && "✓"}
                      </div>
                      <div className="flex-1">
                        <div className={`font-body text-base ${mission.completed ? "line-through text-on-surface-variant" : "text-primary"}`}>
                          <strong className="block text-sm uppercase tracking-wider mb-0.5">{getMissionTitle(mission.id, mission.title)}</strong>
                          <span className="text-sm">{getMissionDescription(mission.id, mission.target, mission.description)}</span>
                          {mission.completed && (
                            <span className="ml-2 text-xs font-bold text-secondary uppercase">({t("deck.games.completed")})</span>
                          )}
                        </div>
                        {/* Progress bar */}
                        {!mission.completed && (
                          <div className="mt-2">
                            <div className="w-full border border-primary h-2 bg-surface-container relative overflow-hidden">
                              <div
                                className="absolute top-0 left-0 h-full bg-secondary transition-all"
                                style={{ width: `${Math.min(100, Math.round((mission.progress / mission.target) * 100))}%` }}
                              />
                            </div>
                            <p className="font-mono text-[10px] text-outline mt-1">
                              {mission.progress} / {mission.target}
                            </p>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* Right Column: Streak Card & Dossier Record */}
            <div className="md:col-span-4 flex flex-col gap-8">
              {/* Streak Counter */}
              <div className={`border-2 border-primary p-6 shadow-[5px_5px_0_0_#000] flex flex-col items-center justify-center text-center ${isMaintained ? "bg-[#ffdadb]" : "bg-surface-container"}`}>
                <Icon name="local_fire_department" className={`text-5xl mb-2 ${isMaintained ? "text-secondary" : "text-outline"}`} />
                <h3 className="font-serif text-2xl font-bold uppercase text-primary">
                  {t("deck.games.streakDays", { n: streakCount })}
                </h3>
                <p className="font-mono text-[10px] text-outline uppercase mt-1 tracking-widest">
                  {isMaintained ? t("deck.games.maintained") : t("deck.games.streakRisk")}
                </p>
              </div>

              {/* Service Record */}
              <div className="bg-surface border-2 border-primary p-6 shadow-[5px_5px_0_0_#000] flex flex-col items-center text-center">
                <h3 className="font-mono text-xs text-primary uppercase tracking-widest mb-6 w-full text-left border-b-2 border-primary pb-2">
                  {t("deck.games.serviceRecord")}
                </h3>
                <div className="w-24 h-24 mb-4 border-2 border-primary rounded-full overflow-hidden bg-surface-container-high flex items-center justify-center">
                  <Icon name="local_police" className="text-5xl text-secondary" />
                </div>
                <div className="font-serif text-xl font-bold uppercase tracking-tight mb-1 text-primary">
                  {getRankTranslation(rank)}
                </div>
                <p className="text-xs text-on-surface-variant mb-4">{t("deck.games.currentRank")}</p>

                <div className="w-full border-2 border-primary h-5 relative bg-surface-container-low overflow-hidden mb-2">
                  <div
                    className="absolute top-0 left-0 h-full bg-primary transition-all"
                    style={{ width: `${xpPct}%` }}
                  />
                </div>
                <div className="w-full flex justify-between font-mono text-[10px] text-outline">
                  <span>{xpLevelMin} XP</span>
                  <span>{xpTotal} XP {t("deck.games.total")}</span>
                  <span>{xpLevelMax} XP</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- ARCHIVE VIEW (DEFAULT LIST) ---
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 bg-[#fcfbf9] text-on-surface min-h-screen">
      {/* Title */}
      <div className="border-b-[2px] border-on-surface pb-4 mb-6">
        <h1 className="font-serif text-5xl md:text-6xl font-normal tracking-tight leading-none">
          {t("deck.titleLead")} {t("deck.titleAccent")}
        </h1>
      </div>

      {/* Game Entries Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => {
            setGameToLaunch("speed-recall");
            setGameMode("setup");
          }}
          className="border-2 border-on-surface bg-surface hover:bg-surface-variant p-4 text-center shadow-[3px_3px_0_0_#000] hover:translate-y-0.5 active:translate-y-1 transition-all cursor-pointer flex flex-col items-center justify-center gap-2"
        >
          <Icon name="warning" className="text-secondary text-2xl" />
          <span className="font-label text-xs uppercase font-bold tracking-wider">{t("deck.games.cardFlipTitle")}</span>
        </button>

        <button
          onClick={() => {
            setGameToLaunch("typewriter");
            setGameMode("setup");
          }}
          className="border-2 border-on-surface bg-surface hover:bg-surface-variant p-4 text-center shadow-[3px_3px_0_0_#000] hover:translate-y-0.5 active:translate-y-1 transition-all cursor-pointer flex flex-col items-center justify-center gap-2"
        >
          <Icon name="keyboard" className="text-secondary text-2xl" />
          <span className="font-label text-xs uppercase font-bold tracking-wider">{t("deck.games.typewriterTitle")}</span>
        </button>

        <button
          onClick={() => navigate("/review")}
          className="border-2 border-on-surface bg-surface hover:bg-surface-variant p-4 text-center shadow-[3px_3px_0_0_#000] hover:translate-y-0.5 active:translate-y-1 transition-all cursor-pointer flex flex-col items-center justify-center gap-2"
        >
          <Icon name="calendar_month" className="text-secondary text-2xl" />
          <span className="font-label text-xs uppercase font-bold tracking-wider">{t("deck.games.spacedRepetitionTitle")}</span>
        </button>

        <button
          onClick={() => setGameMode("daily-missions")}
          className="border-2 border-on-surface bg-surface hover:bg-surface-variant p-4 text-center shadow-[3px_3px_0_0_#000] hover:translate-y-0.5 active:translate-y-1 transition-all cursor-pointer flex flex-col items-center justify-center gap-2"
        >
          <Icon name="local_police" className="text-secondary text-2xl" />
          <span className="font-label text-xs uppercase font-bold tracking-wider">{t("deck.games.missionControlTitle")}</span>
        </button>
      </div>

      {/* Stats Bar */}
      <div className="border-y-[2px] border-on-surface py-6 mb-10 grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
        {statsLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-10 bg-surface-variant rounded w-20 mx-auto"></div>
              <div className="h-4 bg-surface-variant rounded w-24 mx-auto mt-2"></div>
            </div>
          ))
        ) : stats ? (
          <>
            <div>
              <div className="font-ledger text-4xl md:text-5xl font-bold text-secondary">
                {stats.cards_total ? stats.cards_total.toLocaleString() : 0}
              </div>
              <div className="font-label text-xs text-on-surface-variant font-bold mt-1.5 tracking-widest uppercase">
                {t("deck.stats.total")}
              </div>
            </div>
            <div>
              <div className="font-ledger text-4xl md:text-5xl font-bold text-secondary">
                {stats.due_today || 0}
              </div>
              <div className="font-label text-xs text-on-surface-variant font-bold mt-1.5 tracking-widest uppercase">
                {t("deck.stats.due")}
              </div>
            </div>
            <div>
              <div className="font-ledger text-4xl md:text-5xl font-bold text-on-surface">
                {stats.learned_count || 0}
              </div>
              <div className="font-label text-xs text-on-surface-variant font-bold mt-1.5 tracking-widest uppercase">
                {t("deck.stats.learned")}
              </div>
            </div>
            <div>
              <div className="font-ledger text-4xl md:text-5xl font-bold text-on-surface">
                {stats.forgotten_count || 0}
              </div>
              <div className="font-label text-xs text-on-surface-variant font-bold mt-1.5 tracking-widest uppercase">
                {t("deck.stats.forgotten")}
              </div>
            </div>
            <div>
              <div className="font-ledger text-4xl md:text-5xl font-bold text-on-surface">
                {stats.retention_rate ? Math.round(stats.retention_rate) : 100}%
              </div>
              <div className="font-label text-xs text-on-surface-variant font-bold mt-1.5 tracking-widest uppercase">
                {t("deck.stats.retention")}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Main Grid: Left List (65%) and Right Entry Card (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Filter Tabs and Cards List */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Tabs */}
          <div className="flex gap-6 border-b-2 border-on-surface/10 pb-2 font-label text-sm md:text-base uppercase font-bold tracking-wider">
            <button
              onClick={() => onStatusFilterChange("")}
              className={`cursor-pointer pb-2 ${statusFilter === "" ? "border-b-[3px] border-on-surface font-black text-on-surface" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              {t("deck.tabs.all")}
            </button>
            <button
              onClick={() => onStatusFilterChange("learning")}
              className={`cursor-pointer pb-2 ${statusFilter === "learning" ? "border-b-[3px] border-on-surface font-black text-on-surface" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              {t("deck.tabs.learning")}
            </button>
            <button
              onClick={() => onStatusFilterChange("unlearned")}
              className={`cursor-pointer pb-2 ${statusFilter === "unlearned" ? "border-b-[3px] border-on-surface font-black text-on-surface" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              {t("deck.tabs.unlearned")}
            </button>
            <button
              onClick={() => onStatusFilterChange("learned")}
              className={`cursor-pointer pb-2 ${statusFilter === "learned" ? "border-b-[3px] border-on-surface font-black text-on-surface" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              {t("deck.tabs.learned")}
            </button>
            <button
              onClick={() => onStatusFilterChange("hard")}
              className={`cursor-pointer pb-2 ${statusFilter === "hard" ? "border-b-[3px] border-on-surface font-black text-on-surface" : "text-on-surface-variant hover:text-on-surface"}`}
            >
              {t("deck.tabs.hard")}
            </button>
            <button
              onClick={() => onStatusFilterChange("skipped")}
              className={`cursor-pointer pb-2 text-secondary ${statusFilter === "skipped" ? "border-b-[3px] border-secondary font-black" : "opacity-80 hover:opacity-100"}`}
            >
              {t("deck.tabs.skipped")}
            </button>
          </div>

          {error && <ErrorState error={error} onRetry={reload} />}

          {!error && (
            <div className="flex flex-col gap-4">
              {loading && Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}

              {!loading && items.length === 0 ? (
                <div className="border-3 border-dashed border-on-surface p-12 text-center flex flex-col gap-3 items-center bg-surface/30">
                  <Icon name="folder_open" className="text-5xl text-on-surface-variant/40" />
                  <h4 className="font-headline text-xl font-bold">{t("deck.noEntriesTitle")}</h4>
                  <p className="font-body text-sm text-on-surface-variant max-w-sm">
                    {t("deck.noEntriesDesc")}
                  </p>
                </div>
              ) : (
                items.slice(0, limit).map((card) => {
                  const isRevealed = revealedCards.has(card.id);
                  return (
                    <div key={card.id} className={getCardClasses(card.status)}>
                      {/* Top Header: Always in one line (no wrapping!) */}
                      <div className="flex flex-row justify-between items-center w-full gap-4">
                        {/* Term and Styled Dropdown Badge */}
                        <div className="flex flex-row items-center gap-4">
                          <h3 className="font-serif text-3xl font-bold uppercase tracking-tight text-on-surface">
                            {card.word}
                          </h3>
                          <div className="flex-shrink-0">
                            <BadgeSelect card={card} />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-row items-center gap-6 flex-shrink-0">
                          {isRevealed ? (
                            <button
                              onClick={() => toggleReveal(card.id)}
                              className="text-on-surface-variant font-label text-xs uppercase font-bold tracking-widest flex items-center gap-2 hover:text-on-surface cursor-pointer select-none py-1"
                            >
                              <Icon name="visibility_off" className="text-base" />
                              <span>{t("stories.hideTranslation") || "HIDE"}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleReveal(card.id)}
                              className="text-secondary font-label text-xs uppercase font-bold tracking-widest flex items-center gap-2 hover:opacity-85 cursor-pointer select-none py-1"
                            >
                              <Icon name="translate" className="text-base" />
                              <span>{t("stories.showTranslation") || "REVEAL"}</span>
                            </button>
                          )}

                          <button
                            onClick={() => setPendingDelete(card)}
                            className="text-on-surface-variant hover:text-secondary cursor-pointer transition-colors p-1.5"
                            title="Delete entry"
                          >
                            <Icon name="delete" className="text-xl" />
                          </button>
                        </div>
                      </div>

                      {/* Translation revealed/hidden */}
                      {isRevealed && (
                        <p className="font-body text-base font-bold text-secondary mt-1">
                          {card.translation}
                        </p>
                      )}

                      {/* Example sentence */}
                      {card.example && (
                        <p className="font-body text-sm italic text-on-surface-variant leading-relaxed mt-1">
                          {card.example}
                        </p>
                      )}
                    </div>
                  );
                })
              )}

              {/* Load More Button */}
              {!loading && items.length > limit && (
                <button
                  onClick={() => setLimit((l) => l + 10)}
                  className="w-full border-2 border-dashed border-on-surface py-5 flex items-center justify-center gap-3 font-label text-xs uppercase tracking-widest font-bold hover:bg-surface-variant transition-all cursor-pointer mt-4"
                >
                  <Icon name="expand_more" className="text-base" />
                  <span>{t("deck.loadMore") || "LOAD MORE ARCHIVES"}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Side: New Entry Form Card */}
        <div className="lg:col-span-1">
          <div className="border-[3px] border-on-surface bg-surface p-6 md:p-8 shadow-[5px_5px_0_0_#000] sticky top-6 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h2 className="font-serif text-3xl font-normal text-on-surface">
                {t("deck.newEntryTitle")}
              </h2>
              <Icon name="edit_note" className="text-secondary text-3xl" />
            </div>
            
            <div className="h-[2px] bg-on-surface/10 w-full" />

            <form onSubmit={handleAddEntry} className="flex flex-col gap-6">
              <div>
                <label className="font-label text-[11px] uppercase tracking-widest font-bold text-on-surface-variant block mb-2">
                  {t("deck.addModal.wordLabel").toUpperCase()}
                </label>
                <input
                  type="text"
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  placeholder={t("deck.wordPlaceholder")}
                  required
                  className="w-full bg-transparent border-b-2 border-on-surface py-2 text-base focus:outline-none placeholder-on-surface-variant/40"
                />
              </div>

              <div>
                <label className="font-label text-[11px] uppercase tracking-widest font-bold text-on-surface-variant block mb-2">
                  {t("deck.addModal.translationLabel").toUpperCase()}
                </label>
                <input
                  type="text"
                  value={translationInput}
                  onChange={(e) => setTranslationInput(e.target.value)}
                  placeholder={t("deck.translationPlaceholder")}
                  required
                  className="w-full bg-transparent border-b-2 border-on-surface py-2 text-base focus:outline-none placeholder-on-surface-variant/40"
                />
              </div>

              <div>
                <label className="font-label text-[11px] uppercase tracking-widest font-bold text-on-surface-variant block mb-2">
                  {t("deck.addModal.exampleLabel").toUpperCase()}
                </label>
                <textarea
                  value={example}
                  onChange={(e) => setExample(e.target.value)}
                  placeholder={t("deck.examplePlaceholder")}
                  className="w-full bg-surface-variant border-2 border-on-surface p-4 text-sm min-h-[120px] focus:outline-none placeholder-on-surface-variant/40 shadow-[1.5px_1.5px_0_0_#000]"
                />
              </div>

              <button
                type="submit"
                disabled={adding}
                className="w-full bg-secondary text-surface border-[2.5px] border-on-surface shadow-[3.5px_3.5px_0_0_#000] hover:shadow-[5px_5px_0_0_#000] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0_0_#000] py-4 text-center font-label text-xs uppercase font-bold tracking-widest transition-all cursor-pointer"
              >
                {adding ? t("deck.committing") : t("deck.commitToLedger").toUpperCase()}
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Delete Word Confirmation Modal */}
      <Modal open={!!pendingDelete} onClose={() => setPendingDelete(null)} title={t("deck.removeTitle")}>
        <p className="font-body text-body-md mb-6">{t("deck.removeBody", { word: pendingDelete?.word })}</p>
        <div className="flex gap-4">
          <NeoButton variant="ghost" onClick={() => setPendingDelete(null)}>
            {t("common.cancel")}
          </NeoButton>
          <NeoButton onClick={confirmDelete}>{t("deck.remove")}</NeoButton>
        </div>
      </Modal>
    </div>
  );
}
