import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./auth/AuthContext.jsx";
import { getStreak } from "./api/streak.js";
import { getMyLimits } from "./api/_pending/limits.js";
import { getMySubscription } from "./api/subscriptions.js";

const AppDataContext = createContext(null);

// Стрик достаётся из тяжёлого /export/me (см. api/_pending/streak.js) — дёргать его на каждый
// рендер нельзя, поэтому он и лимиты/подписка живут здесь и грузятся один раз за сессию.
export function AppDataProvider({ children }) {
  const { status } = useAuth();
  const [streak, setStreak] = useState(undefined);
  const [limits, setLimits] = useState(undefined);
  const [subscription, setSubscription] = useState(undefined);

  const refreshStreak = useCallback(() => {
    getStreak()
      .then(setStreak)
      .catch(() => setStreak(null));
  }, []);

  const refreshAll = useCallback(() => {
    refreshStreak();
    getMySubscription()
      .then((subscription) => {
        setSubscription(subscription);
        return getMyLimits(subscription);
      })
      .then(setLimits)
      .catch(() => {
        setSubscription(null);
        setLimits(null);
      });
  }, [refreshStreak]);

  useEffect(() => {
    if (status === "authenticated") {
      refreshAll();
    } else if (status === "anonymous") {
      setStreak(undefined);
      setLimits(undefined);
      setSubscription(undefined);
    }
  }, [status, refreshAll]);

  const value = { streak, limits, subscription, refreshStreak, refreshAll };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
