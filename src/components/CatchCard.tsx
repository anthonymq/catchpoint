import React, { useState, useRef } from "react";
import { MapPin, Calendar, Scale, Trash2, Camera } from "lucide-react";
import { type Catch } from "../db";
import { useSettingsStore } from "../stores/settingsStore";
import {
  formatCatchDate,
  formatCoordinates,
  formatWeight,
} from "../utils/format";
import { ConfirmModal } from "./ConfirmModal";
import { useTranslation } from "@/i18n";
import "../styles/components/CatchCard.css";

interface CatchCardProps {
  catchData: Catch;
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
}

export const CatchCard: React.FC<CatchCardProps> = ({
  catchData,
  onDelete,
  onClick,
}) => {
  const { t, language } = useTranslation();
  const { weightUnit } = useSettingsStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (onDelete) {
      // Trigger exit animation
      setIsDeleting(true);

      // Wait for animation to complete before actually deleting
      setTimeout(() => {
        onDelete(catchData.id);
      }, 300);
    }
  };

  const speciesName = catchData.species || t("catch.unknownSpecies");

  return (
    <div
      ref={cardRef}
      className={`catch-card ${isDeleting ? "deleting" : ""}`}
      onClick={() => onClick?.(catchData.id)}
    >
      <div className="catch-card-image-container">
        {catchData.photoUri ? (
          <img
            src={catchData.photoUri}
            alt={speciesName}
            className="catch-card-image"
          />
        ) : (
          <div className="catch-card-placeholder">
            <Camera size={32} opacity={0.5} />
          </div>
        )}
      </div>

      <div className="catch-card-content">
        <div className="catch-card-species">{speciesName}</div>

        <div className="catch-card-detail">
          <Scale size={14} />
          <span>{formatWeight(catchData.weight, weightUnit)}</span>
        </div>

        <div className="catch-card-detail">
          <Calendar size={14} />
          <span>{formatCatchDate(catchData.timestamp, language)}</span>
        </div>

        <div className="catch-card-detail">
          <MapPin size={14} />
          <span>
            {formatCoordinates(catchData.latitude, catchData.longitude)}
          </span>
        </div>
      </div>

      <div className="catch-card-actions">
        {onDelete && (
          <button
            className="catch-card-delete-btn"
            onClick={handleDeleteClick}
            aria-label={t("common.delete")}
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title={t("catch.deleteTitle")}
        message={t("catch.deleteMessage")}
        confirmText={t("catch.deleteConfirm")}
        cancelText={t("catch.deleteCancel")}
        variant="danger"
      />
    </div>
  );
};
