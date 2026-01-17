import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Users, Loader2, User } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useMessageStore } from "../stores/messageStore";
import { useTranslation } from "@/i18n";
import "../styles/pages/Messages.css";

export default function Messages() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    conversations,
    requests,
    loading,
    activeTab,
    fetchConversations,
    fetchRequests,
    setActiveTab,
  } = useMessageStore();

  useEffect(() => {
    if (user?.uid) {
      fetchConversations(user.uid);
      fetchRequests(user.uid);
    }
  }, [user?.uid, fetchConversations, fetchRequests]);

  const handleConversationClick = (conversationId: string) => {
    navigate(`/messages/${conversationId}`);
  };

  const items = activeTab === "inbox" ? conversations : requests;
  const showEmpty = !loading && items.length === 0;

  const formatTime = (date?: Date) => {
    if (!date) return "";
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

  return (
    <div className="messages-page">
      <header className="messages-header">
        <h1>{t("messages.title")}</h1>
      </header>

      <div className="messages-tabs">
        <button
          className={`messages-tab ${activeTab === "inbox" ? "active" : ""}`}
          onClick={() => setActiveTab("inbox")}
        >
          <MessageCircle size={18} />
          <span>{t("messages.inbox")}</span>
          {conversations.some((c) => c.unreadCount > 0) && (
            <span className="messages-tab-badge" />
          )}
        </button>
        <button
          className={`messages-tab ${activeTab === "requests" ? "active" : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          <Users size={18} />
          <span>{t("messages.requests")}</span>
          {requests.length > 0 && (
            <span className="messages-tab-count">{requests.length}</span>
          )}
        </button>
      </div>

      <div className="messages-content">
        {loading ? (
          <div className="messages-loading">
            <Loader2 size={32} className="spinning" />
          </div>
        ) : showEmpty ? (
          <div className="messages-empty">
            <div className="messages-empty-icon">
              {activeTab === "inbox" ? (
                <MessageCircle size={48} />
              ) : (
                <Users size={48} />
              )}
            </div>
            <h2>
              {activeTab === "inbox"
                ? t("messages.empty.title")
                : t("messages.emptyRequests.title")}
            </h2>
            <p>
              {activeTab === "inbox"
                ? t("messages.empty.description")
                : t("messages.emptyRequests.description")}
            </p>
          </div>
        ) : (
          <ul className="conversations-list">
            {items.map(({ conversation, otherUser, unreadCount }) => (
              <li key={conversation.id} className="conversation-item">
                <button
                  className="conversation-button"
                  onClick={() => handleConversationClick(conversation.id)}
                >
                  <div className="conversation-avatar">
                    {otherUser?.photoUrl ? (
                      <img
                        src={otherUser.photoUrl}
                        alt=""
                        className="conversation-avatar-image"
                      />
                    ) : (
                      <User size={24} />
                    )}
                  </div>
                  <div className="conversation-info">
                    <div className="conversation-header">
                      <span className="conversation-name">
                        {otherUser?.displayName || t("messages.unknownUser")}
                      </span>
                      <span className="conversation-time">
                        {formatTime(conversation.lastMessageAt)}
                      </span>
                    </div>
                    <p className="conversation-preview">
                      {conversation.lastMessageText || t("messages.noMessages")}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <span className="conversation-unread">{unreadCount}</span>
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
