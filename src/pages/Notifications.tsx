import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Trophy,
  User,
  Loader2,
  Check,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import {
  useNotificationStore,
  type NotificationWithProfile,
} from "../stores/notificationStore";
import { useTranslation } from "@/i18n";
import "../styles/pages/Notifications.css";

export default function Notifications() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    notifications,
    loading,
    unreadCount,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  useEffect(() => {
    if (user?.uid) {
      fetchNotifications(user.uid);
      fetchUnreadCount(user.uid);
    }
  }, [user?.uid, fetchNotifications, fetchUnreadCount]);

  const handleNotificationClick = async (item: NotificationWithProfile) => {
    const { notification } = item;

    if (!notification.read) {
      await markAsRead(notification.id);
    }

    switch (notification.type) {
      case "like":
      case "comment":
        if (notification.targetId) {
          navigate(`/catch/${notification.targetId}`);
        }
        break;
      case "follow":
        navigate(`/profile/${notification.actorId}`);
        break;
      case "leaderboard_rank":
        navigate("/stats");
        break;
    }
  };

  const handleMarkAllAsRead = () => {
    if (user?.uid && unreadCount > 0) {
      markAllAsRead(user.uid);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="notification-type-icon like" />;
      case "comment":
        return <MessageCircle className="notification-type-icon comment" />;
      case "follow":
        return <UserPlus className="notification-type-icon follow" />;
      case "leaderboard_rank":
        return <Trophy className="notification-type-icon leaderboard" />;
      default:
        return <Bell className="notification-type-icon" />;
    }
  };

  const getNotificationText = (item: NotificationWithProfile): string => {
    const { notification, actor } = item;
    const actorName = actor?.displayName || t("notifications.someone");

    switch (notification.type) {
      case "like":
        return t("notifications.likedYourCatch", { name: actorName });
      case "comment":
        return t("notifications.commentedOnYourCatch", { name: actorName });
      case "follow":
        return t("notifications.startedFollowingYou", { name: actorName });
      case "leaderboard_rank": {
        const metadata = notification.metadata;
        const newRank = metadata?.newRank as number | undefined;
        if (newRank) {
          return t("notifications.leaderboardRankChange", { rank: newRank });
        }
        return t("notifications.leaderboardUpdate");
      }
      default:
        return t("notifications.newNotification");
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return t("comments.justNow");
    if (mins < 60) return t("comments.minutesAgo", { count: mins });
    if (hours < 24) return t("comments.hoursAgo", { count: hours });
    return t("comments.daysAgo", { count: days });
  };

  const showEmpty = !loading && notifications.length === 0;

  return (
    <div className="notifications-page">
      <header className="notifications-header">
        <h1>{t("notifications.title")}</h1>
        {unreadCount > 0 && (
          <button
            className="notifications-mark-all"
            onClick={handleMarkAllAsRead}
          >
            <Check size={16} />
            <span>{t("notifications.markAllRead")}</span>
          </button>
        )}
      </header>

      <div className="notifications-content">
        {loading ? (
          <div className="notifications-loading">
            <Loader2 size={32} className="spinning" />
          </div>
        ) : showEmpty ? (
          <div className="notifications-empty">
            <div className="notifications-empty-icon">
              <Bell size={48} />
            </div>
            <h2>{t("notifications.empty.title")}</h2>
            <p>{t("notifications.empty.description")}</p>
          </div>
        ) : (
          <ul className="notifications-list">
            {notifications.map((item) => (
              <li
                key={item.notification.id}
                className={`notification-item ${!item.notification.read ? "unread" : ""}`}
              >
                <button
                  className="notification-button"
                  onClick={() => handleNotificationClick(item)}
                >
                  <div className="notification-avatar">
                    {item.actor?.photoUrl ? (
                      <img
                        src={item.actor.photoUrl}
                        alt=""
                        className="notification-avatar-image"
                      />
                    ) : (
                      <User size={24} />
                    )}
                    <div className="notification-type-badge">
                      {getNotificationIcon(item.notification.type)}
                    </div>
                  </div>
                  <div className="notification-info">
                    <p className="notification-text">
                      {getNotificationText(item)}
                    </p>
                    <span className="notification-time">
                      {formatTime(item.notification.createdAt)}
                    </span>
                  </div>
                  {!item.notification.read && (
                    <span className="notification-unread-dot" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
