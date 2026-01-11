import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Trash2, AlertTriangle, Info, X } from "lucide-react";
import "../styles/components/ConfirmModal.css";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "danger",
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    // Focus the cancel button on open (safer default for destructive actions)
    setTimeout(() => {
      confirmButtonRef.current?.focus();
    }, 100);

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const getIcon = () => {
    switch (variant) {
      case "danger":
        return <Trash2 size={28} />;
      case "warning":
        return <AlertTriangle size={28} />;
      case "info":
        return <Info size={28} />;
      default:
        return <Trash2 size={28} />;
    }
  };

  const modalContent = (
    <div className="confirm-modal-overlay" onClick={handleOverlayClick}>
      <div
        ref={modalRef}
        className={`confirm-modal confirm-modal--${variant}`}
        onClick={handleModalClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        <button
          className="confirm-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className={`confirm-modal-icon confirm-modal-icon--${variant}`}>
          {getIcon()}
        </div>

        <h2 id="confirm-title" className="confirm-modal-title">
          {title}
        </h2>

        <p id="confirm-message" className="confirm-modal-message">
          {message}
        </p>

        <div className="confirm-modal-actions">
          <button
            className="confirm-modal-btn confirm-modal-btn--cancel"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            className={`confirm-modal-btn confirm-modal-btn--confirm confirm-modal-btn--${variant}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  // Use Portal to render modal at document root, escaping any overflow:hidden containers
  return createPortal(modalContent, document.body);
}
