import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "@/i18n";
import { Mail, Lock, Fish, AlertCircle, ArrowRight } from "lucide-react";
import { signUp } from "@/services/auth";
import { useAuthStore } from "@/stores/authStore";
import SocialSignInButtons from "@/components/SocialSignInButtons";
import "@/styles/pages/Auth.css";

const SignUp: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (password !== confirmPassword) {
      setError(t("auth.passwordsDoNotMatch") || "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError(
        t("auth.passwordTooShort") || "Password must be at least 6 characters",
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { user } = await signUp(email, password);
      setUser(user);
      navigate("/auth/verify-email");
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (error.code === "auth/email-already-in-use") {
        setError(t("auth.emailInUse") || "Email is already in use");
      } else if (error.code === "auth/invalid-email") {
        setError(t("auth.invalidEmail") || "Invalid email address");
      } else {
        setError(
          t("auth.signUpError") ||
            "Failed to create account. Please try again.",
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
            {t("auth.createAccount") || "Create Account"}
          </h1>
          <p className="auth-subtitle">
            {t("auth.signUpSubtitle") ||
              "Join the community and start tracking catches"}
          </p>
        </div>

        <div className="auth-card">
          {error && (
            <div className="auth-message error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <SocialSignInButtons onError={setError} disabled={isLoading} />

          <div className="auth-divider">
            <span>{t("auth.orContinueWith") || "or"}</span>
          </div>

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
              <label className="form-label" htmlFor="password">
                {t("auth.password") || "Password"}
              </label>
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
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
                {t("auth.confirmPassword") || "Confirm Password"}
              </label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={20} />
                <input
                  id="confirmPassword"
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button type="submit" className="auth-button" disabled={isLoading}>
              {isLoading ? (
                <div className="spinner" />
              ) : (
                <>
                  {t("auth.signUp") || "Sign Up"}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            {t("auth.hasAccount") || "Already have an account?"}
            <Link to="/auth/sign-in" className="auth-link">
              {t("auth.signIn") || "Sign in"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
