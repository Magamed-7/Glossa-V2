import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as authApi from "../api/auth.js";
import * as profileApi from "../api/profile.js";
import { clearTokens, readUserId, setTokens } from "./tokens.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState("loading");
  // undefined = ещё не известно (не путать с "известно, что языков нет" — []).
  // ProfileResponse из GET /profile/me не содержит languages, только PublicProfileResponse —
  // поэтому список языков берётся отдельным вызовом GET /profile/{свой user_id}.
  const [languages, setLanguages] = useState(undefined);

  const loadUser = useCallback(async () => {
    try {
      const [me, myProfile] = await Promise.all([authApi.getMe(), profileApi.getMyProfile()]);
      setUser(me);
      setProfile(myProfile);
      setStatus("authenticated");

      const userId = readUserId();
      if (userId) {
        profileApi
          .getPublicProfile(userId)
          .then((pub) => setLanguages(pub.languages || []))
          .catch(() => setLanguages([]));
      } else {
        setLanguages([]);
      }
    } catch (e) {
      clearTokens();
      setUser(null);
      setProfile(null);
      setLanguages(undefined);
      setStatus("anonymous");
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(
    async ({ username, password }) => {
      const result = await authApi.login({ username, password });
      if (result.requires_2fa) return result;
      setTokens(result);
      await loadUser();
      return result;
    },
    [loadUser]
  );

  const loginWith2fa = useCallback(
    async ({ pending_token, code }) => {
      const result = await authApi.verify2faLogin({ pending_token, code });
      setTokens(result);
      await loadUser();
      return result;
    },
    [loadUser]
  );

  const register = useCallback((data) => authApi.register(data), []);

  // Логаут целиком на клиенте: серверного отзыва токена нет (Frontend/Plan/MISSING_API.md, п.6).
  // access остаётся валидным до истечения (до 30 минут) — осознанное ограничение, а не недосмотр.
  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    setProfile(null);
    setLanguages(undefined);
    setStatus("anonymous");
  }, []);

  const value = {
    user,
    profile,
    status,
    languages,
    login,
    loginWith2fa,
    register,
    logout,
    refreshUser: loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
