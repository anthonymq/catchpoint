import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/i18n";
import { useAuthStore } from "@/stores/authStore";
import { signInWithGoogle, signInWithApple } from "@/services/auth";

interface SocialSignInButtonsProps {
  onError: (message: string) => void;
  disabled?: boolean;
}

const GoogleIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const AppleIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

const SocialSignInButtons: React.FC<SocialSignInButtonsProps> = ({
  onError,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (disabled || isGoogleLoading || isAppleLoading) return;

    setIsGoogleLoading(true);
    try {
      const { user } = await signInWithGoogle();
      setUser(user);
      navigate("/");
    } catch (error) {
      const err = error as { code?: string };
      if (
        err.code === "auth/popup-closed-by-user" ||
        err.code === "auth/cancelled-popup-request"
      ) {
        return;
      }
      onError(
        t("auth.socialSignInError") ||
          "Failed to sign in with Google. Please try again.",
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    if (disabled || isGoogleLoading || isAppleLoading) return;

    setIsAppleLoading(true);
    try {
      const { user } = await signInWithApple();
      setUser(user);
      navigate("/");
    } catch (error) {
      const err = error as { code?: string };
      if (
        err.code === "auth/popup-closed-by-user" ||
        err.code === "auth/cancelled-popup-request"
      ) {
        return;
      }
      onError(
        t("auth.socialSignInError") ||
          "Failed to sign in with Apple. Please try again.",
      );
    } finally {
      setIsAppleLoading(false);
    }
  };

  const isLoading = isGoogleLoading || isAppleLoading;

  return (
    <div className="social-auth-buttons">
      <button
        type="button"
        className="social-auth-button google"
        onClick={handleGoogleSignIn}
        disabled={disabled || isLoading}
        aria-label={t("auth.continueWithGoogle") || "Continue with Google"}
      >
        {isGoogleLoading ? (
          <div className="spinner secondary" />
        ) : (
          <>
            <GoogleIcon />
            <span>
              {t("auth.continueWithGoogle") || "Continue with Google"}
            </span>
          </>
        )}
      </button>

      <button
        type="button"
        className="social-auth-button apple"
        onClick={handleAppleSignIn}
        disabled={disabled || isLoading}
        aria-label={t("auth.continueWithApple") || "Continue with Apple"}
      >
        {isAppleLoading ? (
          <div className="spinner" />
        ) : (
          <>
            <AppleIcon />
            <span>{t("auth.continueWithApple") || "Continue with Apple"}</span>
          </>
        )}
      </button>
    </div>
  );
};

export default SocialSignInButtons;
