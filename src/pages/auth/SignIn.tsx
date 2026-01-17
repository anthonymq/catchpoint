import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "@/i18n";
import { Mail, Lock, Fish, AlertCircle, ArrowRight } from "lucide-react";
import { signIn } from "@/services/auth";
import { useAuthStore } from "@/stores/authStore";
import "@/styles/pages/Auth.css";

const SignIn: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError(null);

    try {
      const user = await signIn(email, password);
      setUser(user);

      if (!user.emailVerified) {
        navigate("/auth/verify-email");
      } else {
        navigate("/");
      }
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        setError(t("auth.invalidCredentials") || "Invalid email or password");
      } else if (error.code === "auth/too-many-requests") {
        setError(
          t("auth.tooManyRequests") ||
            "Too many attempts. Please try again later.",
        );
      } else {
        setError(
          t("auth.signInError") || "Failed to sign in. Please try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <Fish size={32} strokeWidth={2.5} />
          </div>
          <h1 className="auth-title">
            {t("auth.welcomeBack") || "Welcome Back"}
          </h1>
          <p className="auth-subtitle">
            {t("auth.signInSubtitle") || "Sign in to access your fishing log"}
          </p>
        </div>

        <div className="auth-card">
          {error && (
            <div className="auth-message error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                {t("auth.email") || "Email"}
              </label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={20} />
                <input
                  id="email"
                  type="email"
                  className="auth-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="flex justify-between items-center">
                <label className="form-label" htmlFor="password">
                  {t("auth.password") || "Password"}
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  {t("auth.forgotPassword") || "Forgot password?"}
                </Link>
              </div>
              <div className="input-wrapper">
                <Lock className="input-icon" size={20} />
                <input
                  id="password"
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button type="submit" className="auth-button" disabled={isLoading}>
              {isLoading ? (
                <div className="spinner" />
              ) : (
                <>
                  {t("auth.signIn") || "Sign In"}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            {t("auth.noAccount") || "Don't have an account?"}
            <Link to="/auth/sign-up" className="auth-link">
              {t("auth.signUp") || "Sign up"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
