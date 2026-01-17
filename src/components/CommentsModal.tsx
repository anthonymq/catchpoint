import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, User, Loader2, Send, Trash2 } from "lucide-react";
import { useCommentStore } from "../stores/commentStore";
import { useAuthStore } from "../stores/authStore";
import { useTranslation } from "@/i18n";
import "../styles/components/CommentsModal.css";

const MAX_COMMENT_LENGTH = 500;

const getTimeAgo = (
  date: Date,
  t: (key: string, params?: Record<string, string>) => string,
) => {
  const seconds = Math.floor(
    (performance.timeOrigin + performance.now() - date.getTime()) / 1000,
  );
  if (seconds < 60) return t("comments.justNow");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)
    return t("comments.minutesAgo", { count: minutes.toString() });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("comments.hoursAgo", { count: hours.toString() });
  const days = Math.floor(hours / 24);
  return t("comments.daysAgo", { count: days.toString() });
};

export const CommentsModal: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const {
    commentsModalCatchId,
    commentsModalCatchOwnerId,
    comments,
    commentsLoading,
    closeCommentsModal,
    addComment,
    deleteComment,
  } = useCommentStore();

  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!commentsModalCatchId) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeCommentsModal();
    }
  };

  const handleUserClick = (userId: string) => {
    closeCommentsModal();
    navigate(`/profile/${userId}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !user?.uid ||
      !commentsModalCatchId ||
      !commentsModalCatchOwnerId ||
      !newComment.trim()
    )
      return;

    setSubmitting(true);
    await addComment(
      commentsModalCatchId,
      user.uid,
      commentsModalCatchOwnerId,
      newComment.trim(),
    );
    setNewComment("");
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    if (!user?.uid) return;
    setDeletingId(commentId);
    await deleteComment(commentId, user.uid);
    setDeletingId(null);
  };

  const canDeleteComment = (commentUserId: string) => {
    if (!user?.uid) return false;
    return user.uid === commentUserId || user.uid === commentsModalCatchOwnerId;
  };

  const remainingChars = MAX_COMMENT_LENGTH - newComment.length;

  return (
    <div className="comments-modal-backdrop" onClick={handleBackdropClick}>
      <div className="comments-modal">
        <header className="comments-modal-header">
          <h2 className="comments-modal-title">{t("comments.title")}</h2>
          <button
            className="comments-modal-close"
            onClick={closeCommentsModal}
            aria-label={t("common.close")}
          >
            <X size={20} />
          </button>
        </header>

        <div className="comments-modal-content">
          {commentsLoading ? (
            <div className="comments-modal-loading">
              <Loader2 className="comments-modal-spinner" size={24} />
            </div>
          ) : comments.length === 0 ? (
            <div className="comments-modal-empty">
              <p>{t("comments.noComments")}</p>
              <span>{t("comments.beFirst")}</span>
            </div>
          ) : (
            <ul className="comments-list">
              {comments.map(({ comment, userProfile }) => (
                <li key={comment.id} className="comments-list-item">
                  <button
                    className="comments-avatar-button"
                    onClick={() => handleUserClick(comment.userId)}
                  >
                    <div className="comments-avatar">
                      {userProfile?.photoUrl ? (
                        <img
                          src={userProfile.photoUrl}
                          alt={userProfile.displayName}
                          className="comments-avatar-image"
                        />
                      ) : (
                        <User size={16} />
                      )}
                    </div>
                  </button>
                  <div className="comments-content">
                    <div className="comments-header">
                      <button
                        className="comments-username"
                        onClick={() => handleUserClick(comment.userId)}
                      >
                        {userProfile?.displayName || t("profile.notFound")}
                      </button>
                      <span className="comments-time">
                        {getTimeAgo(comment.createdAt, t)}
                      </span>
                    </div>
                    <p className="comments-text">{comment.content}</p>
                  </div>
                  {canDeleteComment(comment.userId) && (
                    <button
                      className="comments-delete"
                      onClick={() => handleDelete(comment.id)}
                      disabled={deletingId === comment.id}
                      aria-label={t("comments.delete")}
                    >
                      {deletingId === comment.id ? (
                        <Loader2
                          className="comments-delete-spinner"
                          size={14}
                        />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <form className="comments-input-form" onSubmit={handleSubmit}>
          <div className="comments-input-wrapper">
            <input
              type="text"
              className="comments-input"
              placeholder={t("comments.placeholder")}
              value={newComment}
              onChange={(e) =>
                setNewComment(e.target.value.slice(0, MAX_COMMENT_LENGTH))
              }
              maxLength={MAX_COMMENT_LENGTH}
              disabled={submitting}
            />
            {newComment.length > 0 && (
              <span
                className={`comments-char-count ${remainingChars < 50 ? "warning" : ""}`}
              >
                {remainingChars}
              </span>
            )}
          </div>
          <button
            type="submit"
            className="comments-submit"
            disabled={!newComment.trim() || submitting}
            aria-label={t("comments.send")}
          >
            {submitting ? (
              <Loader2 className="comments-submit-spinner" size={18} />
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
