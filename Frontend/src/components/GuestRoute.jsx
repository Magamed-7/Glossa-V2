import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth/AuthContext.jsx";
import LoadingScreen from "./LoadingScreen.jsx";

export default function GuestRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <LoadingScreen />;

  if (status === "authenticated") {
    const from = location.state?.from?.pathname || "/";
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
}
