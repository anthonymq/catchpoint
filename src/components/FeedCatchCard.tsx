import React from "react";
import { useNavigate } from "react-router-dom";
import { Scale, Ruler, Camera, User } from "lucide-react";
import { type FeedItem } from "../db/repository";
import { useSettingsStore } from "../stores/settingsStore";
import { formatCatchDate, formatWeight, formatLength } from "../utils/format";
import { useTranslation } from "@/i18n";
import "../styles/components/FeedCatchCard.css";

interface FeedCatchCardProps {
  item: FeedItem;
}

export const FeedCatchCard: React.FC<FeedCatchCardProps> = ({ item }) => {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { weightUnit, lengthUnit } = useSettingsStore();
  const { catch: catchData, userProfile } = item;

  const speciesName = catchData.species || t("catch.unknownSpecies");

  const handleCardClick = () => {
    navigate(`/catch/${catchData.id}`);
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (userProfile?.userId) {
      navigate(`/profile/${userProfile.userId}`);
    }
  };

  return (
    <article className="feed-card" onClick={handleCardClick}>
      <header className="feed-card-header" onClick={handleProfileClick}>
        <div className="feed-card-avatar">
          {userProfile?.photoUrl ? (
            <img
              src={userProfile.photoUrl}
              alt={userProfile.displayName}
              className="feed-card-avatar-image"
            />
          ) : (
            <User size={20} />
          )}
        </div>
        <div className="feed-card-user-info">
          <span className="feed-card-username">
            {userProfile?.displayName || t("profile.notFound")}
          </span>
          <span className="feed-card-timestamp">
            {formatCatchDate(catchData.timestamp, language)}
          </span>
        </div>
      </header>

      <div className="feed-card-image-container">
        {catchData.photoUri || catchData.photoCloudUrl ? (
          <img
            src={catchData.photoCloudUrl || catchData.photoUri}
            alt={speciesName}
            className="feed-card-image"
          />
        ) : (
          <div className="feed-card-placeholder">
            <Camera size={48} />
          </div>
        )}
      </div>

      <div className="feed-card-content">
        <h3 className="feed-card-species">{speciesName}</h3>
        <div className="feed-card-stats">
          {catchData.weight && (
            <div className="feed-card-stat">
              <Scale size={14} />
              <span>{formatWeight(catchData.weight, weightUnit)}</span>
            </div>
          )}
          {catchData.length && (
            <div className="feed-card-stat">
              <Ruler size={14} />
              <span>{formatLength(catchData.length, lengthUnit)}</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
