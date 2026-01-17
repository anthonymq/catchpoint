import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Share2, X, Copy, Check, Globe, Lock } from "lucide-react";
import { useTranslation } from "@/i18n";
import { shareCatch, getCatchShareUrl, copyToClipboard } from "../utils/share";
import "../styles/components/ShareModal.css";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  catchId: string;
  species: string;
  isPublic: boolean;
  onMakePublic: () => Promise<void>;
}

export function ShareModal({
  isOpen,
  onClose,
  catchId,
  species,
  isPublic,
  onMakePublic,
}: ShareModalProps) {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [makingPublic, setMakingPublic] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (isOpen) {
      setShareUrl(getCatchShareUrl(catchId));
      setCopied(false);
    }
  }, [isOpen, catchId]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleMakePublicAndShare = async () => {
    setMakingPublic(true);
    try {
      await onMakePublic();
      await handleShare();
    } finally {
      setMakingPublic(false);
    }
  };

  const handleShare = async () => {
    const result = await shareCatch({
      title: t("share.shareTitle", {
        species: species || t("catch.unknownSpecies"),
      }),
      text: t("share.shareText", {
        species: species || t("catch.unknownSpecies"),
      }),
      url: shareUrl,
    });

    if (result.success) {
      if (result.method === "clipboard") {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        onClose();
      }
    }
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const modalContent = (
    <div className="share-modal-overlay" onClick={handleOverlayClick}>
      <div
        ref={modalRef}
        className="share-modal"
        onClick={handleModalClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
      >
        <button
          className="share-modal-close"
          onClick={onClose}
          aria-label={t("common.close")}
        >
          <X size={20} />
        </button>

        <div className="share-modal-icon">
          <Share2 size={28} />
        </div>

        <h2 id="share-title" className="share-modal-title">
          {t("share.title")}
        </h2>

        {!isPublic ? (
          <>
            <div className="share-modal-privacy-notice">
              <Lock size={16} />
              <p>{t("share.privateNotice")}</p>
            </div>
            <p className="share-modal-message">{t("share.makePublicPrompt")}</p>
            <div className="share-modal-actions">
              <button
                className="share-modal-btn share-modal-btn--cancel"
                onClick={onClose}
              >
                {t("common.cancel")}
              </button>
              <button
                className="share-modal-btn share-modal-btn--primary"
                onClick={handleMakePublicAndShare}
                disabled={makingPublic}
              >
                <Globe size={16} />
                {makingPublic
                  ? t("common.loading")
                  : t("share.makePublicAndShare")}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="share-modal-message">{t("share.readyToShare")}</p>
            <div className="share-modal-url-container">
              <input
                type="text"
                className="share-modal-url-input"
                value={shareUrl}
                readOnly
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                className={`share-modal-copy-btn ${copied ? "copied" : ""}`}
                onClick={handleCopyLink}
                aria-label={t("share.copyLink")}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
            <div className="share-modal-actions">
              <button
                className="share-modal-btn share-modal-btn--cancel"
                onClick={onClose}
              >
                {t("common.close")}
              </button>
              <button
                className="share-modal-btn share-modal-btn--primary"
                onClick={handleShare}
              >
                <Share2 size={16} />
                {t("share.shareNow")}
              </button>
            </div>
            {copied && (
              <p className="share-modal-copied-notice">
                {t("share.linkCopied")}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
