import React from "react";
import { MapPin, Calendar, Scale, Trash2, Camera } from "lucide-react";
import { type Catch } from "../db";
import {
  formatCatchDate,
  formatCoordinates,
  formatWeight,
} from "../utils/format";
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
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm("Are you sure you want to delete this catch?")) {
      onDelete(catchData.id);
    }
  };

  return (
    <div className="catch-card" onClick={() => onClick?.(catchData.id)}>
      <div className="catch-card-image-container">
        {catchData.photoUri ? (
          <img
            src={catchData.photoUri}
            alt={catchData.species || "Catch photo"}
            className="catch-card-image"
          />
        ) : (
          <div className="catch-card-placeholder">
            <Camera size={32} opacity={0.5} />
          </div>
        )}
      </div>

      <div className="catch-card-content">
        <div className="catch-card-species">
          {catchData.species || "Unknown Species"}
        </div>

        <div className="catch-card-detail">
          <Scale size={14} />
          <span>{formatWeight(catchData.weight)}</span>
        </div>

        <div className="catch-card-detail">
          <Calendar size={14} />
          <span>{formatCatchDate(catchData.timestamp)}</span>
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
            onClick={handleDelete}
            aria-label="Delete catch"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>
    </div>
  );
};
