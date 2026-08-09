import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as authApi from "../api/auth.js";
import * as profileApi from "../api/profile.js";
import { getSettings } from "../api/settings.js";
import { clearTokens, readUserId, setTokens } from "./tokens.js";
import { useI18n } from "../i18n.jsx";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { lang, setLang } = useI18n();
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

      // Аккаунт — источник истины для языка интерфейса: без этого `glossa-lang` живёт
      // только в localStorage конкретного браузера и теряется/расходится при заходе
      // с другого устройства или после очистки данных.
      try {
        const settings = await getSettings();
        if (settings?.interface_language) setLang(settings.interface_language);
      } catch (e) {}

      const userId = readUserId();
      if (userId) {
        // Дожидаемся явно: callers (например, Onboarding.jsx) делают `await refreshUser()`
        // и сразу `navigate("/")`, рассчитывая, что languages уже актуальны к этому моменту —
        // ProtectedRoute иначе увидит старое значение (ещё [] от первой загрузки) и вернёт
        // обратно на /onboarding, сбросив весь прогресс формы.
        try {
          const pub = await profileApi.getPublicProfile(userId);
          setLanguages(pub.languages || []);
        } catch (e) {
          setLanguages([]);
        }
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
  }, [setLang]);

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
