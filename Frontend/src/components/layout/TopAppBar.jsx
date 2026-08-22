import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "../ui/Icon.jsx";
import Avatar from "../ui/Avatar.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import SearchBar from "./SearchBar.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import { useApi } from "../../lib/useApi.js";
import { getBalance } from "../../lib/api/payments.js";
import { formatMoney } from "../../lib/format.js";
import { useT } from "../../lib/i18n.jsx";
import { useAuth } from "../../lib/auth/AuthContext.jsx";
import { getDailyMissions } from "../../lib/api/learning.js";
import { WS_URL } from "../../lib/config.js";
import { getAccessToken } from "../../lib/auth/tokens.js";

const ICON_BOX = "items-center justify-center w-10 h-10 border-2 border-tertiary hover:bg-surface-container transition-colors shrink-0";

// Каждые десять дней серия меняет цвет: первая декада — оранжевое пламя, дальше по кругу
// через жёлтый, зелёный, синий к фиолетовому и малиновому.
const STREAK_COLORS = [
  "#f97316", // 0-9
  "#f59e0b", // 10-19
  "#eab308", // 20-29
  "#84cc16", // 30-39
  "#22c55e", // 40-49
  "#10b981", // 50-59
  "#14b8a6", // 60-69
  "#06b6d4", // 70-79
  "#0ea5e9", // 80-89
  "#3b82f6", // 90-99
  "#6366f1", // 100-109
  "#8b5cf6", // 110-119
  "#a855f7", // 120-129
  "#d946ef", // 130-139
  "#ec4899", // 140-149
  "#f43f5e", // 150+
];

const getStreakColor = (days) => STREAK_COLORS[Math.floor(Math.max(0, days) / 10) % STREAK_COLORS.length];

