import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth/AuthContext.jsx";
import LoadingScreen from "./LoadingScreen.jsx";

export default function ProtectedRoute() {
  const { status, languages } = useAuth();
  const location = useLocation();

  if (status === "loading") return <LoadingScreen />;

  if (status === "anonymous") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Ждём, пока подтянутся языки, прежде чем решать про онбординг — иначе пользователь
  // с уже выбранным языком на миг увидит редирект на /onboarding (languages ещё [] по умолчанию).
  if (languages === undefined) return <LoadingScreen />;

  if (languages.length === 0 && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
