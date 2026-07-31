import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth/AuthContext.jsx";

export default function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <h1 className="font-display text-headline-lg text-tertiary italic">Glossa</h1>
      </div>
    );
  }

  if (status === "anonymous") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
