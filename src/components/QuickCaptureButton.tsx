import { useState, useEffect } from "react";
import { Fish, Check } from "lucide-react";
import { useQuickCapture } from "../hooks/useQuickCapture";
import { useTranslation } from "@/i18n";
import "../styles/components/QuickCaptureButton.css";

export const QuickCaptureButton = () => {
  const { t } = useTranslation();
  const { capture, isCapturing } = useQuickCapture();
  const [showSuccess, setShowSuccess] = useState(false);

  // Reset success state after animation
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 1500); // Keep success visible for 1.5s
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const handlePress = () => {
    // Prevent double taps if already showing success or capturing (debouncing)
    if (showSuccess || isCapturing) return;

    // Haptic feedback for premium feel
    if ("vibrate" in navigator) {
      navigator.vibrate(50); // Short tap feedback
    }

    // Trigger optimistic success immediately
    setShowSuccess(true);

    // Success haptic after a brief delay
    setTimeout(() => {
      if ("vibrate" in navigator) {
        navigator.vibrate([30, 50, 30]); // Double-pulse success pattern
      }
    }, 200);

    // Start background capture
    // We don't await this because we want the UI to be responsive immediately
    // The hook handles errors and state
    capture();
  };

  return (
    <div className="quick-capture-container">
      <button
        className={`quick-capture-btn ${isCapturing ? "capturing" : ""} ${showSuccess ? "success" : ""}`}
        onClick={handlePress}
        aria-label="Quick Catch"
      >
        {!showSuccess && (
          <>
            <div className="icon">
              <Fish size={64} />
            </div>
            <span className="label">{t("capture.button")}</span>
          </>
        )}

        <div className="success-overlay">
          <Check size={80} color="white" strokeWidth={3} />
        </div>
      </button>

      {/* Helper text */}
      <p className="text-center quick-capture-helper-text">
        {isCapturing && !showSuccess
          ? t("capture.savingLocation")
          : t("capture.tapToLog")}
      </p>
    </div>
  );
};
