import React from "react";
import { useNavigate } from "react-router-dom";
import { X, User, Loader2 } from "lucide-react";
import { useLikeStore } from "../stores/likeStore";
import { useTranslation } from "@/i18n";
import "../styles/components/LikersModal.css";

export const LikersModal: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { likersModalCatchId, likers, likersLoading, closeLikersModal } =
    useLikeStore();

  if (!likersModalCatchId) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeLikersModal();
    }
  };

  const handleUserClick = (userId: string) => {
    closeLikersModal();
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="likers-modal-backdrop" onClick={handleBackdropClick}>
      <div className="likers-modal">
        <header className="likers-modal-header">
          <h2 className="likers-modal-title">{t("likes.likedBy")}</h2>
          <button
            className="likers-modal-close"
            onClick={closeLikersModal}
            aria-label={t("common.close")}
          >
            <X size={20} />
          </button>
        </header>

        <div className="likers-modal-content">
          {likersLoading ? (
            <div className="likers-modal-loading">
              <Loader2 className="likers-modal-spinner" size={24} />
            </div>
          ) : likers.length === 0 ? (
            <div className="likers-modal-empty">
              <p>{t("likes.noLikesYet")}</p>
            </div>
          ) : (
            <ul className="likers-list">
              {likers.map(({ like, userProfile }) => (
                <li key={like.id} className="likers-list-item">
                  <button
                    className="likers-user-button"
                    onClick={() => handleUserClick(like.userId)}
                  >
                    <div className="likers-avatar">
                      {userProfile?.photoUrl ? (
                        <img
                          src={userProfile.photoUrl}
                          alt={userProfile.displayName}
                          className="likers-avatar-image"
                        />
                      ) : (
                        <User size={18} />
                      )}
                    </div>
                    <span className="likers-username">
                      {userProfile?.displayName || t("profile.notFound")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
