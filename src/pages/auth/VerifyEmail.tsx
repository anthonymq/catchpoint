import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/i18n";
import {
  Mail,
  RefreshCw,
  CheckCircle,
  LogOut,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import {
  resendVerificationEmail,
  reloadUser,
  isEmailVerified,
  signOut,
} from "@/services/auth";
import { useAuthStore } from "@/stores/authStore";
import "@/styles/pages/Auth.css";

const VerifyEmail: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth/sign-in");
    }
  }, [user, navigate]);

  const handleCheckVerification = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      await reloadUser();
      const verified = isEmailVerified();

      if (verified) {
        navigate("/");
      } else {
        setMessage({
          type: "error",
          text:
            t("auth.emailNotVerifiedYet") ||
            "Email not verified yet. Please check your inbox.",
        });
      }
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text:
          t("auth.verificationCheckError") ||
          "Failed to check verification status.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    setMessage(null);
    try {
      await resendVerificationEmail();
      setMessage({
        type: "success",
        text: t("auth.verificationSent") || "Verification email sent!",
      });
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (error.code === "auth/too-many-requests") {
        setMessage({
          type: "error",
          text:
            t("auth.tooManyRequests") ||
            "Too many requests. Please wait a moment.",
        });
      } else {
        setMessage({
          type: "error",
          text: t("auth.resendError") || "Failed to resend email.",
        });
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      navigate("/auth/sign-in");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="auth-page">
      <div className="back-button-wrapper">
        <button onClick={handleSignOut} className="back-button">
          <LogOut size={18} />
          <span>{t("auth.signOut") || "Sign Out"}</span>
        </button>
      </div>

      <div className="auth-container">
        <div className="auth-card text-center">
          <div className="verification-icon">
            <Mail size={40} strokeWidth={2} />
          </div>

          <h1 className="auth-title">
            {t("auth.verifyEmail") || "Verify your email"}
          </h1>
          <p className="auth-subtitle mb-4">
            {t("auth.verifyEmailSubtitle", { email: user?.email || "" }) ||
              `We've sent a verification link to ${user?.email || "your email"}. Please check your inbox.`}
          </p>

          {message && (
            <div className={`auth-message ${message.type}`}>
              {message.type === "success" ? (
                <CheckCircle size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <div className="auth-form">
            <button
              onClick={handleCheckVerification}
              className="auth-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="spinner" />
              ) : (
                <>
                  {t("auth.imVerified") || "I've verified my email"}
                  <ArrowRight size={20} />
                </>
              )}
            </button>

            <button
              onClick={handleResendEmail}
              className="auth-button secondary"
              disabled={isResending}
            >
              {isResending ? (
                <div className="spinner secondary" />
              ) : (
                <>
                  <RefreshCw size={18} />
                  {t("auth.resendEmail") || "Resend email"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