export default function TopAppBar({ hasUnread, user, onOpenMenu, onBalance }) {
  const t = useT();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { data: balance } = useApi(() => getBalance(), []);
  const { data: missionsData, reload: reloadStreak } = useApi(() => getDailyMissions(), []);

  // Local state for WebSocket updates
  const [streakState, setStreakState] = useState({ streak: 0, streakMaintained: false });
  const [animatedStreak, setAnimatedStreak] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Кошелёк на телефоне живёт в выдвижном меню, а остаток запрашивается здесь — отдаём
  // его наверх, чтобы не ходить в API второй раз.
  useEffect(() => {
    if (onBalance) onBalance(balance);
  }, [balance, onBalance]);

  // Sync with initial API load
  useEffect(() => {
    if (missionsData) {
      setStreakState({
        streak: missionsData.streak,
        streakMaintained: missionsData.streak_maintained
      });
      setAnimatedStreak(missionsData.streak);
    }
  }, [missionsData]);

  // Connect to WebSocket /ws/streak for real-time updates on enter
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    let ws;
    let reconnectTimer;

    const connectWs = () => {
      const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
      // Check if WS_URL uses http/https, then map to ws/wss
      const baseWsUrl = WS_URL.replace(/^http/, "ws");
      ws = new WebSocket(`${baseWsUrl}/ws/streak?token=${encodeURIComponent(token)}`);

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "streak_update") {
            // Broadcast event to sync with Missions.jsx page!
            window.dispatchEvent(new CustomEvent("streak-updated", { detail: payload }));
            
            setStreakState({
              streak: payload.streak,
              streakMaintained: payload.streak_maintained
            });
          }
        } catch (e) {
          console.error("Error parsing streak ws payload", e);
        }
      };

      ws.onclose = () => {
        reconnectTimer = setTimeout(connectWs, 5000);
      };
    };

    connectWs();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimer);
    };
  }, []);

  // Sync event updates from page (e.g. after manual restore click)
  useEffect(() => {
    const handleUpdate = (e) => {
      if (e.detail) {
        setStreakState({
          streak: e.detail.streak,
          streakMaintained: e.detail.streak_maintained
        });
      } else {
        reloadStreak();
      }
    };
    window.addEventListener("streak-updated", handleUpdate);
    return () => window.removeEventListener("streak-updated", handleUpdate);
  }, [reloadStreak]);

  // Rolling count-up / count-down animation
  useEffect(() => {
    const target = streakState.streak;
    if (animatedStreak === target) return;

    setIsAnimating(true);
    const duration = 800; // 800ms total
    const difference = target - animatedStreak;
    const steps = Math.abs(difference);
    const stepTime = Math.max(40, Math.floor(duration / steps));

    const timer = setInterval(() => {
      setAnimatedStreak((prev) => {
        if (prev < target) {
          const next = prev + 1;
          if (next === target) {
            clearInterval(timer);
            setIsAnimating(false);
          }
          return next;
        } else {
          const next = prev - 1;
          if (next === target) {
            clearInterval(timer);
            setIsAnimating(false);
          }
          return next;
        }
      });
    }, stepTime);

    return () => {
      clearInterval(timer);
      setIsAnimating(false);
    };
  }, [streakState.streak, animatedStreak]);

  // Горит вся кнопка целиком — рамка, фон, пламя и число одного цвета. Погасшая серия
  // остаётся серой, чтобы разница читалась с одного взгляда.
  const streakColor = getStreakColor(streakState.streak);
  const streakLit = streakState.streakMaintained && streakState.streak > 0;

  function onLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <header className="bg-surface border-b-2 border-tertiary flex justify-between items-center gap-2 w-full px-margin-mobile md:px-margin-desktop py-3 md:py-4 sticky top-0 z-30">
      <div className="flex items-center gap-2 min-w-0">
        {onOpenMenu && (
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label={t("nav.openMenu")}
            className="md:hidden flex items-center justify-center w-11 h-11 border-2 border-tertiary shrink-0"
          >
            <Icon name="menu" className="text-tertiary" />
          </button>
        )}
        <Link to="/dashboard" className="font-display text-xl md:text-2xl font-black uppercase tracking-tight text-tertiary shrink-0 flex items-center min-h-11 md:min-h-0">
          {t("loadingScreen.brand")}
        </Link>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <div className="hidden md:block">
          <SearchBar />
        </div>

        {/* Daily Streak Indicator */}
        <Link
          to="/missions"
          className={`flex items-center gap-2 h-10 px-3 border-2 transition-colors shrink-0 ${
            streakLit ? "" : "border-tertiary hover:bg-surface-container"
          }`}
          style={
            streakLit
              ? { borderColor: streakColor, backgroundColor: `${streakColor}1f`, boxShadow: `2px 2px 0 0 ${streakColor}` }
              : undefined
          }
          title={streakState.streakMaintained ? "Active streak!" : "Streak broken! Go to missions page to restore."}
        >
          <Icon
            name="local_fire_department"
            filled={streakLit}
            style={streakLit ? { color: streakColor, "--streak-glow": streakColor } : undefined}
            className={`text-lg font-bold ${streakLit ? "streak-flame" : "opacity-50 text-on-surface-variant"} ${
              isAnimating ? "animate-bounce" : ""
            }`}
          />
          <span
            className={`font-ledger text-sm font-black whitespace-nowrap inline-block transition-all duration-300 ${
              isAnimating ? "scale-135 rotate-6 font-extrabold" : ""
            } ${streakLit ? "" : "text-on-surface-variant opacity-60"}`}
            style={{ color: streakLit ? streakColor : undefined }}
          >
            {animatedStreak}
          </span>
          {!streakState.streakMaintained && (
            <span className="w-2 h-2 bg-secondary rounded-full border border-black animate-ping" />
          )}
        </Link>

        <Link
          to="/wallet"
          className="hidden md:flex items-center gap-2 h-10 px-3 border-2 border-tertiary hover:bg-surface-container transition-colors shrink-0"
          aria-label={t("nav.wallet")}
        >
          <Icon name="account_balance_wallet" className="text-tertiary text-lg" />
          <span className="font-ledger text-sm whitespace-nowrap">
            {balance ? formatMoney(balance.balance) : "…"}
          </span>
        </Link>

        <Link to="/messenger" className={`hidden md:flex ${ICON_BOX}`} aria-label={t("nav.messenger")}>
          <Icon name="chat" className="text-tertiary" />
        </Link>

        <Link to="/notifications" className={`relative flex ${ICON_BOX}`} aria-label={t("nav.notifications")}>
          <Icon name="notifications" className="text-tertiary" />
          {hasUnread && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full" aria-hidden="true" />
          )}
        </Link>

        <ThemeToggle className={`hidden md:flex ${ICON_BOX}`} />

        <Link to="/profile" className="hidden md:block shrink-0" aria-label={t("nav.myProfile")}>
          {user === undefined ? (
            <Skeleton className="w-10 h-10" />
          ) : (
            <Avatar photoUrl={user?.photo_url} name={user?.username} shape="square" size="md" eager />
          )}
        </Link>

        <button
          type="button"
          onClick={onLogout}
          className={`hidden md:flex ${ICON_BOX}`}
          aria-label={t("nav.logOut")}
          title={t("nav.logOut")}
        >
          <Icon name="logout" className="text-secondary" />
        </button>
      </div>
    </header>
  );
}
