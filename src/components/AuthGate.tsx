import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

interface AuthGateProps {
  children: React.ReactNode;
  requireVerified?: boolean;
}

export function AuthGate({ children, requireVerified = false }: AuthGateProps) {
  const { user, loading } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-page">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/sign-in" state={{ from: location }} replace />;
  }

  if (requireVerified && !user.emailVerified) {
    return <Navigate to="/auth/verify-email" replace />;
  }

  return <>{children}</>;
}
