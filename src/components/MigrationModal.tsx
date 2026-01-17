import { createPortal } from "react-dom";
import { Cloud, CloudOff, X, Check, AlertCircle, Loader } from "lucide-react";
import { useTranslation } from "@/i18n";
import type { MigrationProgress } from "@/services/migration";
import "@/styles/components/MigrationModal.css";

interface MigrationModalProps {
  isOpen: boolean;
  catchCount: number;
  progress: MigrationProgress | null;
  onConfirm: () => void;
  onSkip: () => void;
  onClose: () => void;
}

export function MigrationModal({
  isOpen,
  catchCount,
  progress,
  onConfirm,
  onSkip,
  onClose,
}: MigrationModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const isMigrating =
    progress?.status === "migrating" || progress?.status === "preparing";
  const isCompleted = progress?.status === "completed";
  const hasError = progress?.status === "error";
  const progressPercent =
    progress && progress.total > 0
      ? Math.round((progress.completed / progress.total) * 100)
      : 0;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (!isMigrating) {
      e.stopPropagation();
      onClose();
    }
  };

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const renderContent = () => {
    if (isCompleted) {
      return (
        <>
          <div className="migration-modal-icon migration-modal-icon--success">
            <Check size={32} />
          </div>
          <h2 className="migration-modal-title">
            {t("migration.completeTitle")}
          </h2>
          <p className="migration-modal-message">
            {t("migration.completeMessage", {
              synced: progress?.completed ?? 0,
              failed: progress?.failed ?? 0,
            })}
          </p>
          <div className="migration-modal-actions">
            <button
              className="migration-modal-btn migration-modal-btn--primary"
              onClick={onClose}
            >
              {t("common.close")}
            </button>
          </div>
        </>
      );
    }

    if (hasError) {
      return (
        <>
          <div className="migration-modal-icon migration-modal-icon--error">
            <AlertCircle size={32} />
          </div>
          <h2 className="migration-modal-title">{t("migration.errorTitle")}</h2>
          <p className="migration-modal-message">
            {progress?.error || t("migration.errorMessage")}
          </p>
          <div className="migration-modal-actions">
            <button
              className="migration-modal-btn migration-modal-btn--secondary"
              onClick={onClose}
            >
              {t("common.close")}
            </button>
            <button
              className="migration-modal-btn migration-modal-btn--primary"
              onClick={onConfirm}
            >
              {t("migration.retry")}
            </button>
          </div>
        </>
      );
    }

    if (isMigrating) {
      return (
        <>
          <div className="migration-modal-icon migration-modal-icon--syncing">
            <Loader size={32} className="migration-spinner" />
          </div>
          <h2 className="migration-modal-title">
            {t("migration.syncingTitle")}
          </h2>
          <p className="migration-modal-message">
            {progress?.current
              ? t("migration.syncingCurrent", { species: progress.current })
              : t("migration.syncingMessage")}
          </p>
          <div className="migration-progress">
            <div className="migration-progress-bar">
              <div
                className="migration-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="migration-progress-text">
              {t("migration.progress", {
                completed: progress?.completed ?? 0,
                total: progress?.total ?? 0,
              })}
            </p>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="migration-modal-icon migration-modal-icon--info">
          <Cloud size={32} />
        </div>
        <h2 className="migration-modal-title">{t("migration.title")}</h2>
        <p className="migration-modal-message">
          {t("migration.message", { count: catchCount })}
        </p>
        <p className="migration-modal-hint">{t("migration.hint")}</p>
        <div className="migration-modal-actions">
          <button
            className="migration-modal-btn migration-modal-btn--secondary"
            onClick={onSkip}
          >
            <CloudOff size={18} />
            {t("migration.skip")}
          </button>
          <button
            className="migration-modal-btn migration-modal-btn--primary"
            onClick={onConfirm}
          >
            <Cloud size={18} />
            {t("migration.sync")}
          </button>
        </div>
      </>
    );
  };

  const modalContent = (
    <div
      className="migration-modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="migration-title"
    >
      <div className="migration-modal" onClick={handleModalClick}>
        {!isMigrating && (
          <button
            className="migration-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        )}
        {renderContent()}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
