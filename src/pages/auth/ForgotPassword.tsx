import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "@/i18n";
import { Mail, ArrowLeft, Key, CheckCircle, AlertCircle } from "lucide-react";
import { requestPasswordReset } from "@/services/auth";
import "@/styles/pages/Auth.css";

const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);

    try {
      await requestPasswordReset(email);
      setIsSuccess(true);
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (error.code === "auth/user-not-found") {
        setError(t("auth.emailNotFound") || "No account found with this email");
      } else {
        setError(
          t("auth.resetPasswordError") ||
            "Failed to send reset email. Please try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="back-button-wrapper">
        <Link to="/auth/sign-in" className="back-button">
          <ArrowLeft size={18} />
          <span>{t("auth.backToSignIn") || "Back to sign in"}</span>
        </Link>
      </div>

      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <Key size={32} strokeWidth={2.5} />
          </div>
          <h1 className="auth-title">
            {t("auth.resetPassword") || "Reset Password"}
          </h1>
          <p className="auth-subtitle">
            {t("auth.resetPasswordSubtitle") ||
              "We'll send you instructions to reset your password"}
          </p>
        </div>

        <div className="auth-card">
          {isSuccess ? (
            <div className="text-center">
              <div className="verification-icon">
                <CheckCircle size={40} strokeWidth={2} />
              </div>
              <h3 className="text-lg font-bold mb-2">
                {t("auth.checkYourEmail") || "Check your email"}
              </h3>
              <p className="text-gray-500 mb-6">
                {t("auth.resetEmailSent", { email }) ||
                  `We've sent password reset instructions to ${email}`}
              </p>
              <Link to="/auth/sign-in" className="auth-button">
                {t("auth.returnToSignIn") || "Return to Sign In"}
              </Link>
            </div>
          ) : (
            <>
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

                <button
                  type="submit"
                  className="auth-button"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="spinner" />
                  ) : (
                    t("auth.sendInstructions") || "Send Instructions"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
